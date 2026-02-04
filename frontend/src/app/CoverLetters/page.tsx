'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import AuthGate from '@/components/auth/AuthGate'
import { coverLetterService, CoverLetterListItem } from '@/services/coverLetterService'
import { formatDistanceToNow } from 'date-fns'

const CoverLettersPage = () => {
  const [coverLetters, setCoverLetters] = useState<CoverLetterListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCoverLetters = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await coverLetterService.listCoverLetters()
      setCoverLetters(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cover letters')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCoverLetters()
  }, [])

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this cover letter?')) return
    
    try {
      await coverLetterService.deleteCoverLetter(id)
      setCoverLetters((prev) => prev.filter((letter) => letter.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete cover letter')
    }
  }

  return (
    <AppShell title="Cover Letters" subtitle="Create and manage your cover letters" showSearch={false} showActions={false}>
      <AuthGate>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-sm text-text-secondary">Create personalized cover letters for job applications.</p>
          <Link
            href="/CoverLetters/create"
            className="px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:opacity-90 transition flex items-center justify-center gap-2 w-full sm:w-auto flex-shrink-0"
          >
            <span className="material-symbols-outlined">add</span>
            New Cover Letter
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
              <p className="text-sm text-text-secondary">Loading cover letters...</p>
            </div>
          ) : coverLetters.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
              <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-600 mb-3 block">mail</span>
              <p className="text-sm text-text-secondary mb-4">No cover letters created yet</p>
              <Link
                href="/CoverLetters/create"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:opacity-90 transition"
              >
                <span className="material-symbols-outlined">add</span>
                Create your first cover letter
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {coverLetters.map((letter) => (
                <div key={letter.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg">
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-text-main dark:text-white truncate">{letter.title}</h3>
                        <p className="text-xs text-text-secondary mt-1">
                          Updated {formatDistanceToNow(new Date(letter.updated_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs">
                      <Link
                        href={`/CoverLetters/${letter.id}/edit`}
                        className="text-primary hover:underline font-semibold"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(letter.id)}
                        className="text-red-600 dark:text-red-400 hover:underline font-semibold"
                      >
                        Delete
                      </button>
                    </div>
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

export default CoverLettersPage
