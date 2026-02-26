import { useEffect, useState } from "react";
import PageLayout from "../components/PageLayout";
import IOLCalculator from "../components/IOLCalculator";

type ChecklistItem = {
  id: number;
  title: string;
  done: boolean;
};

const initialChecklist: ChecklistItem[] = [
  { id: 1, title: "Анализ крови", done: false },
  { id: 2, title: "ЭКГ", done: false },
  { id: 3, title: "Флюорография", done: false },
  { id: 4, title: "Осмотр терапевта", done: false },
];

function PatientCardPage() {
  const [passport, setPassport] = useState("");
  const [snils, setSnils] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [checklist, setChecklist] =
    useState<ChecklistItem[]>(initialChecklist);

  /* Загрузка сохранённых данных */
  useEffect(() => {
    const saved = localStorage.getItem("patientDraft");
    if (saved) {
      const data = JSON.parse(saved);
      setPassport(data.passport || "");
      setSnils(data.snils || "");
      setDiagnosis(data.diagnosis || "");
      setChecklist(data.checklist || initialChecklist);
    }
  }, []);

  /* Синхронизация при появлении интернета */
  useEffect(() => {
    function syncWhenOnline() {
      const saved = localStorage.getItem("patientDraft");
      if (saved) {
        console.log("📡 Синхронизация данных:", JSON.parse(saved));
        localStorage.removeItem("patientDraft");
      }
    }

    window.addEventListener("online", syncWhenOnline);
    return () => window.removeEventListener("online", syncWhenOnline);
  }, []);

  function saveData() {
    localStorage.setItem(
      "patientDraft",
      JSON.stringify({ passport, snils, diagnosis, checklist })
    );
    alert("Данные сохранены локально");
  }

  return (
    <PageLayout fullName="Иванов Петр Сергеевич">
      <h1>Карточка пациента</h1>

      {/* ОСНОВНОЙ КОНТЕЙНЕР */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 16,
          padding: 16,
          width: "100%",
        }}
      >
        {/* ОСНОВНЫЕ ДАННЫЕ */}
        <h2>Основные данные</h2>

        <div style={{ marginBottom: 16 }}>
          <input
            placeholder="Паспорт"
            value={passport}
            onChange={(e) => setPassport(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <input
            placeholder="СНИЛС"
            value={snils}
            onChange={(e) => setSnils(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <input
            placeholder="Диагноз"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            style={inputStyle}
          />
        </div>

        <h2 style={{ marginBottom: 16 }}>Чек-лист подготовки</h2>

        <div style={{ width: "100%" }}>
          {checklist.map((item) => (
            <label
              key={item.id}
              style={{
                display: "grid",
                gridTemplateColumns: "24px 1fr",
                alignItems: "center",
                columnGap: 12,
                marginBottom: 12,
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={item.done}
                onChange={() =>
                  setChecklist((prev) =>
                    prev.map((i) =>
                      i.id === item.id ? { ...i, done: !i.done } : i
                    )
                  )
                }
                style={{
                  width: 18,
                  height: 18,
                }}
              />

              <span
                style={{
                  fontSize: 16,
                  lineHeight: "20px",
                }}
              >
                {item.title}
              </span>
            </label>
          ))}
        </div>

        {/* КАЛЬКУЛЯТОР */}
        <div style={{ marginBottom: 32 }}>
          <IOLCalculator />
        </div>

        {/* КНОПКА СОХРАНЕНИЯ */}
        <button
          onClick={saveData}
          style={{
            padding: "14px 24px",
            fontSize: 16,
            backgroundColor: "#39568A",
            color: "#FFFFFF",
            border: "none",
            borderRadius: 10,
            cursor: "pointer",
            width: "100%",
            maxWidth: 300,
          }}
        >
          Сохранить
        </button>
      </div>
    </PageLayout>
  );
}

/* ===== ТОЛЬКО СТИЛИ ПОЛЕЙ ВВОДА ===== */
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  backgroundColor: "#FFFFFF",
  color: "#000000",
  border: "1px solid #CFCFCF",
  borderRadius: 8,
  fontSize: 16,
  boxSizing: "border-box",
  WebkitAppearance: "none",
  appearance: "none",
};

export default PatientCardPage;