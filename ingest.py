import pdfplumber
import json
import sqlite3
import os
import sys
from foundry_local_sdk import Configuration, FoundryLocalManager #conf sdkyı başlatırken ayarları vermek için
                                            #manager modelleri indirmek embed etmek ve chat için kullanacağımız ana nesne.

# PDF'ten metin çıkar
def pdf_to_text(pdf_path):
    text = ""
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text

# Metni paragraf bazlı chunk'lara böl
# Sabit karakter yerine çift satır sonunda kesiyoruz — maddeler bütün kalıyor
def split_into_chunks(text, max_chunk_size=600):
    paragraphs = [p.strip() for p in text.split("\n\n") if len(p.strip()) > 30]
    chunks = []
    current_chunk = ""
    for paragraph in paragraphs:
        if len(current_chunk) + len(paragraph) > max_chunk_size and current_chunk:
            chunks.append(current_chunk.strip())
            current_chunk = paragraph
        else:
            current_chunk += "\n\n" + paragraph if current_chunk else paragraph
    if current_chunk:
        chunks.append(current_chunk.strip())
    return chunks

# SQLite veritabanını hazırla — dosya yoksa oluşturur, varsa açar
def setup_database(db_path="belgeler/bddk.db"):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    # documents tablosu: id otomatik artar, source PDF adı, content metin, embedding JSON string
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source TEXT NOT NULL,
            content TEXT NOT NULL,
            embedding TEXT NOT NULL
        )
    """)
    conn.commit()
    return conn

# Tek bir PDF'i işle — sys.argv[1] ile PDF adı alıyoruz
# Her PDF ayrı process olarak çalışacak, RAM temizlenecek
pdf_file = sys.argv[1]
pdf_path = os.path.join("belgeler", pdf_file)

print(f"İşleniyor: {pdf_file}")

# Foundry Local başlat
config = Configuration(app_name="bddk-rag-assistant")
FoundryLocalManager.initialize(config)
manager = FoundryLocalManager.instance

# Embedding modelini yükle
embedding_model = manager.catalog.get_model("qwen3-embedding-0.6b")
embedding_model.load()
embedding_client = embedding_model.get_embedding_client()

# PDF'i oku ve chunk'lara böl
text = pdf_to_text(pdf_path)
if not text.strip():
    print(f"UYARI: Boş veya okunamadı, atlanıyor.")
    sys.exit(0)

chunks = split_into_chunks(text)
print(f"{len(chunks)} chunk oluşturuldu.")

# Chunk'ları embed et
response = embedding_client.generate_embeddings(chunks)
chunk_embeddings = [item.embedding for item in response.data]

# SQLite'a kaydet
conn = setup_database()
cursor = conn.cursor()
for chunk, embedding in zip(chunks, chunk_embeddings):
    cursor.execute(
        "INSERT INTO documents (source, content, embedding) VALUES (?, ?, ?)",
        (pdf_file, chunk, json.dumps(embedding))
    )
conn.commit()
conn.close()
print(f"Kaydedildi.\n")