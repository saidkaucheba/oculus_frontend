import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import IOLCalculator from "../components/IOLCalculator";
import { usePatient, usePatientPreparations, usePatientMedia } from "../api.hooks";
import { useAuth } from "../AuthContext";
import { api } from "../api.client";
import type { ApiError, PatientStatus } from "../api.types";

const STATUS_LABELS: Record<PatientStatus, string> = {
  red:    "Требуется консультация хирурга",
  yellow: "На подготовке",
  green:  "Готов к операции",
  blue:   "Назначена дата операции",
};

const STATUS_COLORS: Record<PatientStatus, string> = {
  red:    "#a70b0b",
  yellow: "#b8950a",
  green:  "#3ea515",
  blue:   "#1a6cd4",
};

function PatientCardPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: patient, loading, error: patientError, update } = usePatient(id ?? null);
  const { data: preparationsData, complete: completePrep } = usePatientPreparations(id ?? null);
  const { data: mediaFiles, upload, remove } = usePatientMedia(id ?? null);

  // Edit mode toggle
  const [editing, setEditing] = useState(false);

  // Editable fields — synced from patient on first load
  const [form, setForm] = useState({
    last_name: "", first_name: "", middle_name: "",
    passport_series: "", passport_number: "", passport_issued_by: "",
    snils: "", insurance_policy: "",
    diagnosis_icd10: "", diagnosis_text: "", surgery_type: "",
    surgery_date: "", status: "red" as PatientStatus,
  });
  const [initialized, setInitialized] = useState(false);

  if (patient && !initialized) {
    setForm({
      last_name:        patient.last_name,
      first_name:       patient.first_name,
      middle_name:      patient.middle_name ?? "",
      passport_series:  patient.passport_series ?? "",
      passport_number:  patient.passport_number ?? "",
      passport_issued_by: patient.passport_issued_by ?? "",
      snils:            patient.snils ?? "",
      insurance_policy: patient.insurance_policy ?? "",
      diagnosis_icd10:  patient.diagnosis_icd10 ?? "",
      diagnosis_text:   patient.diagnosis_text ?? "",
      surgery_type:     patient.surgery_type ?? "",
      surgery_date:     patient.surgery_date ?? "",
      status:           patient.status,
    });
    setInitialized(true);
  }

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setSaveError(null); setSaveSuccess(false);
    try {
      await update({
        last_name:        form.last_name,
        first_name:       form.first_name,
        middle_name:      form.middle_name || null,
        passport_series:  form.passport_series || null,
        passport_number:  form.passport_number || null,
        passport_issued_by: form.passport_issued_by || null,
        snils:            form.snils || null,
        insurance_policy: form.insurance_policy || null,
        diagnosis_icd10:  form.diagnosis_icd10 || null,
        diagnosis_text:   form.diagnosis_text || null,
        surgery_type:     form.surgery_type || null,
        surgery_date:     form.surgery_date || null,
        status:           form.status,
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

  // File upload
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setPendingFiles(files);
  }

  async function handleUpload() {
    if (!pendingFiles.length) return;
    setUploading(true);
    try {
      for (const file of pendingFiles) {
        await upload(file);
      }
      setPendingFiles([]);
      setShowUploadModal(false);
    } catch {
      alert("Ошибка загрузки файла");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  // Surgeon feedback / surgeon can verify docs
  const canVerify = user?.role === "surgeon" || user?.role === "admin";

  // Confirm readiness modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmDate, setConfirmDate] = useState("");
  const [confirming, setConfirming] = useState(false);

  async function handleConfirmReady() {
    setConfirming(true);
    try {
      await update({ status: "green", surgery_date: confirmDate || null });
      setForm((f) => ({ ...f, status: "green", surgery_date: confirmDate }));
      setShowConfirmModal(false);
    } catch {
      alert("Ошибка обновления статуса");
    } finally {
      setConfirming(false);
    }
  }

  if (loading) {
    return (
      <PageLayout>
        <div style={{ padding: 40, color: "#616161" }}>Загрузка карточки...</div>
      </PageLayout>
    );
  }

  if (patientError || !patient) {
    return (
      <PageLayout>
        <div style={{ padding: 40, color: "#a70b0b" }}>
          Пациент не найден.{" "}
          <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", color: "#39568A", cursor: "pointer", fontSize: 16 }}>
            ← Назад
          </button>
        </div>
      </PageLayout>
    );
  }

  const preparations = preparationsData?.results ?? [];

  return (
    <PageLayout>
      <div style={{ padding: "20px 24px", maxWidth: 1280, margin: "0 auto" }}>
        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, fontSize: 14, color: "#616161" }}>
          <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", color: "#39568A", cursor: "pointer", fontSize: 16, padding: 0, display: "flex", alignItems: "center", gap: 4 }}>
            ← Пациенты
          </button>
          <span>/</span>
          <span>{patient.last_name} {patient.first_name} {patient.middle_name ?? ""}</span>
          <span style={{ marginLeft: "auto", fontSize: 13, color: "#39568A", fontWeight: 600 }}>
            № карты {patient.id.slice(-4).toUpperCase()}
          </span>
        </div>

        {/* Patient name + status bar */}
        <div style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 16,
          padding: "20px 24px",
          marginBottom: 20,
          boxShadow: "0 2px 12px rgba(57,86,138,0.07)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 12,
        }}>
          <div>
            <h1 style={{ margin: "0 0 4px 0", fontSize: 26 }}>
              {patient.last_name} {patient.first_name[0]}. {patient.middle_name ? patient.middle_name[0] + "." : ""}
            </h1>
            <div style={{ fontSize: 14, color: "#616161" }}>
              Возраст: {calcAge(patient.birth_date)} ({formatDate(patient.birth_date)})
            </div>
            <div style={{ fontSize: 14, color: "#616161" }}>
              Диагноз: {patient.diagnosis_text ?? patient.diagnosis_icd10 ?? "—"}
            </div>
            <span style={{
              display: "inline-block",
              marginTop: 8,
              fontSize: 13,
              fontWeight: 600,
              color: STATUS_COLORS[patient.status],
              backgroundColor: `${STATUS_COLORS[patient.status]}15`,
              padding: "4px 14px",
              borderRadius: 50,
              border: `1px solid ${STATUS_COLORS[patient.status]}40`,
            }}>
              {STATUS_LABELS[patient.status]}
            </span>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={() => setEditing(!editing)}
              style={{
                padding: "9px 18px",
                backgroundColor: editing ? "#EAE8EF" : "#39568A",
                color: editing ? "#000" : "#FFFFFF",
                border: "none",
                borderRadius: 10,
                fontSize: 14,
                fontFamily: "inherit",
                cursor: "pointer",
              }}
            >
              {editing ? "Отмена" : "✏ Редактировать"}
            </button>
            {!editing && (
              <button
                onClick={() => setShowConfirmModal(true)}
                style={{
                  padding: "9px 18px",
                  backgroundColor: "#3ea515",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 10,
                  fontSize: 14,
                  fontFamily: "inherit",
                  cursor: "pointer",
                }}
              >
                Подтвердить готовность
              </button>
            )}
          </div>
        </div>

        {saveSuccess && (
          <div style={{ backgroundColor: "#e8fde8", color: "#3ea515", borderRadius: 10, padding: "10px 16px", marginBottom: 16, fontSize: 14 }}>
            Данные сохранены ✓
          </div>
        )}

        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "flex-start" }}>
          {/* ── Left: patient info ── */}
          <div style={{ flex: 2, minWidth: 300, display: "flex", flexDirection: "column", gap: 16 }}>

            {editing ? (
              /* ── Edit form ── */
              <div style={{ backgroundColor: "#FFFFFF", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(57,86,138,0.07)" }}>
                <h2 style={{ fontSize: 20, marginBottom: 20 }}>Редактирование данных</h2>
                <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                    <Field label="Фамилия" value={form.last_name} onChange={(v) => setForm((f) => ({ ...f, last_name: v }))} />
                    <Field label="Имя" value={form.first_name} onChange={(v) => setForm((f) => ({ ...f, first_name: v }))} />
                    <Field label="Отчество" value={form.middle_name} onChange={(v) => setForm((f) => ({ ...f, middle_name: v }))} />
                  </div>

                  <div style={{ borderTop: "1px solid #EAE8EF", paddingTop: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#39568A", marginBottom: 10 }}>Паспортные данные</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12 }}>
                      <Field label="Серия" value={form.passport_series} onChange={(v) => setForm((f) => ({ ...f, passport_series: v }))} />
                      <Field label="Номер" value={form.passport_number} onChange={(v) => setForm((f) => ({ ...f, passport_number: v }))} />
                    </div>
                    <Field label="Кем выдан" value={form.passport_issued_by} onChange={(v) => setForm((f) => ({ ...f, passport_issued_by: v }))} />
                  </div>

                  <div style={{ borderTop: "1px solid #EAE8EF", paddingTop: 12 }}>
                    <Field label="СНИЛС" value={form.snils} onChange={(v) => setForm((f) => ({ ...f, snils: v }))} />
                    <div style={{ marginTop: 12 }}>
                      <Field label="Полис ОМС" value={form.insurance_policy} onChange={(v) => setForm((f) => ({ ...f, insurance_policy: v }))} />
                    </div>
                  </div>

                  <div style={{ borderTop: "1px solid #EAE8EF", paddingTop: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#39568A", marginBottom: 10 }}>Медицинские данные</div>
                    <Field label="Диагноз МКБ-10" value={form.diagnosis_icd10} onChange={(v) => setForm((f) => ({ ...f, diagnosis_icd10: v }))} />
                    <div style={{ marginTop: 12 }}>
                      <Field label="Тип операции" value={form.surgery_type} onChange={(v) => setForm((f) => ({ ...f, surgery_type: v }))} />
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <label style={{ fontSize: 13, color: "#616161", display: "block", marginBottom: 4 }}>Статус</label>
                      <select
                        value={form.status}
                        onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as PatientStatus }))}
                        style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #CFCFCF", fontSize: 15, fontFamily: "inherit", width: "100%" }}
                      >
                        {(Object.entries(STATUS_LABELS) as [PatientStatus, string][]).map(([val, label]) => (
                          <option key={val} value={val}>{label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {saveError && (
                    <div style={{ color: "#a70b0b", fontSize: 14, backgroundColor: "#fde8e8", borderRadius: 8, padding: "8px 12px" }}>
                      {saveError}
                    </div>
                  )}
                  <button
                    type="submit" disabled={saving}
                    style={{ padding: "13px", backgroundColor: saving ? "#8fa3c4" : "#39568A", color: "#FFFFFF", border: "none", borderRadius: 10, fontSize: 16, fontFamily: "inherit", cursor: saving ? "not-allowed" : "pointer" }}
                  >
                    {saving ? "Сохранение..." : "Сохранить"}
                  </button>
                </form>
              </div>
            ) : (
              /* ── View card ── */
              <div style={{ backgroundColor: "#FFFFFF", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(57,86,138,0.07)" }}>
                <div style={{ borderBottom: "2px solid #EAE8EF", paddingBottom: 12, marginBottom: 16 }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: "#39568A", cursor: "pointer" }}>О пациенте</span>
                </div>

                <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#616161", marginBottom: 10 }}>Личные данные:</div>
                    <InfoLine label="ФИО" value={`${patient.last_name} ${patient.first_name} ${patient.middle_name ?? ""}`} />
                    <InfoLine label="Номер телефона" value="—" />
                    <InfoLine label="E-mail" value="—" />

                    <div style={{ marginTop: 16, fontSize: 13, fontWeight: 600, color: "#616161", marginBottom: 10 }}>Паспортные данные:</div>
                    <InfoLine label="Серия" value={patient.passport_series ?? "—"} />
                    <InfoLine label="Номер" value={patient.passport_number ?? "—"} />
                    <InfoLine label="Кем выдан" value={patient.passport_issued_by ?? "—"} />

                    <div style={{ marginTop: 16 }}>
                      <InfoLine label="СНИЛС" value={patient.snils ?? "—"} />
                      <InfoLine label="Полис" value={patient.insurance_policy ?? "—"} />
                    </div>
                  </div>

                  <div style={{ flex: 1, minWidth: 180 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#616161", marginBottom: 10 }}>Медицинские данные:</div>
                    <InfoLine label="Диагноз" value={patient.diagnosis_icd10 ? `${patient.diagnosis_icd10} ${patient.diagnosis_text ?? ""}` : (patient.diagnosis_text ?? "—")} />
                    <InfoLine label="Планируемая операция" value={patient.surgery_type ?? "—"} />
                    <InfoLine label="Глаз" value="OD (Правый)" />
                    <InfoLine label="Острота зрения" value="OD 0.1 / OS 0.8" />
                    <InfoLine label="Дата операции" value={patient.surgery_date ? formatDate(patient.surgery_date) : "Планируется"} />
                  </div>
                </div>
              </div>
            )}

            {/* Preparation checklist */}
            <div style={{ backgroundColor: "#FFFFFF", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(57,86,138,0.07)" }}>
              <div style={{ borderBottom: "2px solid #EAE8EF", paddingBottom: 12, marginBottom: 16 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: "#39568A" }}>План подготовки</span>
                {patient.surgery_type && (
                  <div style={{ fontSize: 13, color: "#39568A", marginTop: 4 }}>{patient.surgery_type}</div>
                )}
              </div>

              {preparations.length === 0 ? (
                <p style={{ color: "#616161", fontSize: 14 }}>Нет пунктов подготовки</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  {preparations.map((item) => (
                    <label
                      key={item.id}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "28px 1fr auto",
                        alignItems: "center",
                        columnGap: 12,
                        padding: "12px 0",
                        borderBottom: "1px solid #F0EFF4",
                        cursor: item.completed ? "default" : "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => !item.completed && completePrep(item.id)}
                        style={{ width: 18, height: 18, accentColor: "#39568A" }}
                      />
                      <span style={{
                        fontSize: 15,
                        textDecoration: item.completed ? "line-through" : "none",
                        color: item.completed ? "#616161" : "#000000",
                        fontWeight: item.completed ? 400 : 500,
                      }}>
                        {item.template_details?.title ?? "Пункт подготовки"}
                      </span>
                      <button
                        onClick={(e) => { e.preventDefault(); setShowUploadModal(true); }}
                        style={{
                          padding: "5px 12px",
                          backgroundColor: "#39568A",
                          color: "#FFFFFF",
                          border: "none",
                          borderRadius: 8,
                          fontSize: 12,
                          fontFamily: "inherit",
                          cursor: "pointer",
                        }}
                      >
                        Загрузить
                      </button>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Right: IOL + Files ── */}
          <div style={{ flex: 1, minWidth: 280, display: "flex", flexDirection: "column", gap: 16 }}>

            {/* IOL Calculator */}
            <IOLCalculator patientId={id} />

            {/* Documents */}
            <div style={{ backgroundColor: "#FFFFFF", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(57,86,138,0.07)" }}>
              <h3 style={{ fontSize: 16, marginBottom: 16 }}>Документы</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                {(mediaFiles ?? []).map((f) => (
                  <div key={f.id} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    backgroundColor: "#EAE8EF", borderRadius: 8, padding: "8px 12px",
                  }}>
                    <a
                      href={f.file_url ?? "#"}
                      target="_blank" rel="noreferrer"
                      style={{ fontSize: 13, color: "#39568A", textDecoration: "none", wordBreak: "break-all", flex: 1 }}
                    >
                      📄 {f.file_name || "Файл"}
                    </a>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0, marginLeft: 8 }}>
                      {canVerify && !f.is_verified && (
                        <button
                          onClick={() => api.mediaFiles.verify(f.id)}
                          style={{ padding: "3px 8px", fontSize: 11, backgroundColor: "#3ea515", color: "#FFFFFF", border: "none", borderRadius: 6, cursor: "pointer" }}
                        >
                          ✓
                        </button>
                      )}
                      {f.is_verified && <span style={{ fontSize: 11, color: "#3ea515", fontWeight: 700 }}>✓</span>}
                      <button
                        onClick={() => remove(f.id)}
                        style={{ background: "none", border: "none", color: "#a70b0b", cursor: "pointer", fontSize: 16, padding: "0 4px" }}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
                {(mediaFiles ?? []).length === 0 && <p style={{ color: "#616161", fontSize: 13 }}>Нет загруженных файлов</p>}
              </div>
              <button
                onClick={() => setShowUploadModal(true)}
                style={{
                  width: "100%",
                  padding: "10px",
                  backgroundColor: "#39568A",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 14,
                  fontFamily: "inherit",
                  cursor: "pointer",
                }}
              >
                + Загрузить файл
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Upload modal ── */}
      {showUploadModal && (
        <div
          onClick={() => setShowUploadModal(false)}
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: "#FFFFFF", borderRadius: 20, padding: 32, width: "100%", maxWidth: 500, boxShadow: "0 8px 40px rgba(0,0,0,0.18)" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <h2 style={{ margin: 0, fontSize: 22 }}>Загрузка файлов</h2>
              <button onClick={() => setShowUploadModal(false)} style={{ background: "none", border: "none", fontSize: 22, color: "#616161", cursor: "pointer" }}>✕</button>
            </div>
            <p style={{ fontSize: 14, color: "#616161", marginBottom: 20 }}>Максимальный размер файлов: 50Мбайт</p>

            {/* Drop zone */}
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                border: "2px dashed #CFCFCF",
                borderRadius: 16,
                padding: "40px 24px",
                textAlign: "center",
                cursor: "pointer",
                marginBottom: 20,
                backgroundColor: "#F8F7FC",
                transition: "border-color 0.18s",
              }}
              onDragOver={(e) => { e.preventDefault(); }}
              onDrop={(e) => {
                e.preventDefault();
                setPendingFiles(Array.from(e.dataTransfer.files));
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 12 }}>⬇</div>
              <div style={{ color: "#616161", fontSize: 15 }}>
                Для загрузки файлов перетащите их сюда...
              </div>
              <input
                ref={fileRef}
                type="file"
                multiple
                onChange={handleFilePick}
                style={{ display: "none" }}
              />
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <button
                  onClick={() => fileRef.current?.click()}
                  style={{
                    width: "100%",
                    padding: "10px",
                    backgroundColor: "#EAE8EF",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 14,
                    fontFamily: "inherit",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    marginBottom: 8,
                  }}
                >
                  📄 Выбрать файл
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!pendingFiles.length || uploading}
                  style={{
                    width: "100%",
                    padding: "10px",
                    backgroundColor: !pendingFiles.length || uploading ? "#8fa3c4" : "#39568A",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 14,
                    fontFamily: "inherit",
                    cursor: !pendingFiles.length || uploading ? "not-allowed" : "pointer",
                  }}
                >
                  {uploading ? "Загрузка..." : "Загрузить"}
                </button>
              </div>
              <div style={{
                flex: 1,
                backgroundColor: "#F8F7FC",
                borderRadius: 8,
                padding: "10px 12px",
                fontSize: 13,
                color: "#616161",
                overflowY: "auto",
                maxHeight: 100,
              }}>
                {pendingFiles.length === 0 ? "Пусто" : pendingFiles.map((f) => (
                  <div key={f.name} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <span>📄</span> {f.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm readiness modal ── */}
      {showConfirmModal && (
        <div
          onClick={() => setShowConfirmModal(false)}
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: "#FFFFFF", borderRadius: 20, padding: 32, width: "100%", maxWidth: 440, boxShadow: "0 8px 40px rgba(0,0,0,0.18)" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontSize: 22 }}>Подтверждение готовности</h2>
              <button onClick={() => setShowConfirmModal(false)} style={{ background: "none", border: "none", fontSize: 22, color: "#616161", cursor: "pointer" }}>✕</button>
            </div>
            <label style={{ fontSize: 14, color: "#616161", display: "block", marginBottom: 6 }}>Дата операции:</label>
            <input
              type="date"
              value={confirmDate}
              onChange={(e) => setConfirmDate(e.target.value)}
              style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #CFCFCF", fontSize: 15, fontFamily: "inherit", width: "100%", marginBottom: 24 }}
            />
            <button
              onClick={handleConfirmReady}
              disabled={confirming}
              style={{
                width: "100%",
                padding: "13px",
                backgroundColor: confirming ? "#8fa3c4" : "#39568A",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 50,
                fontSize: 16,
                fontFamily: "inherit",
                cursor: confirming ? "not-allowed" : "pointer",
              }}
            >
              {confirming ? "Подтверждение..." : "Подтвердить готовность"}
            </button>
          </div>
        </div>
      )}
    </PageLayout>
  );
}

/* ── Helpers ── */
function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label style={{ fontSize: 13, color: "#616161", display: "block", marginBottom: 4 }}>{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid #CFCFCF", fontSize: 14, fontFamily: "inherit", width: "100%" }}
      />
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 8, fontSize: 14 }}>
      <span style={{ color: "#616161", minWidth: 90, flexShrink: 0 }}>{label}:</span>
      <span style={{ color: "#000000" }}>{value}</span>
    </div>
  );
}

function calcAge(birthDate: string): number {
  const dob = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  if (today.getMonth() < dob.getMonth() || (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())) age--;
  return age;
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default PatientCardPage;
