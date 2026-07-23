import math
import json
from foundry_local_sdk import Configuration, FoundryLocalManager #conf sdkyı başlatırken ayarları vermek için
                                            #manager modelleri indirmek embed etmek ve chat için kullanacağımız ana nesne.

# Embedding'leri diskten yükle — ingest.py'nin kaydettiği dosyadan okuyoruz
# Her çalıştırmada PDF'i yeniden embed etmiyoruz
with open("belgeler/embeddings.json", "r", encoding="utf-8") as f:
    data = json.load(f)
    documents = data["chunks"]        # orijinal metin parçaları
    doc_embeddings = data["embeddings"]  # onların vektörleri

def cosine_similarity(a, b): #iki vektörün ne kadar yakın olduğunu ölçmek için kosinüs benzerliği hesaplar
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x ** 2 for x in a))
    norm_b = math.sqrt(sum(x ** 2 for x in b))
    return dot / (norm_a * norm_b)

def find_relevant(query_embedding, doc_embeddings, top_k=2): #sorduğumuz soruyu embed edip tüm dökümanın vektörleri ile karşılaştırır ve en yüksek 2 skora sahip olanları döndürür
    scores = [cosine_similarity(query_embedding, d) for d in doc_embeddings]
    ranked = sorted(enumerate(scores), key=lambda x: x[1], reverse=True)
    return [(documents[i], score) for i, score in ranked[:top_k]]

def main():
    config = Configuration(app_name="bddk-rag-assistant")
    FoundryLocalManager.initialize(config)
    manager = FoundryLocalManager.instance

    # Embedding modelini yükle — metinleri vektöre çevirmek için
    embedding_model = manager.catalog.get_model("qwen3-embedding-0.6b")
    embedding_model.load()
    embedding_client = embedding_model.get_embedding_client()

    # Chat modelini yükle — bulunan dokümanları okuyup cevap üretecek olan
    chat_model = manager.catalog.get_model("phi-3.5-mini")
    chat_model.load()
    chat_client = chat_model.get_chat_client()

    # Türkçe soru sor
    query = "Kredi kartı taksit sınırları nelerdir?"
    query_response = embedding_client.generate_embeddings([query])
    query_embedding = query_response.data[0].embedding

    # Retrieve — en alakalı chunk'ları bul
    results = find_relevant(query_embedding, doc_embeddings)
    print(f"Soru: {query}\n")
    print("En alakalı chunk'lar:")
    for doc, score in results:
        print(f"  [{score:.3f}] {doc[:100]}...\n")

    # Augment — bulunan chunk'ları soruyla birleştir, modele context olarak ver
    # Modele kendi bilgisinden değil, bu belgelerden cevap vermesini söylüyoruz
    context = "\n".join([doc for doc, _ in results])
    prompt = f"""Aşağıdaki BDDK belgelerine dayanarak soruyu Türkçe olarak cevapla.
Eğer belgede cevap yoksa 'Bilmiyorum' de.

Belgeler:
{context}

Soru: {query}
Cevap:"""

    # Generate — model prompt'u okuyup cevap üretir
    print("\nModel cevap üretiyor...\n")
    completion = chat_client.complete_chat(
        messages=[{"role": "user", "content": prompt}]
    )
    print(f"Cevap: {completion.choices[0].message.content}")

if __name__ == "__main__":
    main()