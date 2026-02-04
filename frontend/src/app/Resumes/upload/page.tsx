'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import AuthGate from '@/components/auth/AuthGate'
import { resumeService } from '@/services/resumeService'
import { templateService } from '@/services/templateService'

const UploadResumePage = () => {
  const router = useRouter()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [isPrimary, setIsPrimary] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null
    setSelectedFile(file)
    setError(null)
    setSuccess(null)
    if (file && !title) {
      setTitle(file.name.replace(/\.[^/.]+$/, ''))
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please choose a resume file to upload.')
      return
    }

    setIsUploading(true)
    setError(null)
    setSuccess(null)

    try {
      const resume = await resumeService.uploadResume(selectedFile, title || undefined, isPrimary)
      setSuccess('Resume uploaded successfully. Extracting content...')
      
      // Auto-trigger extraction in background
      setIsExtracting(true)
      try {
        await templateService.extractResumeContent(resume.id)
        setSuccess('Resume uploaded and content extracted! Redirecting to builder...')
        // Redirect to the resume builder after short delay
        setTimeout(() => {
          router.push(`/Resumes/${resume.id}/edit`)
        }, 1500)
      } catch {
        // Extraction failed but upload succeeded - still redirect
        setSuccess('Resume uploaded! Content extraction will be available in the builder.')
        setTimeout(() => {
          router.push(`/Resumes/${resume.id}/edit`)
        }, 1500)
      } finally {
        setIsExtracting(false)
      }
      
      setSelectedFile(null)
      setTitle('')
      setIsPrimary(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <AppShell title="Upload Resume" subtitle="Add a new resume version" showSearch={false} showActions={false}>
      <AuthGate>
        <Link href="/Resumes" className="text-sm text-primary font-semibold hover:underline">
          Back to Resumes
        </Link>

        <section className="mt-6 bg-card-light dark:bg-card-dark rounded-2xl shadow-card border border-gray-100 dark:border-gray-800 p-6">
          <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-10 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-4">
              <span className="material-symbols-outlined text-3xl">upload_file</span>
            </div>
            <h3 className="text-lg font-bold text-text-main dark:text-white">Drop your resume here</h3>
            <p className="text-sm text-text-secondary mt-2">
              Upload PDF or DOCX files. We will store it securely in Supabase.
            </p>
            <div className="mt-6">
              <input
                type="file"
                className="hidden"
                id="resume-upload"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileChange}
              />
              <label
                htmlFor="resume-upload"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold cursor-pointer shadow-lg shadow-primary/30"
              >
                <span className="material-symbols-outlined text-[18px]">upload</span>
                Choose file
              </label>
            </div>
            {selectedFile && (
              <p className="text-xs text-text-secondary mt-4">Selected: {selectedFile.name}</p>
            )}
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-text-main dark:text-white">Resume title</label>
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/40"
                placeholder="e.g. Master Resume"
              />
            </div>
            <div className="flex items-center gap-3 mt-6 md:mt-8">
              <input
                id="primary-resume"
                type="checkbox"
                checked={isPrimary}
                onChange={(event) => setIsPrimary(event.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="primary-resume" className="text-sm text-text-secondary">
                Set as primary resume
              </label>
            </div>
          </div>

          {error && (
            <div className="mt-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800 rounded-2xl px-4 py-3">
              <p className="text-sm font-semibold">{error}</p>
            </div>
          )}
          {success && (
            <div className="mt-4 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-800 rounded-2xl px-4 py-3">
              <p className="text-sm font-semibold">{success}</p>
            </div>
          )}

          <div className="mt-6 flex items-center justify-end">
            <button
              type="button"
              onClick={handleUpload}
              disabled={isUploading || isExtracting}
              className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-lg shadow-primary/30 hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isExtracting ? 'Extracting...' : isUploading ? 'Uploading...' : 'Upload Resume'}
            </button>
          </div>
        </section>

        <section className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card-light dark:bg-card-dark rounded-2xl shadow-card border border-gray-100 dark:border-gray-800 p-6">
            <h4 className="text-sm font-semibold text-text-main dark:text-white mb-2">File requirements</h4>
            <ul className="text-sm text-text-secondary space-y-2">
              <li>PDF or DOCX format</li>
              <li>Max size 5 MB</li>
              <li>One resume per upload</li>
            </ul>
          </div>
          <div className="bg-card-light dark:bg-card-dark rounded-2xl shadow-card border border-gray-100 dark:border-gray-800 p-6">
            <h4 className="text-sm font-semibold text-text-main dark:text-white mb-2">Tips</h4>
            <ul className="text-sm text-text-secondary space-y-2">
              <li>Use a clean, ATS friendly format.</li>
              <li>Keep contact details at the top.</li>
              <li>Highlight impact and metrics.</li>
            </ul>
          </div>
        </section>
      </AuthGate>
    </AppShell>
  )
}

export default UploadResumePage

