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
  const [extractingId, setExtractingId] = useState<number | null>(null)
  const { showToast } = useToast()

  const fetchResumes = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await resumeService.listResumes()
      
      // Fetch content status for each resume
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
      setExtractingId(resumeId)
      await resumeService.extractResume(resumeId, true)
      showToast('Extraction started! This may take a moment.', 'info')
      
      // Poll for completion
      let attempts = 0
      const pollInterval = setInterval(async () => {
        attempts++
        try {
          const content = await resumeService.getResumeContent(resumeId)
          if (content.extraction_status === 'completed') {
            clearInterval(pollInterval)
            setExtractingId(null)
            showToast('Resume extracted successfully!', 'success')
            fetchResumes()
          } else if (content.extraction_status === 'failed') {
            clearInterval(pollInterval)
            setExtractingId(null)
            showToast(`Extraction failed: ${content.extraction_error}`, 'error')
            fetchResumes()
          } else if (attempts >= 30) {
            clearInterval(pollInterval)
            setExtractingId(null)
            showToast('Extraction is taking longer than expected. Check back later.', 'warning')
          }
        } catch {
          if (attempts >= 30) {
            clearInterval(pollInterval)
            setExtractingId(null)
          }
        }
      }, 2000)
    } catch (err) {
      setExtractingId(null)
      showToast(err instanceof Error ? err.message : 'Failed to start extraction', 'error')
    }
  }

  const handleDelete = async (resumeId: number) => {
    try {
      await resumeService.deleteResume(resumeId)
      setResumes((prev) => prev.filter((resume) => resume.id !== resumeId))
      showToast('Resume deleted', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete resume', 'error')
    }
  }

  const getExtractionStatus = (content: ResumeContent | null | undefined) => {
    if (!content) return { label: 'Not extracted', color: 'text-gray-500 bg-gray-100 dark:bg-gray-800' }
    switch (content.extraction_status) {
      case 'completed':
        return { label: 'Extracted', color: 'text-green-600 bg-green-100 dark:bg-green-900/30' }
      case 'processing':
        return { label: 'Processing...', color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' }
      case 'failed':
        return { label: 'Failed', color: 'text-red-600 bg-red-100 dark:bg-red-900/30' }
      default:
        return { label: 'Pending', color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30' }
    }
  }

  return (
    <AppShell title="Resumes" subtitle="Manage resume versions and templates" showSearch={false} showActions={false}>
      <AuthGate>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <p className="text-sm text-text-secondary">Keep your master resume and tailored versions organized.</p>
          <div className="flex items-center gap-3">
            <Link
              href="/Resumes/templates"
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-text-main dark:text-white rounded-xl text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              <span className="material-symbols-outlined text-[18px]">style</span>
              Templates
            </Link>
            <Link
              href="/Resumes/upload"
              className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/30"
            >
              Upload Resume
            </Link>
          </div>
        </div>

        {error && (
          <div className="mt-6 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800 rounded-2xl px-4 py-3">
            <p className="text-sm font-semibold">{error}</p>
          </div>
        )}

        <section className="mt-6">
          {isLoading ? (
            <div className="text-center py-12 text-sm text-text-secondary">
              <span className="material-symbols-outlined animate-spin text-2xl mb-2">refresh</span>
              <p>Loading resumes...</p>
            </div>
          ) : resumes.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-5xl text-gray-300 dark:text-gray-700 mb-3">description</span>
              <p className="text-sm text-text-secondary">No resumes uploaded yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {resumes.map((resume) => (
                <div
                  key={resume.id}
                  className="bg-white dark:bg-card-dark rounded-2xl shadow-card border border-gray-100 dark:border-gray-800 p-6 hover:shadow-lg transition"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <span className="material-symbols-outlined">description</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-text-main dark:text-white">{resume.title}</h3>
                        <p className="text-xs text-text-secondary mt-1">{resume.file_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {resume.is_primary && (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                          Primary
                        </span>
                      )}
                      {(() => {
                        const status = getExtractionStatus(resume.content)
                        return (
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${status.color}`}>
                            {status.label}
                          </span>
                        )
                      })()}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs text-text-secondary">
                    <span>
                      Updated {formatDistanceToNow(new Date(resume.updated_at || resume.created_at), { addSuffix: true })}
                    </span>
                    <span>{formatFileSize(resume.file_size)}</span>
                  </div>

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    {resume.file_url ? (
                      <a
                        href={resume.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-text-secondary hover:text-primary transition"
                      >
                        <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                        View
                      </a>
                    ) : (
                      <span className="text-xs text-text-secondary">Uploading...</span>
                    )}
                    
                    {/* Extract button */}
                    {(!resume.content || resume.content.extraction_status === 'failed' || !resume.content.extraction_status) && (
                      <button
                        type="button"
                        onClick={() => handleExtract(resume.id)}
                        disabled={extractingId === resume.id}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-purple-600 hover:text-purple-700 disabled:opacity-50 transition"
                      >
                        <span className={`material-symbols-outlined text-[18px] ${extractingId === resume.id ? 'animate-spin' : ''}`}>
                          {extractingId === resume.id ? 'refresh' : 'auto_awesome'}
                        </span>
                        {extractingId === resume.id ? 'Extracting...' : 'Extract with AI'}
                      </button>
                    )}
                    
                    {/* Edit structured data (only if extracted) */}
                    {resume.content?.extraction_status === 'completed' && (
                      <Link
                        href={`/Resumes/${resume.id}/edit`}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                        Edit
                      </Link>
                    )}
                    
                    {/* Preview with template (only if extracted) */}
                    {resume.content?.extraction_status === 'completed' && (
                      <Link
                        href={`/Resumes/${resume.id}/preview`}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-600 hover:text-green-700"
                      >
                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                        Preview
                      </Link>
                    )}
                    
                    <button
                      type="button"
                      onClick={() => handleDelete(resume.id)}
                      className="ml-auto text-xs font-semibold text-red-600 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
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