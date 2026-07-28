import math
import json
import sqlite3
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from foundry_local_sdk import Configuration, FoundryLocalManager

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

print("Modeller yükleniyor...")
embedding_model = SentenceTransformer("efeturkol/bddk-embedding-model")

config = Configuration(app_name="bddk-rag-assistant")
FoundryLocalManager.initialize(config)
manager = FoundryLocalManager.instance
chat_model = manager.catalog.get_model("phi-3.5-mini")
chat_model.load()
chat_client = chat_model.get_chat_client()

conn = sqlite3.connect("belgeler/bddk.db")
cursor = conn.cursor()
cursor.execute("SELECT source, content, embedding FROM documents")
rows = cursor.fetchall()
conn.close()
sources = [row[0] for row in rows]
documents = [row[1] for row in rows]
doc_embeddings = [json.loads(row[2]) for row in rows]
print(f"{len(documents)} chunk yüklendi.")

def cosine_similarity(a, b):
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x ** 2 for x in a))
    norm_b = math.sqrt(sum(x ** 2 for x in b))
    return dot / (norm_a * norm_b)

def find_relevant(query_embedding, top_k=3):
    scores = [cosine_similarity(query_embedding, d) for d in doc_embeddings]
    ranked = sorted(enumerate(scores), key=lambda x: x[1], reverse=True)
    return [(documents[i], sources[i], scores[i]) for i, _ in ranked[:top_k]]

class QueryRequest(BaseModel):
    query: str

@app.post("/ask")
def ask(request: QueryRequest):
    query = request.query
    query_embedding = embedding_model.encode(query).tolist()
    results = find_relevant(query_embedding)

    context = "\n\n".join([f"Kaynak: {source}\n{doc}" for doc, source, _ in results])
    prompt = f"""Aşağıdaki BDDK ve KVKK belgelerine dayanarak soruyu Türkçe olarak cevapla.
Eğer belgede cevap yoksa 'Bilmiyorum' de.

Belgeler:
{context}

Soru: {query}
Cevap:"""

    completion = chat_client.complete_chat(
        messages=[
            {
                "role": "system",
                "content": """Sen bir BDDK ve KVKK mevzuat asistanısın.
Sana verilen belge parçalarındaki bilgiyi AYNEN kullan, yorum katma.
Kurallar:
- Belgede geçen tanımı veya maddeyi doğrudan aktar
- Kendi yorumunu ekleme
- Cevabın sonunda sadece bir kez kaynak belirt
- Belgede cevap yoksa sadece 'Bu konuda belgelerimde bilgi bulunmuyor' de"""
            },
            {"role": "user", "content": prompt}
        ]
    )

    return {
        "answer": completion.choices[0].message.content,
        "sources": [
            {"source": source, "content": doc[:300], "score": round(score, 3)}
            for doc, source, score in results
        ]
    }

@app.get("/health")
def health():
    return {"status": "ok", "chunks": len(documents)}