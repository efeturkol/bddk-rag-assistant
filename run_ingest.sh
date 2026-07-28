#!/bin/bash
rm -f belgeler/bddk.db

#veritabanını temizle
for pdf in belgeler/*.pdf; do
    filename=$(basename "$pdf")
    python3 ingest.py "$filename"
done

echo "Tüm PDF'ler işlendi."