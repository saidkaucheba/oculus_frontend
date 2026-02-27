import { useState } from "react";
import PageLayout from "../components/PageLayout";
import { usePatients, useFeedback, usePatientMedia, usePatient } from "../api.hooks";
import { api } from "../api.client";
import type { Patient, SurgeonReferral, CreateReferralPayload, MediaFile } from "../api.types";

function PatientPanel({
  patient,
  onClose,
  onScheduled,
  onFeedbackSent,
}: {
  patient: Patient;
  onClose: () => void;
  onScheduled: (msg: string) => void;
  onFeedbackSent: (msg: string) => void;
}) {
  const { data: fresh, update } = usePatient(patient.id);
  const p = fresh ?? patient;

  const { data: mediaFiles } = usePatientMedia(patient.id);
  const { create: sendReferral } = useFeedback();

  const [surgeryDate, setSurgeryDate] = useState(p.surgery_date ?? "");
  const [scheduling, setScheduling] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  async function handleSchedule(e: React.FormEvent) {
    e.preventDefault();
    if (!surgeryDate) return;
    setScheduling(true);
    setScheduleError(null);
    try {
      await update({ surgery_date: surgeryDate, status: "blue" });
      onScheduled(`Операция для ${p.last_name} ${p.first_name} назначена на ${formatDate(surgeryDate)}`);
    } catch {
      setScheduleError("Ошибка при назначении даты операции");
    } finally {
      setScheduling(false);
    }
  }

  const [referralComment, setReferralComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleReferral(e: React.FormEvent) {
    e.preventDefault();
    if (!referralComment.trim()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload: CreateReferralPayload = {
        patient: p.id,
        comment: referralComment,
      };
      await sendReferral(payload);
      setReferralComment("");
      onFeedbackSent(`Пациент ${p.last_name} ${p.first_name} направлен на доследование`);
    } catch {
      setSubmitError("Ошибка при отправке направления");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{
      flex: 2,
      minWidth: 360,
      display: "flex",
      flexDirection: "column",
      gap: 16,
    }}>
      <div style={{
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: "20px 24px",
        boxShadow: "0 2px 12px rgba(57,86,138,0.07)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
      }}>
        <div>
          <h2 style={{ margin: "0 0 4px 0", fontSize: 22 }}>
            {p.last_name} {p.first_name} {p.middle_name ?? ""}
          </h2>
          <div style={{ fontSize: 14, color: "#616161" }}>
            {p.surgery_type ?? "Тип операции не указан"}
          </div>
          {p.surgery_date && (
            <div style={{
              marginTop: 8,
              display: "inline-block",
              fontSize: 13,
              fontWeight: 600,
              color: "#1a6cd4",
              backgroundColor: "#1a6cd418",
              padding: "4px 14px",
              borderRadius: 50,
              border: "1px solid #1a6cd440",
            }}>
              📅 Операция: {formatDate(p.surgery_date)}
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none", border: "none", fontSize: 22,
            color: "#616161", cursor: "pointer", padding: "0 4px", lineHeight: 1,
          }}
        >✕</button>
      </div>

      <div style={{
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 24,
        boxShadow: "0 2px 12px rgba(57,86,138,0.07)",
      }}>
        <h3 style={{ fontSize: 17, marginBottom: 16, color: "#39568A" }}>🗓 Назначить операцию</h3>
        <form onSubmit={handleSchedule} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ fontSize: 13, color: "#616161", display: "block", marginBottom: 4 }}>
              Дата операции
            </label>
            <input
              type="date"
              value={surgeryDate}
              onChange={(e) => setSurgeryDate(e.target.value)}
              required
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid #CFCFCF",
                fontSize: 15,
                fontFamily: "inherit",
                width: "100%",
                boxSizing: "border-box",
              }}
            />
          </div>

          {scheduleError && (
            <div style={{ color: "#a70b0b", fontSize: 13, backgroundColor: "#fde8e8", borderRadius: 8, padding: "8px 12px" }}>
              {scheduleError}
            </div>
          )}

          <button
            type="submit"
            disabled={scheduling || !surgeryDate}
            style={{
              padding: "11px",
              backgroundColor: scheduling || !surgeryDate ? "#8fa3c4" : "#1a6cd4",
              color: "#FFFFFF",
              border: "none",
              borderRadius: 10,
              fontSize: 15,
              fontFamily: "inherit",
              cursor: scheduling || !surgeryDate ? "not-allowed" : "pointer",
            }}
          >
            {scheduling ? "Назначение..." : "Назначить дату операции"}
          </button>
        </form>
      </div>

      <div style={{
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 24,
        boxShadow: "0 2px 12px rgba(57,86,138,0.07)",
      }}>
        <h3 style={{ fontSize: 17, marginBottom: 16, color: "#39568A" }}>📁 Документы пациента</h3>
        {!mediaFiles || mediaFiles.length === 0 ? (
          <p style={{ color: "#616161", fontSize: 14 }}>Нет прикреплённых документов</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {mediaFiles.map((f: MediaFile) => (
              <div key={f.id} style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                backgroundColor: "#F5F4F9",
                borderRadius: 10,
                padding: "10px 14px",
              }}>
                <span style={{ fontSize: 20 }}>📄</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <a
                    href={f.file_url ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      fontSize: 14,
                      color: "#39568A",
                      textDecoration: "none",
                      fontWeight: 500,
                      display: "block",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {f.file_name || "Файл"}
                  </a>
                  {f.description && (
                    <div style={{ fontSize: 12, color: "#616161", marginTop: 1 }}>{f.description}</div>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                  {f.is_verified ? (
                    <span style={{
                      fontSize: 12, fontWeight: 700, color: "#3ea515",
                      backgroundColor: "#3ea51518", padding: "3px 10px",
                      borderRadius: 50, border: "1px solid #3ea51540",
                    }}>✓ Верифицирован</span>
                  ) : (
                    <button
                      onClick={() => api.mediaFiles.verify(f.id)}
                      style={{
                        padding: "4px 10px",
                        fontSize: 12,
                        backgroundColor: "#39568A",
                        color: "#FFFFFF",
                        border: "none",
                        borderRadius: 6,
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      Верифицировать
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 24,
        boxShadow: "0 2px 12px rgba(57,86,138,0.07)",
        border: "1px solid #f5e6c8",
      }}>
        <h3 style={{ fontSize: 17, marginBottom: 8, color: "#b8950a" }}>
          🔬 Направить на доследование
        </h3>
        <p style={{ fontSize: 13, color: "#616161", marginBottom: 16, lineHeight: 1.5 }}>
          После отправки пациент вернётся к участковому врачу со статусом
          <strong> «На подготовке»</strong>. Врач увидит ваш комментарий и проведёт
          необходимые исследования, после чего повторно запросит операцию.
        </p>

        <form onSubmit={handleReferral} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ fontSize: 13, color: "#616161", display: "block", marginBottom: 4 }}>
              Что именно нужно доследовать <span style={{ color: "#a70b0b" }}>*</span>
            </label>
            <textarea
              placeholder="Например: необходимо повторить ОАК, уточнить давление, провести ЭКГ..."
              value={referralComment}
              onChange={(e) => setReferralComment(e.target.value)}
              required
              style={{
                width: "100%", height: 100, padding: 12, borderRadius: 8,
                border: "1px solid #CFCFCF", fontFamily: "inherit", fontSize: 14,
                resize: "vertical", boxSizing: "border-box",
              }}
            />
          </div>

          {submitError && (
            <div style={{ color: "#a70b0b", fontSize: 13, backgroundColor: "#fde8e8", borderRadius: 8, padding: "8px 12px" }}>
              {submitError}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !referralComment.trim()}
            style={{
              padding: "12px",
              backgroundColor: submitting || !referralComment.trim() ? "#c9a84c" : "#b8950a",
              color: "#FFFFFF",
              border: "none",
              borderRadius: 10,
              fontSize: 15,
              fontFamily: "inherit",
              cursor: submitting || !referralComment.trim() ? "not-allowed" : "pointer",
              fontWeight: 600,
            }}
          >
            {submitting ? "Отправка..." : "↩ Направить на доследование"}
          </button>
        </form>
      </div>
    </div>
  );
}

function SurgeonDashboard() {
  const { data: greenData, loading: loadingGreen, error } = usePatients({ status: "green" });
  const { data: blueData, loading: loadingBlue } = usePatients({ status: "blue" });

  const [selected, setSelected] = useState<Patient | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const loading = loadingGreen || loadingBlue;

  const requested = greenData?.results ?? [];
  const scheduled = blueData?.results ?? [];

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  return (
    <PageLayout>
      <div style={{ padding: 24, maxWidth: 1280, margin: "0 auto" }}>
        {toast && (
          <div style={{
            backgroundColor: "#e8fde8", color: "#3ea515", borderRadius: 10,
            padding: "12px 18px", marginBottom: 16, fontSize: 14, fontWeight: 500,
            boxShadow: "0 2px 8px rgba(62,165,21,0.15)",
          }}>
            ✅ {toast}
          </div>
        )}

        {error && (
          <div style={{ color: "#a70b0b", marginBottom: 16, backgroundColor: "#fde8e8", borderRadius: 8, padding: "10px 14px" }}>
            Ошибка загрузки: {error.error ?? error.detail}
          </div>
        )}

        <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ width: 320, flexShrink: 0, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 16,
              overflow: "hidden",
              boxShadow: "0 2px 12px rgba(57,86,138,0.07)",
            }}>
              <div style={{
                padding: "14px 20px",
                borderBottom: "1px solid #EAE8EF",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#3ea515", flexShrink: 0 }} />
                <span style={{ fontSize: 15, fontWeight: 700 }}>Запросы на операцию</span>
                <span style={{
                  marginLeft: "auto",
                  fontSize: 12,
                  backgroundColor: "#3ea51518",
                  color: "#3ea515",
                  borderRadius: 50,
                  padding: "2px 10px",
                  fontWeight: 600,
                  border: "1px solid #3ea51540",
                }}>
                  {loading ? "…" : requested.length}
                </span>
              </div>

              {loading ? (
                <div style={{ padding: "18px 20px", color: "#616161", fontSize: 14 }}>Загрузка...</div>
              ) : requested.length === 0 ? (
                <div style={{ padding: "18px 20px", color: "#616161", fontSize: 14 }}>Нет новых запросов</div>
              ) : (
                <div>
                  {requested.map((p: Patient) => (
                    <PatientListItem
                      key={p.id}
                      patient={p}
                      selected={selected?.id === p.id}
                      onClick={() => setSelected(p)}
                      accent="#3ea515"
                      badge="Ожидает назначения"
                    />
                  ))}
                </div>
              )}
            </div>
            <div style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 16,
              overflow: "hidden",
              boxShadow: "0 2px 12px rgba(57,86,138,0.07)",
            }}>
              <div style={{
                padding: "14px 20px",
                borderBottom: "1px solid #EAE8EF",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#1a6cd4", flexShrink: 0 }} />
                <span style={{ fontSize: 15, fontWeight: 700 }}>Назначенные операции</span>
                <span style={{
                  marginLeft: "auto",
                  fontSize: 12,
                  backgroundColor: "#1a6cd418",
                  color: "#1a6cd4",
                  borderRadius: 50,
                  padding: "2px 10px",
                  fontWeight: 600,
                  border: "1px solid #1a6cd440",
                }}>
                  {loading ? "…" : scheduled.length}
                </span>
              </div>

              {loading ? (
                <div style={{ padding: "18px 20px", color: "#616161", fontSize: 14 }}>Загрузка...</div>
              ) : scheduled.length === 0 ? (
                <div style={{ padding: "18px 20px", color: "#616161", fontSize: 14 }}>Нет назначенных операций</div>
              ) : (
                <div>
                  {scheduled.map((p: Patient) => (
                    <PatientListItem
                      key={p.id}
                      patient={p}
                      selected={selected?.id === p.id}
                      onClick={() => setSelected(p)}
                      accent="#1a6cd4"
                      badge={p.surgery_date ? `📅 ${formatDate(p.surgery_date)}` : "Дата назначена"}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {selected ? (
            <PatientPanel
              key={selected.id}
              patient={selected}
              onClose={() => setSelected(null)}
              onScheduled={(msg) => { showToast(msg); }}
              onFeedbackSent={(msg) => { showToast(msg); setSelected(null); }}
            />
          ) : (
            <div style={{
              flex: 2,
              minWidth: 320,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#FFFFFF",
              borderRadius: 16,
              padding: 48,
              boxShadow: "0 2px 12px rgba(57,86,138,0.07)",
              color: "#616161",
              flexDirection: "column",
              gap: 12,
            }}>
              <div style={{ fontSize: 48 }}>🔬</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>Выберите пациента из списка слева</div>
              <div style={{ fontSize: 14, color: "#9e9e9e", textAlign: "center", maxWidth: 280 }}>
                Здесь появится карточка с возможностью назначить операцию, просмотреть документы и оставить отзыв
              </div>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}

function PatientListItem({
  patient, selected, onClick, accent, badge,
}: {
  patient: Patient;
  selected: boolean;
  onClick: () => void;
  accent: string;
  badge: string;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: "12px 20px",
        borderBottom: "1px solid #F0EFF4",
        cursor: "pointer",
        backgroundColor: selected ? `${accent}0D` : "transparent",
        borderLeft: selected ? `3px solid ${accent}` : "3px solid transparent",
        transition: "all 0.15s",
      }}
      onMouseEnter={(e) => { if (!selected) e.currentTarget.style.backgroundColor = "#F5F4F9"; }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = selected ? `${accent}0D` : "transparent"; }}
    >
      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>
        {patient.last_name} {patient.first_name} {patient.middle_name ?? ""}
      </div>
      <div style={{ fontSize: 12, color: "#616161", marginBottom: 4 }}>
        {patient.surgery_type ?? "Тип не указан"}
      </div>
      <span style={{
        fontSize: 11,
        fontWeight: 600,
        color: accent,
        backgroundColor: `${accent}18`,
        padding: "2px 8px",
        borderRadius: 50,
        border: `1px solid ${accent}40`,
      }}>
        {badge}
      </span>
    </div>
  );
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default SurgeonDashboard;
