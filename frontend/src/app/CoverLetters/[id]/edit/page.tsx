'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import AuthGate from '@/components/auth/AuthGate'
import TokenSelector from '@/components/resume/TokenSelector'
import {
  coverLetterService,
  CoverLetter,
  CoverLetterTemplate,
  CoverLetterStructuredData,
  DesignTokens,
} from '@/services/coverLetterService'

const defaultContent: CoverLetterStructuredData = {
  meta: {
    tone: 'professional',
    job_title: '',
    company_name: '',
  },
  content: {
    salutation: 'Dear Hiring Manager,',
    opening: '',
    body: [],
    closing: '',
    signature: 'Sincerely,',
    sender_name: '',
  },
}

const CoverLetterEditPage = () => {
  const params = useParams()
  const router = useRouter()
  const id = Number(params.id)
  
  const [coverLetter, setCoverLetter] = useState<CoverLetter | null>(null)
  const [templates, setTemplates] = useState<CoverLetterTemplate[]>([])
  const [content, setContent] = useState<CoverLetterStructuredData>(defaultContent)
  const [selectedTemplate, setSelectedTemplate] = useState('formal')
  const [designTokens, setDesignTokens] = useState<DesignTokens>({
    font_family: 'Inter',
    spacing: 'comfortable',
    accent_color: 'neutral',
  })
  const [previewHtml, setPreviewHtml] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')
  
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Load cover letter and templates
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        const [letterData, templatesData] = await Promise.all([
          coverLetterService.getCoverLetter(id),
          coverLetterService.listTemplates(),
        ])
        
        setCoverLetter(letterData)
        setTemplates(templatesData)
        setSelectedTemplate(letterData.template_slug)
        
        if (letterData.design_tokens) {
          setDesignTokens(letterData.design_tokens)
        }
        
        if (letterData.content) {
          setContent(letterData.content as CoverLetterStructuredData)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load cover letter')
      } finally {
        setIsLoading(false)
      }
    }
    
    loadData()
  }, [id])

  // Auto-save with debounce
  const autoSave = useCallback(async () => {
    if (!coverLetter) return
    
    setSaveStatus('saving')
    try {
      await coverLetterService.updateCoverLetter(id, {
        template_slug: selectedTemplate,
        design_tokens: designTokens,
        content: content,
      })
      setSaveStatus('saved')
    } catch (err) {
      console.error('Auto-save failed:', err)
      setSaveStatus('unsaved')
    }
  }, [id, coverLetter, selectedTemplate, designTokens, content])

  // Trigger auto-save on changes
  useEffect(() => {
    if (isLoading || !coverLetter) return
    
    setSaveStatus('unsaved')
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      autoSave()
    }, 1500)
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [content, selectedTemplate, designTokens, isLoading, coverLetter, autoSave])

  // Load preview
  const loadPreview = useCallback(async () => {
    if (!coverLetter || !content) return
    
    try {
      const html = await coverLetterService.previewCoverLetter(id, {
        template_slug: selectedTemplate,
        design_tokens: designTokens,
      })
      setPreviewHtml(html)
    } catch (err) {
      console.error('Failed to load preview:', err)
    }
  }, [id, coverLetter, content, selectedTemplate, designTokens])

  useEffect(() => {
    if (!isLoading && coverLetter) {
      loadPreview()
    }
  }, [isLoading, coverLetter, loadPreview])

  // Export handlers
  const handleExportPdf = async () => {
    setIsExporting(true)
    try {
      const blob = await coverLetterService.exportCoverLetterPdf(id, {
        template_slug: selectedTemplate,
        design_tokens: designTokens,
      })
      
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${coverLetter?.title || 'cover_letter'}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export PDF')
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportDocx = async () => {
    setIsExporting(true)
    try {
      const blob = await coverLetterService.exportCoverLetterDocx(id)
      
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${coverLetter?.title || 'cover_letter'}.docx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export DOCX')
    } finally {
      setIsExporting(false)
    }
  }

  // Content update helpers
  const updateMeta = (field: string, value: string) => {
    setContent(prev => ({
      ...prev,
      meta: { ...prev.meta, [field]: value },
    }))
  }

  const updateContent = (field: string, value: string | string[]) => {
    setContent(prev => ({
      ...prev,
      content: { ...prev.content, [field]: value },
    }))
  }

  const addBodyParagraph = () => {
    setContent(prev => ({
      ...prev,
      content: { ...prev.content, body: [...prev.content.body, ''] },
    }))
  }

  const updateBodyParagraph = (index: number, value: string) => {
    setContent(prev => ({
      ...prev,
      content: {
        ...prev.content,
        body: prev.content.body.map((p, i) => (i === index ? value : p)),
      },
    }))
  }

  const removeBodyParagraph = (index: number) => {
    setContent(prev => ({
      ...prev,
      content: {
        ...prev.content,
        body: prev.content.body.filter((_, i) => i !== index),
      },
    }))
  }

  if (isLoading) {
    return (
      <AppShell title="Loading..." showSearch={false} showActions={false}>
        <AuthGate>
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </AuthGate>
      </AppShell>
    )
  }

  if (!coverLetter) {
    return (
      <AppShell title="Not Found" showSearch={false} showActions={false}>
        <AuthGate>
          <div className="text-center py-20">
            <p className="text-text-secondary">Cover letter not found</p>
            <Link href="/CoverLetters" className="text-primary font-semibold mt-4 inline-block">
              Back to Cover Letters
            </Link>
          </div>
        </AuthGate>
      </AppShell>
    )
  }

  return (
    <AppShell title={coverLetter.title} subtitle="Edit your cover letter" showSearch={false} showActions={false}>
      <AuthGate>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/CoverLetters" className="text-sm text-primary font-semibold hover:underline">
            ← Back to Cover Letters
          </Link>
          <div className="flex items-center gap-3">
            <span className={`text-xs px-2 py-1 rounded ${
              saveStatus === 'saved' ? 'bg-green-100 text-green-700' :
              saveStatus === 'saving' ? 'bg-yellow-100 text-yellow-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {saveStatus === 'saved' ? '✓ Saved' : saveStatus === 'saving' ? 'Saving...' : 'Unsaved'}
            </span>
            <button
              onClick={handleExportPdf}
              disabled={isExporting}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
              PDF
            </button>
            <button
              onClick={handleExportDocx}
              disabled={isExporting}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">description</span>
              DOCX
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800 rounded-2xl px-4 py-3">
            <p className="text-sm font-semibold">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Editor Panel */}
          <div className="space-y-6">
            {/* Template & Design */}
            <section className="bg-card-light dark:bg-card-dark rounded-2xl shadow-card border border-gray-100 dark:border-gray-800 p-6">
              <h3 className="text-lg font-bold text-text-main dark:text-white mb-4">Design</h3>
              
              {/* Template selector */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-text-main dark:text-white mb-2">
                  Template
                </label>
                <div className="flex flex-wrap gap-2">
                  {templates.map(template => (
                    <button
                      key={template.slug}
                      onClick={() => setSelectedTemplate(template.slug)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                        selectedTemplate === template.slug
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-text-main dark:text-white hover:bg-gray-200'
                      }`}
                    >
                      {template.name}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Design tokens */}
              <TokenSelector
                tokens={{
                  fontFamily: designTokens.font_family,
                  spacing: designTokens.spacing,
                  accentColor: designTokens.accent_color,
                }}
                onChange={tokens => setDesignTokens({
                  font_family: tokens.fontFamily || 'Inter',
                  spacing: tokens.spacing || 'comfortable',
                  accent_color: tokens.accentColor || 'neutral',
                })}
              />
            </section>

            {/* Context */}
            <section className="bg-card-light dark:bg-card-dark rounded-2xl shadow-card border border-gray-100 dark:border-gray-800 p-6">
              <h3 className="text-lg font-bold text-text-main dark:text-white mb-4">Job Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-text-main dark:text-white mb-2">
                    Job Title
                  </label>
                  <input
                    type="text"
                    value={content.meta.job_title}
                    onChange={e => updateMeta('job_title', e.target.value)}
                    placeholder="e.g., Software Engineer"
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-main dark:text-white mb-2">
                    Company
                  </label>
                  <input
                    type="text"
                    value={content.meta.company_name}
                    onChange={e => updateMeta('company_name', e.target.value)}
                    placeholder="e.g., Google"
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>
            </section>

            {/* Letter Content */}
            <section className="bg-card-light dark:bg-card-dark rounded-2xl shadow-card border border-gray-100 dark:border-gray-800 p-6">
              <h3 className="text-lg font-bold text-text-main dark:text-white mb-4">Content</h3>
              <div className="space-y-4">
                {/* Salutation */}
                <div>
                  <label className="block text-sm font-semibold text-text-main dark:text-white mb-2">
                    Salutation
                  </label>
                  <input
                    type="text"
                    value={content.content.salutation}
                    onChange={e => updateContent('salutation', e.target.value)}
                    placeholder="Dear Hiring Manager,"
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                {/* Opening */}
                <div>
                  <label className="block text-sm font-semibold text-text-main dark:text-white mb-2">
                    Opening Paragraph
                  </label>
                  <textarea
                    value={content.content.opening}
                    onChange={e => updateContent('opening', e.target.value)}
                    placeholder="Introduce yourself and state the position you're applying for..."
                    rows={3}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                {/* Body paragraphs */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-semibold text-text-main dark:text-white">
                      Body Paragraphs
                    </label>
                    <button
                      onClick={addBodyParagraph}
                      className="text-xs text-primary font-semibold hover:underline"
                    >
                      + Add Paragraph
                    </button>
                  </div>
                  <div className="space-y-3">
                    {content.content.body.map((paragraph, index) => (
                      <div key={index} className="relative">
                        <textarea
                          value={paragraph}
                          onChange={e => updateBodyParagraph(index, e.target.value)}
                          placeholder={`Body paragraph ${index + 1}...`}
                          rows={3}
                          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 pr-10 text-sm focus:ring-2 focus:ring-primary/40"
                        />
                        <button
                          onClick={() => removeBodyParagraph(index)}
                          className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500"
                        >
                          <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                      </div>
                    ))}
                    {content.content.body.length === 0 && (
                      <p className="text-sm text-text-secondary italic">
                        No body paragraphs yet. Click &quot;Add Paragraph&quot; to add one.
                      </p>
                    )}
                  </div>
                </div>

                {/* Closing */}
                <div>
                  <label className="block text-sm font-semibold text-text-main dark:text-white mb-2">
                    Closing Paragraph
                  </label>
                  <textarea
                    value={content.content.closing}
                    onChange={e => updateContent('closing', e.target.value)}
                    placeholder="Thank the reader and express your interest in discussing further..."
                    rows={3}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                {/* Signature */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-text-main dark:text-white mb-2">
                      Sign-off
                    </label>
                    <input
                      type="text"
                      value={content.content.signature}
                      onChange={e => updateContent('signature', e.target.value)}
                      placeholder="Sincerely,"
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-text-main dark:text-white mb-2">
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={content.content.sender_name}
                      onChange={e => updateContent('sender_name', e.target.value)}
                      placeholder="John Doe"
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Preview Panel */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <section className="bg-card-light dark:bg-card-dark rounded-2xl shadow-card border border-gray-100 dark:border-gray-800 overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
                <h3 className="font-bold text-text-main dark:text-white">Preview</h3>
                <button
                  onClick={loadPreview}
                  className="text-xs text-primary font-semibold hover:underline"
                >
                  Refresh
                </button>
              </div>
              <div className="bg-gray-100 dark:bg-gray-900 p-4">
                {previewHtml ? (
                  <iframe
                    srcDoc={previewHtml}
                    className="w-full bg-white rounded-lg shadow"
                    style={{ height: '700px' }}
                    title="Cover Letter Preview"
                  />
                ) : (
                  <div className="flex items-center justify-center h-96 text-text-secondary">
                    <p>Preview will appear here</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </AuthGate>
    </AppShell>
  )
}

export default CoverLetterEditPage
