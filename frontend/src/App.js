import { useState } from "react";
import axios from "axios";

const Styles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;450;500&family=JetBrains+Mono:wght@400;500&display=swap');

    :root {
      --paper: #FAF8F5;
      --card: #FFFFFF;
      --ink: #16191F;
      --body: #4A5160;
      --muted: #8B8578;
      --rule: #E4DFD6;
      --seal: #A03328;
    }
    * { box-sizing: border-box; }
    body { margin: 0; background: var(--paper); }
    input:focus { outline: none; }

    .app { min-height: 100vh; color: var(--ink); font-family: 'Inter', sans-serif; }

    .bar { border-bottom: 1px solid var(--rule); background: var(--card); }
    .bar-in { max-width: 1080px; margin: 0 auto; padding: 22px 40px; display: flex; align-items: center; gap: 16px; }
    .logo { font-family: 'Space Grotesk', sans-serif; font-size: 19px; font-weight: 700; letter-spacing: -0.5px; }
    .div { width: 1px; height: 15px; background: var(--rule); }
    .tag { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--muted); letter-spacing: 0.5px; }
    .status { margin-left: auto; font-size: 11.5px; color: var(--muted); display: flex; align-items: center; gap: 7px; }
    .dot { width: 6px; height: 6px; border-radius: 50%; background: #4A9E5C; }

    .wrap { max-width: 1080px; margin: 0 auto; padding: 52px 40px 100px; }

    .hero h1 {
      font-family: 'Space Grotesk', sans-serif; font-size: 52px; font-weight: 700;
      line-height: 1.06; letter-spacing: -2px; margin: 0 0 20px; max-width: 16ch;
    }
    .hero h1 span { color: var(--seal); }
    .hero p { font-size: 16px; line-height: 1.65; color: var(--body); max-width: 52ch; margin: 0 0 40px; }

    .field { display: flex; border: 1px solid var(--rule); background: var(--card); border-radius: 3px; }
    .field input {
      flex: 1; padding: 18px 22px; border: none; background: transparent;
      color: var(--ink); font-size: 15.5px; font-family: 'Inter', sans-serif;
    }
    .field input::placeholder { color: var(--muted); }
    .field button {
      padding: 0 32px; border: none; border-left: 1px solid var(--rule);
      background: var(--ink); color: var(--card); font-family: 'Space Grotesk', sans-serif;
      font-size: 14px; font-weight: 600; cursor: pointer; transition: background .15s;
    }
    .field button:hover:not(:disabled) { background: var(--seal); }
    .field button:disabled { background: var(--paper); color: var(--muted); cursor: default; }

    .chips { display: flex; gap: 9px; flex-wrap: wrap; margin-top: 18px; }
    .chip {
      padding: 8px 15px; border: 1px solid var(--rule); background: transparent;
      color: var(--body); font-size: 13px; cursor: pointer; border-radius: 3px;
      font-family: 'Inter', sans-serif; transition: all .15s;
    }
    .chip:hover { border-color: var(--seal); color: var(--seal); }

    .eyebrow {
      font-family: 'JetBrains Mono', monospace; font-size: 10.5px;
      letter-spacing: 1.3px; color: var(--muted); margin-bottom: 10px;
    }

    .grid { display: grid; grid-template-columns: 1fr; gap: 40px; margin-top: 48px; animation: fade .4s ease; }
    @media (min-width: 900px) { .grid { grid-template-columns: minmax(0,1.45fr) minmax(300px,1fr); gap: 56px; } }

    .q {
      font-family: 'Space Grotesk', sans-serif; font-size: 28px; font-weight: 600;
      line-height: 1.25; letter-spacing: -0.8px; margin-bottom: 26px;
    }
    .answer {
      background: var(--card); border: 1px solid var(--rule); border-left: 3px solid var(--seal);
      padding: 28px 30px; border-radius: 3px; font-size: 16px; line-height: 1.85; color: var(--body);
    }

    .src { border-top: 1px solid var(--rule); padding: 15px 0; }
    .src-head { display: flex; align-items: center; gap: 12px; cursor: pointer; }
    .src-n { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--muted); }
    .src-name { flex: 1; font-size: 13px; font-weight: 500; color: var(--ink); word-break: break-word; }
    .src-body {
      margin-top: 12px; padding: 14px 16px; background: var(--paper);
      border-left: 2px solid var(--rule); font-size: 13px; line-height: 1.75; color: var(--body);
    }
    .meter { width: 48px; height: 3px; background: var(--rule); border-radius: 2px; overflow: hidden; }
    .meter i { display: block; height: 100%; background: var(--seal); }
    .score { font-family: 'JetBrains Mono', monospace; font-size: 10.5px; color: var(--muted); }

    .hist { border-top: 1px solid var(--rule); margin-top: 64px; padding-top: 26px; }
    .hist-item {
      padding: 12px 0; cursor: pointer; font-size: 14.5px; color: var(--body);
      border-bottom: 1px solid var(--rule); transition: color .15s;
    }
    .hist-item:hover { color: var(--seal); }

    .load { display: flex; align-items: center; gap: 9px; padding: 34px 0; }
    .load i { width: 5px; height: 5px; border-radius: 50%; background: var(--seal); animation: pulse 1.4s ease-in-out infinite; }
    .load i:nth-child(2) { animation-delay: .18s; }
    .load i:nth-child(3) { animation-delay: .36s; }
    .load span { font-size: 13.5px; color: var(--muted); margin-left: 5px; }

    @keyframes fade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
    @keyframes pulse { 0%,100% { opacity: .2; } 50% { opacity: 1; } }
  `}</style>
);

const Source = ({ index, source, content, score }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="src">
      <div className="src-head" onClick={() => setOpen(!open)}>
        <span className="src-n">{String(index + 1).padStart(2, "0")}</span>
        <span className="src-name">{source}</span>
        <span className="meter"><i style={{ width: `${score * 100}%` }} /></span>
        <span className="score">{score.toFixed(3)}</span>
      </div>
      {open && <div className="src-body">{content}…</div>}
    </div>
  );
};

const SUGGESTIONS = [
  "Kişisel veri nedir?",
  "Kredi kartı taksit sınırları nelerdir?",
  "Likidite karşılama oranı nedir?",
  "Bankaların iç sistemleri nelerdir?",
];

export default function App() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  const ask = async (text) => {
    const q = (text ?? query).trim();
    if (!q || loading) return;
    setLoading(true);
    setResult(null);
    setQuery("");
    try {
      const res = await axios.post("http://localhost:8000/ask", { query: q });
      const entry = { question: q, answer: res.data.answer, sources: res.data.sources };
      setResult(entry);
      setHistory((p) => [entry, ...p]);
    } catch {
      setResult({ question: q, answer: "Sunucuya bağlanılamadı. Backend çalışıyor mu kontrol edin.", sources: [] });
    }
    setLoading(false);
  };

  const open = (entry) => {
    setResult(entry);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="app">
      <Styles />

      <header className="bar">
        <div className="bar-in">
          <span className="logo">Mevzuat Asistanı</span>
          <span className="div" />
          <span className="tag">BDDK · KVKK</span>
          <span className="status"><span className="dot" />Foundry Local</span>
        </div>
      </header>

      <main className="wrap">
        {!result && !loading && history.length === 0 && (
          <div className="hero">
            <h1>Bankacılık mevzuatına <span>doğrudan</span> sorun.</h1>
            <p>
              15 BDDK yönetmeliği ve KVKK metni üzerinde anlamsal arama yapar.
              Her yanıtın dayandığı belge ve benzerlik skoru birlikte gösterilir.
            </p>
          </div>
        )}

        <div className="field">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && ask()}
            placeholder="Sorunuzu yazın"
          />
          <button onClick={() => ask()} disabled={loading}>Sor</button>
        </div>

        {!result && !loading && (
          <div className="chips">
            {SUGGESTIONS.map((s) => (
              <button key={s} className="chip" onClick={() => ask(s)}>{s}</button>
            ))}
          </div>
        )}

        {loading && (
          <div className="load"><i /><i /><i /><span>Mevzuat taranıyor</span></div>
        )}

        {result && (
          <div className="grid">
            <div>
              <div className="eyebrow">SORU</div>
              <div className="q">{result.question}</div>
              <div className="eyebrow">YANIT</div>
              <div className="answer">{result.answer}</div>
            </div>

            <aside>
              {result.sources.length > 0 && (
                <>
                  <div className="eyebrow">DAYANAK · {result.sources.length} BELGE</div>
                  {result.sources.map((s, i) => <Source key={i} index={i} {...s} />)}
                </>
              )}
            </aside>
          </div>
        )}

        {history.length > 1 && (
          <div className="hist">
            <div className="eyebrow">ÖNCEKİ SORULAR</div>
            {history.slice(1).map((h, i) => (
              <div key={i} className="hist-item" onClick={() => open(h)}>{h.question}</div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}