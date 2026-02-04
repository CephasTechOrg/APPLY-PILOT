'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { applicationService, Application } from '@/services/applicationService'
import { eventsService, ApplicationEventListItem } from '@/services/eventsService'
import { format } from 'date-fns'
import AuthGate from '@/components/auth/AuthGate'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import ResumePicker from '@/components/shared/ResumePicker'
import EmailParser from '@/components/EmailParser'
import EventTimeline from '@/components/EventTimeline'

const statusClasses: Record<string, string> = {
  saved: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  applied: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  interview: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  offer: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
}

const statusLabel: Record<string, string> = {
  saved: 'Saved',
  applied: 'Applied',
  interview: 'Interview',
  offer: 'Offer',
  rejected: 'Rejected',
}

const statusIcons: Record<string, string> = {
  saved: 'bookmark',
  applied: 'send',
  interview: 'calendar_month',
  offer: 'verified',
  rejected: 'close',
}

const statusDotClasses: Record<string, string> = {
  saved: 'bg-gray-500',
  applied: 'bg-blue-500',
  interview: 'bg-purple-500',
  offer: 'bg-green-500',
  rejected: 'bg-red-500',
}

const updateApplicationSchema = z.object({
  company: z.string().min(1, 'Company is required'),
  job_title: z.string().min(1, 'Job title is required'),
  status: z.enum(['saved', 'applied', 'interview', 'offer', 'rejected']).default('saved'),
  location: z.string().optional(),
  job_url: z.string().url('Enter a valid URL').optional().or(z.literal('')),
  job_description: z.string().optional(),
  salary_range: z.string().optional(),
  notes: z.string().optional(),
  recruiter_name: z.string().optional(),
  recruiter_email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  recruiter_phone: z.string().optional(),
  applied_at: z.string().optional(),
  interview_date: z.string().optional(),
  follow_up_date: z.string().optional(),
  resume_id: z.number().nullable().optional(),
})

type UpdateApplicationForm = z.infer<typeof updateApplicationSchema>

