import { api } from '../lib/api'

// ── Sessions ──────────────────────────────────────────────────
export const getTrainingSessions  = (filters?: { status?: string; type?: string }) =>
  api.get('/trainings/sessions', { params: filters }).then(r => r.data)

export const getTrainingSession   = (id: string) =>
  api.get(`/trainings/sessions/${id}`).then(r => r.data)

export const createTrainingSession = (d: any) =>
  api.post('/trainings/sessions', d).then(r => r.data)

export const updateTrainingSession = (id: string, d: any) =>
  api.patch(`/trainings/sessions/${id}`, d).then(r => r.data)

export const deleteTrainingSession = (id: string) =>
  api.delete(`/trainings/sessions/${id}`).then(r => r.data)

export const publishTrainingSession = (id: string) =>
  api.post(`/trainings/sessions/${id}/publish`).then(r => r.data)

// ── Questions ─────────────────────────────────────────────────
export const addTrainingQuestion = (sessionId: string, d: { question: string; options: string[]; correctIndex: number; points?: number }) =>
  api.post(`/trainings/sessions/${sessionId}/questions`, d).then(r => r.data)

export const deleteTrainingQuestion = (sessionId: string, questionId: string) =>
  api.delete(`/trainings/sessions/${sessionId}/questions/${questionId}`).then(r => r.data)

// ── Participants ──────────────────────────────────────────────
export const assignParticipants = (sessionId: string, agentIds: string[]) =>
  api.post(`/trainings/sessions/${sessionId}/participants`, { agentIds }).then(r => r.data)

export const updateParticipant = (participantId: string, d: { status?: string; score?: number }) =>
  api.patch(`/trainings/participants/${participantId}`, d).then(r => r.data)
