import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import IOLCalculator from "../components/IOLCalculator";
import { usePatient, usePatientPreparations, usePatientMedia, usePatientReferrals } from "../api.hooks";
import { useAuth } from "../AuthContext";
import type { ApiError, PatientStatus } from "../api.types";

const STATUS_LABELS: Record<PatientStatus, string> = {
  red:    "Требуется консультация хирурга",
  yellow: "Идёт подготовка",
  green:  "Готов к операции",
  blue:   "Операция назначена",
};

const STATUS_COLORS: Record<PatientStatus, string> = {
  red:    "#a70b0b",
  yellow: "#b8950a",
  green:  "#3ea515",
  blue:   "#1a6cd4",
};

const STATUS_BG: Record<PatientStatus, string> = {
  red:    "#fde8e8",
  yellow: "#fffbf0",
  green:  "#e8fde8",
  blue:   "#e8f0fd",
};

const S: React.CSSProperties = { fontFamily: "'Bitter', Georgia, serif" };

const fieldStyle: React.CSSProperties = {
  ...S,
  padding: "9px 14px",
  borderRadius: 8,
  border: "1px solid #CFCFCF",
  fontSize: 15,
  outline: "none",
  color: "#000",
  backgroundColor: "#FFFFFF",
  width: "100%",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  color: "#888",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  display: "block",
  marginBottom: 3,
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <span style={labelStyle}>{label}</span>
      <span style={{ fontSize: 15, fontWeight: 600, color: "#000", ...S }}>{value || "—"}</span>
    </div>
  );
}

function Card({ title, children, action }: {
  title?: string; children: React.ReactNode; action?: React.ReactNode;
}) {
  return (
    <div style={{
      backgroundColor: "#FFFFFF",
      borderRadius: 16,
      marginBottom: 16,
      boxShadow: "0 2px 12px rgba(57,86,138,0.07)",
      overflow: "hidden",
    }}>
      {title && (
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "14px 20px 12px",
          borderBottom: "1px solid #EAE8EF",
        }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#39568A", ...S }}>{title}</span>
          {action}
        </div>
      )}
      <div style={{ padding: "16px 20px" }}>
        {children}
      </div>
    </div>
  );
}

