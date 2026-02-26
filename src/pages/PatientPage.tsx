import { useParams } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import { useMedicalHistory } from "../api.hooks";
import type { PatientStatus } from "../api.types";

const STATUS_LABELS: Record<PatientStatus, string> = {
  red: "Неполные данные",
  yellow: "На подготовке",
  green: "Готов к операции",
  blue: "Назначена дата",
};

const STATUS_COLORS: Record<PatientStatus, string> = {
  red: "#a70b0b",
  yellow: "#d0d31c",
  green: "#3ea515",
  blue: "#1a6cd4",
};

function PatientPage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error } = useMedicalHistory(id ?? null);

  if (loading) {
    return (
      <PageLayout>
        <div style={{ padding: 40, color: "#616161" }}>Загрузка...</div>
      </PageLayout>
    );
  }

  if (error || !data) {
    return (
      <PageLayout>
        <div style={{ padding: 40, color: "#a70b0b" }}>Ошибка загрузки данных.</div>
      </PageLayout>
    );
  }

  const { patient, iol_calculations, media_files, feedback } = data;
  const preparations = data as unknown as { preparations?: { completed: boolean; template_details?: { title: string } }[] };

  return (
    <PageLayout>
      <div style={{ padding: 24 }}>
        <h1 style={{ marginBottom: 8 }}>
          {patient.last_name} {patient.first_name} {patient.middle_name ?? ""}
        </h1>

        <span
          style={{
            display: "inline-block",
            marginBottom: 24,
            fontSize: 14,
            fontWeight: 600,
            color: STATUS_COLORS[patient.status],
            backgroundColor: `${STATUS_COLORS[patient.status]}18`,
            padding: "4px 14px",
            borderRadius: 20,
          }}
        >
          {STATUS_LABELS[patient.status]}
        </span>

        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          {/* Surgery info */}
          <div style={{ flex: 1, minWidth: 260, backgroundColor: "#FFFFFF", borderRadius: 16, padding: 24 }}>
            <h2 style={{ marginBottom: 16, fontSize: 20 }}>Операция</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <InfoRow label="Тип операции" value={patient.surgery_type ?? "Не указан"} />
              <InfoRow
                label="Дата операции"
                value={patient.surgery_date ? new Date(patient.surgery_date).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" }) : "Не назначена"}
              />
              <InfoRow label="Диагноз" value={patient.diagnosis_text ?? patient.diagnosis_icd10 ?? "—"} />
            </div>
          </div>

          {/* Preparation checklist */}
          <div style={{ flex: 1, minWidth: 260, backgroundColor: "#FFFFFF", borderRadius: 16, padding: 24 }}>
            <h2 style={{ marginBottom: 16, fontSize: 20 }}>Подготовка к операции</h2>
            {(!preparations.preparations || preparations.preparations.length === 0) ? (
              <p style={{ color: "#616161" }}>Пункты подготовки не назначены</p>
            ) : (
              (preparations.preparations ?? []).map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                    backgroundColor: item.completed ? "#3ea515" : "#CFCFCF",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#FFFFFF", fontSize: 13,
                  }}>
                    {item.completed ? "✓" : ""}
                  </span>
                  <span style={{ fontSize: 15, color: item.completed ? "#000000" : "#616161", textDecoration: item.completed ? "none" : "none" }}>
                    {item.template_details?.title ?? "Пункт подготовки"}
                  </span>
                  <span style={{ marginLeft: "auto", fontSize: 12, color: item.completed ? "#3ea515" : "#616161" }}>
                    {item.completed ? "завершено" : "ожидание"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* IOL results */}
        {iol_calculations.length > 0 && (
          <div style={{ marginTop: 20, backgroundColor: "#FFFFFF", borderRadius: 16, padding: 24 }}>
            <h2 style={{ marginBottom: 16, fontSize: 20 }}>Расчёты ИОЛ</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {iol_calculations.map((c) => (
                <div key={c.id} style={{ backgroundColor: "#EAE8EF", borderRadius: 10, padding: "12px 18px", minWidth: 160 }}>
                  <div style={{ fontSize: 12, color: "#616161" }}>
                    {c.formula_used.toUpperCase()} · {c.eye === "right" ? "Правый" : "Левый"}
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: "#39568A" }}>{c.result_diopters} D</div>
                  <div style={{ fontSize: 11, color: "#616161" }}>
                    {new Date(c.created_at).toLocaleDateString("ru-RU")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Documents */}
        {media_files.length > 0 && (
          <div style={{ marginTop: 20, backgroundColor: "#FFFFFF", borderRadius: 16, padding: 24 }}>
            <h2 style={{ marginBottom: 16, fontSize: 20 }}>Мои документы</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {media_files.map((f) => (
                <a key={f.id} href={f.file_url ?? "#"} target="_blank" rel="noreferrer"
                  style={{ backgroundColor: "#EAE8EF", borderRadius: 8, padding: "8px 14px", color: "#39568A", textDecoration: "none", fontSize: 14 }}>
                  📄 {f.file_name || "Файл"}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Feedback from surgeon */}
        {feedback.length > 0 && (
          <div style={{ marginTop: 20, backgroundColor: "#FFFFFF", borderRadius: 16, padding: 24 }}>
            <h2 style={{ marginBottom: 16, fontSize: 20 }}>Отзыв хирурга</h2>
            {feedback.map((f) => (
              <div key={f.id} style={{ backgroundColor: "#EAE8EF", borderRadius: 10, padding: 16, marginBottom: 10 }}>
                <p style={{ margin: "0 0 8px 0", color: "#000000" }}>{f.comment}</p>
                <div style={{ fontSize: 13, color: "#616161" }}>
                  {new Date(f.created_at).toLocaleDateString("ru-RU")}
                  {f.status_after && (
                    <span style={{ marginLeft: 10, fontWeight: 600 }}>· {f.status_after}</span>
                  )}
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
    <div>
      <div style={{ fontSize: 12, color: "#616161", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 16 }}>{value}</div>
    </div>
  );
}

export default PatientPage;
