import React from 'react'

interface SkeletonProps {
  className?: string
}

export const Skeleton = ({ className = '' }: SkeletonProps) => (
  <div className={`skeleton rounded ${className}`} />
)

export const SkeletonText = ({ lines = 3, className = '' }: { lines?: number; className?: string }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
      />
    ))}
  </div>
)

export const SkeletonCard = ({ className = '' }: { className?: string }) => (
  <div className={`bg-card-light dark:bg-card-dark rounded-2xl p-6 border border-gray-100 dark:border-gray-800 ${className}`}>
    <div className="flex items-start gap-4">
      <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
      <div className="flex-1">
        <Skeleton className="h-5 w-1/2 mb-2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
    <div className="mt-4">
      <SkeletonText lines={2} />
    </div>
    <div className="mt-4 flex gap-3">
      <Skeleton className="h-8 w-20 rounded-lg" />
      <Skeleton className="h-8 w-20 rounded-lg" />
    </div>
  </div>
)

export const SkeletonTable = ({ rows = 5 }: { rows?: number }) => (
  <div className="space-y-3">
    {/* Header */}
    <div className="flex gap-4 py-2">
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-4 w-1/4" />
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-4 py-3 border-t border-gray-100 dark:border-gray-800">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
      </div>
    ))}
  </div>
)

export const SkeletonStats = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="bg-card-light dark:bg-card-dark rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Skeleton className="h-3 w-24 mb-3" />
            <Skeleton className="h-8 w-16" />
          </div>
          <Skeleton className="w-10 h-10 rounded-xl" />
        </div>
      </div>
    ))}
  </div>
)

export default Skeleton
