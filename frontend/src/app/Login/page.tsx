'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { authService } from '@/services/authService'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof loginSchema>

const Login = () => {
  const router = useRouter()
  const [apiError, setApiError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setApiError(null)
    setIsSubmitting(true)
    try {
      await authService.login({
        email: data.email.trim().toLowerCase(),
        password: data.password,
      })
      router.replace('/Dashboard')
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
        <h1 className="text-2xl font-bold text-center text-text-main dark:text-white">Sign in</h1>
        <p className="text-sm text-center text-text-secondary mt-2">
          Access your dashboard and continue your search.
        </p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="text-sm font-semibold text-text-main dark:text-white">Email</label>
            <input
              {...register('email')}
              className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/40 focus:border-transparent transition"
              type="email"
              placeholder="you@example.com"
            />
            {errors.email && (
              <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-semibold text-text-main dark:text-white">Password</label>
            <input
              {...register('password')}
              className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/40 focus:border-transparent transition"
              type="password"
              placeholder="At least 8 characters"
            />
            {errors.password && (
              <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
            )}
          </div>
          <div className="flex justify-end">
            <Link href="/Reset" className="text-xs font-semibold text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <button
            type="submit"
            className="w-full bg-primary hover:opacity-90 text-white font-bold py-3 rounded-xl shadow-lg shadow-primary/30 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        {apiError && (
          <p className="text-xs text-red-500 text-center mt-4">{apiError}</p>
        )}
        <p className="text-sm text-center text-text-secondary mt-6">
          New here?{' '}
          <Link href="/Register" className="text-primary font-semibold hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Login

