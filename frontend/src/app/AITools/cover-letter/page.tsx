'use client'

import React, { useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import ResumePicker from '@/components/shared/ResumePicker'
import { aiService } from '@/services/aiService'
import { useToast } from '@/components/ui/Toast'

const schema = z.object({
  resume_text: z.string().min(50, 'Paste at least 50 characters of your resume.'),
  job_description: z.string().min(50, 'Paste at least 50 characters of the job description.'),
  resume_id: z.number().nullable().optional(),
  tone: z.string().optional(),
  instructions: z.string().optional(),
})

type CoverLetterForm = z.infer<typeof schema>

const CoverLetterPage = () => {
  const [result, setResult] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [creditsLeft, setCreditsLeft] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)
  const { showToast } = useToast()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CoverLetterForm>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: CoverLetterForm) => {
    setError(null)
    setResult('')
    try {
      const response = await aiService.generateCoverLetter({
        resume_text: data.resume_text,
        job_description: data.job_description,
        resume_id: data.resume_id ?? null,
        tone: data.tone,
        instructions: data.instructions,
      })
      setResult(response.content)
      setCreditsLeft(response.credits_left)
      showToast('Cover letter generated!', 'success')
    } catch (err: any) {
      const message = err?.response?.data?.detail || 'AI request failed. Please try again.'
      setError(message)
      showToast(message, 'error')
    }
  }

  const handleCopy = async () => {
    if (!result) return
    try {
      await navigator.clipboard.writeText(result)
      setCopied(true)
      showToast('Copied to clipboard!', 'success')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      showToast('Failed to copy', 'error')
    }
  }

  const handleDownload = () => {
    if (!result) return
    const blob = new Blob([result], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'cover-letter.txt'
    a.click()
    URL.revokeObjectURL(url)
    showToast('Downloaded!', 'success')
  }

  return (
    <AppShell title="Cover Letter" subtitle="Generate a personalized cover letter" showSearch={false} showActions={false}>
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <div className="bg-card-light dark:bg-card-dark rounded-2xl shadow-card border border-gray-100 dark:border-gray-800 p-6">
          <h3 className="text-lg font-bold text-text-main dark:text-white mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">edit_note</span>
            Input
          </h3>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <Controller
              name="resume_id"
              control={control}
              render={({ field }) => (
                <ResumePicker value={field.value ?? undefined} onChange={field.onChange} label="Select a resume (optional)" />
              )}
            />
            <div>
              <label className="text-sm font-semibold text-text-main dark:text-white">Resume text</label>
              <textarea
                {...register('resume_text')}
                className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm h-28 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                placeholder="Paste your resume content here..."
              />
              {errors.resume_text && <p className="text-xs text-red-500 mt-1">{errors.resume_text.message}</p>}
            </div>
            <div>
              <label className="text-sm font-semibold text-text-main dark:text-white">Job description</label>
              <textarea
                {...register('job_description')}
                className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm h-28 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                placeholder="Paste the job description here..."
              />
              {errors.job_description && <p className="text-xs text-red-500 mt-1">{errors.job_description.message}</p>}
            </div>
            <div>
              <label className="text-sm font-semibold text-text-main dark:text-white">Tone</label>
              <select
                {...register('tone')}
                className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              >
                <option value="">Default (Professional)</option>
                <option value="professional">Professional</option>
                <option value="confident">Confident</option>
                <option value="friendly">Friendly</option>
                <option value="concise">Concise</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-text-main dark:text-white">Extra instructions (optional)</label>
              <input
                {...register('instructions')}
                className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                placeholder="e.g., highlight leadership and product work"
              />
            </div>
            <button
              className="w-full bg-primary text-white rounded-xl text-sm font-bold py-3.5 shadow-lg shadow-primary/30 hover:bg-primary-dark disabled:opacity-70 transition-all flex items-center justify-center gap-2"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[18px]">refresh</span>
                  Generating...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">mail</span>
                  Generate Cover Letter
                </>
              )}
            </button>
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl px-4 py-3 text-sm">
                {error}
              </div>
            )}
            {creditsLeft !== null && (
              <div className="flex items-center justify-between text-xs text-text-secondary bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2">
                <span>AI credits remaining today</span>
                <span className="font-bold text-primary">{creditsLeft}</span>
              </div>
            )}
          </form>
        </div>

        {/* Result Panel */}
        <div className="bg-card-light dark:bg-card-dark rounded-2xl shadow-card border border-gray-100 dark:border-gray-800 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-text-main dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600">mail</span>
              Cover Letter
            </h3>
            {result && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-text-secondary hover:text-primary bg-gray-100 dark:bg-gray-800 rounded-lg transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">{copied ? 'check' : 'content_copy'}</span>
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-text-secondary hover:text-primary bg-gray-100 dark:bg-gray-800 rounded-lg transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  Download
                </button>
              </div>
            )}
          </div>
          
          <div className="flex-1 bg-gray-50 dark:bg-gray-800/60 rounded-xl p-4 text-sm overflow-y-auto min-h-[300px] max-h-[500px]">
            {isSubmitting ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-text-secondary">
                <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                <p className="text-sm font-medium">Crafting your cover letter...</p>
                <p className="text-xs">This may take 10-30 seconds</p>
              </div>
            ) : result ? (
              <pre className="whitespace-pre-wrap text-text-main dark:text-white font-sans leading-relaxed">{result}</pre>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-text-secondary">
                <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-600">mail</span>
                <p className="text-sm text-center">Your personalized cover letter<br/>will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </AppShell>
  )
}

export default CoverLetterPage