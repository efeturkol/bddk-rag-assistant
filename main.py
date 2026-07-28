import math
import json
import sqlite3
from sentence_transformers import SentenceTransformer
from foundry_local_sdk import Configuration, FoundryLocalManager #conf sdkyı başlatırken ayarları vermek için
                                            #manager modelleri indirmek embed etmek ve chat için kullanacağımız ana nesne.

# Sentence-transformers modeli — Colab'da DB'yi bu modelle embed ettik
# Sorgu embedding'i de aynı modelle yapılmalı, yoksa vektörler uyuşmaz
embedding_model = SentenceTransformer("efeturkol/bddk-embedding-model")


# SQLite'tan chunk'ları, source'ları ve embedding'leri yükle
def load_from_database(db_path="belgeler/bddk.db"):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT source, content, embedding FROM documents")
    rows = cursor.fetchall()
    conn.close()
    sources = [row[0] for row in rows]
    documents = [row[1] for row in rows]
    embeddings = [json.loads(row[2]) for row in rows]
    return sources, documents, embeddings

def cosine_similarity(a, b): #iki vektörün ne kadar yakın olduğunu ölçmek için kosinüs benzerliği hesaplar
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x ** 2 for x in a))
    norm_b = math.sqrt(sum(x ** 2 for x in b))
    return dot / (norm_a * norm_b)

def find_relevant(query_embedding, doc_embeddings, documents, sources, top_k=3): #sorduğumuz soruyu embed edip tüm dökümanın vektörleri ile karşılaştırır ve en yüksek skora sahip olanları döndürür
    scores = [cosine_similarity(query_embedding, d) for d in doc_embeddings]
    ranked = sorted(enumerate(scores), key=lambda x: x[1], reverse=True)
    return [(documents[i], sources[i], score) for i, score in ranked[:top_k]]

def main():
    # Veritabanından chunk'ları, source'ları ve embedding'leri yükle
    sources, documents, doc_embeddings = load_from_database()
    print(f"{len(documents)} chunk veritabanından yüklendi.\n")

    # Foundry Local başlat — sadece chat için kullanıyoruz
    config = Configuration(app_name="bddk-rag-assistant")
    FoundryLocalManager.initialize(config)
    manager = FoundryLocalManager.instance

    # Chat modelini yükle — bulunan dokümanları okuyup cevap üretecek olan
    chat_model = manager.catalog.get_model("phi-3.5-mini")
    chat_model.load()
    chat_client = chat_model.get_chat_client()

    # Soru sor
    query = "Bankaların iç sistemleri nelerdir?"

    # Sorguyu embed et — DB ile aynı model kullanılmalı
    query_embedding = embedding_model.encode(query).tolist()

    # Retrieve — en alakalı chunk'ları bul
    results = find_relevant(query_embedding, doc_embeddings, documents, sources)
    print(f"Soru: {query}\n")
    print("En alakalı chunk'lar:")
    for doc, source, score in results:
        print(f"  [{score:.3f}] {source} → {doc[:80]}...\n")

    # Augment — bulunan chunk'ları soruyla birleştir, modele context olarak ver
    # Modele kendi bilgisinden değil, bu belgelerden cevap vermesini söylüyoruz
    context = "\n\n".join([f"Kaynak: {source}\n{doc}" for doc, source, _ in results])
    prompt = f"""Aşağıdaki BDDK ve KVKK belgelerine dayanarak soruyu Türkçe olarak cevapla.
Cevabının sonunda hangi kaynaktan yararlandığını belirt.
Eğer belgede cevap yoksa 'Bilmiyorum' de.

Belgeler:
{context}

Soru: {query}
Cevap:"""

    # Generate — model prompt'u okuyup cevap üretir
    print("\nModel cevap üretiyor...\n")
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
            {
                "role": "user",
                "content": prompt
            }
        ]
    )
    print(f"Cevap: {completion.choices[0].message.content}")

if __name__ == "__main__":
    main()