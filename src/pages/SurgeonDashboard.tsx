import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import { usePatients, useFeedback } from "../api.hooks";
import type { Patient, FeedbackStatus, CreateFeedbackPayload } from "../api.types";

const STATUS_LABELS: Record<FeedbackStatus, string> = {
  success: "Успешно",
  complications: "С осложнениями",
  postponed: "Отложено",
  cancelled: "Отменено",
};

const STATUS_COLORS: Record<FeedbackStatus, string> = {
  success: "#3ea515",
  complications: "#d0d31c",
  postponed: "#1a6cd4",
  cancelled: "#a70b0b",
};

function SurgeonDashboard() {
  const navigate = useNavigate();
  const { data, loading, error } = usePatients({ status: "green" });
  const { create: createFeedback } = useFeedback();

  const [selected, setSelected] = useState<Patient | null>(null);
  const [feedbackStatus, setFeedbackStatus] = useState<FeedbackStatus>("success");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<string | null>(null);

  const patients = data?.results ?? [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload: CreateFeedbackPayload = {
        patient: selected.id,
        comment,
        status_after: feedbackStatus,
      };
      await createFeedback(payload);
      setSubmitted(`Отзыв для ${selected.last_name} ${selected.first_name} сохранён`);
      setSelected(null);
      setComment("");
      setFeedbackStatus("success");
      setTimeout(() => setSubmitted(null), 3000);
    } catch {
      setSubmitError("Ошибка при сохранении отзыва");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageLayout>
      <div style={{ padding: 24 }}>
        <h1 style={{ marginBottom: 24 }}>Кабинет хирурга</h1>

        {submitted && (
          <div style={{ backgroundColor: "#e8fde8", color: "#3ea515", borderRadius: 8, padding: "12px 16px", marginBottom: 16 }}>
            {submitted}
          </div>
        )}

        {error && (
          <div style={{ color: "#a70b0b", marginBottom: 16 }}>
            Ошибка загрузки: {error.error ?? error.detail}
          </div>
        )}

        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          {/* Patient list */}
          <div style={{ flex: 1, minWidth: 280 }}>
            <h2 style={{ marginBottom: 16, fontSize: 20 }}>Пациенты готовые к операции</h2>
            {loading ? (
              <div style={{ color: "#616161" }}>Загрузка...</div>
            ) : patients.length === 0 ? (
              <div style={{ color: "#616161" }}>Нет пациентов в статусе «Готов к операции»</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {patients.map((p: Patient) => (
                  <div
                    key={p.id}
                    onClick={() => setSelected(p)}
                    style={{
                      backgroundColor: selected?.id === p.id ? "#d6e4f7" : "#FFFFFF",
                      borderRadius: 12,
                      padding: "14px 18px",
                      cursor: "pointer",
                      border: selected?.id === p.id ? "2px solid #39568A" : "2px solid transparent",
                      transition: "all 0.15s",
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>
                      {p.last_name} {p.first_name} {p.middle_name ?? ""}
                    </div>
                    <div style={{ fontSize: 13, color: "#616161", marginTop: 2 }}>
                      {p.surgery_type ?? "Тип не указан"} · {p.surgery_date ? `Дата: ${p.surgery_date}` : "Дата не назначена"}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/doctor/patient/${p.id}`); }}
                      style={{ marginTop: 8, background: "none", border: "none", color: "#39568A", fontSize: 13, cursor: "pointer", padding: 0 }}
                    >
                      Открыть карточку →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Feedback form */}
          <div style={{ flex: 1, minWidth: 300, backgroundColor: "#FFFFFF", borderRadius: 16, padding: 24 }}>
            <h2 style={{ marginBottom: 16, fontSize: 20 }}>Отзыв после операции</h2>
            {!selected ? (
              <p style={{ color: "#616161" }}>Выберите пациента из списка слева</p>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ backgroundColor: "#EAE8EF", borderRadius: 10, padding: "12px 16px" }}>
                  <div style={{ fontWeight: 600 }}>
                    {selected.last_name} {selected.first_name}
                  </div>
                  <div style={{ fontSize: 13, color: "#616161" }}>{selected.surgery_type}</div>
                </div>

                <div>
                  <label style={{ fontSize: 13, color: "#616161", display: "block", marginBottom: 4 }}>
                    Результат операции
                  </label>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {(Object.entries(STATUS_LABELS) as [FeedbackStatus, string][]).map(([val, label]) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setFeedbackStatus(val)}
                        style={{
                          padding: "8px 16px",
                          borderRadius: 20,
                          border: `2px solid ${feedbackStatus === val ? STATUS_COLORS[val] : "#CFCFCF"}`,
                          backgroundColor: feedbackStatus === val ? `${STATUS_COLORS[val]}18` : "#FFFFFF",
                          color: feedbackStatus === val ? STATUS_COLORS[val] : "#616161",
                          cursor: "pointer",
                          fontSize: 14,
                          fontFamily: "inherit",
                          fontWeight: feedbackStatus === val ? 600 : 400,
                          transition: "all 0.15s",
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 13, color: "#616161", display: "block", marginBottom: 4 }}>
                    Комментарий
                  </label>
                  <textarea
                    placeholder="Комментарий районному врачу..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    required
                    style={{
                      width: "100%", height: 100, padding: 12, borderRadius: 8,
                      border: "1px solid #CFCFCF", fontFamily: "inherit", fontSize: 15,
                      resize: "vertical", boxSizing: "border-box",
                    }}
                  />
                </div>

                {submitError && (
                  <div style={{ color: "#a70b0b", fontSize: 14, backgroundColor: "#fde8e8", borderRadius: 8, padding: "8px 12px" }}>
                    {submitError}
                  </div>
                )}

                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    style={{ flex: 1, padding: "12px", backgroundColor: "#EAE8EF", border: "none", borderRadius: 10, fontSize: 15, fontFamily: "inherit", cursor: "pointer" }}
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      flex: 2, padding: "12px",
                      backgroundColor: submitting ? "#8fa3c4" : "#39568A", color: "#FFFFFF",
                      border: "none", borderRadius: 10, fontSize: 15, fontFamily: "inherit",
                      cursor: submitting ? "not-allowed" : "pointer",
                    }}
                  >
                    {submitting ? "Сохранение..." : "Подтвердить"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

export default SurgeonDashboard;
