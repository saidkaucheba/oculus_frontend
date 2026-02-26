import { useState } from "react";
import { useIOLCalculate, useIOLCalculateAndSave, usePatientIOLHistory } from "../api.hooks";
import type { IOLFormula, Eye } from "../api.types";

const FORMULAS: { value: IOLFormula; label: string }[] = [
  { value: "srk_t", label: "SRK/T" },
  { value: "holladay", label: "Holladay" },
  { value: "haigis", label: "Haigis" },
  { value: "barrett", label: "Barrett" },
  { value: "hoffer_q", label: "Hoffer Q" },
];

const inputStyle: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid #CFCFCF",
  fontSize: 15,
  fontFamily: "inherit",
  width: "100%",
  boxSizing: "border-box",
};

interface Props {
  patientId?: string;
}

function IOLCalculator({ patientId }: Props) {
  const [k1, setK1] = useState("");
  const [k2, setK2] = useState("");
  const [acd, setAcd] = useState("");
  const [axialLength, setAxialLength] = useState("");
  const [formula, setFormula] = useState<IOLFormula>("srk_t");
  const [eye, setEye] = useState<Eye>("right");
  const [mode, setMode] = useState<"calculate" | "all">("all");

  const { calculate, result, loading, error } = useIOLCalculate();
  const { save, loading: saving, error: saveError } = useIOLCalculateAndSave();
  const { data: history, refetch: refetchHistory } = usePatientIOLHistory(patientId ?? null);

  const [saved, setSaved] = useState(false);

  function isValid() {
    return [k1, k2, acd, axialLength].every((v) => v !== "" && !isNaN(Number(v)));
  }

  async function handleCalculate() {
    if (!isValid()) return;
    await calculate({
      axial_length: Number(axialLength),
      k1: Number(k1),
      k2: Number(k2),
      acd: Number(acd),
      formula: mode === "all" ? "all" : formula,
    });
  }

  async function handleSave() {
    if (!patientId || !result) return;
    const formulaToSave = mode === "all" ? "srk_t" : formula;
    const value = mode === "all" ? result[formulaToSave] : result[formula];
    if (value === undefined) return;
    await save({
      patient_id: patientId,
      axial_length: Number(axialLength),
      k1: Number(k1),
      k2: Number(k2),
      acd: Number(acd),
      formula: formulaToSave,
      eye,
    });
    setSaved(true);
    refetchHistory();
    setTimeout(() => setSaved(false), 2000);
  }

  const resultEntries = result
    ? Object.entries(result).filter(([k]) => k !== "errors")
    : [];

  return (
    <div style={{ backgroundColor: "#FFFFFF", borderRadius: 16, padding: 24 }}>
      <h2 style={{ marginBottom: 16 }}>Калькулятор ИОЛ</h2>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
        <div>
          <label style={{ fontSize: 12, color: "#616161", display: "block", marginBottom: 3 }}>K1 (дптр)</label>
          <input placeholder="например: 43.2" value={k1} onChange={(e) => setK1(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={{ fontSize: 12, color: "#616161", display: "block", marginBottom: 3 }}>K2 (дптр)</label>
          <input placeholder="например: 44.1" value={k2} onChange={(e) => setK2(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={{ fontSize: 12, color: "#616161", display: "block", marginBottom: 3 }}>ACD (мм)</label>
          <input placeholder="например: 3.2" value={acd} onChange={(e) => setAcd(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={{ fontSize: 12, color: "#616161", display: "block", marginBottom: 3 }}>Длина глаза (мм)</label>
          <input placeholder="например: 23.5" value={axialLength} onChange={(e) => setAxialLength(e.target.value)} style={inputStyle} />
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 140 }}>
          <label style={{ fontSize: 12, color: "#616161", display: "block", marginBottom: 3 }}>Формула</label>
          <select
            value={mode === "all" ? "all" : formula}
            onChange={(e) => {
              if (e.target.value === "all") { setMode("all"); }
              else { setMode("calculate"); setFormula(e.target.value as IOLFormula); }
            }}
            style={inputStyle}
          >
            <option value="all">Все формулы</option>
            {FORMULAS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: 120 }}>
          <label style={{ fontSize: 12, color: "#616161", display: "block", marginBottom: 3 }}>Глаз</label>
          <select value={eye} onChange={(e) => setEye(e.target.value as Eye)} style={inputStyle}>
            <option value="right">Правый</option>
            <option value="left">Левый</option>
          </select>
        </div>
      </div>

      {error && (
        <div style={{ color: "#a70b0b", fontSize: 13, marginBottom: 10, backgroundColor: "#fde8e8", borderRadius: 6, padding: "6px 10px" }}>
          {error.error ?? "Ошибка расчёта"}
        </div>
      )}

      <button
        onClick={handleCalculate}
        disabled={loading || !isValid()}
        style={{
          width: "100%", padding: "11px", backgroundColor: loading ? "#8fa3c4" : "#39568A",
          color: "#FFFFFF", border: "none", borderRadius: 10, fontSize: 15, fontFamily: "inherit",
          cursor: loading || !isValid() ? "not-allowed" : "pointer", marginBottom: 12,
        }}
      >
        {loading ? "Расчёт..." : "Рассчитать"}
      </button>

      {/* Results */}
      {resultEntries.length > 0 && (
        <div style={{ backgroundColor: "#EAE8EF", borderRadius: 10, padding: 14, marginBottom: 12 }}>
          {resultEntries.map(([f, v]) => (
            <div key={f} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>{f.toUpperCase().replace("_", "/")}</span>
              <span style={{ fontSize: 14, color: "#39568A", fontWeight: 700 }}>{v} D</span>
            </div>
          ))}
          {result?.errors && Object.entries(result.errors).map(([f, msg]) => (
            <div key={f} style={{ fontSize: 12, color: "#a70b0b", marginBottom: 4 }}>
              {f}: {msg}
            </div>
          ))}
        </div>
      )}

      {/* Save button — only when patient context provided */}
      {patientId && resultEntries.length > 0 && (
        <>
          {saveError && <div style={{ color: "#a70b0b", fontSize: 13, marginBottom: 8 }}>{saveError.error}</div>}
          {saved && <div style={{ color: "#3ea515", fontSize: 13, marginBottom: 8 }}>Сохранено ✓</div>}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              width: "100%", padding: "10px", backgroundColor: saving ? "#8fa3c4" : "#EAE8EF",
              color: "#39568A", border: "1px solid #39568A", borderRadius: 10, fontSize: 14,
              fontFamily: "inherit", cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            {saving ? "Сохранение..." : "Сохранить расчёт"}
          </button>
        </>
      )}

      {/* History */}
      {history && history.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#616161", marginBottom: 8 }}>История расчётов:</div>
          {history.slice(0, 5).map((c) => (
            <div key={c.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4, color: "#616161" }}>
              <span>{new Date(c.created_at).toLocaleDateString("ru-RU")} · {c.formula_used.toUpperCase()} · {c.eye === "right" ? "П" : "Л"}</span>
              <span style={{ fontWeight: 600, color: "#39568A" }}>{c.result_diopters} D</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default IOLCalculator;
