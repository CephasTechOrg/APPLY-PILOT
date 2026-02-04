'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { authService } from '@/services/authService'

const passwordRules = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[0-9]/, 'Password must include at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must include a special character')

const signupSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Enter a valid email'),
  password: passwordRules,
  dob: z.string().refine((value) => {
    if (!value) {
      return false
    }
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      return false
    }
    const today = new Date()
    return date <= today
  }, 'Enter a valid date of birth'),
})

type SignupForm = z.infer<typeof signupSchema>

const Register = () => {
  const router = useRouter()
  const [apiError, setApiError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  })

  const onSubmit = async (data: SignupForm) => {
    setApiError(null)
    setIsSubmitting(true)
    try {
      const fullName = `${data.firstName.trim()} ${data.lastName.trim()}`.trim()
      const pendingEmail = data.email.trim().toLowerCase()
      await authService.register({
        first_name: data.firstName.trim(),
        last_name: data.lastName.trim(),
        email: pendingEmail,
        password: data.password,
        date_of_birth: data.dob,
      })

      sessionStorage.setItem(
        'pending_user',
        JSON.stringify({
          fullName,
          email: pendingEmail,
        })
      )
      router.push('/Verify')
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Network error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-card-light dark:bg-card-dark rounded-2xl shadow-card border border-gray-100 dark:border-gray-800 p-8">
        <div className="flex items-center justify-center mb-6">
          <div className="bg-primary/10 text-primary p-3 rounded-2xl">
            <span className="material-symbols-outlined text-3xl">auto_awesome</span>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center text-text-main dark:text-white">Create your account</h1>
        <p className="text-sm text-center text-text-secondary mt-2">
          Start tracking applications and tailoring resumes with AI.
        </p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="text-sm font-semibold text-text-main dark:text-white">First name</label>
            <input
              {...register('firstName')}
              className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/40 focus:border-transparent transition"
              type="text"
              placeholder="Alex"
            />
            {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName.message}</p>}
          </div>
          <div>
            <label className="text-sm font-semibold text-text-main dark:text-white">Last name</label>
            <input
              {...register('lastName')}
              className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/40 focus:border-transparent transition"
              type="text"
              placeholder="Rivera"
            />
            {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName.message}</p>}
          </div>
          <div>
            <label className="text-sm font-semibold text-text-main dark:text-white">Email</label>
            <input
              {...register('email')}
              className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/40 focus:border-transparent transition"
              type="email"
              placeholder="you@example.com"
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="text-sm font-semibold text-text-main dark:text-white">Password</label>
            <input
              {...register('password')}
              className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/40 focus:border-transparent transition"
              type="password"
              placeholder="Create a secure password"
            />
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
          </div>
          <div>
            <label className="text-sm font-semibold text-text-main dark:text-white">Date of birth</label>
            <input
              {...register('dob')}
              className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/40 focus:border-transparent transition"
              type="date"
            />
            {errors.dob && <p className="text-xs text-red-500 mt-1">{errors.dob.message}</p>}
          </div>
          <button
            type="submit"
            className="w-full bg-primary hover:opacity-90 text-white font-bold py-3 rounded-xl shadow-lg shadow-primary/30 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Sending code...' : 'Continue to verification'}
          </button>
        </form>
        {apiError && (
          <p className="text-xs text-red-500 text-center mt-4">{apiError}</p>
        )}
        <p className="text-sm text-center text-text-secondary mt-6">
          Already have an account?{' '}
          <Link href="/Login" className="text-primary font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Register

