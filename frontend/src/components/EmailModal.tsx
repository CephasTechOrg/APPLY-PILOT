'use client'

import { useState } from 'react'
import { emailService, EmailResponse, ExtractedDeadline } from '@/services/emailService'

interface EmailModalProps {
  onEmailSaved?: (email: EmailResponse) => void
  onClose?: () => void
}

export default function EmailModal({ onEmailSaved, onClose }: EmailModalProps) {
  const [emailContent, setEmailContent] = useState('')
  const [isParsing, setIsParsing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [parseResult, setParseResult] = useState<EmailResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleParse = async () => {
    if (!emailContent.trim()) {
      setError('Please paste email content')
      return
    }

    setIsParsing(true)
    setError(null)

    try {
      const result = await emailService.createEmail(emailContent)
      setParseResult(result)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to parse email'
      setError(errorMessage)
    } finally {
      setIsParsing(false)
    }
  }

  const handleSave = async () => {
    if (!parseResult) return

    setIsSaving(true)
    setError(null)

    try {
      onEmailSaved?.(parseResult)
      handleReset()
      onClose?.()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save email'
      setError(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setEmailContent('')
    setParseResult(null)
    setError(null)
  }

  const getConfidenceColor = (confidence: string | null) => {
    switch (confidence) {
      case 'high':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
      case 'low':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
    }
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-blue-600">mail</span>
          Track Email Deadline
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        )}
      </div>

      {!parseResult ? (
        // Step 1: Paste email content
        <div className="space-y-4 sm:space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Paste Email Content
            </label>
            <textarea
              value={emailContent}
              onChange={(e) => setEmailContent(e.target.value)}
              placeholder="Paste the email content here... AI will automatically extract dates, deadlines, and key information."
              className="w-full h-40 sm:h-48 px-3 sm:px-4 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 resize-none text-sm transition"
            />
          </div>

          {error && (
            <div className="p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm flex items-start gap-2">
              <span className="material-symbols-outlined text-lg flex-shrink-0">error</span>
              {error}
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            {onClose && (
              <button
                onClick={onClose}
                className="px-4 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 font-semibold text-sm transition"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleParse}
              disabled={isParsing || !emailContent.trim()}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold text-sm transition"
            >
              {isParsing ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-lg">refresh</span>
                  Analyzing...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">auto_awesome</span>
                  Analyze with AI
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        // Step 2: Review parsed results
        <div className="space-y-4 sm:space-y-6">
          {/* Summary */}
          {parseResult.parsed_summary && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
              <label className="block text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined">summarize</span>
                Summary
              </label>
              <p className="text-sm text-blue-800 dark:text-blue-400">{parseResult.parsed_summary}</p>
            </div>
          )}

          {/* Confidence */}
          {parseResult.ai_confidence && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
              <span className="material-symbols-outlined text-purple-600">psychology</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">AI Confidence:</span>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${getConfidenceColor(parseResult.ai_confidence)}`}>
                {parseResult.ai_confidence.charAt(0).toUpperCase() + parseResult.ai_confidence.slice(1)}
              </span>
            </div>
          )}

          {/* Key Deadlines */}
          {parseResult.key_deadlines && parseResult.key_deadlines.length > 0 && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <label className="block text-sm font-semibold text-red-900 dark:text-red-300 mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined">warning</span>
                Critical Deadlines ({parseResult.key_deadlines.length})
              </label>
              <div className="space-y-2">
                {parseResult.key_deadlines.map((deadline, idx) => (
                  <div
                    key={idx}
                    className="flex flex-wrap items-center gap-2 p-2 bg-red-100 dark:bg-red-900/40 rounded-lg"
                  >
                    <span className="material-symbols-outlined text-lg text-red-600 dark:text-red-400">
                      event
                    </span>
                    <span className="font-semibold text-red-900 dark:text-red-300">
                      {formatDate(deadline.date)}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">—</span>
                    <span className="text-sm text-red-800 dark:text-red-300">{deadline.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Extracted Dates */}
          {parseResult.extracted_dates && parseResult.extracted_dates.length > 0 && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined">calendar_month</span>
                All Dates Detected ({parseResult.extracted_dates.length})
              </label>
              <div className="space-y-2">
                {parseResult.extracted_dates.map((date, idx) => (
                  <div key={idx} className="flex flex-wrap items-center gap-2 px-3 py-2 text-sm">
                    <span className="material-symbols-outlined text-gray-500 dark:text-gray-400 text-lg">
                      {date.is_critical ? 'priority_high' : 'event'}
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formatDate(date.date)}
                    </span>
                    <span className="text-gray-400">—</span>
                    <span className="text-gray-600 dark:text-gray-400">{date.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key Details */}
          {parseResult.key_details && parseResult.key_details.length > 0 && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined">info</span>
                Key Details
              </label>
              <ul className="space-y-2">
                {parseResult.key_details.map((detail, idx) => (
                  <li key={idx} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Source Company */}
          {parseResult.source_company && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-sm">
              <span className="text-gray-600 dark:text-gray-400">From:</span>
              <span className="ml-2 font-semibold text-gray-900 dark:text-white">{parseResult.source_company}</span>
            </div>
          )}

          {error && (
            <div className="p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm flex items-start gap-2">
              <span className="material-symbols-outlined text-lg flex-shrink-0">error</span>
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={handleReset}
              className="px-4 py-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-semibold text-sm flex items-center justify-center gap-1 transition"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              Start Over
            </button>
            <div className="flex gap-3 ml-auto">
              {onClose && (
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 font-semibold text-sm transition"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-5 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold text-sm transition"
              >
                {isSaving ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-lg">refresh</span>
                    Saving...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">check_circle</span>
                    Save Email
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
