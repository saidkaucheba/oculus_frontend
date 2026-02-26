// ─── Enums ────────────────────────────────────────────────────────────────────

export type UserRole = 'district_doctor' | 'surgeon' | 'patient' | 'admin';

export type PatientStatus = 'red' | 'yellow' | 'green' | 'blue';

export type Gender = 'male' | 'female';

export type Eye = 'right' | 'left';

export type IOLFormula = 'srk_t' | 'holladay' | 'hoffer_q' | 'haigis' | 'barrett';

export type FeedbackStatus = 'success' | 'complications' | 'postponed' | 'cancelled';

// ─── Core models ──────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  role: UserRole;
}

export interface Patient {
  id: string;
  created_by: string | null;
  last_name: string;
  first_name: string;
  middle_name: string | null;
  birth_date: string; // ISO date: "YYYY-MM-DD"
  gender: Gender | null;
  passport_series: string | null;
  passport_number: string | null;
  passport_issued_by: string | null;
  passport_issue_date: string | null;
  snils: string | null;
  insurance_policy: string | null;
  diagnosis_icd10: string | null;
  diagnosis_text: string | null;
  surgery_type: string | null;
  status: PatientStatus;
  surgery_date: string | null;
  fhir_data: Record<string, unknown> | null;
  created_at: string; // ISO datetime
  updated_at: string;
}

export interface PreparationTemplate {
  id: string;
  surgery_type: string;
  title: string;
  requires_file: boolean;
  required: boolean;
}

export interface PatientPreparation {
  id: string;
  patient: string;
  template: string;
  template_details: PreparationTemplate | null; // read-only nested
  completed: boolean;
  completion_date: string | null;
  comment: string | null;
  created_at: string;
}

export interface MediaFile {
  id: string;
  patient: string;
  patient_name?: string;       // detail serializer
  preparation: string | null;
  preparation_info?: string | null; // detail serializer
  file: string;                // relative path (use file_url for display)
  file_url: string | null;
  file_name: string;
  file_type: string;
  file_size: number | null;
  file_hash: string | null;
  description: string | null;
  is_verified: boolean;
  verified_by: string | null;
  verified_at: string | null;
  uploaded_by: string | null;
  uploaded_by_name?: string | null;
  created_at: string;
}

export interface IOLCalculation {
  id: string;
  patient: string;
  patient_name?: string;       // detail serializer
  eye: Eye;
  k1: string;                  // DecimalField comes back as string from DRF
  k2: string;
  acd: string;
  axial_length: string;
  formula_used: IOLFormula;
  result_diopters: string;
  calculated_by: string | null;
  calculated_by_name?: string | null;
  created_at: string;
}

export interface SurgeonFeedback {
  id: string;
  patient: string;
  surgeon: string;
  comment: string;
  status_after: FeedbackStatus | null;
  created_at: string;
}

// ─── Request payloads ─────────────────────────────────────────────────────────

export type CreatePatientPayload = Omit<Patient,
  'id' | 'created_by' | 'created_at' | 'updated_at'
>;

export type UpdatePatientPayload = Partial<CreatePatientPayload>;

export interface IOLCalculatePayload {
  axial_length: number;
  k1: number;
  k2: number;
  acd: number;
  formula?: IOLFormula | 'all';
}

export interface IOLCalculateAndSavePayload extends IOLCalculatePayload {
  patient_id: string;
  eye: Eye;
  formula: IOLFormula;
}

export interface CreateFeedbackPayload {
  patient: string;
  comment: string;
  status_after?: FeedbackStatus;
}

// ─── Response shapes ──────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface IOLCalculateResponse {
  srk_t?: number;
  holladay?: number;
  hoffer_q?: number;
  haigis?: number;
  barrett?: number;
  errors?: Partial<Record<IOLFormula, string>>;
}

export interface IOLRecommendation {
  recommended_formula: IOLFormula;
  reason: string;
  alternatives: IOLFormula[];
  notes: string;
}

export interface IOLCompareResponse {
  calculations: IOLCalculateResponse;
  recommendation: IOLRecommendation;
  patient_name: string;
  eye: Eye;
}

export interface MedicalHistory {
  patient: Patient;
  iol_calculations: IOLCalculation[];
  media_files: MediaFile[];
  feedback: SurgeonFeedback[];
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface PatientStatistics {
  total_patients: number;
  by_status: Partial<Record<PatientStatus, number>>;
  by_gender: Partial<Record<Gender, number>>;
  by_surgery_type: Record<string, number>;
  new_patients_today: number;
  upcoming_surgeries: number;
}

export interface SurgeonPerformance {
  surgeon__id: string;
  surgeon__last_name: string;
  surgeon__first_name: string;
  total_operations: number;
  successful: number;
  with_complications: number;
  postponed: number;
  cancelled: number;
  success_rate: number;
}

export interface IOLStatistics {
  by_formula: { formula_used: IOLFormula; avg_result: number; count: number }[];
  eye_distribution: { eye: Eye; count: number }[];
  monthly_trends: { month: string; count: number; avg_diopters: number }[];
  total_calculations: number;
}

export interface DashboardData {
  patient_statistics: PatientStatistics;
  surgeon_performance: SurgeonPerformance[];
  iol_statistics: IOLStatistics;
  recent_activities: {
    user__email: string;
    action: string;
    entity_type: string;
    created_at: string;
  }[];
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  role: UserRole;
}

export interface ApiError {
  error?: string;
  detail?: string;
  [field: string]: string | string[] | undefined;
}
