import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from './api.client';
import { offlineMutation, cacheSet, cacheGet, subscribeSyncState, syncQueue } from './offlineQueue';
import type { SyncState } from './offlineQueue';
import type {
  Patient,
  CreatePatientPayload,
  UpdatePatientPayload,
  PatientListParams,
  IOLCalculation,
  IOLCalculatePayload,
  IOLCalculateResponse,
  IOLCalculateAndSavePayload,
  MediaFile,
  SurgeonFeedback,
  CreateFeedbackPayload,
  PatientPreparation,
  PreparationTemplate,
  DashboardData,
  MedicalHistory,
  ApiError,
  PaginatedResponse,
} from './api.types';

export type { PatientListParams };

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  fromCache: boolean;
}

function useAsyncCached<T>(
  cacheKey: string,
  fn: () => Promise<T>,
  deps: unknown[] = [],
  skip = false,
): AsyncState<T> & { refetch: () => void } {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: !skip,
    error: null,
    fromCache: false,
  });

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const run = useCallback(async () => {
    if (skip) return;
    setState(s => ({ ...s, loading: true, error: null }));

    try {
      const data = await fn();
      if (mounted.current) {
        setState({ data, loading: false, error: null, fromCache: false });
        await cacheSet(cacheKey, data);
      }
    } catch (err) {
      const cached = await cacheGet<T>(cacheKey);
      if (mounted.current) {
        if (cached !== null) {
          setState({ data: cached, loading: false, error: null, fromCache: true });
        } else {
          setState({ data: null, loading: false, error: err as ApiError, fromCache: false });
        }
      }
    }
  }, [...deps, skip, cacheKey]);

  useEffect(() => { run(); }, [run]);

  return { ...state, refetch: run };
}

export function useSyncStatus(): SyncState & { sync: () => void } {
  const [state, setState] = useState<SyncState>({
    pendingCount: 0,
    status: 'idle',
    lastSyncAt: null,
    lastError: null,
  });

  useEffect(() => {
    const unsub = subscribeSyncState(setState);
    return unsub;
  }, []);

  return { ...state, sync: syncQueue };
}

export function useCurrentUser() {
  return useAsyncCached('me', () => api.auth.me(), []);
}

export function useLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.auth.login({ email, password });
      return result;
    } catch (err) {
      setError(err as ApiError);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { login, loading, error };
}

export function usePatients(params?: PatientListParams) {
  const depsKey = JSON.stringify(params ?? {});
  const cacheKey = `patients:list:${depsKey}`;

  const fetch = useAsyncCached(
    cacheKey,
    () => api.patients.list(params),
    [depsKey],
  );

  const createPatient = useCallback(
    async (payload: CreatePatientPayload): Promise<Patient | null> => {
      const optimistic: Patient = {
        id: `temp_${crypto.randomUUID()}`,
        created_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'red',
        ...payload,
      };

      const result = await offlineMutation<Patient>(
        'POST',
        '/api/patients/',
        payload,
        'Создание пациента',
      );

      fetch.refetch();
      return result ?? optimistic;
    },
    [fetch],
  );

  const deletePatient = useCallback(
    async (id: string): Promise<void> => {
      await offlineMutation<void>('DELETE', `/api/patients/${id}/`, null, 'Удаление пациента');
      fetch.refetch();
    },
    [fetch],
  );

  return { ...fetch, createPatient, deletePatient };
}

export function usePatient(id: string | null) {
  const cacheKey = `patient:${id}`;
  const fetch = useAsyncCached(
    cacheKey,
    () => api.patients.get(id!),
    [id],
    !id,
  );

  const update = useCallback(
    async (payload: UpdatePatientPayload): Promise<Patient | null> => {
      if (!id) throw new Error('No patient id');
      const result = await offlineMutation<Patient>(
        'PATCH',
        `/api/patients/${id}/`,
        payload,
        'Редактирование пациента',
      );
      fetch.refetch();
      return result;
    },
    [id, fetch],
  );

  return { ...fetch, update };
}

export function useMedicalHistory(patientId: string | null) {
  return useAsyncCached<MedicalHistory>(
    `medical_history:${patientId}`,
    () => api.patients.medicalHistory(patientId!),
    [patientId],
    !patientId,
  );
}

export function usePreparationTemplates(search?: string) {
  return useAsyncCached<PaginatedResponse<PreparationTemplate>>(
    `templates:${search ?? ''}`,
    () => api.templates.list(search),
    [search],
  );
}

