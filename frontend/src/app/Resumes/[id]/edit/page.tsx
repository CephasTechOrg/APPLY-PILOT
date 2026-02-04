'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import AuthGate from '@/components/auth/AuthGate'
import TokenSelector from '@/components/resume/TokenSelector'
import ResumePreview from '@/components/resume/ResumePreview'
import templateService, {
  DesignTokens,
  ResumeContent,
  TemplateListItem,
  CanonicalResumeSchema
} from '@/services/templateService'
import { resumeService } from '@/services/resumeService'

const ResumeEditPage = () => {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const resumeId = Number(params.id)
  const initialTemplate = searchParams.get('template') || 'modern'

  // State
  const [resume, setResume] = useState<any>(null)
  const [content, setContent] = useState<ResumeContent | null>(null)
  const [templates, setTemplates] = useState<TemplateListItem[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState(initialTemplate)
  const [designTokens, setDesignTokens] = useState<DesignTokens>({
    fontFamily: 'Inter',
    spacing: 'comfortable',
    accentColor: 'neutral'
  })
  
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isExtracting, setIsExtracting] = useState(false)
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'design' | 'content'>('design')

  // Fetch resume and content
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Fetch resume details
        const resumeData = await resumeService.getResume(resumeId)
        setResume(resumeData)

        // Fetch templates
        const templateList = await templateService.listTemplates()
        setTemplates(templateList)

        // Try to fetch content
        try {
          const contentData = await templateService.getResumeContent(resumeId)
          setContent(contentData)
        } catch {
          // Content not extracted yet - will trigger extraction
          setContent(null)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load resume')
      } finally {
        setIsLoading(false)
      }
    }

    if (resumeId) {
      fetchData()
    }
  }, [resumeId])

  // Trigger extraction if content not available
  const handleExtract = async () => {
    try {
      setIsExtracting(true)
      setError(null)
      
      await templateService.extractResumeContent(resumeId, true)
      
      // Poll for completion
      let attempts = 0
      const maxAttempts = 30
      const pollInterval = 2000

      const poll = async () => {
        try {
          const contentData = await templateService.getResumeContent(resumeId)
          if (contentData.extraction_status === 'completed') {
            setContent(contentData)
            setIsExtracting(false)
          } else if (contentData.extraction_status === 'failed') {
            setError(contentData.extraction_error || 'Extraction failed')
            setIsExtracting(false)
          } else if (attempts < maxAttempts) {
            attempts++
            setTimeout(poll, pollInterval)
          } else {
            setError('Extraction timed out. Please try again.')
            setIsExtracting(false)
          }
        } catch {
          if (attempts < maxAttempts) {
            attempts++
            setTimeout(poll, pollInterval)
          }
        }
      }

      setTimeout(poll, pollInterval)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start extraction')
      setIsExtracting(false)
    }
  }

  // Generate preview
  const handlePreview = useCallback(async () => {
    if (!content?.structured_data) return

    try {
      setIsPreviewLoading(true)
      const result = await templateService.previewResume(
        resumeId,
        selectedTemplate,
        designTokens,
        content.purpose || undefined
      )
      setPreviewHtml(result.html)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate preview')
    } finally {
      setIsPreviewLoading(false)
    }
  }, [resumeId, selectedTemplate, designTokens, content])

  // Auto-update preview when template or tokens change
  useEffect(() => {
    if (content?.structured_data) {
      handlePreview()
    }
  }, [selectedTemplate, designTokens, content, handlePreview])

  // Export resume
  const handleExport = async (format: 'pdf' | 'docx') => {
    try {
      setIsExporting(true)
      const blob = await templateService.exportResume(
        resumeId,
        selectedTemplate,
        format,
        designTokens
      )

      // Download file
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${resume?.title || 'resume'}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to export ${format.toUpperCase()}`)
    } finally {
      setIsExporting(false)
    }
  }

  if (isLoading) {
    return (
      <AppShell title="Resume Builder" showSearch={false} showActions={false}>
        <AuthGate>
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <span className="material-symbols-outlined animate-spin text-3xl text-primary mb-3">refresh</span>
              <p className="text-sm text-text-secondary">Loading resume...</p>
            </div>
          </div>
        </AuthGate>
      </AppShell>
    )
  }

  return (
    <AppShell
      title={resume?.title || 'Resume Builder'}
      subtitle="Customize your resume with templates and design options"
      showSearch={false}
      showActions={false}
    >
      <AuthGate>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/Resumes"
            className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-primary transition"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to Resumes
          </Link>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleExport('pdf')}
              disabled={!content?.structured_data || isExporting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
              {isExporting ? 'Exporting...' : 'PDF'}
            </button>
            <button
              type="button"
              onClick={() => handleExport('docx')}
              disabled={!content?.structured_data || isExporting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-semibold hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[18px]">description</span>
              {isExporting ? 'Exporting...' : 'DOCX'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800 rounded-2xl px-4 py-3 mb-6">
            <p className="text-sm font-semibold">{error}</p>
          </div>
        )}

        {/* Content not extracted state */}
        {!content?.structured_data && !isExtracting && (
          <div className="bg-white dark:bg-card-dark rounded-2xl shadow-card border border-gray-100 dark:border-gray-800 p-8 text-center">
            <span className="material-symbols-outlined text-5xl text-primary mb-4">auto_awesome</span>
            <h3 className="text-xl font-bold text-text-main dark:text-white mb-2">
              Extract Resume Content
            </h3>
            <p className="text-sm text-text-secondary mb-6 max-w-md mx-auto">
              We&apos;ll use AI to extract and structure the content from your uploaded resume.
              This allows you to customize it with different templates.
            </p>
            <button
              type="button"
              onClick={handleExtract}
              className="px-6 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/30 hover:bg-primary-dark transition"
            >
              Extract Content with AI
            </button>
          </div>
        )}

        {/* Extracting state */}
        {isExtracting && (
          <div className="bg-white dark:bg-card-dark rounded-2xl shadow-card border border-gray-100 dark:border-gray-800 p-8 text-center">
            <span className="material-symbols-outlined animate-spin text-5xl text-primary mb-4">sync</span>
            <h3 className="text-xl font-bold text-text-main dark:text-white mb-2">
              Extracting Content...
            </h3>
            <p className="text-sm text-text-secondary">
              AI is analyzing your resume. This may take a moment.
            </p>
          </div>
        )}

        {/* Main Editor */}
        {content?.structured_data && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Panel - Controls */}
            <div className="lg:col-span-1 space-y-6">
              {/* Template Selection */}
              <div className="bg-white dark:bg-card-dark rounded-2xl shadow-card border border-gray-100 dark:border-gray-800 p-6">
                <h3 className="text-lg font-bold text-text-main dark:text-white mb-4">
                  Template
                </h3>
                <div className="space-y-2">
                  {templates.map((template) => (
                    <button
                      key={template.slug}
                      type="button"
                      onClick={() => setSelectedTemplate(template.slug)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition ${
                        selectedTemplate === template.slug
                          ? 'bg-primary/10 border-2 border-primary'
                          : 'bg-gray-50 dark:bg-gray-800 border-2 border-transparent hover:border-gray-200 dark:hover:border-gray-700'
                      }`}
                    >
                      <span className={`material-symbols-outlined ${
                        selectedTemplate === template.slug ? 'text-primary' : 'text-text-secondary'
                      }`}>
                        {template.slug === 'modern' ? 'auto_awesome' : 
                         template.slug === 'classic' ? 'library_books' : 'view_agenda'}
                      </span>
                      <div className="text-left">
                        <p className={`text-sm font-semibold ${
                          selectedTemplate === template.slug 
                            ? 'text-primary' 
                            : 'text-text-main dark:text-white'
                        }`}>
                          {template.name}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
                <Link
                  href={`/Resumes/templates?resumeId=${resumeId}`}
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-3"
                >
                  Browse all templates
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </Link>
              </div>

              {/* Design Tokens */}
              <div className="bg-white dark:bg-card-dark rounded-2xl shadow-card border border-gray-100 dark:border-gray-800 p-6">
                <h3 className="text-lg font-bold text-text-main dark:text-white mb-4">
                  Design Options
                </h3>
                <TokenSelector tokens={designTokens} onChange={setDesignTokens} />
              </div>

              {/* Quick Stats */}
              <div className="bg-white dark:bg-card-dark rounded-2xl shadow-card border border-gray-100 dark:border-gray-800 p-6">
                <h3 className="text-sm font-semibold text-text-secondary mb-3">Resume Stats</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Experience</span>
                    <span className="font-semibold text-text-main dark:text-white">
                      {content.structured_data.sections?.experience?.length || 0} entries
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Skills</span>
                    <span className="font-semibold text-text-main dark:text-white">
                      {content.structured_data.sections?.skills?.length || 0} skills
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Education</span>
                    <span className="font-semibold text-text-main dark:text-white">
                      {content.structured_data.sections?.education?.length || 0} entries
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel - Preview */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-card-dark rounded-2xl shadow-card border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                  <h3 className="text-lg font-bold text-text-main dark:text-white">Preview</h3>
                  <button
                    type="button"
                    onClick={handlePreview}
                    disabled={isPreviewLoading}
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline disabled:opacity-50"
                  >
                    <span className={`material-symbols-outlined text-[18px] ${isPreviewLoading ? 'animate-spin' : ''}`}>
                      refresh
                    </span>
                    Refresh
                  </button>
                </div>
                <div className="p-4">
                  <ResumePreview
                    html={previewHtml}
                    isLoading={isPreviewLoading}
                    scale={0.7}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </AuthGate>
    </AppShell>
  )
}

export default ResumeEditPage
