#!/bin/bash
# Veritabanını temizle
rm -f belgeler/bddk.db

# Her PDF'i ayrı process olarak çalıştır
for pdf in belgeler/*.pdf; do
    filename=$(basename "$pdf")
    python3 ingest.py "$filename"
done

echo "Tüm PDF'ler işlendi."