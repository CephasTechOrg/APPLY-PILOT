'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import AuthGate from '@/components/auth/AuthGate'
import templateService, { TemplateListItem } from '@/services/templateService'

const TemplatesPage = () => {
  const searchParams = useSearchParams()
  const resumeId = searchParams.get('resumeId')
  
  const [templates, setTemplates] = useState<TemplateListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [previewSlug, setPreviewSlug] = useState<string | null>(null)
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await templateService.listTemplates('resume')
        setTemplates(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load templates')
      } finally {
        setIsLoading(false)
      }
    }

    fetchTemplates()
  }, [])

  const handlePreview = async (slug: string) => {
    if (previewSlug === slug) {
      setPreviewSlug(null)
      setPreviewHtml(null)
      return
    }

    try {
      setPreviewLoading(true)
      setPreviewSlug(slug)
      const result = await templateService.previewTemplate(slug)
      setPreviewHtml(result.html)
    } catch (err) {
      setError('Failed to load preview')
    } finally {
      setPreviewLoading(false)
    }
  }

  const getTemplateIcon = (slug: string) => {
    switch (slug) {
      case 'modern':
        return 'auto_awesome'
      case 'classic':
        return 'library_books'
      case 'minimal':
        return 'view_agenda'
      default:
        return 'description'
    }
  }

  const getTemplateColor = (slug: string) => {
    switch (slug) {
      case 'modern':
        return 'bg-blue-500/10 text-blue-600'
      case 'classic':
        return 'bg-amber-500/10 text-amber-600'
      case 'minimal':
        return 'bg-gray-500/10 text-gray-600'
      default:
        return 'bg-primary/10 text-primary'
    }
  }

  return (
    <AppShell
      title="Resume Templates"
      subtitle="Choose a professional template for your resume"
      showSearch={false}
      showActions={false}
    >
      <AuthGate>
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/Resumes"
            className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-primary transition"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to Resumes
          </Link>
          {resumeId && (
            <span className="text-sm text-text-secondary">
              Selecting template for resume #{resumeId}
            </span>
          )}
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800 rounded-2xl px-4 py-3 mb-6">
            <p className="text-sm font-semibold">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <span className="material-symbols-outlined animate-spin text-2xl text-primary mb-2">refresh</span>
            <p className="text-sm text-text-secondary">Loading templates...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {templates.map((template) => (
              <div
                key={template.slug}
                className={`bg-white dark:bg-card-dark rounded-2xl shadow-card border transition-all ${
                  previewSlug === template.slug
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'border-gray-100 dark:border-gray-800 hover:shadow-lg'
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${getTemplateColor(template.slug)}`}>
                        <span className="material-symbols-outlined text-2xl">{getTemplateIcon(template.slug)}</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-text-main dark:text-white">
                          {template.name}
                        </h3>
                        <p className="text-sm text-text-secondary mt-1">
                          {template.description || 'Professional resume template'}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-text-secondary">
                            v{template.version}
                          </span>
                          {template.is_default && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                              Default
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => handlePreview(template.slug)}
                      className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-text-main dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                    >
                      {previewSlug === template.slug ? 'Hide Preview' : 'Preview'}
                    </button>
                    {resumeId ? (
                      <Link
                        href={`/Resumes/${resumeId}/edit?template=${template.slug}`}
                        className="flex-1 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold text-center shadow-lg shadow-primary/30 hover:bg-primary-dark transition"
                      >
                        Use Template
                      </Link>
                    ) : (
                      <Link
                        href={`/Resumes/templates/${template.slug}`}
                        className="flex-1 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold text-center shadow-lg shadow-primary/30 hover:bg-primary-dark transition"
                      >
                        View Details
                      </Link>
                    )}
                  </div>
                </div>

                {/* Preview Panel */}
                {previewSlug === template.slug && (
                  <div className="border-t border-gray-100 dark:border-gray-800 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-b-2xl">
                    {previewLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <span className="material-symbols-outlined animate-spin text-xl text-primary">refresh</span>
                      </div>
                    ) : previewHtml ? (
                      <div className="bg-white rounded-xl shadow-inner overflow-hidden">
                        <iframe
                          srcDoc={previewHtml}
                          title={`${template.name} preview`}
                          className="w-full h-[400px] border-0"
                          sandbox="allow-same-origin"
                        />
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!isLoading && templates.length === 0 && (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-5xl text-gray-300 dark:text-gray-700 mb-3">
              style
            </span>
            <p className="text-sm text-text-secondary">No templates available yet.</p>
          </div>
        )}
      </AuthGate>
    </AppShell>
  )
}

export default TemplatesPage
