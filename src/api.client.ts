import type {
  LoginPayload,
  LoginResponse,
  User,
  Patient,
  CreatePatientPayload,
  UpdatePatientPayload,
  PaginatedResponse,
  PatientPreparation,
  PreparationTemplate,
  MediaFile,
  IOLCalculation,
  IOLCalculatePayload,
  IOLCalculateResponse,
  IOLCalculateAndSavePayload,
  IOLCompareResponse,
  SurgeonFeedback,
  CreateFeedbackPayload,
  MedicalHistory,
  DashboardData,
  PatientStatistics,
  SurgeonPerformance,
  IOLStatistics,
  ApiError,
} from './api.types';

const BASE_URL: string = (import.meta.env.VITE_API_URL as string | undefined) ?? '';

let csrfReady = false;

async function ensureCsrf(): Promise<void> {
  if (csrfReady) return;
  const csrfBase = BASE_URL || '';
  await fetch(`${csrfBase}/csrf/`, { credentials: 'include' });
  csrfReady = true;
}

function getCsrfToken(): string {
  const match = document.cookie.match(/csrftoken=([^;]+)/);
  return match ? match[1] : '';
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

async function request<T>(
  method: Method,
  path: string,
  body?: unknown,
  params?: Record<string, string | number | boolean | undefined>,
): Promise<T> {
  const isMutating = method !== 'GET';
  if (isMutating) await ensureCsrf();

  const base = BASE_URL || window.location.origin;
  const url = new URL(`${base}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined) url.searchParams.set(k, String(v));
    });
  }

  const isFormData = body instanceof FormData;

  const response = await fetch(url.toString(), {
    method,
    credentials: 'include',
    headers: {
      ...(!isFormData && body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(isMutating ? { 'X-CSRFToken': getCsrfToken() } : {}),
    },
    body: isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) return undefined as T;

  const data = await response.json();

  if (!response.ok) {
    const err: ApiError = data;
    throw err;
  }

  return data as T;
}

export const auth = {
  login: (payload: LoginPayload) =>
    request<LoginResponse>('POST', '/api/login/', payload),

  me: () =>
    request<User>('GET', '/api/me/'),
};

export interface PatientListParams {
  status?: string;
  gender?: string;
  surgery_type?: string;
  search?: string;
  ordering?: string;
  page?: number;
}

export const patients = {
  list: (params?: PatientListParams) =>
    request<PaginatedResponse<Patient>>('GET', '/api/patients/', undefined, params as Record<string, string>),

  get: (id: string) =>
    request<Patient>('GET', `/api/patients/${id}/`),

  create: (payload: CreatePatientPayload) =>
    request<Patient>('POST', '/api/patients/', payload),

  update: (id: string, payload: UpdatePatientPayload) =>
    request<Patient>('PUT', `/api/patients/${id}/`, payload),

  patch: (id: string, payload: UpdatePatientPayload) =>
    request<Patient>('PATCH', `/api/patients/${id}/`, payload),

  delete: (id: string) =>
    request<void>('DELETE', `/api/patients/${id}/`),

  preparations: (id: string) =>
    request<PatientPreparation[]>('GET', `/api/patients/${id}/preparations/`),

  iolCalculations: (id: string) =>
    request<IOLCalculation[]>('GET', `/api/patients/${id}/iol_calculations/`),

  medicalHistory: (id: string) =>
    request<MedicalHistory>('GET', `/api/patients/${id}/medical_history/`),
};


export const templates = {
  list: (search?: string) =>
    request<PaginatedResponse<PreparationTemplate>>(
      'GET', '/api/templates/', undefined, search ? { search } : undefined
    ),

  get: (id: string) =>
    request<PreparationTemplate>('GET', `/api/templates/${id}/`),

  create: (payload: Omit<PreparationTemplate, 'id'>) =>
    request<PreparationTemplate>('POST', '/api/templates/', payload),

  update: (id: string, payload: Omit<PreparationTemplate, 'id'>) =>
    request<PreparationTemplate>('PUT', `/api/templates/${id}/`, payload),

  delete: (id: string) =>
    request<void>('DELETE', `/api/templates/${id}/`),
};


export const preparations = {
  list: (patientId?: string) =>
    request<PaginatedResponse<PatientPreparation>>(
      'GET', '/api/preparations/', undefined, patientId ? { patient: patientId } : undefined
    ),

  get: (id: string) =>
    request<PatientPreparation>('GET', `/api/preparations/${id}/`),

  create: (payload: { patient: string; template: string; comment?: string }) =>
    request<PatientPreparation>('POST', '/api/preparations/', payload),

  complete: (id: string) =>
    request<{ status: string }>('POST', `/api/preparations/${id}/complete/`),

  delete: (id: string) =>
    request<void>('DELETE', `/api/preparations/${id}/`),
};


export const iolCalculations = {
  list: () =>
    request<PaginatedResponse<IOLCalculation>>('GET', '/api/iol-calculations/'),

  get: (id: string) =>
    request<IOLCalculation>('GET', `/api/iol-calculations/${id}/`),

  calculate: (payload: IOLCalculatePayload) =>
    request<IOLCalculateResponse>('POST', '/api/iol-calculations/calculate/', payload),

  calculateAndSave: (payload: IOLCalculateAndSavePayload) =>
    request<IOLCalculation>('POST', '/api/iol-calculations/calculate_and_save/', payload),

  compareFormulas: (id: string) =>
    request<IOLCalculateResponse>('GET', `/api/iol-calculations/${id}/compare_formulas/`),

  compareForPatient: (id: string) =>
    request<IOLCompareResponse>('GET', `/api/iol-calculations/${id}/compare_for_patient/`),

  patientHistory: (patientId: string) =>
    request<IOLCalculation[]>(
      'GET', '/api/iol-calculations/patient_history/', undefined, { patient_id: patientId }
    ),

  delete: (id: string) =>
    request<void>('DELETE', `/api/iol-calculations/${id}/`),
};


export const feedback = {
  list: () =>
    request<PaginatedResponse<SurgeonFeedback>>('GET', '/api/feedback/'),

  get: (id: string) =>
    request<SurgeonFeedback>('GET', `/api/feedback/${id}/`),

  create: (payload: CreateFeedbackPayload) =>
    request<SurgeonFeedback>('POST', '/api/feedback/', payload),

  update: (id: string, payload: Partial<CreateFeedbackPayload>) =>
    request<SurgeonFeedback>('PATCH', `/api/feedback/${id}/`, payload),

  delete: (id: string) =>
    request<void>('DELETE', `/api/feedback/${id}/`),
};


export const mediaFiles = {
  list: (patientId?: string) =>
    patientId
      ? request<MediaFile[]>('GET', '/api/media/patient_files/', undefined, { patient_id: patientId })
      : request<PaginatedResponse<MediaFile>>('GET', '/api/media/'),

  get: (id: string) =>
    request<MediaFile>('GET', `/api/media/${id}/`),

  upload: (
    file: File,
    patientId: string,
    extra?: { preparation?: string; description?: string }
  ) => {
    const form = new FormData();
    form.append('file', file);
    form.append('patient', patientId);
    if (extra?.preparation) form.append('preparation', extra.preparation);
    if (extra?.description) form.append('description', extra.description);
    return request<MediaFile>('POST', '/api/media/', form);
  },

  downloadUrl: (id: string) => `${BASE_URL || ''}/api/media/${id}/download/`,

  verify: (id: string) =>
    request<{ status: string }>('POST', `/api/media/${id}/verify/`),

  delete: (id: string) =>
    request<void>('DELETE', `/api/media/${id}/`),
};

export const analytics = {
  dashboard: (doctorId?: string) =>
    request<DashboardData>(
      'GET', '/api/analytics/dashboard/', undefined, doctorId ? { doctor_id: doctorId } : undefined
    ),

  patients: (startDate?: string, endDate?: string) =>
    request<PatientStatistics>(
      'GET', '/api/analytics/patients/', undefined,
      { start_date: startDate, end_date: endDate }
    ),

  surgeonReport: (doctorId: string, startDate: string, endDate: string) =>
    request<ReturnType<typeof Object.create>>(
      'GET', '/api/analytics/surgeon_report/', undefined,
      { doctor_id: doctorId, start_date: startDate, end_date: endDate }
    ),

  iolStatistics: () =>
    request<IOLStatistics>('GET', '/api/analytics/iol_statistics/'),

  surgeonPerformance: (doctorId?: string, days?: number) => {
    return analytics.dashboard(doctorId).then((d) => d.surgeon_performance as SurgeonPerformance[]);
  },
};

export const api = {
  auth,
  patients,
  templates,
  preparations,
  iolCalculations,
  feedback,
  mediaFiles,
  analytics,
};

export default api;
