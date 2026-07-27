import { useState } from "react";
import axios from "axios";

export default function App() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  const ask = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await axios.post("http://localhost:8000/ask", { query });
      const newEntry = {
        question: query,
        answer: res.data.answer,
        sources: res.data.sources,
      };
      setResult(newEntry);
      setHistory((prev) => [newEntry, ...prev]);
    } catch (err) {
      setResult({ question: query, answer: "Sunucuya bağlanılamadı.", sources: [] });
    }

    setQuery("");
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0f0f0f", color: "#e5e5e5", fontFamily: "Inter, sans-serif" }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid #222", padding: "20px 40px", display: "flex", alignItems: "center", gap: "12px" }}>
        <span style={{ fontSize: "24px" }}>⚖️</span>
        <div>
          <div style={{ fontWeight: "700", fontSize: "18px" }}>BDDK & KVKK Mevzuat Asistanı</div>
          <div style={{ fontSize: "12px", color: "#666" }}>Türk bankacılık ve kişisel veri koruma mevzuatı</div>
        </div>
      </div>

      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 20px" }}>
        {/* Input */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "40px" }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && ask()}
            placeholder="Sorunuzu yazın... (örn: Kişisel veri nedir?)"
            style={{
              flex: 1, padding: "14px 18px", borderRadius: "10px",
              border: "1px solid #333", background: "#1a1a1a",
              color: "#e5e5e5", fontSize: "15px", outline: "none"
            }}
          />
          <button
            onClick={ask}
            disabled={loading}
            style={{
              padding: "14px 24px", borderRadius: "10px", border: "none",
              background: loading ? "#333" : "#2563eb", color: "#fff",
              fontWeight: "600", cursor: loading ? "not-allowed" : "pointer", fontSize: "15px"
            }}
          >
            {loading ? "..." : "Sor"}
          </button>
        </div>

        {/* Sonuç */}
        {loading && (
          <div style={{ textAlign: "center", color: "#666", padding: "40px" }}>
            Yanıt hazırlanıyor...
          </div>
        )}

        {result && (
          <div style={{ marginBottom: "40px" }}>
            {/* Soru */}
            <div style={{ background: "#1a1a1a", borderRadius: "10px", padding: "16px 20px", marginBottom: "12px", borderLeft: "3px solid #2563eb" }}>
              <div style={{ fontSize: "12px", color: "#666", marginBottom: "6px" }}>SORU</div>
              <div>{result.question}</div>
            </div>

            {/* Cevap */}
            <div style={{ background: "#1a1a1a", borderRadius: "10px", padding: "16px 20px", marginBottom: "12px", borderLeft: "3px solid #16a34a" }}>
              <div style={{ fontSize: "12px", color: "#666", marginBottom: "6px" }}>CEVAP</div>
              <div style={{ lineHeight: "1.7" }}>{result.answer}</div>
            </div>

            {/* Kaynaklar */}
            {result.sources.length > 0 && (
              <div style={{ background: "#1a1a1a", borderRadius: "10px", padding: "16px 20px" }}>
                <div style={{ fontSize: "12px", color: "#666", marginBottom: "12px" }}>KAYNAKLAR</div>
                {result.sources.map((s, i) => (
                  <div key={i} style={{ borderTop: i > 0 ? "1px solid #222" : "none", paddingTop: i > 0 ? "12px" : "0", marginTop: i > 0 ? "12px" : "0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span style={{ color: "#2563eb", fontSize: "13px", fontWeight: "600" }}>📄 {s.source}</span>
                      <span style={{ color: "#666", fontSize: "12px" }}>benzerlik: {s.score}</span>
                    </div>
                    <div style={{ fontSize: "13px", color: "#888", lineHeight: "1.5" }}>{s.content}...</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Geçmiş */}
        {history.length > 1 && (
          <div>
            <div style={{ fontSize: "12px", color: "#666", marginBottom: "16px" }}>ÖNCEKİ SORULAR</div>
            {history.slice(1).map((h, i) => (
              <div key={i} style={{ background: "#111", borderRadius: "8px", padding: "12px 16px", marginBottom: "8px", cursor: "pointer" }}
                onClick={() => setResult(h)}>
                <div style={{ fontSize: "13px", color: "#aaa" }}>{h.question}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}