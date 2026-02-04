'use client'

import React, { useEffect, useState } from 'react'
import { resumeService, Resume } from '@/services/resumeService'

interface ResumePicerProps {
  value?: number | null
  onChange: (resumeId: number | null) => void
  label?: string
}

const ResumePicker: React.FC<ResumePicerProps> = ({ value, onChange, label = 'Resume' }) => {
  const [resumes, setResumes] = useState<Resume[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchResumes = async () => {
      try {
        setIsLoading(true)
        const data = await resumeService.listResumes()
        setResumes(data)
        setError(null)
      } catch (err) {
        setError('Failed to load resumes')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchResumes()
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : null)}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
      >
        <option value="">None</option>
        {resumes.map((resume) => (
          <option key={resume.id} value={resume.id}>
            {resume.title} {resume.is_primary ? '(Primary)' : ''}
          </option>
        ))}
      </select>
    </div>
  )
}

export default ResumePicker
