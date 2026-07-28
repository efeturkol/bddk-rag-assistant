import { useState } from "react";
import axios from "axios";

const SourceCard = ({ source, content, score }) => {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        borderTop: "1px solid #222",
        paddingTop: "12px",
        marginTop: "12px",
      }}
    >
      <div
        onClick={() => setOpen(!open)}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
        }}
      >
        <span style={{ color: "#3b82f6", fontSize: "13px", fontWeight: "600" }}>
          📄 {source}
        </span>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <span style={{ color: "#555", fontSize: "12px" }}>
            benzerlik: {score}
          </span>
          <span style={{ color: "#555", fontSize: "12px" }}>
            {open ? "▲" : "▼"}
          </span>
        </div>
      </div>
      {open && (
        <div
          style={{
            marginTop: "10px",
            fontSize: "13px",
            color: "#888",
            lineHeight: "1.7",
            background: "#111",
            padding: "12px",
            borderRadius: "6px",
          }}
        >
          {content}...
        </div>
      )}
    </div>
  );
};

const Spinner = () => (
  <div style={{ display: "flex", gap: "6px", alignItems: "center", padding: "20px 0" }}>
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        style={{
          width: "8px", height: "8px", borderRadius: "50%",
          background: "#3b82f6",
          animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
        }}
      />
    ))}
    <style>{`
      @keyframes bounce {
        0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
        40% { transform: scale(1); opacity: 1; }
      }
    `}</style>
  </div>
);

export default function App() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  const ask = async () => {
    if (!query.trim() || loading) return;
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
    } catch {
      setResult({ question: query, answer: "Sunucuya bağlanılamadı.", sources: [] });
    }

    setQuery("");
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#e5e5e5", fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid #1a1a1a", padding: "20px 40px", display: "flex", alignItems: "center", gap: "12px", background: "#0f0f0f" }}>
        <span style={{ fontSize: "22px" }}>⚖️</span>
        <div>
          <div style={{ fontWeight: "700", fontSize: "17px", letterSpacing: "-0.3px" }}>
            BDDK & KVKK Mevzuat Asistanı
          </div>
          <div style={{ fontSize: "12px", color: "#555", marginTop: "2px" }}>
            Türk bankacılık ve kişisel veri koruma mevzuatı · Powered by Foundry Local
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "760px", margin: "0 auto", padding: "48px 24px" }}>

        {/* Karşılama */}
        {!result && !loading && history.length === 0 && (
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <div style={{ fontSize: "40px", marginBottom: "16px" }}>⚖️</div>
            <div style={{ fontSize: "22px", fontWeight: "700", marginBottom: "10px", letterSpacing: "-0.5px" }}>
              Mevzuat hakkında soru sorun
            </div>
            <div style={{ fontSize: "14px", color: "#555", lineHeight: "1.7", maxWidth: "420px", margin: "0 auto" }}>
              BDDK yönetmelikleri ve KVKK kapsamında sorularınızı yanıtlar,
              ilgili mevzuat maddelerini gösterir.
            </div>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginTop: "24px", flexWrap: "wrap" }}>
              {["Kişisel veri nedir?", "Kredi kartı taksit sınırları nelerdir?", "Likidite karşılama oranı nedir?"].map((q) => (
                <button
                  key={q}
                  onClick={() => setQuery(q)}
                  style={{
                    padding: "8px 14px", borderRadius: "20px", border: "1px solid #222",
                    background: "transparent", color: "#888", fontSize: "13px",
                    cursor: "pointer", transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => { e.target.style.borderColor = "#3b82f6"; e.target.style.color = "#3b82f6"; }}
                  onMouseLeave={(e) => { e.target.style.borderColor = "#222"; e.target.style.color = "#888"; }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "40px" }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && ask()}
            placeholder="Sorunuzu yazın..."
            style={{
              flex: 1, padding: "14px 18px", borderRadius: "10px",
              border: "1px solid #1e1e1e", background: "#141414",
              color: "#e5e5e5", fontSize: "15px", outline: "none",
              transition: "border 0.2s",
            }}
            onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
            onBlur={(e) => e.target.style.borderColor = "#1e1e1e"}
          />
          <button
            onClick={ask}
            disabled={loading}
            style={{
              padding: "14px 22px", borderRadius: "10px", border: "none",
              background: loading ? "#1a1a1a" : "#2563eb", color: loading ? "#555" : "#fff",
              fontWeight: "600", cursor: loading ? "not-allowed" : "pointer",
              fontSize: "15px", transition: "all 0.2s", minWidth: "80px",
            }}
          >
            {loading ? "..." : "Sor"}
          </button>
        </div>

        {/* Loading */}
        {loading && <Spinner />}

        {/* Sonuç */}
        {result && (
          <div style={{ marginBottom: "40px" }}>
            <div style={{ background: "#111", borderRadius: "12px", padding: "18px 22px", marginBottom: "10px", borderLeft: "3px solid #3b82f6" }}>
              <div style={{ fontSize: "11px", color: "#444", marginBottom: "8px", letterSpacing: "0.8px", textTransform: "uppercase" }}>Soru</div>
              <div style={{ fontSize: "15px", lineHeight: "1.6" }}>{result.question}</div>
            </div>

            <div style={{ background: "#111", borderRadius: "12px", padding: "18px 22px", marginBottom: "10px", borderLeft: "3px solid #16a34a" }}>
              <div style={{ fontSize: "11px", color: "#444", marginBottom: "8px", letterSpacing: "0.8px", textTransform: "uppercase" }}>Cevap</div>
              <div style={{ fontSize: "15px", lineHeight: "1.8", color: "#d4d4d4" }}>{result.answer}</div>
            </div>

            {result.sources.length > 0 && (
              <div style={{ background: "#111", borderRadius: "12px", padding: "18px 22px" }}>
                <div style={{ fontSize: "11px", color: "#444", marginBottom: "12px", letterSpacing: "0.8px", textTransform: "uppercase" }}>
                  Kaynaklar ({result.sources.length})
                </div>
                {result.sources.map((s, i) => (
                  <SourceCard key={i} {...s} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Geçmiş */}
        {history.length > 1 && (
          <div>
            <div style={{ fontSize: "11px", color: "#444", marginBottom: "14px", letterSpacing: "0.8px", textTransform: "uppercase" }}>
              Önceki Sorular
            </div>
            {history.slice(1).map((h, i) => (
              <div
                key={i}
                onClick={() => setResult(h)}
                style={{
                  background: "#111", borderRadius: "8px", padding: "12px 16px",
                  marginBottom: "8px", cursor: "pointer", border: "1px solid transparent",
                  transition: "border 0.2s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = "#222"}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = "transparent"}
              >
                <div style={{ fontSize: "13px", color: "#888" }}>{h.question}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}