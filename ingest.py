import pdfplumber
import json
import sqlite3
import os
import sys
from sentence_transformers import SentenceTransformer

embedding_model = SentenceTransformer("efeturkol/bddk-embedding-model")

def pdf_to_text(pdf_path):
    text = ""
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text

def split_into_chunks(text, max_chunk_size=600):
    if "\n\n" in text:
        paragraphs = [p.strip() for p in text.split("\n\n") if len(p.strip()) > 30]
    else:
        paragraphs = [p.strip() for p in text.split("\n") if len(p.strip()) > 30]
    chunks = []
    current_chunk = ""
    for paragraph in paragraphs:
        if len(current_chunk) + len(paragraph) > max_chunk_size and current_chunk:
            chunks.append(current_chunk.strip())
            current_chunk = paragraph
        else:
            current_chunk += "\n" + paragraph if current_chunk else paragraph
    if current_chunk:
        chunks.append(current_chunk.strip())
    return chunks

def setup_database(db_path="belgeler/bddk.db"):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
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

pdf_file = sys.argv[1]
pdf_path = os.path.join("belgeler", pdf_file)
print(f"İşleniyor: {pdf_file}")

text = pdf_to_text(pdf_path)
if not text.strip():
    print(f"UYARI: Boş veya okunamadı, atlanıyor.")
    sys.exit(0)

chunks = split_into_chunks(text)
print(f"{len(chunks)} chunk oluşturuldu.")

embeddings = embedding_model.encode(chunks).tolist()

conn = setup_database()
cursor = conn.cursor()
for chunk, embedding in zip(chunks, embeddings):
    cursor.execute(
        "INSERT INTO documents (source, content, embedding) VALUES (?, ?, ?)",
        (pdf_file, chunk, json.dumps(embedding))
    )
conn.commit()
conn.close()
print(f"Kaydedildi.\n")