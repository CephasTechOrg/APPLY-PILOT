'use client'

import { useState } from 'react'
import { eventsService, EmailParseResponse, eventTypeInfo, EventType } from '@/services/eventsService'

interface EmailParserProps {
  applicationId: number
  onEventCreated?: () => void
  onClose?: () => void
}

export default function EmailParser({ applicationId, onEventCreated, onClose }: EmailParserProps) {
  const [emailContent, setEmailContent] = useState('')
  const [additionalContext, setAdditionalContext] = useState('')
  const [isParsing, setIsParsing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [parseResult, setParseResult] = useState<EmailParseResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // User overrides
  const [selectedEventType, setSelectedEventType] = useState<EventType | null>(null)
  const [customSummary, setCustomSummary] = useState('')
  const [updateStatus, setUpdateStatus] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState('')

  const handleParse = async () => {
    if (!emailContent.trim()) {
      setError('Please paste email content to analyze')
      return
    }

    setIsParsing(true)
    setError(null)
    setParseResult(null)

    try {
      const result = await eventsService.parseEmail(applicationId, {
        email_content: emailContent,
        additional_context: additionalContext || undefined,
      })
      setParseResult(result)
      setSelectedEventType(result.suggestions.suggested_event_type)
      setCustomSummary(result.summary)
      if (result.suggestions.suggested_status) {
        setSelectedStatus(result.suggestions.suggested_status)
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to parse email'
      setError(errorMessage)
    } finally {
      setIsParsing(false)
    }
  }

  const handleCreateEvent = async () => {
    if (!parseResult) return

    setIsCreating(true)
    setError(null)

    try {
      await eventsService.createEventFromEmail(applicationId, {
        email_content: emailContent,
        event_type: selectedEventType || undefined,
        summary: customSummary || undefined,
        action_required: parseResult.suggestions.action_required,
        action_description: parseResult.suggestions.action_description || undefined,
        action_deadline: parseResult.suggestions.action_deadline || undefined,
        update_status: updateStatus,
        new_status: updateStatus ? selectedStatus : undefined,
      })
      
      onEventCreated?.()
      onClose?.()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create event'
      setError(errorMessage)
    } finally {
      setIsCreating(false)
    }
  }

  const handleReset = () => {
    setParseResult(null)
    setSelectedEventType(null)
    setCustomSummary('')
    setUpdateStatus(false)
    setSelectedStatus('')
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-blue-600">mail</span>
          Log Email Event
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
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Paste Email Content
            </label>
            <textarea
              value={emailContent}
              onChange={(e) => setEmailContent(e.target.value)}
              placeholder="Paste the email content here..."
              className="w-full h-40 sm:h-48 px-3 sm:px-4 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 resize-none text-sm transition"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Additional Context <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
              placeholder="Any additional context about this email..."
              className="w-full px-3 sm:px-4 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 text-sm transition"
            />
          </div>

          {error && (
            <div className="p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm flex items-start gap-2">
              <span className="material-symbols-outlined text-lg">error</span>
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            {onClose && (
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 font-semibold text-sm transition"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleParse}
              disabled={isParsing || !emailContent.trim()}
              className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold text-sm transition"
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
        // Step 2: Review AI suggestions
        <div className="space-y-4 sm:space-y-6">
          {/* AI Confidence */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
            <span className="material-symbols-outlined text-purple-600">psychology</span>
            <span className="text-sm text-gray-600 dark:text-gray-400">AI Confidence:</span>
            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 max-w-24 sm:max-w-32">
              <div
                className={`h-2 rounded-full transition-all ${
                  parseResult.suggestions.confidence > 0.8
                    ? 'bg-green-500'
                    : parseResult.suggestions.confidence > 0.5
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${parseResult.suggestions.confidence * 100}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {Math.round(parseResult.suggestions.confidence * 100)}%
            </span>
          </div>

          {/* Event Type Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Event Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(eventTypeInfo).map(([type, info]) => (
                <button
                  key={type}
                  onClick={() => setSelectedEventType(type as EventType)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left text-sm font-medium transition ${
                    selectedEventType === type
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <span>{info.icon}</span>
                  <span className="truncate">{info.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Summary
            </label>
            <textarea
              value={customSummary}
              onChange={(e) => setCustomSummary(e.target.value)}
              className="w-full h-16 sm:h-20 px-3 sm:px-4 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 resize-none text-sm transition"
            />
          </div>

          {/* Key Details */}
          {parseResult.suggestions.key_details.length > 0 && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">info</span>
                Key Details Extracted
              </label>
              <ul className="space-y-2">
                {parseResult.suggestions.key_details.map((detail, idx) => (
                  <li key={idx} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Extracted Dates */}
          {parseResult.suggestions.extracted_dates.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">calendar_month</span>
                Dates Detected
              </label>
              <div className="space-y-2">
                {parseResult.suggestions.extracted_dates.map((date, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-wrap items-center gap-2 px-3 py-2.5 rounded-xl text-sm ${
                      date.is_deadline 
                        ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' 
                        : 'bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">
                      {date.is_deadline ? 'warning' : 'event'}
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {new Date(date.date).toLocaleDateString()}
                    </span>
                    <span className="text-gray-400">—</span>
                    <span className="text-gray-600 dark:text-gray-400">{date.description}</span>
                    {date.is_deadline && (
                      <span className="ml-auto text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 px-2 py-0.5 rounded-full font-semibold">
                        Deadline
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Required */}
          {parseResult.suggestions.action_required && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50 rounded-xl">
              <div className="flex items-center gap-2 font-semibold text-yellow-800 dark:text-yellow-300 mb-2">
                <span className="material-symbols-outlined">warning</span>
                Action Required
              </div>
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                {parseResult.suggestions.action_description || 'Please take action on this email'}
              </p>
              {parseResult.suggestions.action_deadline && (
                <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-2 flex items-center gap-1">
                  <span className="material-symbols-outlined text-base">schedule</span>
                  Deadline: {new Date(parseResult.suggestions.action_deadline).toLocaleDateString()}
                </p>
              )}
            </div>
          )}

          {/* Next Steps */}
          {parseResult.suggestions.next_steps.length > 0 && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-xl">
              <label className="block text-sm font-semibold text-green-700 dark:text-green-300 mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">lightbulb</span>
                Suggested Next Steps
              </label>
              <ul className="space-y-2">
                {parseResult.suggestions.next_steps.map((step, idx) => (
                  <li key={idx} className="text-sm text-green-700 dark:text-green-400 flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">→</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Update Application Status */}
          {parseResult.suggestions.suggested_status && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-xl">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={updateStatus}
                  onChange={(e) => setUpdateStatus(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                />
                <span className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                  Also update application status to &quot;{parseResult.suggestions.suggested_status}&quot;
                </span>
              </label>
            </div>
          )}

          {error && (
            <div className="p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm flex items-start gap-2">
              <span className="material-symbols-outlined text-lg">error</span>
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={handleReset}
              className="order-2 sm:order-1 px-4 py-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-semibold text-sm flex items-center justify-center gap-1 transition"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              Start Over
            </button>
            <div className="order-1 sm:order-2 flex flex-col sm:flex-row gap-3">
              {onClose && (
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 font-semibold text-sm transition"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={handleCreateEvent}
                disabled={isCreating}
                className="w-full sm:w-auto px-5 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold text-sm transition"
              >
                {isCreating ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-lg">refresh</span>
                    Saving...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">check_circle</span>
                    Confirm & Save Event
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
