'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { authService } from '@/services/authService'

const verificationSchema = z.object({
  code: z
    .string()
    .min(6, 'Enter the 6-digit code')
    .max(6, 'Enter the 6-digit code')
    .regex(/^[0-9]{6}$/, 'Enter the 6-digit code'),
})

type VerificationForm = z.infer<typeof verificationSchema>

const VerifyPage = () => {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  const [fullName, setFullName] = useState<string | null>(null)
  const [pendingUser, setPendingUser] = useState<Record<string, string> | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VerificationForm>({
    resolver: zodResolver(verificationSchema),
  })

  useEffect(() => {
    const stored = sessionStorage.getItem('pending_user')
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Record<string, string>
        setPendingUser(parsed)
        setEmail(parsed.email ?? null)
        setFullName(parsed.fullName ?? null)
        return
      } catch {
        // ignore parsing errors
      }
    }

    const pendingEmail = sessionStorage.getItem('pending_email')
    if (pendingEmail) {
      setPendingUser({ email: pendingEmail })
      setEmail(pendingEmail)
    }
  }, [])

  const onSubmit = async (data: VerificationForm) => {
    if (!pendingUser?.email) {
      return
    }
    setApiError(null)
    setIsSubmitting(true)
    try {
      await authService.verifyEmail({ email: pendingUser.email, code: data.code })
      sessionStorage.removeItem('pending_user')
      router.replace('/Dashboard')
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Network error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resendCode = async () => {
    if (!pendingUser?.email) {
      return
    }
    setApiError(null)
    setIsResending(true)
    try {
      await authService.resendVerification(pendingUser.email)
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Network error. Please try again.')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-card-light dark:bg-card-dark rounded-2xl shadow-card border border-gray-100 dark:border-gray-800 p-8">
        <div className="flex items-center justify-center mb-6">
          <div className="bg-primary/10 text-primary p-3 rounded-2xl">
            <span className="material-symbols-outlined text-3xl">mark_email_read</span>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center text-text-main dark:text-white">Verify your email</h1>
        <p className="text-sm text-center text-text-secondary mt-2">
          {email ? `We sent a 6-digit code to ${email}.` : 'Enter the verification code sent to your email.'}
        </p>
        {fullName && (
          <p className="text-xs text-center text-text-secondary mt-1">Account for {fullName}</p>
        )}

        {pendingUser ? (
          <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="text-sm font-semibold text-text-main dark:text-white">Verification code</label>
              <input
                {...register('code')}
                className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm tracking-[0.3em] text-center focus:ring-2 focus:ring-primary/40 focus:border-transparent transition"
                type="text"
                placeholder="123456"
                maxLength={6}
              />
              {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code.message}</p>}
            </div>
            <button
              type="submit"
              className="w-full bg-primary hover:opacity-90 text-white font-bold py-3 rounded-xl shadow-lg shadow-primary/30 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Verifying...' : 'Verify and continue'}
            </button>
          </form>
        ) : (
          <div className="mt-6 text-center text-sm text-text-secondary">
            No pending signup found.{' '}
            <Link href="/Login" className="text-primary font-semibold hover:underline">
              Start again
            </Link>
          </div>
        )}

        {apiError && (
          <p className="text-xs text-red-500 text-center mt-4">{apiError}</p>
        )}

        <div className="text-center mt-6 text-sm text-text-secondary">
          Didn’t get a code?{' '}
          <button
            className="text-primary font-semibold hover:underline disabled:opacity-70"
            type="button"
            onClick={resendCode}
            disabled={isResending || !pendingUser?.email}
          >
            {isResending ? 'Resending...' : 'Resend'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default VerifyPage
