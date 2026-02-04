'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { authService } from '@/services/authService'

const passwordRules = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[0-9]/, 'Password must include at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must include a special character')

const requestSchema = z.object({
  email: z.string().email('Enter a valid email'),
})

const resetSchema = z.object({
  code: z
    .string()
    .min(6, 'Enter the 6-digit code')
    .max(6, 'Enter the 6-digit code')
    .regex(/^[0-9]{6}$/, 'Enter the 6-digit code'),
  newPassword: passwordRules,
})

type RequestForm = z.infer<typeof requestSchema>
type ResetForm = z.infer<typeof resetSchema>

const ResetPage = () => {
  const [step, setStep] = useState<'request' | 'reset'>('request')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const requestForm = useForm<RequestForm>({
    resolver: zodResolver(requestSchema),
  })

  const resetForm = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
  })

  useEffect(() => {
    const pendingEmail = sessionStorage.getItem('pending_reset_email')
    if (pendingEmail) {
      setEmail(pendingEmail)
      setStep('reset')
    }
  }, [])

  const handleRequest = async (data: RequestForm) => {
    setError(null)
    setMessage(null)
    setIsSubmitting(true)
    try {
      await authService.requestPasswordReset({ email: data.email.toLowerCase().trim() })
      sessionStorage.setItem('pending_reset_email', data.email.toLowerCase().trim())
      setEmail(data.email.toLowerCase().trim())
      setStep('reset')
      setMessage('If the account exists, a reset code was sent.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send reset code')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = async (data: ResetForm) => {
    setError(null)
    setMessage(null)
    setIsSubmitting(true)
    try {
      await authService.resetPassword({
        email,
        code: data.code,
        new_password: data.newPassword,
      })
      setMessage('Password updated. You can now sign in.')
      sessionStorage.removeItem('pending_reset_email')
      setStep('request')
      resetForm.reset()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reset password')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-card-light dark:bg-card-dark rounded-2xl shadow-card border border-gray-100 dark:border-gray-800 p-8">
        <div className="flex items-center justify-center mb-6">
          <div className="bg-primary/10 text-primary p-3 rounded-2xl">
            <span className="material-symbols-outlined text-3xl">lock_reset</span>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center text-text-main dark:text-white">Reset password</h1>
        <p className="text-sm text-center text-text-secondary mt-2">
          {step === 'request'
            ? 'Enter your email and we will send a reset code.'
            : 'Enter the code from your email and choose a new password.'}
        </p>

        {message && <p className="text-xs text-green-600 text-center mt-4">{message}</p>}
        {error && <p className="text-xs text-red-500 text-center mt-4">{error}</p>}

        {step === 'request' ? (
          <form className="mt-6 space-y-4" onSubmit={requestForm.handleSubmit(handleRequest)}>
            <div>
              <label className="text-sm font-semibold text-text-main dark:text-white">Email</label>
              <input
                {...requestForm.register('email')}
                className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/40 focus:border-transparent transition"
                type="email"
                placeholder="you@example.com"
              />
              {requestForm.formState.errors.email && (
                <p className="text-xs text-red-500 mt-1">{requestForm.formState.errors.email.message}</p>
              )}
            </div>
            <button
              type="submit"
              className="w-full bg-primary hover:opacity-90 text-white font-bold py-3 rounded-xl shadow-lg shadow-primary/30 transition-all active:scale-95 disabled:opacity-70"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending...' : 'Send reset code'}
            </button>
          </form>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={resetForm.handleSubmit(handleReset)}>
            <div>
              <label className="text-sm font-semibold text-text-main dark:text-white">Reset code</label>
              <input
                {...resetForm.register('code')}
                className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm tracking-[0.3em] text-center focus:ring-2 focus:ring-primary/40 focus:border-transparent transition"
                type="text"
                placeholder="123456"
                maxLength={6}
              />
              {resetForm.formState.errors.code && (
                <p className="text-xs text-red-500 mt-1">{resetForm.formState.errors.code.message}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-semibold text-text-main dark:text-white">New password</label>
              <input
                {...resetForm.register('newPassword')}
                className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/40 focus:border-transparent transition"
                type="password"
                placeholder="At least 8 characters"
              />
              {resetForm.formState.errors.newPassword && (
                <p className="text-xs text-red-500 mt-1">{resetForm.formState.errors.newPassword.message}</p>
              )}
            </div>
            <button
              type="submit"
              className="w-full bg-primary hover:opacity-90 text-white font-bold py-3 rounded-xl shadow-lg shadow-primary/30 transition-all active:scale-95 disabled:opacity-70"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating...' : 'Update password'}
            </button>
          </form>
        )}

        <div className="text-sm text-center text-text-secondary mt-6">
          Remembered your password?{' '}
          <Link href="/Login" className="text-primary font-semibold hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ResetPage
