# BDDK & KVKK Mevzuat Asistanı

Türk bankacılık ve kişisel veri koruma mevzuatı üzerinde çalışan, tamamen çevrimdışı RAG tabanlı soru-cevap sistemi. 15 BDDK yönetmeliği ve KVKK metni üzerinde anlamsal arama yapar; her yanıtın dayandığı belge ve benzerlik skorunu birlikte gösterir.

Microsoft Cloud Summer School 2026 kapsamında geliştirildi.

---

## Mimari

```
Kullanıcı sorusu
      ↓
Embedding (sentence-transformers)
      ↓
Cosine similarity → en alakalı 3 chunk
      ↓
Prompt oluşturma (chunk + soru)
      ↓
Microsoft Foundry Local → Phi-3.5 Mini
      ↓
Cevap + kaynak gösterimi
```

Belge parçaları SQLite'ta vektörleriyle birlikte saklanır. Benzerlik skoru 0.55'in altında kalan sorgular yanıtlanmaz, sistem bilgi bulunmadığını bildirir.

---

## Kurulum

**Gereksinimler:** Python 3.11+, Node.js 18+

```bash
git clone https://github.com/efeturkol/bddk-rag-assistant.git
cd bddk-rag-assistant

python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

**Veritabanını oluştur.** `belgeler/` klasöründeki PDF'leri işler, embedding'leri çıkarır ve `bddk.db` dosyasını yazar. Embedding modeli ilk çalıştırmada HuggingFace'ten otomatik iner.

```bash
chmod +x run_ingest.sh
./run_ingest.sh
```

**Backend:**

```bash
uvicorn api:app --reload
```

**Frontend** (ayrı terminalde):

```bash
cd frontend
npm install
npm start
```

`http://localhost:3000` adresini aç.

---

## Stack

| | |
|---|---|
| LLM Runtime | Microsoft Foundry Local |
| Chat Modeli | Phi-3.5 Mini |
| Embedding | [efeturkol/bddk-embedding-model](https://huggingface.co/efeturkol/bddk-embedding-model) |
| Vektör Depolama | SQLite |
| Backend | FastAPI |
| Frontend | React |
| PDF İşleme | pdfplumber |

---

## Belge Kaynakları

`belgeler/` klasöründeki 15 PDF resmî kaynaklardan alınmıştır:

- BDDK Mevzuat — https://www.bddk.org.tr/Mevzuat
- KVKK Mevzuat — https://www.kvkk.gov.tr/Icerik/6749/KVKK-Mevzuat

Yeni belge eklemek için PDF'i `belgeler/` klasörüne koyup `./run_ingest.sh` komutunu tekrar çalıştırmak yeterli.

---

**Mahmut Efe Türkol** · [GitHub](https://github.com/efeturkol) · [LinkedIn](https://linkedin.com/in/efeturkol)
