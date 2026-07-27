import pdfplumber
import json
import sqlite3
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
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            content TEXT NOT NULL,
            embedding TEXT NOT NULL
        )
    """)
    conn.commit()
    return conn

# PDF'i oku ve chunk'lara böl
text = pdf_to_text("belgeler/yonetmelik.pdf")
chunks = split_into_chunks(text)
print(f"{len(chunks)} chunk oluşturuldu.\n")

# Foundry Local başlat
config = Configuration(app_name="bddk-rag-assistant")
FoundryLocalManager.initialize(config)
manager = FoundryLocalManager.instance

# Embedding modelini yükle — zaten indirildi, sadece belleğe yüklüyoruz
embedding_model = manager.catalog.get_model("qwen3-embedding-0.6b")
embedding_model.load()
embedding_client = embedding_model.get_embedding_client()

# Chunk'ları embed et — her chunk'ı vektöre çeviriyoruz
response = embedding_client.generate_embeddings(chunks)
chunk_embeddings = [item.embedding for item in response.data]
print(f"{len(chunk_embeddings)} chunk embed edildi.")

# SQLite'a kaydet
conn = setup_database()
cursor = conn.cursor()

# Her çalıştırmada tabloyu temizle — aynı dokümanı iki kez eklememek için
cursor.execute("DELETE FROM documents")

for chunk, embedding in zip(chunks, chunk_embeddings):
    # Embedding vektörünü JSON string'e çevirip saklıyoruz
    cursor.execute(
        "INSERT INTO documents (content, embedding) VALUES (?, ?)",
        (chunk, json.dumps(embedding))
    )

conn.commit()
conn.close()
print("Veriler belgeler/bddk.db'ye kaydedildi.")