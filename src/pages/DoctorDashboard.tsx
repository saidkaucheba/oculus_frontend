import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import { usePatients } from "../api.hooks";
import type { Patient, PatientStatus, CreatePatientPayload } from "../api.types";

const STATUS_LABELS: Record<PatientStatus, string> = {
  red:    "Не готов",
  yellow: "Подготовка",
  green:  "Готовы",
  blue:   "Назначена дата",
};

const STATUS_COLORS: Record<PatientStatus, string> = {
  red:    "#a70b0b",
  yellow: "#b8950a",
  green:  "#3ea515",
  blue:   "#1a6cd4",
};

type Tab = "red" | "yellow" | "green";

function StatCard({ title, count, color, percent }: { title: string; count: number; color: string; percent: number }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (percent / 100) * circ;

  return (
    <div style={{
      backgroundColor: "#EAE8EF",
      borderRadius: 16,
      padding: "16px 20px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    }}>
      <div>
        <div style={{ fontSize: 13, color: "#616161", marginBottom: 6 }}>{title}</div>
        <div style={{ fontSize: 44, fontWeight: 700, color, lineHeight: 1 }}>{count}</div>
      </div>
      <svg width={70} height={70} viewBox="0 0 70 70">
        <circle cx={35} cy={35} r={r} fill="none" stroke="#E0DEE8" strokeWidth={6} />
        <circle
          cx={35} cy={35} r={r}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          transform="rotate(-90 35 35)"
        />
        <text x={35} y={39} textAnchor="middle" fontSize={12} fontWeight={700} fill={color}>{percent}%</text>
      </svg>
    </div>
  );
}

function DoctorDashboard() {
  const navigate = useNavigate();
  const { data, loading, error, createPatient, refetch } = usePatients();
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("red");

  const { data: searchData } = usePatients({ search: searchQuery || undefined });

  const allPatients = data?.results ?? [];
  const total = data?.count ?? 0;

  const counts: Record<PatientStatus, number> = {
    red:    allPatients.filter((p) => p.status === "red").length,
    yellow: allPatients.filter((p) => p.status === "yellow").length,
    green:  allPatients.filter((p) => p.status === "green").length,
    blue:   allPatients.filter((p) => p.status === "blue").length,
  };

  const pct = (n: number) => total > 0 ? Math.round((n / total) * 100) : 0;

  // When searching, show all; otherwise filter by tab
  const displayPatients = searchQuery
    ? (searchData?.results ?? [])
    : allPatients.filter((p) => p.status === activeTab);

  const tabs: { key: Tab; label: string }[] = [
    { key: "red",    label: "Не готов" },
    { key: "yellow", label: "Подготовка" },
    { key: "green",  label: "Готовы" },
  ];

  return (
    <PageLayout>
      <div style={{ padding: 24, maxWidth: 1280, margin: "0 auto" }}>
        {error && (
          <div style={{ color: "#a70b0b", marginBottom: 16, padding: 12, backgroundColor: "#fde8e8", borderRadius: 8 }}>
            Ошибка загрузки: {error.error ?? error.detail ?? "Неизвестная ошибка"}
          </div>
        )}

        <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
          {/* ── Left: stats + list ── */}
          <div style={{ flex: 1, minWidth: 300, display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Stat cards */}
            <div style={{ backgroundColor: "#FFFFFF", borderRadius: 16, padding: 20, boxShadow: "0 2px 12px rgba(57,86,138,0.07)" }}>
              <h2 style={{ fontSize: 22, marginBottom: 16 }}>Список пациентов:</h2>

              {loading ? (
                <div style={{ color: "#616161", padding: 8 }}>Загрузка...</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <StatCard title="Всего: Пациенты с неполными данными" count={counts.red}    color="#a70b0b" percent={pct(counts.red)} />
                  <StatCard title="Всего: Пациенты на подготовке"       count={counts.yellow} color="#b8950a" percent={pct(counts.yellow)} />
                  <StatCard title="Всего: Пациенты готовые к операции"  count={counts.green}  color="#3ea515" percent={pct(counts.green)} />
                </div>
              )}

              <button
                onClick={() => setShowAddForm(true)}
                style={{
                  marginTop: 16,
                  width: "100%",
                  padding: "13px",
                  backgroundColor: "#39568A",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 12,
                  fontSize: 16,
                  fontFamily: "inherit",
                  cursor: "pointer",
                }}
              >
                Добавить пациента
              </button>
            </div>

            {/* Search */}
            <div style={{ position: "relative" }}>
              <span style={{
                position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                color: "#616161", fontSize: 16, pointerEvents: "none",
              }}>🔍</span>
              <input
                placeholder="Поиск пациента"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  paddingLeft: 40,
                  paddingRight: 14,
                  paddingTop: 12,
                  paddingBottom: 12,
                  borderRadius: 50,
                  border: "1px solid #CFCFCF",
                  fontSize: 15,
                  fontFamily: "inherit",
                  width: "100%",
                  backgroundColor: "#FFFFFF",
                }}
              />
            </div>

            {/* Tabs */}
            {!searchQuery && (
              <div style={{ display: "flex", borderBottom: "2px solid #E0DEE8", gap: 0 }}>
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    style={{
                      flex: 1,
                      padding: "10px",
                      background: "none",
                      border: "none",
                      borderBottom: activeTab === tab.key ? `3px solid ${STATUS_COLORS[tab.key]}` : "3px solid transparent",
                      color: activeTab === tab.key ? STATUS_COLORS[tab.key] : "#616161",
                      fontFamily: "inherit",
                      fontSize: 15,
                      fontWeight: activeTab === tab.key ? 700 : 400,
                      cursor: "pointer",
                      marginBottom: -2,
                      transition: "all 0.18s",
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}

            {/* Patient list */}
            <div style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 16,
              overflow: "hidden",
              boxShadow: "0 2px 12px rgba(57,86,138,0.07)",
            }}>
              {loading ? (
                <div style={{ padding: 24, color: "#616161" }}>Загрузка...</div>
              ) : displayPatients.length === 0 ? (
                <div style={{ padding: 24, color: "#616161", textAlign: "center" }}>Пациенты не найдены</div>
              ) : (
                <>
                  <div style={{ padding: "12px 20px", borderBottom: "1px solid #EAE8EF" }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: "#a70b0b", fontFamily: "'Bitter', serif" }}>
                      Список пациентов:
                    </span>
                  </div>
                  {displayPatients.map((patient: Patient) => (
                    <div
                      key={patient.id}
                      onClick={() => navigate(`/doctor/patient/${patient.id}`)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                        padding: "14px 20px",
                        borderBottom: "1px solid #F0EFF4",
                        cursor: "pointer",
                        transition: "background-color 0.15s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F5F4F9")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <span style={{ color: "#616161", fontSize: 14, minWidth: 42, fontWeight: 600 }}>
                        {/* Show a truncated ID as numeric reference */}
                        {patient.id.slice(-4)}
                      </span>
                      <div style={{ flex: 1, borderLeft: "2px solid #EAE8EF", paddingLeft: 14 }}>
                        <div style={{ fontWeight: 600, fontSize: 15 }}>
                          {patient.last_name} {patient.first_name} {patient.middle_name ?? ""}
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* ── Right: summary ── */}
          <div style={{
            width: 240,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}>
            {[
              { label: "Всего:", value: total },
              { label: "Свободные даты:", value: counts.blue },
              { label: "Свободные хирурги:", value: 4 },
            ].map((item) => (
              <div key={item.label} style={{ backgroundColor: "#FFFFFF", borderRadius: 16, padding: "16px 20px", boxShadow: "0 2px 12px rgba(57,86,138,0.07)" }}>
                <div style={{ fontSize: 14, color: "#616161", marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: 52, fontWeight: 700, color: "#000000", lineHeight: 1 }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showAddForm && (
        <AddPatientModal
          onClose={() => setShowAddForm(false)}
          onSaved={() => { setShowAddForm(false); refetch(); }}
          createPatient={createPatient}
        />
      )}
    </PageLayout>
  );
}

/* ── Add patient modal ── */
function AddPatientModal({
  onClose, onSaved, createPatient,
}: {
  onClose: () => void;
  onSaved: () => void;
  createPatient: (p: CreatePatientPayload) => Promise<Patient>;
}) {
  const [form, setForm] = useState({
    last_name: "", first_name: "", middle_name: "",
    birth_date: "", gender: "", surgery_type: "", diagnosis_icd10: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await createPatient({
        ...form,
        gender: (form.gender as "male" | "female") || null,
        middle_name: form.middle_name || null,
        surgery_type: form.surgery_type || null,
        diagnosis_icd10: form.diagnosis_icd10 || null,
        status: "red",
      } as CreatePatientPayload);
      onSaved();
    } catch {
      setError("Ошибка при сохранении. Проверьте заполненные поля.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "#FFFFFF", borderRadius: 20, padding: "32px 32px 28px",
          width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto",
          boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 22 }}>Добавление карты пациента</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, color: "#616161", cursor: "pointer", padding: "0 4px" }}>✕</button>
        </div>

        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            ["last_name", "Фамилия", true], ["first_name", "Имя", true],
            ["middle_name", "Отчество", false], ["birth_date", "Дата рождения", true],
            ["surgery_type", "Тип операции", false], ["diagnosis_icd10", "Диагноз (МКБ-10)", false],
          ].map(([field, label, req]) => (
            <div key={field as string}>
              <label style={{ fontSize: 13, color: "#616161", display: "block", marginBottom: 4 }}>
                {label as string}{req ? " *" : ""}
              </label>
              <input
                value={(form as Record<string, string>)[field as string]}
                onChange={(e) => set(field as string, e.target.value)}
                type={field === "birth_date" ? "date" : "text"}
                required={req as boolean}
                style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #CFCFCF", fontSize: 15, fontFamily: "inherit", width: "100%" }}
              />
            </div>
          ))}

          <div>
            <label style={{ fontSize: 13, color: "#616161", display: "block", marginBottom: 4 }}>Пол</label>
            <select
              value={form.gender}
              onChange={(e) => set("gender", e.target.value)}
              style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #CFCFCF", fontSize: 15, fontFamily: "inherit", width: "100%" }}
            >
              <option value="">Не указан</option>
              <option value="male">Мужской</option>
              <option value="female">Женский</option>
            </select>
          </div>

          {error && <div style={{ color: "#a70b0b", fontSize: 14, backgroundColor: "#fde8e8", borderRadius: 8, padding: "8px 12px" }}>{error}</div>}

          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <button
              type="button" onClick={onClose}
              style={{ flex: 1, padding: "12px", backgroundColor: "#EAE8EF", border: "none", borderRadius: 10, fontSize: 16, fontFamily: "inherit", cursor: "pointer" }}
            >
              Отмена
            </button>
            <button
              type="submit" disabled={saving}
              style={{ flex: 1, padding: "12px", backgroundColor: saving ? "#8fa3c4" : "#39568A", color: "#FFFFFF", border: "none", borderRadius: 10, fontSize: 16, fontFamily: "inherit", cursor: saving ? "not-allowed" : "pointer" }}
            >
              {saving ? "Сохранение..." : "Сохранить"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DoctorDashboard;
