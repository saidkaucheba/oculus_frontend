/**
 * api.hooks.ts
 *
 * React hooks for every API resource.
 * Each hook returns { data, loading, error, refetch } plus mutation helpers.
 *
 * Requirements: React 18+
 * No external state library needed — plain useState/useEffect/useCallback.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from './api.client';
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

// Re-export PatientListParams so consumers don't need to import from two places
export type { PatientListParams };

// ─── Generic async state ──────────────────────────────────────────────────────

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
}

function useAsync<T>(
  fn: () => Promise<T>,
  deps: unknown[] = [],
  skip = false,
): AsyncState<T> & { refetch: () => void } {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: !skip,
    error: null,
  });

  // Prevent stale state updates after unmount
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const run = useCallback(async () => {
    if (skip) return;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fn();
      if (mounted.current) setState({ data, loading: false, error: null });
    } catch (err) {
      if (mounted.current) setState({ data: null, loading: false, error: err as ApiError });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, skip]);

  useEffect(() => { run(); }, [run]);

  return { ...state, refetch: run };
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export function useCurrentUser() {
  return useAsync(() => api.auth.me(), []);
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

// ─── Patients ─────────────────────────────────────────────────────────────────

export function usePatients(params?: PatientListParams) {
  // Re-run when any filter param changes
  const depsKey = JSON.stringify(params ?? {});
  const fetch = useAsync(
    () => api.patients.list(params),
    [depsKey],
  );

  const createPatient = useCallback(
    async (payload: CreatePatientPayload): Promise<Patient> => {
      const patient = await api.patients.create(payload);
      fetch.refetch();
      return patient;
    },
    [fetch],
  );

  const deletePatient = useCallback(
    async (id: string): Promise<void> => {
      await api.patients.delete(id);
      fetch.refetch();
    },
    [fetch],
  );

  return { ...fetch, createPatient, deletePatient };
}

export function usePatient(id: string | null) {
  const fetch = useAsync(
    () => api.patients.get(id!),
    [id],
    !id,
  );

  const update = useCallback(
    async (payload: UpdatePatientPayload): Promise<Patient> => {
      if (!id) throw new Error('No patient id');
      const updated = await api.patients.patch(id, payload);
      fetch.refetch();
      return updated;
    },
    [id, fetch],
  );

  return { ...fetch, update };
}

export function useMedicalHistory(patientId: string | null) {
  return useAsync<MedicalHistory>(
    () => api.patients.medicalHistory(patientId!),
    [patientId],
    !patientId,
  );
}

// ─── Preparation templates ────────────────────────────────────────────────────

export function usePreparationTemplates(search?: string) {
  return useAsync<PaginatedResponse<PreparationTemplate>>(
    () => api.templates.list(search),
    [search],
  );
}

// ─── Patient preparations ─────────────────────────────────────────────────────

export function usePatientPreparations(patientId: string | null) {
  const fetch = useAsync<PaginatedResponse<PatientPreparation>>(
    () => api.preparations.list(patientId!),
    [patientId],
    !patientId,
  );

  const complete = useCallback(
    async (prepId: string) => {
      await api.preparations.complete(prepId);
      fetch.refetch();
    },
    [fetch],
  );

  return { ...fetch, complete };
}

// ─── IOL Calculations ─────────────────────────────────────────────────────────

/** Live calculation — does NOT save to the database. */
export function useIOLCalculate() {
  const [result, setResult] = useState<IOLCalculateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const calculate = useCallback(async (payload: IOLCalculatePayload) => {
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

/** Save a calculation to the database. */
export function useIOLCalculateAndSave() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const save = useCallback(async (payload: IOLCalculateAndSavePayload): Promise<IOLCalculation> => {
    setLoading(true);
    setError(null);
    try {
      return await api.iolCalculations.calculateAndSave(payload);
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
  return useAsync<IOLCalculation[]>(
    () => api.iolCalculations.patientHistory(patientId!),
    [patientId],
    !patientId,
  );
}

export function useIOLCompare(calculationId: string | null) {
  return useAsync(
    () => api.iolCalculations.compareForPatient(calculationId!),
    [calculationId],
    !calculationId,
  );
}

// ─── Surgeon feedback ─────────────────────────────────────────────────────────

export function useFeedback() {
  const fetch = useAsync(() => api.feedback.list(), []);

  const create = useCallback(
    async (payload: CreateFeedbackPayload): Promise<SurgeonFeedback> => {
      const item = await api.feedback.create(payload);
      fetch.refetch();
      return item;
    },
    [fetch],
  );

  return { ...fetch, create };
}

// ─── Media files ──────────────────────────────────────────────────────────────

export function usePatientMedia(patientId: string | null) {
  const fetch = useAsync<MediaFile[]>(
    () => api.mediaFiles.list(patientId!) as Promise<MediaFile[]>,
    [patientId],
    !patientId,
  );

  const upload = useCallback(
    async (
      file: File,
      extra?: { preparation?: string; description?: string },
    ): Promise<MediaFile> => {
      if (!patientId) throw new Error('No patient id');
      const uploaded = await api.mediaFiles.upload(file, patientId, extra);
      fetch.refetch();
      return uploaded;
    },
    [patientId, fetch],
  );

  const remove = useCallback(
    async (id: string) => {
      await api.mediaFiles.delete(id);
      fetch.refetch();
    },
    [fetch],
  );

  const verify = useCallback(
    async (id: string) => {
      await api.mediaFiles.verify(id);
      fetch.refetch();
    },
    [fetch],
  );

  return { ...fetch, upload, remove, verify };
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export function useDashboard(doctorId?: string) {
  return useAsync<DashboardData>(
    () => api.analytics.dashboard(doctorId),
    [doctorId],
  );
}

export function usePatientStats(startDate?: string, endDate?: string) {
  return useAsync(
    () => api.analytics.patients(startDate, endDate),
    [startDate, endDate],
  );
}

export function useIOLStatistics() {
  return useAsync(() => api.analytics.iolStatistics(), []);
}
