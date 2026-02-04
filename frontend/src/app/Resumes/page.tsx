'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import AuthGate from '@/components/auth/AuthGate'
import { resumeService, ResumeContent } from '@/services/resumeService'
import type { Resume } from '@/types/resume.types'
import { formatDistanceToNow } from 'date-fns'
import { useToast } from '@/components/ui/Toast'

const formatFileSize = (bytes: number) => {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / Math.pow(1024, index)
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`
}

interface ResumeWithContent extends Resume {
  content?: ResumeContent | null
}

const ResumesPage = () => {
  const [resumes, setResumes] = useState<ResumeWithContent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [extracting, setExtracting] = useState<Set<number>>(new Set())
  const { showToast } = useToast()

  const fetchResumes = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await resumeService.listResumes()
      
      const resumesWithContent = await Promise.all(
        data.map(async (resume) => {
          try {
            const content = await resumeService.getResumeContent(resume.id)
            return { ...resume, content }
          } catch {
            return { ...resume, content: null }
          }
        })
      )
      
      setResumes(resumesWithContent)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load resumes')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchResumes()
  }, [])

  const handleExtract = async (resumeId: number) => {
    try {
      setExtracting((prev) => new Set([...prev, resumeId]))
      setResumes((prev) =>
        prev.map((r) =>
          r.id === resumeId
            ? {
                ...r,
                content: {
                  ...(r.content ? r.content : {}),
                  extraction_status: 'processing',
                  raw_text: r.content?.raw_text || null,
                  structured_data: r.content?.structured_data || null,
                  extraction_error: null,
                  id: r.content?.id || 0,
                  resume_id: r.id,
                  purpose: r.content?.purpose || null,
                  industry: r.content?.industry || null,
                  language: r.content?.language || null,
                  tone: r.content?.tone || null,
                  created_at: r.content?.created_at || new Date().toISOString(),
                  updated_at: r.content?.updated_at || new Date().toISOString(),
                },
              }
            : r
        )
      )
      
      // Trigger extraction
      await resumeService.extractResume(resumeId, true)
      
      // Poll for completion
      let completed = false
      let attempts = 0
      const maxAttempts = 30
      
      while (!completed && attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        
        try {
          const content = await resumeService.getResumeContent(resumeId)
          if (content.extraction_status === 'completed') {
            completed = true
            // Update the resume in state
            setResumes((prev) =>
              prev.map((r) => (r.id === resumeId ? { ...r, content } : r))
            )
            showToast('Resume text extracted successfully!', 'success')
          } else if (content.extraction_status === 'failed') {
            throw new Error(content.extraction_error || 'Extraction failed')
          } else {
            // Update status while processing
            setResumes((prev) =>
              prev.map((r) => (r.id === resumeId ? { ...r, content } : r))
            )
          }
        } catch (pollErr: any) {
          if (pollErr?.response?.status === 404) {
            // Content not created yet, keep polling
          } else if (attempts === maxAttempts - 1) {
            throw pollErr
          }
        }
        
        attempts++
      }
      
      if (!completed) {
        throw new Error('Extraction timeout - still processing')
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to extract resume', 'error')
    } finally {
      setExtracting((prev) => {
        const newSet = new Set(prev)
        newSet.delete(resumeId)
        return newSet
      })
    }
  }

  const handleDelete = async (resumeId: number) => {
    if (!window.confirm('Delete this resume?')) return
    
    try {
      await resumeService.deleteResume(resumeId)
      setResumes((prev) => prev.filter((resume) => resume.id !== resumeId))
      showToast('Resume deleted', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete resume', 'error')
    }
  }

  return (
    <AppShell title="My Resumes" subtitle="Upload and manage your resumes" showSearch={false} showActions={false}>
      <AuthGate>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-sm text-text-secondary">Upload resumes and extract text for AI processing.</p>
          <Link
            href="/Resumes/upload"
            className="px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-colors flex items-center justify-center gap-2 w-full sm:w-auto flex-shrink-0"
          >
            <span className="material-symbols-outlined">add</span>
            Upload Resume
          </Link>
        </div>

        {error && (
          <div className="mt-6 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg p-4 text-sm">
            {error}
          </div>
        )}

        <section className="mt-6">
          {isLoading ? (
            <div className="text-center py-8">
              <span className="material-symbols-outlined animate-spin text-2xl text-primary mb-2 block">refresh</span>
              <p className="text-sm text-text-secondary">Loading resumes...</p>
            </div>
          ) : resumes.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
              <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-600 mb-3 block">description</span>
              <p className="text-sm text-text-secondary mb-4">No resumes uploaded yet</p>
              <Link
                href="/Resumes/upload"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:opacity-90 transition"
              >
                <span className="material-symbols-outlined">add</span>
                Upload your first resume
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {resumes.map((resume) => (
                <div key={resume.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg">
                  {/* Header */}
                  <div className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-text-main dark:text-white break-words">{resume.title}</h3>
                        <p className="text-xs text-text-secondary mt-1 break-words">
                          {resume.file_name} • {formatFileSize(resume.file_size)}
                        </p>
                        <p className="text-xs text-text-secondary">
                          Updated {formatDistanceToNow(new Date(resume.updated_at || resume.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      <div className="flex flex-row sm:flex-col gap-2 flex-wrap sm:flex-nowrap sm:items-end">
                        {resume.is_primary && (
                          <span className="text-xs font-semibold px-2 py-1 rounded bg-primary/10 text-primary whitespace-nowrap">
                            Primary
                          </span>
                        )}
                        {resume.content?.extraction_status === 'processing' ? (
                          <span className="text-xs font-semibold px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 whitespace-nowrap">
                            Processing
                          </span>
                        ) : resume.content?.raw_text ? (
                          <span className="text-xs font-semibold px-2 py-1 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 whitespace-nowrap">
                            ✓ Extracted
                          </span>
                        ) : (
                          <span className="text-xs font-semibold px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                            Pending
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3 text-xs">
                      {resume.file_url && (
                        <a
                          href={resume.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline font-semibold"
                        >
                          View File
                        </a>
                      )}
                      {!resume.content?.raw_text && resume.content?.extraction_status !== 'processing' && (
                        <button
                          onClick={() => handleExtract(resume.id)}
                          disabled={extracting.has(resume.id)}
                          className="text-blue-600 dark:text-blue-400 hover:underline font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {extracting.has(resume.id) ? 'Extracting...' : 'Extract Text'}
                        </button>
                      )}
                      {resume.content?.raw_text && (
                        <button
                          onClick={() => setExpandedId(expandedId === resume.id ? null : resume.id)}
                          className="text-text-secondary hover:text-text-main font-semibold"
                        >
                          {expandedId === resume.id ? 'Hide' : 'Show'} Text
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(resume.id)}
                        className="sm:ml-auto text-red-600 dark:text-red-400 hover:underline font-semibold"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Expanded Text Preview */}
                  {expandedId === resume.id && resume.content?.raw_text && (
                    <div className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 p-4">
                      <p className="text-xs font-semibold text-text-secondary mb-2">Extracted Text</p>
                      <div className="bg-white dark:bg-gray-900 rounded p-3 border border-gray-200 dark:border-gray-700 max-h-64 sm:max-h-80 overflow-y-auto">
                        <p className="text-sm leading-relaxed text-text-main dark:text-gray-300 whitespace-pre-wrap break-words">
                          {resume.content.raw_text}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </AuthGate>
    </AppShell>
  )
}

export default ResumesPage