export function usePatientPreparations(patientId: string | null) {
  const fetch = useAsyncCached<PaginatedResponse<PatientPreparation>>(
    `preparations:${patientId}`,
    () => api.preparations.list(patientId!),
    [patientId],
    !patientId,
  );

  const complete = useCallback(
    async (prepId: string) => {
      await offlineMutation<{ status: string }>(
        'POST',
        `/api/preparations/${prepId}/complete/`,
        {},
        'Выполнение пункта подготовки',
      );
      fetch.refetch();
    },
    [fetch],
  );

  return { ...fetch, complete };
}

export function useIOLCalculate() {
  const [result, setResult] = useState<IOLCalculateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const calculate = useCallback(async (payload: IOLCalculatePayload) => {
    if (!navigator.onLine) {
      setError({ error: 'Расчёт ИОЛ недоступен офлайн. Подключитесь к интернету.' });
      return null;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await api.iolCalculations.calculate(payload);
      setResult(data);
      return data;
    } catch (err) {
      setError(err as ApiError);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => { setResult(null); setError(null); }, []);
  return { result, loading, error, calculate, reset };
}

export function useIOLCalculateAndSave() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const save = useCallback(async (payload: IOLCalculateAndSavePayload): Promise<IOLCalculation | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await offlineMutation<IOLCalculation>(
        'POST',
        '/api/iol-calculations/calculate_and_save/',
        payload,
        'Сохранение расчёта ИОЛ',
      );
      return result;
    } catch (err) {
      setError(err as ApiError);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { save, loading, error };
}

export function usePatientIOLHistory(patientId: string | null) {
  return useAsyncCached<IOLCalculation[]>(
    `iol_history:${patientId}`,
    () => api.iolCalculations.patientHistory(patientId!),
    [patientId],
    !patientId,
  );
}

export function useIOLCompare(calculationId: string | null) {
  return useAsyncCached(
    `iol_compare:${calculationId}`,
    () => api.iolCalculations.compareForPatient(calculationId!),
    [calculationId],
    !calculationId,
  );
}

export function useFeedback() {
  const fetch = useAsyncCached(`feedback:list`, () => api.feedback.list(), []);

  const create = useCallback(
    async (payload: CreateFeedbackPayload): Promise<SurgeonFeedback | null> => {
      const result = await offlineMutation<SurgeonFeedback>(
        'POST',
        '/api/feedback/',
        payload,
        'Направление на доследование',
      );
      fetch.refetch();
      return result;
    },
    [fetch],
  );

  return { ...fetch, create };
}
export function usePatientReferrals(patientId: string | null) {
  return useAsyncCached<SurgeonFeedback[]>(
    `referrals:${patientId}`,
    () => api.feedback.list().then((r) => {
      const results = (r as unknown as { results?: SurgeonFeedback[] }).results ?? (r as unknown as SurgeonFeedback[]);
      return Array.isArray(results) ? results.filter((f) => f.patient === patientId) : [];
    }),
    [patientId],
    !patientId,
  );
}

export function usePatientMedia(patientId: string | null) {
  const fetch = useAsyncCached<MediaFile[]>(
    `media:${patientId}`,
    () => api.mediaFiles.list(patientId!) as Promise<MediaFile[]>,
    [patientId],
    !patientId,
  );

  const upload = useCallback(
    async (file: File, extra?: { preparation?: string; description?: string }): Promise<MediaFile | null> => {
      if (!patientId) throw new Error('No patient id');
      const form = new FormData();
      form.append('file', file);
      form.append('patient', patientId);
      if (extra?.preparation) form.append('preparation', extra.preparation);
      if (extra?.description)  form.append('description',  extra.description);

      const result = await offlineMutation<MediaFile>(
        'POST',
        '/api/media/',
        form,
        `Загрузка файла «${file.name}»`,
      );
      fetch.refetch();
      return result;
    },
    [patientId, fetch],
  );

  const remove = useCallback(
    async (id: string) => {
      await offlineMutation<void>('DELETE', `/api/media/${id}/`, null, 'Удаление файла');
      fetch.refetch();
    },
    [fetch],
  );

  const verify = useCallback(
    async (id: string) => {
      await offlineMutation<{ status: string }>(
        'POST',
        `/api/media/${id}/verify/`,
        {},
        'Верификация документа',
      );
      fetch.refetch();
    },
    [fetch],
  );

  return { ...fetch, upload, remove, verify };
}

export function useDashboard(doctorId?: string) {
  return useAsyncCached<DashboardData>(
    `dashboard:${doctorId ?? 'all'}`,
    () => api.analytics.dashboard(doctorId),
    [doctorId],
  );
}

export function usePatientStats(startDate?: string, endDate?: string) {
  return useAsyncCached(
    `patient_stats:${startDate}:${endDate}`,
    () => api.analytics.patients(startDate, endDate),
    [startDate, endDate],
  );
}

export function useIOLStatistics() {
  return useAsyncCached(`iol_statistics`, () => api.analytics.iolStatistics(), []);
}
