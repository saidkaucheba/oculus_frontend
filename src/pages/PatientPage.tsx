import { useParams, useNavigate } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import { useMedicalHistory } from "../api.hooks";
import { useAuth } from "../AuthContext";
import type { PatientStatus } from "../api.types";

const STATUS_LABELS: Record<PatientStatus, string> = {
  red:    "Неполные данные",
  yellow: "На подготовке",
  green:  "Готов к операции",
  blue:   "Назначена дата",
};
const STATUS_COLORS: Record<PatientStatus, string> = {
  red:    "#e52322",
  yellow: "#d4a017",
  green:  "#3ea515",
  blue:   "#1a6cd4",
};

const S: React.CSSProperties = { fontFamily: "'Bitter', Georgia, serif" };

function PatientPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const isUnlinked = id === "unlinked";
  const { data, loading, error } = useMedicalHistory(isUnlinked ? null : (id ?? null));

  if (isUnlinked) {
    return (
      <PageLayout>
        <div style={{ padding: "28px 20px", maxWidth: 560, margin: "0 auto" }}>
          <div style={{
            backgroundColor: "#FFFFFF", borderRadius: 16, padding: 32, textAlign: "center",
            boxShadow: "0 2px 12px rgba(57,86,138,0.08)",
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>👁</div>
            <h2 style={{ marginBottom: 12, color: "#39568A", ...S }}>Карточка пациента не привязана</h2>
            <p style={{ color: "#616161", lineHeight: 1.6, ...S }}>
              Ваш аккаунт ещё не связан с медицинской карточкой.
              Обратитесь к вашему врачу-офтальмологу — он создаст карточку
              и выдаст вам код доступа.
            </p>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (loading) {
    return (
      <PageLayout>
        <div style={{ padding: 40, color: "#616161", ...S }}>Загрузка данных...</div>
      </PageLayout>
    );
  }

  if (error || !data) {
    const status = (error as { status?: number })?.status;
    return (
      <PageLayout>
        <div style={{ padding: "28px 20px", maxWidth: 560, margin: "0 auto" }}>
          <div style={{ backgroundColor: "#FFFFFF", borderRadius: 16, padding: 32, boxShadow: "0 2px 12px rgba(57,86,138,0.08)" }}>
            <h2 style={{ color: "#a70b0b", marginBottom: 12, ...S }}>
              {status === 403 ? "Доступ запрещён" : status === 404 ? "Карточка не найдена" : "Ошибка загрузки данных"}
            </h2>
            <p style={{ color: "#616161", marginBottom: 20, ...S }}>
              {status === 403
                ? "У вас нет прав на просмотр этой карточки."
                : status === 404
                ? "Медицинская карточка не найдена. Обратитесь к врачу."
                : `Не удалось загрузить данные. ${(error as { detail?: string })?.detail ?? ""}`}
            </p>
            {user?.role === "patient" && user.linked_patient_id && (
              <button
                onClick={() => navigate(`/patient/${user.linked_patient_id}`)}
                style={{ ...S, padding: "10px 20px", backgroundColor: "#39568A", color: "#FFFFFF", border: "none", borderRadius: 10, fontSize: 15, cursor: "pointer" }}
              >
                Открыть мою карточку
              </button>
            )}
          </div>
        </div>
      </PageLayout>
    );
  }

  const { patient, iol_calculations, media_files, feedback } = data;

  const step1Status: StepStatus = "done";
  const step2Status: StepStatus =
    patient.status === "blue" ? "cancelled" :
    patient.status === "green" ? "waiting" : "waiting";
  const step3Status: StepStatus =
    patient.status === "blue" ? "waiting" : "pending";

  const hasPlannedDates = patient.status !== "red";

  return (
    <PageLayout>
      <div style={{ padding: "20px 20px 32px", maxWidth: 680, margin: "0 auto" }}>

        <div style={{
          display: "flex", alignItems: "center", gap: 12, marginBottom: 20,
          fontSize: 15, ...S, color: "#616161", cursor: "pointer",
        }}
          onClick={() => navigate(-1)}
        >
          <span style={{ fontSize: 18, color: "#39568A" }}>‹</span>
          <span style={{ color: "#000", fontWeight: 500 }}>Личный кабинет</span>
        </div>
        <div style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 16,
          padding: "28px 28px 24px",
          boxShadow: "0 2px 12px rgba(57,86,138,0.07)",
          marginBottom: 20,
        }}>
          <h2 style={{ ...S, fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Планируемые даты:</h2>

          <StepRow
            step="Этап 1. Сдача анализов."
            status={step1Status}
            task="Анализы в районной поликлинике"
            date={patient.created_at ?? null}
          />

          <StepRow
            step="Этап 2. Проверка."
            status={step2Status}
            task="Проверка хирургом"
            date={null}
          />

          <StepRow
            step="Этап 3: Операция."
            status={step3Status}
            task="Операция"
            date={patient.surgery_date ?? null}
          />
        </div>

        <div style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 16,
          padding: "24px 28px",
          boxShadow: "0 2px 12px rgba(57,86,138,0.07)",
          marginBottom: 20,
        }}>
          <h2 style={{ ...S, fontSize: 20, fontWeight: 700, marginBottom: 16 }}>О пациенте</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <InfoRow label="Диагноз" value={`${patient.diagnosis_icd10 ?? ""} ${patient.diagnosis_text ?? ""}`.trim() || "—"} />
            <InfoRow label="Планируемая операция" value={patient.surgery_type ?? "Не указана"} />
            {patient.surgery_date && (
              <InfoRow
                label="Дата операции"
                value={new Date(patient.surgery_date).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
              />
            )}
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "#616161", minWidth: 140 }}>Статус</span>
              <span style={{
                fontSize: 13, fontWeight: 600,
                color: STATUS_COLORS[patient.status],
                backgroundColor: `${STATUS_COLORS[patient.status]}15`,
                padding: "3px 12px", borderRadius: 50,
                border: `1px solid ${STATUS_COLORS[patient.status]}40`,
              }}>
                {STATUS_LABELS[patient.status]}
              </span>
            </div>
          </div>
        </div>

        {iol_calculations.length > 0 && (
          <div style={{
            backgroundColor: "#FFFFFF", borderRadius: 16, padding: "24px 28px",
            boxShadow: "0 2px 12px rgba(57,86,138,0.07)", marginBottom: 20,
          }}>
            <h2 style={{ ...S, fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Расчёты ИОЛ</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {iol_calculations.map((c) => (
                <div key={c.id} style={{ backgroundColor: "#EAE8EF", borderRadius: 12, padding: "14px 18px", minWidth: 150 }}>
                  <div style={{ fontSize: 12, color: "#616161", marginBottom: 4 }}>
                    {c.formula_used.toUpperCase().replace("_", "/")} · {c.eye === "right" ? "Правый глаз" : "Левый глаз"}
                  </div>
                  <div style={{ ...S, fontSize: 28, fontWeight: 700, color: "#39568A", lineHeight: 1 }}>{c.result_diopters} D</div>
                  <div style={{ fontSize: 11, color: "#616161", marginTop: 4 }}>
                    {new Date(c.created_at).toLocaleDateString("ru-RU")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {media_files.length > 0 && (
          <div style={{
            backgroundColor: "#FFFFFF", borderRadius: 16, padding: "24px 28px",
            boxShadow: "0 2px 12px rgba(57,86,138,0.07)", marginBottom: 20,
          }}>
            <h2 style={{ ...S, fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Мои документы</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {media_files.map((f) => (
                <a key={f.id} href={f.file_url ?? "#"} target="_blank" rel="noreferrer" style={{
                  backgroundColor: "#EAE8EF", borderRadius: 10, padding: "10px 16px",
                  color: "#39568A", textDecoration: "none", fontSize: 14,
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <span>📄</span>
                  <span>{f.file_name || "Файл"}</span>
                  {f.is_verified && <span style={{ color: "#3ea515", fontSize: 12, fontWeight: 700 }}>✓</span>}
                </a>
              ))}
            </div>
          </div>
        )}

        {feedback.length > 0 && (
          <div style={{
            backgroundColor: "#fffbf0", borderRadius: 16, padding: "24px 28px",
            boxShadow: "0 2px 12px rgba(184,149,10,0.08)", border: "1px solid #f5e6c8",
          }}>
            <h2 style={{ ...S, fontSize: 20, fontWeight: 700, marginBottom: 12, color: "#b8950a" }}>
              🔬 Назначено доследование
            </h2>
            <p style={{ ...S, color: "#616161", fontSize: 14, marginBottom: 14, lineHeight: 1.6 }}>
              Хирург направил вас на дополнительное обследование. Обратитесь к вашему
              участковому врачу — он объяснит что нужно сдать или проверить.
            </p>
            {feedback.map((f) => (
              <div key={f.id} style={{
                backgroundColor: "#FFFFFF", borderRadius: 10, padding: "10px 14px",
                marginBottom: 8, borderLeft: "3px solid #b8950a",
              }}>
                <div style={{ ...S, fontSize: 13, color: "#b8950a", fontWeight: 600 }}>
                  {new Date(f.created_at).toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", gap: 12 }}>
      <span style={{ fontSize: 13, color: "#616161", minWidth: 140, fontFamily: "'Bitter', Georgia, serif" }}>{label}</span>
      <span style={{ fontSize: 15, fontFamily: "'Bitter', Georgia, serif" }}>{value}</span>
    </div>
  );
}

type StepStatus = "done" | "waiting" | "cancelled" | "pending";

function StepRow({ step, status, task, date }: {
  step: string;
  status: StepStatus;
  task: string;
  date: string | null;
}) {
  const statusText: Record<StepStatus, string> = {
    done:      "Завершено",
    waiting:   "В ожидании",
    cancelled: "Отменена",
    pending:   "В ожидании",
  };
  const statusColor: Record<StepStatus, string> = {
    done:      "#3ea515",
    waiting:   "#d4a017",
    cancelled: "#e52322",
    pending:   "#616161",
  };
  const isDone       = status === "done";
  const isCancelled  = status === "cancelled";

  return (
    <div style={{ borderBottom: "1px solid #EAE8EF", paddingBottom: 16, marginBottom: 16 }}>
      <div style={{
        display: "flex", justifyContent: "space-between",
        fontSize: 13, color: "#616161",
        fontFamily: "'Bitter', Georgia, serif",
        marginBottom: 8,
      }}>
        <span>{step}</span>
        <span style={{ fontWeight: 600, color: statusColor[status] }}>{statusText[status]}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 20, height: 20,
            border: `2px solid ${isDone ? "#3ea515" : isCancelled ? "#e52322" : "#CFCFCF"}`,
            borderRadius: 3, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            backgroundColor: isDone ? "#3ea515" : "transparent",
          }}>
            {isDone && (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M 2 6 L 5 9 L 10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
          <span style={{
            fontSize: 16, fontWeight: 500,
            fontFamily: "'Bitter', Georgia, serif",
            textDecoration: isDone ? "line-through" : "none",
            color: isDone || isCancelled ? "#616161" : "#000000",
          }}>
            {task}
          </span>
        </div>
        {date && (
          <span style={{
            fontSize: 14, color: "#616161", flexShrink: 0, marginLeft: 16,
            fontFamily: "'Bitter', Georgia, serif",
          }}>
            {new Date(date).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" })},&nbsp;
            {new Date(date).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>
    </div>
  );
}

export default PatientPage;