function PatientCardPage() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: patient, loading, error: patientError, update } = usePatient(id ?? null);
  const { data: preparationsData, complete: completePrep }      = usePatientPreparations(id ?? null);
  const { data: mediaFiles, upload, remove }                    = usePatientMedia(id ?? null);
  const { data: referrals }                                     = usePatientReferrals(id ?? null);

  const [editing, setEditing]         = useState(false);
  const [form, setForm]               = useState({
    last_name: "", first_name: "", middle_name: "",
    passport_series: "", passport_number: "", passport_issued_by: "", passport_issue_date: "",
    snils: "", insurance_policy: "",
    diagnosis_icd10: "", diagnosis_text: "", surgery_type: "",
    surgery_date: "", status: "red" as PatientStatus,
  });
  const [initialized, setInitialized] = useState(false);

  if (patient && !initialized) {
    setForm({
      last_name:           patient.last_name,
      first_name:          patient.first_name,
      middle_name:         patient.middle_name         ?? "",
      passport_series:     patient.passport_series     ?? "",
      passport_number:     patient.passport_number     ?? "",
      passport_issued_by:  patient.passport_issued_by  ?? "",
      passport_issue_date: (patient as unknown as Record<string,string>).passport_issue_date ?? "",
      snils:               patient.snils               ?? "",
      insurance_policy:    patient.insurance_policy    ?? "",
      diagnosis_icd10:     patient.diagnosis_icd10     ?? "",
      diagnosis_text:      patient.diagnosis_text      ?? "",
      surgery_type:        patient.surgery_type        ?? "",
      surgery_date:        patient.surgery_date        ?? "",
      status:              patient.status,
    });
    setInitialized(true);
  }

  function setField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const [saving, setSaving]           = useState(false);
  const [saveError, setSaveError]     = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setSaveError(null);
    try {
      await update({
        last_name: form.last_name, first_name: form.first_name,
        middle_name: form.middle_name || null,
        passport_series: form.passport_series || null,
        passport_number: form.passport_number || null,
        passport_issued_by: form.passport_issued_by || null,
        snils: form.snils || null, insurance_policy: form.insurance_policy || null,
        diagnosis_icd10: form.diagnosis_icd10 || null,
        diagnosis_text: form.diagnosis_text || null,
        surgery_type: form.surgery_type || null,
        surgery_date: form.surgery_date || null,
        status: form.status,
      });
      setSaveSuccess(true);
      setEditing(false);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      const e = err as ApiError;
      setSaveError(e.error ?? e.detail ?? "Ошибка при сохранении");
    } finally {
      setSaving(false);
    }
  }

  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestComment,   setRequestComment]   = useState("");
  const [requesting,       setRequesting]       = useState(false);
  const [requestSuccess,   setRequestSuccess]   = useState(false);

  async function handleRequestSurgery(e: React.FormEvent) {
    e.preventDefault();
    setRequesting(true);
    try {
      await update({ status: "green" });
      setForm((f) => ({ ...f, status: "green" }));
      setRequestSuccess(true);
      setShowRequestModal(false);
      setRequestComment("");
      setTimeout(() => setRequestSuccess(false), 3500);
    } catch {
      alert("Ошибка при отправке запроса на операцию");
    } finally {
      setRequesting(false);
    }
  }

  const fileRef                          = useRef<HTMLInputElement>(null);
  const [showUploadModal, setShowUpload] = useState(false);
  const [selectedFile, setSelectedFile]  = useState<File | null>(null);
  const [uploading, setUploading]        = useState(false);
  const [uploadError, setUploadError]    = useState<string | null>(null);
  const [dragOver, setDragOver]          = useState(false);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile || !id) return;
    setUploading(true); setUploadError(null);
    try {
      await upload(selectedFile);
      setSelectedFile(null);
      setShowUpload(false);
    } catch {
      setUploadError("Ошибка загрузки файла");
    } finally {
      setUploading(false);
    }
  }

  const preparations = preparationsData?.results ?? [];

  const age = patient?.birth_date
    ? Math.floor((Date.now() - new Date(patient.birth_date).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
    : null;

  if (loading) return (
    <PageLayout><div style={{ padding: 40, color: "#616161", ...S }}>Загрузка...</div></PageLayout>
  );
  if (patientError || !patient) return (
    <PageLayout><div style={{ padding: 40, color: "#a70b0b", ...S }}>Ошибка загрузки пациента</div></PageLayout>
  );

  const cardNum        = parseInt(patient.id.replace(/-/g, "").slice(-4), 16) % 10000;
  const completedCount = preparations.filter(p => p.completed).length;
  const progressPct    = preparations.length ? Math.round((completedCount / preparations.length) * 100) : 0;

  return (
    <PageLayout>
      <div style={{ ...S, padding: "20px 24px 60px", maxWidth: 1280 }}>

        {saveSuccess && (
          <div style={{ backgroundColor: "#e8fde8", color: "#3ea515", borderRadius: 10, padding: "10px 16px", marginBottom: 12, fontSize: 14 }}>
            Данные сохранены ✓
          </div>
        )}
        {requestSuccess && (
          <div style={{ backgroundColor: "#e8fde8", color: "#3ea515", borderRadius: 10, padding: "10px 16px", marginBottom: 12, fontSize: 14 }}>
            ✅ Запрос на операцию отправлен хирургу
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ fontSize: 14, color: "#616161", display: "flex", alignItems: "center", gap: 6 }}>
            <button
              onClick={() => navigate("/doctor")}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#616161", fontSize: 20, padding: 0, lineHeight: 1 }}
            >‹</button>
            <span style={{ cursor: "pointer", color: "#39568A" }} onClick={() => navigate("/doctor")}>Пациенты</span>
            <span style={{ color: "#CFCFCF" }}>/</span>
            <span style={{ color: "#000" }}>{patient.last_name} {patient.first_name} {patient.middle_name ?? ""}</span>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "#616161" }}>№ карты <strong>{cardNum}</strong></span>
            {editing ? (
              <>
                <button
                  onClick={() => setEditing(false)}
                  style={{ ...S, padding: "9px 18px", backgroundColor: "#EAE8EF", color: "#000", border: "none", borderRadius: 10, fontSize: 14, cursor: "pointer" }}
                >Отмена</button>
                <button
                  onClick={(e) => handleSave(e as unknown as React.FormEvent)}
                  disabled={saving}
                  style={{ ...S, padding: "9px 20px", backgroundColor: saving ? "#8fa3c4" : "#3ea515", color: "#FFFFFF", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer" }}
                >{saving ? "Сохранение..." : "Сохранить"}</button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                style={{ ...S, padding: "9px 20px", backgroundColor: "#39568A", color: "#FFFFFF", border: "none", borderRadius: 10, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
              >✏ Редактировать</button>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 320, display: "flex", flexDirection: "column" }}>

            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <h2 style={{ ...S, fontSize: 26, fontWeight: 700, margin: "0 0 6px" }}>
                    {patient.last_name} {patient.first_name} {patient.middle_name ?? ""}
                  </h2>
                  <div style={{ fontSize: 14, color: "#616161", display: "flex", gap: 16, flexWrap: "wrap" }}>
                    {age !== null && (
                      <span>{age} лет · {new Date(patient.birth_date).toLocaleDateString("ru-RU")}</span>
                    )}
                    {patient.gender && (
                      <span>{patient.gender === "male" ? "Мужской" : "Женский"}</span>
                    )}
                    {patient.diagnosis_icd10 && (
                      <span style={{ color: "#39568A", fontWeight: 600 }}>МКБ: {patient.diagnosis_icd10}</span>
                    )}
                  </div>
                </div>
                <div style={{
                  padding: "8px 16px", borderRadius: 20,
                  backgroundColor: STATUS_BG[patient.status],
                  border: `1px solid ${STATUS_COLORS[patient.status]}50`,
                  color: STATUS_COLORS[patient.status],
                  fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0,
                }}>
                  {STATUS_LABELS[patient.status]}
                </div>
              </div>

              {preparations.length > 0 && (
                <div style={{ marginTop: 18 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#616161", marginBottom: 6 }}>
                    <span>Готовность к операции</span>
                    <span style={{ fontWeight: 700, color: progressPct === 100 ? "#3ea515" : "#39568A" }}>
                      {completedCount} / {preparations.length} ({progressPct}%)
                    </span>
                  </div>
                  <div style={{ height: 7, backgroundColor: "#EAE8EF", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{
                      height: "100%", width: `${progressPct}%`,
                      backgroundColor: progressPct === 100 ? "#3ea515" : "#39568A",
                      borderRadius: 4, transition: "width 0.4s",
                    }} />
                  </div>
                </div>
              )}

              {referrals && referrals.length > 0 && (
                <div style={{ marginTop: 16, backgroundColor: "#fffbf0", borderRadius: 12, padding: "12px 16px", border: "1px solid #f5e6c8" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#b8950a", marginBottom: 10 }}>
                    🔬 Направления на доследование ({referrals.length})
                  </div>
                  {referrals.map((r) => (
                    <div key={r.id} style={{ backgroundColor: "#FFFFFF", borderRadius: 8, padding: "8px 12px", marginBottom: 6, borderLeft: "3px solid #b8950a" }}>
                      <div style={{ fontSize: 11, color: "#b8950a", fontWeight: 600, marginBottom: 3 }}>
                        {r.surgeon_name ?? "Хирург"} · {new Date(r.created_at).toLocaleDateString("ru-RU")}
                      </div>
                      <div style={{ ...S, fontSize: 13 }}>{r.comment}</div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <form onSubmit={handleSave}>
              <Card
                title="Личные данные"
                action={editing ? (
                  <button type="submit" disabled={saving} style={{ ...S, padding: "5px 16px", backgroundColor: saving ? "#8fa3c4" : "#3ea515", color: "#FFFFFF", border: "none", borderRadius: 7, fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer" }}>
                    {saving ? "Сохранение..." : "Сохранить"}
                  </button>
                ) : undefined}
              >
                {saveError && (
                  <div style={{ color: "#a70b0b", fontSize: 13, backgroundColor: "#fde8e8", borderRadius: 8, padding: "8px 12px", marginBottom: 14 }}>
                    {saveError}
                  </div>
                )}

                {editing ? (
                  <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                    {[["last_name","Фамилия",true],["first_name","Имя",true],["middle_name","Отчество",false]].map(([f, lbl, req]) => (
                      <div key={f as string} style={{ flex: 1 }}>
                        <label style={labelStyle}>{lbl as string}{req ? " *" : ""}</label>
                        <input value={(form as Record<string,string>)[f as string]} onChange={(e) => setField(f as string, e.target.value)} style={fieldStyle} required={req as boolean} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <InfoRow label="ФИО" value={`${patient.last_name} ${patient.first_name} ${patient.middle_name ?? ""}`} />
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 28px" }}>
                  <InfoRow label="Телефон" value={(patient as unknown as Record<string,string>).phone ?? "—"} />
                  <InfoRow label="E-mail"  value={(patient as unknown as Record<string,string>).email ?? "—"} />
                </div>

                <div style={{ height: 1, backgroundColor: "#EAE8EF", margin: "4px 0 16px" }} />
                <div style={{ fontSize: 11, fontWeight: 700, color: "#39568A", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.06em" }}>Паспортные данные</div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 28px" }}>
                  <div>
                    {editing ? (
                      <div style={{ marginBottom: 14 }}>
                        <label style={labelStyle}>Серия / Номер</label>
                        <div style={{ display: "flex", gap: 6 }}>
                          <input value={form.passport_series} onChange={(e) => setField("passport_series", e.target.value)} style={{ ...fieldStyle, width: 90 }} placeholder="Серия" />
                          <input value={form.passport_number} onChange={(e) => setField("passport_number", e.target.value)} style={fieldStyle} placeholder="Номер" />
                        </div>
                      </div>
                    ) : <InfoRow label="Серия / Номер" value={`${patient.passport_series ?? "—"} ${patient.passport_number ?? ""}`.trim()} />}
                  </div>
                  <div>
                    {editing ? (
                      <div style={{ marginBottom: 14 }}>
                        <label style={labelStyle}>Дата выдачи</label>
                        <input value={form.passport_issue_date} onChange={(e) => setField("passport_issue_date", e.target.value)} style={fieldStyle} type="date" />
                      </div>
                    ) : <InfoRow label="Дата выдачи" value={(patient as unknown as Record<string,string>).passport_issue_date ?? "—"} />}
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    {editing ? (
                      <div style={{ marginBottom: 14 }}>
                        <label style={labelStyle}>Кем выдан</label>
                        <input value={form.passport_issued_by} onChange={(e) => setField("passport_issued_by", e.target.value)} style={fieldStyle} />
                      </div>
                    ) : <InfoRow label="Кем выдан" value={patient.passport_issued_by ?? "—"} />}
                  </div>
                  <div>
                    {editing ? (
                      <div style={{ marginBottom: 14 }}>
                        <label style={labelStyle}>СНИЛС</label>
                        <input value={form.snils} onChange={(e) => setField("snils", e.target.value)} style={fieldStyle} placeholder="000-000-000 00" />
                      </div>
                    ) : <InfoRow label="СНИЛС" value={patient.snils ?? "—"} />}
                  </div>
                  <div>
                    {editing ? (
                      <div style={{ marginBottom: 14 }}>
                        <label style={labelStyle}>Полис ОМС</label>
                        <input value={form.insurance_policy} onChange={(e) => setField("insurance_policy", e.target.value)} style={fieldStyle} placeholder="0000000000000000" />
                      </div>
                    ) : <InfoRow label="Полис ОМС" value={patient.insurance_policy ?? "—"} />}
                  </div>
                </div>
              </Card>
            </form>

            <Card title="Калькулятор ИОЛ">
              <IOLCalculator patientId={id} />
            </Card>

          </div>

          <div style={{ width: 280, flexShrink: 0, display: "flex", flexDirection: "column" }}>
            <div style={{ backgroundColor: "#FFFFFF", borderRadius: 16, marginBottom: 16, boxShadow: "0 2px 12px rgba(57,86,138,0.07)", overflow: "hidden" }}>
              <div style={{ backgroundColor: STATUS_BG[patient.status], borderBottom: `2px solid ${STATUS_COLORS[patient.status]}30`, padding: "16px 20px" }}>
                <div style={{ fontSize: 10, color: STATUS_COLORS[patient.status], fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Статус</div>
                <div style={{ ...S, fontSize: 14, fontWeight: 700, color: STATUS_COLORS[patient.status] }}>{STATUS_LABELS[patient.status]}</div>
              </div>
              <div style={{ padding: "16px 20px" }}>
                {editing ? (
                  <div>
                    <label style={labelStyle}>Изменить статус</label>
                    <select value={form.status} onChange={(e) => setField("status", e.target.value)} style={fieldStyle}>
                      <option value="red">Не готов</option>
                      <option value="yellow">Подготовка</option>
                      <option value="green">Готов к операции</option>
                      <option value="blue">Назначена дата</option>
                    </select>
                  </div>
                ) : patient.status !== "green" && patient.status !== "blue" ? (
                  <button
                    onClick={() => setShowRequestModal(true)}
                    style={{ ...S, width: "100%", padding: "12px", backgroundColor: "#3ea515", color: "#FFFFFF", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer" }}
                  >✓ Подтвердить готовность</button>
                ) : (
                  <div style={{ padding: "10px 14px", borderRadius: 10, textAlign: "center", backgroundColor: STATUS_BG[patient.status], color: STATUS_COLORS[patient.status], fontSize: 13, fontWeight: 600, ...S }}>
                    {patient.status === "blue" ? "📅 Операция назначена хирургом" : "✅ Запрос отправлен хирургу"}
                  </div>
                )}
              </div>
            </div>

            <Card title="Медицинские данные">
              {editing ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {([
                    ["diagnosis_icd10", "Диагноз (МКБ-10)", "text", "H40.1"],
                    ["diagnosis_text",  "Описание диагноза", "text", ""],
                    ["surgery_type",    "Тип операции", "text", ""],
                    ["surgery_date",    "Дата операции", "date", ""],
                  ] as [string, string, string, string][]).map(([f, lbl, type, placeholder]) => (
                    <div key={f}>
                      <label style={labelStyle}>{lbl}</label>
                      <input value={(form as Record<string,string>)[f]} onChange={(e) => setField(f, e.target.value)} style={fieldStyle} type={type} placeholder={placeholder} />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <InfoRow label="Диагноз" value={patient.diagnosis_icd10 ? `${patient.diagnosis_icd10}${patient.diagnosis_text ? " — " + patient.diagnosis_text : ""}` : "—"} />
                  <InfoRow label="Тип операции"  value={patient.surgery_type ?? "—"} />
                  <InfoRow label="Дата операции" value={patient.surgery_date ? new Date(patient.surgery_date).toLocaleDateString("ru-RU") : "Планируется"} />
                </>
              )}
            </Card>

            <Card
              title="Документы"
              action={
                <button onClick={() => setShowUpload(true)} style={{ ...S, padding: "5px 14px", backgroundColor: "#39568A", color: "#FFFFFF", border: "none", borderRadius: 7, fontSize: 12, cursor: "pointer" }}>
                  + Загрузить
                </button>
              }
            >
              {mediaFiles && mediaFiles.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {mediaFiles.map((f) => (
                    <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", backgroundColor: "#F5F4F9", borderRadius: 8 }}>
                      <span style={{ fontSize: 18 }}>📄</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.file_name || "Файл"}</div>
                        <div style={{ fontSize: 11, color: "#888" }}>{f.is_verified ? "✓ Верифицирован" : "Ожидает проверки"}</div>
                      </div>
                      <button onClick={() => remove(f.id)} style={{ background: "none", border: "none", color: "#CFCFCF", cursor: "pointer", fontSize: 15, padding: 0 }} title="Удалить">✕</button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: "#888", fontSize: 13, textAlign: "center", padding: "10px 0" }}>Документы не загружены</div>
              )}
            </Card>

            <Card title="План подготовки">
              {patient.surgery_type && (
                <div style={{ fontSize: 12, color: "#39568A", marginBottom: 12, fontWeight: 600 }}>{patient.surgery_type}</div>
              )}
              {preparations.length === 0 ? (
                <div style={{ color: "#888", fontSize: 13, padding: "8px 0" }}>Нет пунктов подготовки</div>
              ) : (
                <>
                  <div style={{ fontSize: 10, color: "#888", fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Лабораторная диагностика</div>
                  {preparations.slice(0, 3).map((prep) => (
                    <PrepRow
                      key={prep.id}
                      title={prep.template_details?.title ?? ""}
                      completed={prep.completed}
                      date={prep.completion_date ? new Date(prep.completion_date).toLocaleDateString("ru-RU") : ""}
                      onComplete={() => completePrep(prep.id)}
                      onUpload={() => setShowUpload(true)}
                    />
                  ))}
                  {preparations.length > 3 && (
                    <>
                      <div style={{ fontSize: 10, color: "#888", fontWeight: 700, margin: "12px 0 6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Инструментальная диагностика</div>
                      {preparations.slice(3).map((prep) => (
                        <PrepRow
                          key={prep.id}
                          title={prep.template_details?.title ?? ""}
                          completed={prep.completed}
                          date={prep.completion_date ? new Date(prep.completion_date).toLocaleDateString("ru-RU") : ""}
                          onComplete={() => completePrep(prep.id)}
                          onUpload={() => setShowUpload(true)}
                        />
                      ))}
                    </>
                  )}
                </>
              )}
            </Card>

          </div>
        </div>
      </div>

      <FeedbackFloat patientName={`${patient.last_name} ${patient.first_name}`} />

      {showRequestModal && (
        <div onClick={() => setShowRequestModal(false)} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: "#FFFFFF", borderRadius: 20, padding: 32, width: "100%", maxWidth: 460, boxShadow: "0 8px 40px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ ...S, margin: 0, fontSize: 22 }}>Подтверждение готовности</h2>
              <button onClick={() => setShowRequestModal(false)} style={{ background: "none", border: "none", fontSize: 22, color: "#616161", cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ fontSize: 14, color: "#616161", marginBottom: 16, lineHeight: 1.6, backgroundColor: "#EAE8EF", borderRadius: 10, padding: "12px 14px" }}>
              После подтверждения пациент получит статус <strong>«Готов к операции»</strong>.
              Хирург увидит его и назначит дату самостоятельно.
            </div>
            <form onSubmit={handleRequestSurgery} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <textarea
                placeholder="Комментарий для хирурга (необязательно)..."
                value={requestComment} onChange={(e) => setRequestComment(e.target.value)}
                style={{ ...S, width: "100%", height: 80, padding: 12, borderRadius: 8, border: "1px solid #CFCFCF", fontSize: 14, resize: "vertical", boxSizing: "border-box" }}
              />
              <button type="submit" disabled={requesting} style={{ ...S, width: "100%", padding: "14px", backgroundColor: requesting ? "#8fa3c4" : "#39568A", color: "#FFFFFF", border: "none", borderRadius: 50, fontSize: 17, fontWeight: 700, cursor: requesting ? "not-allowed" : "pointer" }}>
                {requesting ? "Отправка..." : "Подтвердить готовность"}
              </button>
            </form>
          </div>
        </div>
      )}

      {showUploadModal && (
        <div onClick={() => setShowUpload(false)} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: "#FFFFFF", borderRadius: 16, padding: "28px 24px", width: "100%", maxWidth: 520, boxShadow: "0 8px 40px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <button onClick={() => setShowUpload(false)} style={{ background: "none", border: "none", fontSize: 22, color: "#39568A", cursor: "pointer", padding: 0, lineHeight: 1 }}>✕</button>
              <h2 style={{ ...S, margin: 0, fontSize: 22, fontWeight: 700 }}>Загрузка файлов</h2>
            </div>
            <div style={{ fontSize: 14, color: "#616161", marginBottom: 16 }}>Максимальный размер: 10 МБ</div>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) setSelectedFile(f); }}
              style={{ backgroundColor: dragOver ? "#E0DEE8" : "#EAE8EF", borderRadius: 14, padding: "40px 20px", textAlign: "center", marginBottom: 20, transition: "background 0.15s", cursor: "pointer" }}
              onClick={() => fileRef.current?.click()}
            >
              <svg width="60" height="68" viewBox="0 0 70 80" fill="none" style={{ marginBottom: 12 }}>
                <defs><linearGradient id="arrGrad2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#5B82C0"/><stop offset="100%" stopColor="#39568A"/></linearGradient></defs>
                <rect x="26" y="0" width="18" height="46" rx="3" fill="url(#arrGrad2)"/>
                <path d="M 8 42 L 35 72 L 62 42 Z" fill="url(#arrGrad2)"/>
              </svg>
              <div style={{ ...S, fontSize: 15, color: "#616161" }}>{selectedFile ? selectedFile.name : "Перетащите файл или нажмите для выбора"}</div>
            </div>
            <input ref={fileRef} type="file" style={{ display: "none" }} onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)} />
            <form onSubmit={handleUpload} style={{ display: "flex", gap: 10 }}>
              <button type="button" onClick={() => fileRef.current?.click()} style={{ ...S, flex: 1, padding: "11px", backgroundColor: "#FFFFFF", border: "1px solid #CFCFCF", borderRadius: 8, fontSize: 15, cursor: "pointer" }}>📄 Выбрать файл</button>
              <button type="submit" disabled={!selectedFile || uploading} style={{ ...S, flex: 1, padding: "11px", backgroundColor: !selectedFile || uploading ? "#8fa3c4" : "#39568A", color: "#FFFFFF", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: !selectedFile || uploading ? "not-allowed" : "pointer" }}>
                {uploading ? "Загрузка..." : "Загрузить"}
              </button>
            </form>
            {uploadError && <div style={{ color: "#a70b0b", fontSize: 13, backgroundColor: "#fde8e8", borderRadius: 8, padding: "8px 12px", marginTop: 10 }}>{uploadError}</div>}
          </div>
        </div>
      )}
    </PageLayout>
  );
}

function PrepRow({ title, completed, date, onComplete, onUpload }: {
  title: string; completed: boolean; date: string;
  onComplete: () => void; onUpload: () => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: "1px solid #F5F4F9" }}>
      <input type="checkbox" checked={completed} onChange={onComplete} style={{ width: 15, height: 15, cursor: "pointer", flexShrink: 0, accentColor: "#39568A" }} />
      <span style={{ flex: 1, fontSize: 13, fontFamily: "'Bitter', Georgia, serif", textDecoration: completed ? "line-through" : "none", color: completed ? "#ADADAD" : "#000" }}>
        {title}
      </span>
      {date && <span style={{ fontSize: 10, color: "#CFCFCF", flexShrink: 0 }}>{date}</span>}
      <button onClick={onUpload} style={{ padding: "3px 8px", backgroundColor: "#EAE8EF", color: "#39568A", border: "none", borderRadius: 5, fontSize: 10, cursor: "pointer", flexShrink: 0, fontFamily: "'Bitter', Georgia, serif", fontWeight: 700 }}>↑</button>
    </div>
  );
}

function FeedbackFloat({ patientName }: { patientName: string }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"presets" | "input">("presets");
  const [text, setText] = useState("");
  const FS: React.CSSProperties = { fontFamily: "'Bitter', Georgia, serif" };
  const PRESETS = ["Пациенту нужно повторно сдать ОАК и ОАМ", "Назначить новые лекарства"];
  function handleClose() { setOpen(false); setStep("presets"); setText(""); }

  return (
    <>
      <button onClick={() => setOpen(true)} style={{ position: "fixed", bottom: 28, right: 24, width: 52, height: 52, borderRadius: "50%", backgroundColor: "#39568A", color: "#FFFFFF", border: "none", fontSize: 22, cursor: "pointer", boxShadow: "0 4px 16px rgba(57,86,138,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 900, ...FS }} title="Обратная связь">···</button>
      {open && (
        <div onClick={handleClose} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2100 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: "#FFFFFF", borderRadius: 20, padding: "28px 24px", width: "100%", maxWidth: 500, boxShadow: "0 8px 40px rgba(0,0,0,0.22)", position: "relative" }}>
            <button onClick={handleClose} style={{ position: "absolute", top: 20, left: 20, background: "none", border: "none", fontSize: 22, color: "#39568A", cursor: "pointer", ...FS }}>✕</button>
            <h2 style={{ ...FS, textAlign: "center", fontSize: 20, fontWeight: 700, marginBottom: 24 }}>Обратная связь</h2>
            {step === "presets" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {PRESETS.map((preset) => (
                  <button key={preset} onClick={() => { setText(preset); setStep("input"); }} style={{ ...FS, backgroundColor: "#39568A", color: "#FFFFFF", border: "none", borderRadius: 50, padding: "20px 24px", fontSize: 17, cursor: "pointer", textAlign: "left", lineHeight: 1.3 }}>{preset}</button>
                ))}
              </div>
            ) : (
              <div>
                <input type="text" value={patientName} readOnly style={{ ...FS, width: "100%", padding: "16px 22px", borderRadius: 50, border: "none", backgroundColor: "#39568A", color: "#FFFFFF", fontSize: 17, marginBottom: 12, boxSizing: "border-box" as const, outline: "none" }} />
                <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Ввести комментарий" style={{ ...FS, width: "100%", padding: "16px 22px", borderRadius: 20, border: "1px solid #EAE8EF", backgroundColor: "#EAE8EF", fontSize: 16, resize: "vertical", minHeight: 90, outline: "none", boxSizing: "border-box" as const, color: "#000" }} />
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
                  <button onClick={() => setStep("presets")} style={{ width: 48, height: 48, borderRadius: "50%", backgroundColor: "#39568A", color: "#FFFFFF", border: "none", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>←</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default PatientCardPage;