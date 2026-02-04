import api from './api'

// Types
export interface TemplateListItem {
  id: number
  slug: string
  name: string
  description: string | null
  template_type: string
  thumbnail_url: string | null
  is_active: boolean
  is_default: boolean
  version: string
}

export interface Template extends TemplateListItem {
  html_content: string
  css_content: string
  config: {
    supportedPurposes?: string[]
    defaultTokens?: DesignTokens
    features?: string[]
  } | null
  created_at: string | null
  updated_at: string | null
}

export interface DesignTokens {
  fontFamily?: string
  spacing?: string
  accentColor?: string
}

export interface ResumeContent {
  id: number
  resume_id: number
  structured_data: CanonicalResumeSchema | null
  extraction_status: 'pending' | 'processing' | 'completed' | 'failed'
  extraction_error: string | null
  purpose: string | null
  industry: string | null
  language: string | null
  tone: string | null
  created_at: string
  updated_at: string | null
}

export interface ContactInfo {
  email?: string | null
  phone?: string | null
  location?: string | null
  linkedin?: string | null
  portfolio?: string | null
}

export interface ProfileSection {
  fullName: string
  headline?: string | null
  contact: ContactInfo
}

export interface ExperienceEntry {
  company: string
  role: string
  location?: string | null
  startDate?: string | null
  endDate?: string | null
  bullets: string[]
}

export interface ProjectEntry {
  name: string
  description?: string | null
  technologies: string[]
  url?: string | null
}

export interface EducationEntry {
  institution: string
  degree?: string | null
  field?: string | null
  startDate?: string | null
  endDate?: string | null
  gpa?: string | null
}

export interface CertificationEntry {
  name: string
  issuer?: string | null
  date?: string | null
  url?: string | null
}

export interface AwardEntry {
  name: string
  issuer?: string | null
  date?: string | null
  description?: string | null
}

export interface ResumeSections {
  summary?: string | null
  experience: ExperienceEntry[]
  projects: ProjectEntry[]
  education: EducationEntry[]
  skills: string[]
  certifications: CertificationEntry[]
  awards: AwardEntry[]
}

export interface ResumeMeta {
  resumeId?: number | null
  purpose?: string | null
  industry?: string | null
  language: string
  tone: string
}

export interface CanonicalResumeSchema {
  meta: ResumeMeta
  profile: ProfileSection
  sections: ResumeSections
}

export interface RenderResponse {
  html: string
  template_slug: string
  tokens_used: DesignTokens
}

export interface ExtractResponse {
  resume_id: number
  status: string
  message: string
}

// API Methods
const listTemplates = async (templateType: string = 'resume'): Promise<TemplateListItem[]> => {
  const response = await api.get<TemplateListItem[]>('/templates', {
    params: { template_type: templateType }
  })
  return response.data
}

const getTemplate = async (slug: string): Promise<Template> => {
  const response = await api.get<Template>(`/templates/${slug}`)
  return response.data
}

const previewTemplate = async (slug: string): Promise<{ html: string; template_slug: string }> => {
  const response = await api.get<{ html: string; template_slug: string }>(`/templates/${slug}/preview`)
  return response.data
}

const extractResumeContent = async (resumeId: number, useAi: boolean = true): Promise<ExtractResponse> => {
  const response = await api.post<ExtractResponse>(`/resumes/${resumeId}/extract`, null, {
    params: { use_ai: useAi }
  })
  return response.data
}

const getResumeContent = async (resumeId: number): Promise<ResumeContent> => {
  const response = await api.get<ResumeContent>(`/resumes/${resumeId}/content`)
  return response.data
}

const updateResumeContent = async (
  resumeId: number,
  payload: Partial<{
    structured_data: Partial<CanonicalResumeSchema>
    purpose: string
    industry: string
    language: string
    tone: string
  }>
): Promise<ResumeContent> => {
  const response = await api.put<ResumeContent>(`/resumes/${resumeId}/content`, payload)
  return response.data
}

const previewResume = async (
  resumeId: number,
  templateSlug: string,
  designTokens?: DesignTokens,
  purpose?: string
): Promise<RenderResponse> => {
  const response = await api.post<RenderResponse>(`/resumes/${resumeId}/preview`, {
    template_slug: templateSlug,
    design_tokens: designTokens,
    purpose
  })
  return response.data
}

const exportResume = async (
  resumeId: number,
  templateSlug: string,
  format: 'pdf' | 'docx' = 'pdf',
  designTokens?: DesignTokens,
  pageSize: string = 'A4'
): Promise<Blob> => {
  const response = await api.post(
    `/resumes/${resumeId}/export`,
    {
      template_slug: templateSlug,
      format,
      design_tokens: designTokens,
      page_size: pageSize
    },
    { responseType: 'blob' }
  )
  return response.data
}

export const templateService = {
  listTemplates,
  getTemplate,
  previewTemplate,
  extractResumeContent,
  getResumeContent,
  updateResumeContent,
  previewResume,
  exportResume
}

export default templateService