const ApplicationDetailPage = () => {
  const params = useParams()
  const [application, setApplication] = useState<Application | null>(null)
  const [events, setEvents] = useState<ApplicationEventListItem[]>([])
  const [eventsError, setEventsError] = useState<string | null>(null)
  const [eventsLoading, setEventsLoading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [isEmailParserOpen, setIsEmailParserOpen] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<UpdateApplicationForm>({
    resolver: zodResolver(updateApplicationSchema),
  })

  useEffect(() => {
    if (params.id) {
      fetchApplication()
    }
  }, [params.id])

  const fetchEvents = async () => {
    try {
      setEventsLoading(true)
      setEventsError(null)
      const eventData = await eventsService.listEvents(Number(params.id))
      setEvents(eventData)
    } catch (err) {
      setEventsError(err instanceof Error ? err.message : 'Failed to load timeline')
    } finally {
      setEventsLoading(false)
    }
  }

  const handleEventCreated = () => {
    setIsEmailParserOpen(false)
    fetchEvents()
    fetchApplication() // Also refresh application in case status changed
  }

  const fetchApplication = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const appData = await applicationService.getApplication(Number(params.id))
      setApplication(appData)
      await fetchEvents()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load application')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set'
    try {
      return format(new Date(dateString), 'MMM d, yyyy')
    } catch {
      return 'Invalid date'
    }
  }

  const openEditModal = () => {
    if (!application) return
    setFormError(null)
    reset({
      company: application.company,
      job_title: application.job_title,
      status: application.status,
      location: application.location || '',
      job_url: application.job_url || '',
      job_description: application.job_description || '',
      salary_range: application.salary_range || '',
      notes: application.notes || '',
      recruiter_name: application.recruiter_name || '',
      recruiter_email: application.recruiter_email || '',
      recruiter_phone: application.recruiter_phone || '',
      applied_at: application.applied_at ? application.applied_at.slice(0, 10) : '',
      interview_date: application.interview_date ? application.interview_date.slice(0, 10) : '',
      follow_up_date: application.follow_up_date ? application.follow_up_date.slice(0, 10) : '',
    })
    setIsEditOpen(true)
  }

  const closeEditModal = () => {
    setIsEditOpen(false)
  }

  const onUpdateSubmit = async (data: UpdateApplicationForm) => {
    if (!application) return
    setIsSaving(true)
    setFormError(null)
    try {
      // Convert date strings to ISO datetime format (backend expects datetime)
      const payload = {
        company: data.company.trim(),
        job_title: data.job_title.trim(),
        status: data.status,
        location: data.location?.trim() || undefined,
        job_url: data.job_url?.trim() || undefined,
        job_description: data.job_description?.trim() || undefined,
        salary_range: data.salary_range?.trim() || undefined,
        notes: data.notes?.trim() || undefined,
        recruiter_name: data.recruiter_name?.trim() || undefined,
        recruiter_email: data.recruiter_email?.trim() || undefined,
        recruiter_phone: data.recruiter_phone?.trim() || undefined,
        applied_at: data.applied_at ? `${data.applied_at}T00:00:00` : undefined,
        interview_date: data.interview_date ? `${data.interview_date}T00:00:00` : undefined,
        follow_up_date: data.follow_up_date ? `${data.follow_up_date}T00:00:00` : undefined,
      }
      await applicationService.updateApplication(application.id, payload)
      await fetchApplication()
      closeEditModal()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to update application')
    } finally {
      setIsSaving(false)
    }
  }

  const confirmDelete = () => {
    setIsDeleteOpen(true)
  }

  const closeDeleteModal = () => {
    setIsDeleteOpen(false)
  }

  const handleDelete = async () => {
    if (!application) return
    setIsDeleting(true)
    try {
      await applicationService.deleteApplication(application.id)
      window.location.href = '/Applications'
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to delete application')
    } finally {
      setIsDeleting(false)
      setIsDeleteOpen(false)
    }
  }

  if (isLoading) {
    return (
      <AppShell title="Application Details" subtitle="Loading..." showSearch={false} showActions={false}>
        <div className="text-center py-12 text-sm text-text-secondary">
          <span className="material-symbols-outlined animate-spin text-2xl mb-2">refresh</span>
          <p>Loading application...</p>
        </div>
      </AppShell>
    )
  }

  if (error || !application) {
    return (
      <AppShell title="Application Details" subtitle="Error" showSearch={false} showActions={false}>
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800 rounded-2xl px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-semibold">{error || 'Application not found'}</span>
          <Link href="/Applications" className="text-sm font-semibold hover:underline">
            Back to Applications
          </Link>
        </div>
      </AppShell>
    )
  }
  return (
    <AppShell title="Application Details" subtitle={`${application.company} - ${application.job_title}`} showSearch={false} showActions={false}>
      <AuthGate>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <Link href="/Applications" className="text-sm text-primary font-semibold hover:underline flex items-center gap-1 transition-colors">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to Applications
          </Link>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              onClick={openEditModal}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
              Edit
            </button>
            <button
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition"
              onClick={confirmDelete}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
              Delete
            </button>
          </div>
        </div>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-card-dark rounded-2xl shadow-card border border-gray-200 dark:border-gray-800 p-4 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6 pb-6 border-b border-gray-100 dark:border-gray-800">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-text-main dark:text-white mb-2">{application.company}</h2>
              <p className="text-base sm:text-lg text-text-secondary mb-3">{application.job_title}</p>
              {application.location && (
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <span className="material-symbols-outlined text-[18px]">location_on</span>
                  {application.location}
                </div>
              )}
            </div>
            <div className="self-start flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-text-main dark:text-white bg-white/70 dark:bg-gray-900/40">
              <span className={`h-2 w-2 rounded-full ${statusDotClasses[application.status]}`} />
              <span className="material-symbols-outlined text-[18px] text-text-secondary">{statusIcons[application.status]}</span>
              {statusLabel[application.status]}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mt-6">
            <div>
              <p className="text-xs uppercase text-text-secondary">Location</p>
              <p className="text-sm font-semibold text-text-main dark:text-white">{application.location || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-text-secondary">Job URL</p>
              {application.job_url ? (
                <a href={application.job_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline truncate">
                  <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                  View Posting
                </a>
              ) : (
                <p className="text-sm font-semibold text-text-main dark:text-white">Not provided</p>
              )}
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 border border-gray-200 dark:border-gray-800">
              <p className="text-xs uppercase text-text-secondary font-semibold mb-1">Applied</p>
              <p className="text-sm font-semibold text-text-main dark:text-white">{formatDate(application.applied_at)}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 border border-gray-200 dark:border-gray-800">
              <p className="text-xs uppercase text-text-secondary font-semibold mb-1">Follow up</p>
              <p className="text-sm font-semibold text-text-main dark:text-white">{formatDate(application.follow_up_date)}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-text-secondary">Salary Range</p>
              <p className="text-sm font-semibold text-text-main dark:text-white">{application.salary_range || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-text-secondary">Created</p>
              <p className="text-sm font-semibold text-text-main dark:text-white">{formatDate(application.created_at)}</p>
            </div>
            {application.interview_date && (
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 border border-gray-200 dark:border-gray-800">
                <p className="text-xs uppercase text-text-secondary font-semibold mb-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">calendar_month</span>
                  Interview Date
                </p>
                <p className="text-sm font-semibold text-text-main dark:text-white">{formatDate(application.interview_date)}</p>
              </div>
            )}
            {application.recruiter_name && (
              <div>
                <p className="text-xs uppercase text-text-secondary">Recruiter Name</p>
                <p className="text-sm font-semibold text-text-main dark:text-white">{application.recruiter_name}</p>
              </div>
            )}
            {application.recruiter_email && (
              <div>
                <p className="text-xs uppercase text-text-secondary">Recruiter Email</p>
                <a href={`mailto:${application.recruiter_email}`} className="text-sm font-semibold text-primary hover:underline">
                  {application.recruiter_email}
                </a>
              </div>
            )}
            {application.recruiter_phone && (
              <div>
                <p className="text-xs uppercase text-text-secondary">Recruiter Phone</p>
                <a href={`tel:${application.recruiter_phone}`} className="text-sm font-semibold text-primary hover:underline">
                  {application.recruiter_phone}
                </a>
              </div>
            )}
          </div>
          {application.job_description && (
            <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-bold text-text-main dark:text-white mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined">description</span>
                Job Description
              </h3>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 sm:p-6 text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">
                {application.job_description}
              </div>
            </div>
          )}
          {application.resume && (
            <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-bold text-text-main dark:text-white mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined">description</span>
                Attached Resume
              </h3>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
                <p className="text-sm font-semibold text-text-main dark:text-white">{application.resume.title}</p>
                <p className="text-xs text-text-secondary mt-1">{application.resume.file_name}</p>
                {application.resume.is_primary && (
                  <span className="inline-block mt-2 px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs rounded font-semibold">
                    Primary
                  </span>
                )}
              </div>
            </div>
          )}
          <div className="mt-6">
            <h3 className="text-lg font-bold text-text-main dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined">notes</span>
              Notes
            </h3>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 sm:p-6 text-sm text-text-secondary mt-4">
              {application.notes || <span className="italic text-text-secondary/70">No notes added yet.</span>}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-card-dark rounded-2xl shadow-card border border-gray-200 dark:border-gray-800 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-bold text-text-main dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined">history</span>
              Activity Timeline
            </h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEmailParserOpen(true)}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary-dark transition"
              >
                <span className="material-symbols-outlined text-[16px]">mail</span>
                Log Email
              </button>
              <button
                type="button"
                onClick={fetchEvents}
                disabled={eventsLoading}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span className={`material-symbols-outlined text-[16px] ${eventsLoading ? 'animate-spin' : ''}`}>
                  refresh
                </span>
                <span className="hidden sm:inline">{eventsLoading ? 'Refreshing...' : 'Refresh'}</span>
              </button>
            </div>
          </div>
          {eventsError && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-100 dark:border-red-800 rounded-lg px-4 py-3 text-xs mb-4">
              {eventsError}
            </div>
          )}
          <EventTimeline 
            events={events} 
            applicationId={application.id}
            onEventUpdated={fetchEvents}
          />
        </div>
      </section>

        {/* Email Parser Modal */}
        {isEmailParserOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <EmailParser
              applicationId={application.id}
              onEventCreated={handleEventCreated}
              onClose={() => setIsEmailParserOpen(false)}
            />
          </div>
        )}

        {isEditOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 flex flex-col">
              <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                <div>
                  <h3 className="text-lg font-bold text-text-main dark:text-white">Edit Application</h3>
                  <p className="text-sm text-text-secondary">Update details for this role.</p>
                </div>
                <button
                  className="text-text-secondary hover:text-text-main"
                  onClick={closeEditModal}
                  type="button"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form className="px-4 sm:px-6 py-5 space-y-6 overflow-y-auto" onSubmit={handleSubmit(onUpdateSubmit)}>
                <div>
                  <h4 className="text-sm font-bold text-text-main dark:text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">info</span>
                    Required Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-text-main dark:text-white">Company *</label>
                      <input
                        {...register('company')}
                        className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/40 focus:border-transparent transition"
                        type="text"
                      />
                      {errors.company && <p className="text-xs text-red-500 mt-1">{errors.company.message}</p>}
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-text-main dark:text-white">Job Title *</label>
                      <input
                        {...register('job_title')}
                        className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/40 focus:border-transparent transition"
                        type="text"
                      />
                      {errors.job_title && <p className="text-xs text-red-500 mt-1">{errors.job_title.message}</p>}
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-text-main dark:text-white">Status</label>
                      <select
                        {...register('status')}
                        className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/40 focus:border-transparent transition"
                      >
                        <option value="saved">Saved</option>
                        <option value="applied">Applied</option>
                        <option value="interview">Interview</option>
                        <option value="offer">Offer</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-text-main dark:text-white">Location</label>
                      <input
                        {...register('location')}
                        className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/40 focus:border-transparent transition"
                        type="text"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
                  <h4 className="text-sm font-bold text-text-main dark:text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">description</span>
                    Job Details
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-semibold text-text-main dark:text-white">Job URL</label>
                      <input
                        {...register('job_url')}
                        className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/40 focus:border-transparent transition"
                        type="url"
                      />
                      {errors.job_url && <p className="text-xs text-red-500 mt-1">{errors.job_url.message}</p>}
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-text-main dark:text-white">Salary Range</label>
                      <input
                        {...register('salary_range')}
                        className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/40 focus:border-transparent transition"
                        type="text"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-text-main dark:text-white">Job Description</label>
                      <textarea
                        {...register('job_description')}
                        className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/40 focus:border-transparent transition min-h-[100px]"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
                  <h4 className="text-sm font-bold text-text-main dark:text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">calendar_month</span>
                    Timeline
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-text-main dark:text-white">Applied Date</label>
                      <input
                        {...register('applied_at')}
                        className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/40 focus:border-transparent transition"
                        type="date"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-text-main dark:text-white">Interview Date</label>
                      <input
                        {...register('interview_date')}
                        className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/40 focus:border-transparent transition"
                        type="date"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-text-main dark:text-white">Follow-up Date</label>
                      <input
                        {...register('follow_up_date')}
                        className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/40 focus:border-transparent transition"
                        type="date"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
                  <h4 className="text-sm font-bold text-text-main dark:text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">person</span>
                    Recruiter Contact
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-text-main dark:text-white">Recruiter Name</label>
                      <input
                        {...register('recruiter_name')}
                        className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/40 focus:border-transparent transition"
                        type="text"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-text-main dark:text-white">Recruiter Email</label>
                      <input
                        {...register('recruiter_email')}
                        className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/40 focus:border-transparent transition"
                        type="email"
                      />
                      {errors.recruiter_email && <p className="text-xs text-red-500 mt-1">{errors.recruiter_email.message}</p>}
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-text-main dark:text-white">Recruiter Phone</label>
                      <input
                        {...register('recruiter_phone')}
                        className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/40 focus:border-transparent transition"
                        type="tel"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
                  <h4 className="text-sm font-bold text-text-main dark:text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">description</span>
                    Select Resume
                  </h4>
                  <Controller
                    name="resume_id"
                    control={control}
                    render={({ field }) => (
                      <ResumePicker
                        value={field.value ?? undefined}
                        onChange={(resumeId) => field.onChange(resumeId)}
                        label=""
                      />
                    )}
                  />
                </div>

                <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
                  <label className="text-sm font-bold text-text-main dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">notes</span>
                    Additional Notes
                  </label>
                  <textarea
                    {...register('notes')}
                    className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/40 focus:border-transparent transition min-h-[120px]"
                  />
                </div>

                {formError && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg px-4 py-3">
                    <p className="text-xs text-red-700 dark:text-red-300">{formError}</p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-text-secondary hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-lg shadow-primary/30 hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isDeleteOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800">
              <div className="px-6 py-5">
                <h3 className="text-lg font-bold text-text-main dark:text-white">Delete application?</h3>
                <p className="text-sm text-text-secondary mt-2">
                  This action cannot be undone. The application and its timeline will be permanently removed.
                </p>

                {formError && <p className="text-xs text-red-500 mt-3">{formError}</p>}

                <div className="flex items-center justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={closeDeleteModal}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-text-secondary hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="px-5 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </AuthGate>
    </AppShell>
  )
}

export default ApplicationDetailPage
