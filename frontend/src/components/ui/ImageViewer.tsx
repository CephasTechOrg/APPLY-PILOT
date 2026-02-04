'use client'

import React from 'react'

interface ImageViewerProps {
  isOpen: boolean
  imageUrl: string
  alt: string
  onClose: () => void
}

const ImageViewer = ({ isOpen, imageUrl, alt, onClose }: ImageViewerProps) => {
  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
        aria-label="Close image viewer"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="relative max-w-2xl w-full max-h-[90vh] flex flex-col">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors z-50"
            aria-label="Close image viewer"
            type="button"
          >
            <span className="material-symbols-outlined text-3xl">close</span>
          </button>

          {/* Image container */}
          <div className="bg-card-light dark:bg-card-dark rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center">
            <img
              src={imageUrl}
              alt={alt}
              className="max-w-full max-h-[80vh] object-contain"
            />
          </div>
        </div>
      </div>
    </>
  )
}

export default ImageViewer
