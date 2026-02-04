export interface Resume {
  id: number
  user_id: number
  title: string
  file_name: string
  content_type: string
  file_size: number
  is_primary: boolean
  storage_path: string
  file_url?: string | null
  created_at: string
  updated_at?: string | null
}

export interface UpdateResumePayload {
  title?: string
  is_primary?: boolean
}
