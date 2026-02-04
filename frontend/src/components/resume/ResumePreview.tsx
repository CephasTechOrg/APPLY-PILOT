'use client'

import React, { useEffect, useRef, useState } from 'react'

interface ResumePreviewProps {
  html: string | null
  isLoading?: boolean
  error?: string | null
  scale?: number
}

const ResumePreview: React.FC<ResumePreviewProps> = ({
  html,
  isLoading = false,
  error = null,
  scale = 0.75,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [iframeHeight, setIframeHeight] = useState(800)

  useEffect(() => {
    if (html && iframeRef.current) {
      const iframe = iframeRef.current
      const doc = iframe.contentDocument || iframe.contentWindow?.document
      if (doc) {
        doc.open()
        doc.write(html)
        doc.close()
        
        // Adjust iframe height based on content
        setTimeout(() => {
          const body = doc.body
          if (body) {
            setIframeHeight(Math.max(body.scrollHeight / scale, 800))
          }
        }, 100)
      }
    }
  }, [html, scale])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-gray-50 dark:bg-gray-900 rounded-xl">
        <span className="material-symbols-outlined animate-spin text-3xl text-primary mb-3">refresh</span>
        <p className="text-sm text-text-secondary">Generating preview...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-red-50 dark:bg-red-900/20 rounded-xl p-6">
        <span className="material-symbols-outlined text-3xl text-red-500 mb-3">error</span>
        <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
      </div>
    )
  }

  if (!html) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-gray-50 dark:bg-gray-900 rounded-xl">
        <span className="material-symbols-outlined text-5xl text-gray-300 dark:text-gray-700 mb-3">description</span>
        <p className="text-sm text-text-secondary">Select a template to preview</p>
      </div>
    )
  }

  return (
    <div className="relative bg-gray-100 dark:bg-gray-900 rounded-xl overflow-hidden">
      {/* Paper shadow effect */}
      <div className="absolute inset-4 bg-white shadow-2xl rounded-lg" />
      
      {/* Iframe container with scaling */}
      <div 
        className="relative p-4 overflow-auto"
        style={{ maxHeight: '80vh' }}
      >
        <div
          className="origin-top-left bg-white rounded-lg overflow-hidden shadow-lg"
          style={{
            transform: `scale(${scale})`,
            width: `${100 / scale}%`,
            height: iframeHeight,
          }}
        >
          <iframe
            ref={iframeRef}
            title="Resume Preview"
            className="w-full h-full border-0"
            sandbox="allow-same-origin"
          />
        </div>
      </div>

      {/* Zoom indicator */}
      <div className="absolute bottom-4 right-4 px-2 py-1 bg-black/50 text-white text-xs rounded-full">
        {Math.round(scale * 100)}%
      </div>
    </div>
  )
}

export default ResumePreview
