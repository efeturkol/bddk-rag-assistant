# BDDK & KVKK Mevzuat Asistanı

Türk bankacılık ve kişisel veri koruma mevzuatı üzerine çalışan, tamamen çevrimdışı RAG tabanlı yapay zeka asistanı. Microsoft Cloud Summer School 2026 kapsamında geliştirildi.

---

## Ne Yapar

BDDK yönetmelikleri ve KVKK dokümanlarından oluşan 15 PDF üzerinde semantik arama yaparak soruları yanıtlar. Her cevabın yanında ilgili yönetmelik maddesi ve benzerlik skoru gösterilir.

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
Microsoft Foundry Local → Phi modeli
      ↓
Cevap + kaynak gösterimi
```

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

**Embedding modelini indir:**
```bash
python3 -c "
from sentence_transformers import SentenceTransformer
SentenceTransformer('efeturkol/bddk-embedding-model').save('embedding-model')
"
```

**Veritabanını oluştur:**
```bash
chmod +x run_ingest.sh
./run_ingest.sh
```

**Backend:**
```bash
uvicorn api:app --reload
```

**Frontend:**
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
| Embedding | paraphrase-multilingual-MiniLM-L12-v2 |
| Vektör Depolama | SQLite |
| Backend | FastAPI |
| Frontend | React |
| PDF İşleme | pdfplumber |

---

## Belgeler

`belgeler/` klasörüne aşağıdaki kaynaklardan PDF indir:

- BDDK: https://www.bddk.org.tr/Mevzuat
- KVKK: https://www.kvkk.gov.tr/Icerik/6749/KVKK-Mevzuat

`bddk.db` dosyası `run_ingest.sh` ile otomatik oluşturulur, repoya dahil değildir.

---

**Mahmut Efe Türkol** · [GitHub](https://github.com/efeturkol) · [LinkedIn](https://linkedin.com/in/efeturkol)
