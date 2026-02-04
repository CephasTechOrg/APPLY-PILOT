import api from './api'

export interface AIResponse {
  request_id: number
  tool: 'tailor_resume' | 'cover_letter' | 'ats_checklist'
  content: string
  credits_left: number
}

export interface AITailorResumeRequest {
  resume_text: string
  job_description: string
  resume_id?: number | null
  instructions?: string
}

export interface AICoverLetterRequest {
  resume_text: string
  job_description: string
  resume_id?: number | null
  tone?: string
  instructions?: string
}

export interface AIATSChecklistRequest {
  resume_text: string
  job_description: string
  resume_id?: number | null
  instructions?: string
}

class AIService {
  async tailorResume(payload: AITailorResumeRequest): Promise<AIResponse> {
    const response = await api.post<AIResponse>('/ai/tailor-resume', payload)
    return response.data
  }

  async generateCoverLetter(payload: AICoverLetterRequest): Promise<AIResponse> {
    const response = await api.post<AIResponse>('/ai/generate-cover-letter', payload)
    return response.data
  }

  async atsChecklist(payload: AIATSChecklistRequest): Promise<AIResponse> {
    const response = await api.post<AIResponse>('/ai/ats-checklist', payload)
    return response.data
  }
}

export const aiService = new AIService()
