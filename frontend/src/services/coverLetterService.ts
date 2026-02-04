import api from './api'

// Types
export interface CoverLetterMeta {
  tone: string
  job_title: string
  company_name: string
  industry?: string
}

export interface CoverLetterContent {
  salutation: string
  opening: string
  body: string[]
  closing: string
  signature: string
  sender_name: string
}

export interface CoverLetterStructuredData {
  meta: CoverLetterMeta
  content: CoverLetterContent
}

export interface DesignTokens {
  font_family: string
  spacing: string
  accent_color: string
}

export interface CoverLetter {
  id: number
  user_id: number
  application_id?: number
  title: string
  template_slug: string
  design_tokens?: DesignTokens
  content?: CoverLetterStructuredData
  is_template: boolean
  created_at: string
  updated_at: string
}

export interface CoverLetterListItem {
  id: number
  title: string
  template_slug: string
  application_id?: number
  created_at: string
  updated_at: string
}

export interface CoverLetterTemplate {
  slug: string
  name: string
  description: string
  supported_purposes: string[]
  default_tokens: {
    fontFamily: string
    spacing: string
    accentColor: string
  }
  features: string[]
}

// API functions
const listTemplates = async (): Promise<CoverLetterTemplate[]> => {
  const response = await api.get<CoverLetterTemplate[]>('/cover-letters/templates')
  return response.data
}

const getTemplate = async (slug: string): Promise<CoverLetterTemplate> => {
  const response = await api.get<CoverLetterTemplate>(`/cover-letters/templates/${slug}`)
  return response.data
}

const createCoverLetter = async (data: {
  title?: string
  application_id?: number
  template_slug?: string
  design_tokens?: DesignTokens
  content?: CoverLetterStructuredData
}): Promise<CoverLetter> => {
  const response = await api.post<CoverLetter>('/cover-letters', data)
  return response.data
}

const listCoverLetters = async (): Promise<CoverLetterListItem[]> => {
  const response = await api.get<CoverLetterListItem[]>('/cover-letters')
  return response.data
}

const getCoverLetter = async (id: number): Promise<CoverLetter> => {
  const response = await api.get<CoverLetter>(`/cover-letters/${id}`)
  return response.data
}

const updateCoverLetter = async (
  id: number,
  data: {
    title?: string
    application_id?: number
    template_slug?: string
    design_tokens?: DesignTokens
    content?: CoverLetterStructuredData
  }
): Promise<CoverLetter> => {
  const response = await api.patch<CoverLetter>(`/cover-letters/${id}`, data)
  return response.data
}

const deleteCoverLetter = async (id: number): Promise<void> => {
  await api.delete(`/cover-letters/${id}`)
}

const previewCoverLetter = async (
  id: number,
  options?: {
    template_slug?: string
    design_tokens?: DesignTokens
  }
): Promise<string> => {
  const response = await api.post<{ html: string }>(`/cover-letters/${id}/preview`, options || {})
  return response.data.html
}

const exportCoverLetterPdf = async (
  id: number,
  options?: {
    template_slug?: string
    design_tokens?: DesignTokens
  }
): Promise<Blob> => {
  const response = await api.post(`/cover-letters/${id}/export/pdf`, options || {}, {
    responseType: 'blob',
  })
  return response.data
}

const exportCoverLetterDocx = async (id: number): Promise<Blob> => {
  const response = await api.post(`/cover-letters/${id}/export/docx`, {}, {
    responseType: 'blob',
  })
  return response.data
}

export const coverLetterService = {
  listTemplates,
  getTemplate,
  createCoverLetter,
  listCoverLetters,
  getCoverLetter,
  updateCoverLetter,
  deleteCoverLetter,
  previewCoverLetter,
  exportCoverLetterPdf,
  exportCoverLetterDocx,
}
