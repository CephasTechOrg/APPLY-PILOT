import api from './api'
import type { Resume, UpdateResumePayload } from '@/types/resume.types'

export type { Resume } from '@/types/resume.types'

export interface ResumeContent {
  id: number
  resume_id: number
  structured_data: Record<string, any> | null
  extraction_status: 'pending' | 'processing' | 'completed' | 'failed'
  extraction_error: string | null
  purpose: string | null
  industry: string | null
  language: string | null
  tone: string | null
  created_at: string
  updated_at: string | null
}

export interface ExtractResponse {
  resume_id: number
  status: string
  message: string
}

const uploadResume = async (file: File, title?: string, isPrimary?: boolean): Promise<Resume> => {
  const formData = new FormData()
  formData.append('file', file)
  if (title) {
    formData.append('title', title)
  }
  if (typeof isPrimary === 'boolean') {
    formData.append('is_primary', String(isPrimary))
  }

  const response = await api.post<Resume>('/resumes/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}

const listResumes = async (): Promise<Resume[]> => {
  const response = await api.get<Resume[]>('/resumes')
  return response.data
}

const getResume = async (resumeId: number): Promise<Resume> => {
  const response = await api.get<Resume>(`/resumes/${resumeId}`)
  return response.data
}

const updateResume = async (resumeId: number, payload: UpdateResumePayload): Promise<Resume> => {
  const response = await api.patch<Resume>(`/resumes/${resumeId}`, payload)
  return response.data
}

const deleteResume = async (resumeId: number): Promise<void> => {
  await api.delete(`/resumes/${resumeId}`)
}

const extractResume = async (resumeId: number, useAi: boolean = true): Promise<ExtractResponse> => {
  const response = await api.post<ExtractResponse>(`/resumes/${resumeId}/extract`, null, {
    params: { use_ai: useAi }
  })
  return response.data
}

const getResumeContent = async (resumeId: number): Promise<ResumeContent> => {
  const response = await api.get<ResumeContent>(`/resumes/${resumeId}/content`)
  return response.data
}

const updateResumeContent = async (resumeId: number, data: Partial<ResumeContent>): Promise<ResumeContent> => {
  const response = await api.put<ResumeContent>(`/resumes/${resumeId}/content`, data)
  return response.data
}

export const resumeService = {
  uploadResume,
  listResumes,
  getResume,
  updateResume,
  deleteResume,
  extractResume,
  getResumeContent,
  updateResumeContent,
}
