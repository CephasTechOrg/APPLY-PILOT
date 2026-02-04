'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import AuthGate from '@/components/auth/AuthGate'
import { coverLetterService, CoverLetterListItem, CoverLetterTemplate } from '@/services/coverLetterService'

const CoverLettersPage = () => {
  const [coverLetters, setCoverLetters] = useState<CoverLetterListItem[]>([])
  const [templates, setTemplates] = useState<CoverLetterTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showNewModal, setShowNewModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('formal')
  const [isCreating, setIsCreating] = useState(false)

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      const [lettersData, templatesData] = await Promise.all([
        coverLetterService.listCoverLetters(),
        coverLetterService.listTemplates(),
      ])
      setCoverLetters(lettersData)
      setTemplates(templatesData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cover letters')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleCreateNew = async () => {
    if (!newTitle.trim()) return
    
    setIsCreating(true)
    try {
      const newLetter = await coverLetterService.createCoverLetter({
        title: newTitle,
        template_slug: selectedTemplate,
      })
      setShowNewModal(false)
      setNewTitle('')
      // Redirect to editor
      window.location.href = `/CoverLetters/${newLetter.id}/edit`
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create cover letter')
    } finally {
      setIsCreating(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this cover letter?')) return
    
    try {
      await coverLetterService.deleteCoverLetter(id)
      setCoverLetters(prev => prev.filter(cl => cl.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete cover letter')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <AppShell title="Cover Letters" subtitle="Create and manage your cover letters" showSearch={false} showActions={false}>
      <AuthGate>
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <p className="text-sm text-text-secondary">
            Craft personalized cover letters for your job applications.
          </p>
          <button
            onClick={() => setShowNewModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/30"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Cover Letter
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800 rounded-2xl px-4 py-3">
            <p className="text-sm font-semibold">{error}</p>
          </div>
        )}

        {/* Loading */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : coverLetters.length === 0 ? (
          /* Empty state */
          <div className="bg-card-light dark:bg-card-dark rounded-2xl shadow-card border border-gray-100 dark:border-gray-800 p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-4">
              <span className="material-symbols-outlined text-4xl">mail</span>
            </div>
            <h3 className="text-lg font-bold text-text-main dark:text-white mb-2">No cover letters yet</h3>
            <p className="text-sm text-text-secondary mb-6">
              Create your first cover letter to get started
            </p>
            <button
              onClick={() => setShowNewModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Create Cover Letter
            </button>
          </div>
        ) : (
          /* Cover Letters Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coverLetters.map(letter => (
              <div
                key={letter.id}
                className="bg-card-light dark:bg-card-dark rounded-2xl shadow-card border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Preview placeholder */}
                <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
                  <span className="material-symbols-outlined text-5xl text-gray-400 dark:text-gray-500">
                    description
                  </span>
                </div>
                
                <div className="p-4">
                  <h3 className="font-semibold text-text-main dark:text-white truncate">{letter.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-text-secondary capitalize">{letter.template_slug} template</span>
                    <span className="text-xs text-text-secondary">•</span>
                    <span className="text-xs text-text-secondary">{formatDate(letter.updated_at)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-4">
                    <Link
                      href={`/CoverLetters/${letter.id}/edit`}
                      className="flex-1 text-center px-3 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-dark transition"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(letter.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* New Cover Letter Modal */}
        {showNewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
              <h2 className="text-xl font-bold text-text-main dark:text-white mb-4">New Cover Letter</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-text-main dark:text-white mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="e.g., Software Engineer at Google"
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-text-main dark:text-white mb-2">
                    Template
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {templates.map(template => (
                      <button
                        key={template.slug}
                        onClick={() => setSelectedTemplate(template.slug)}
                        className={`p-3 rounded-xl border-2 text-center transition ${
                          selectedTemplate === template.slug
                            ? 'border-primary bg-primary/10'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-sm font-semibold">{template.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowNewModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateNew}
                  disabled={!newTitle.trim() || isCreating}
                  className="flex-1 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold disabled:opacity-50"
                >
                  {isCreating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}
      </AuthGate>
    </AppShell>
  )
}

export default CoverLettersPage
