import pdfplumber
import json
import sqlite3
import os
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

# Metni chunk'lara böl — her chunk yaklaşık 500 karakter
def split_into_chunks(text, chunk_size=500, overlap=50):
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += chunk_size - overlap  # overlap: chunk'lar arası 50 karakter örtüşme
    return chunks

# SQLite veritabanını hazırla — dosya yoksa oluşturur, varsa açar
def setup_database(db_path="belgeler/bddk.db"):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    # documents tablosu: id otomatik artar, content metin, embedding JSON string
    # source: hangi PDF'ten geldiğini kaydediyoruz — kaynak gösterme için lazım
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

# Foundry Local başlat
config = Configuration(app_name="bddk-rag-assistant")
FoundryLocalManager.initialize(config)
manager = FoundryLocalManager.instance

# Embedding modelini yükle — zaten indirildi, sadece belleğe yüklüyoruz
embedding_model = manager.catalog.get_model("qwen3-embedding-0.6b")
embedding_model.load()
embedding_client = embedding_model.get_embedding_client()

# Veritabanını hazırla ve temizle
conn = setup_database()
cursor = conn.cursor()
cursor.execute("DELETE FROM documents")
conn.commit()

# belgeler klasöründeki tüm PDF'leri tara
pdf_files = [f for f in os.listdir("belgeler") if f.endswith(".pdf")]
print(f"{len(pdf_files)} PDF bulundu.\n")

total_chunks = 0

for pdf_file in pdf_files:
    pdf_path = os.path.join("belgeler", pdf_file)
    print(f"İşleniyor: {pdf_file}")

    # PDF'ten metin çıkar
    text = pdf_to_text(pdf_path)
    if not text.strip():
        print(f"  UYARI: {pdf_file} boş veya okunamadı, atlanıyor.\n")
        continue

    # Chunk'lara böl
    chunks = split_into_chunks(text)
    print(f"  {len(chunks)} chunk oluşturuldu.")

    # Chunk'ları embed et
    response = embedding_client.generate_embeddings(chunks)
    chunk_embeddings = [item.embedding for item in response.data]

    # SQLite'a kaydet — source kolonuna PDF adını yazıyoruz
    for chunk, embedding in zip(chunks, chunk_embeddings):
        cursor.execute(
            "INSERT INTO documents (source, content, embedding) VALUES (?, ?, ?)",
            (pdf_file, chunk, json.dumps(embedding))
        )

    conn.commit()
    total_chunks += len(chunks)
    print(f"  Kaydedildi.\n")

conn.close()
print(f"Tamamlandı. Toplam {total_chunks} chunk {len(pdf_files)} PDF'ten veritabanına kaydedildi.")