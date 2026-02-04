'use client'

import React from 'react'
import { DesignTokens } from '@/services/templateService'

interface TokenSelectorProps {
  tokens: DesignTokens
  onChange: (tokens: DesignTokens) => void
}

const FONT_OPTIONS = [
  { value: 'Inter', label: 'Inter', style: 'font-sans' },
  { value: 'Roboto', label: 'Roboto', style: 'font-sans' },
  { value: 'Georgia', label: 'Georgia', style: 'font-serif' },
]

const SPACING_OPTIONS = [
  { value: 'compact', label: 'Compact', icon: 'density_small' },
  { value: 'comfortable', label: 'Comfortable', icon: 'density_medium' },
]

const COLOR_OPTIONS = [
  { value: 'neutral', label: 'Neutral', color: '#4a5568' },
  { value: 'blue', label: 'Blue', color: '#2563eb' },
  { value: 'green', label: 'Green', color: '#059669' },
]

const TokenSelector: React.FC<TokenSelectorProps> = ({ tokens, onChange }) => {
  const handleChange = (key: keyof DesignTokens, value: string) => {
    onChange({ ...tokens, [key]: value })
  }

  return (
    <div className="space-y-6">
      {/* Font Family */}
      <div>
        <label className="block text-sm font-semibold text-text-main dark:text-white mb-2">
          Font Family
        </label>
        <div className="grid grid-cols-3 gap-2">
          {FONT_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleChange('fontFamily', option.value)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                tokens.fontFamily === option.value
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-text-main dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700'
              } ${option.style}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Spacing */}
      <div>
        <label className="block text-sm font-semibold text-text-main dark:text-white mb-2">
          Spacing
        </label>
        <div className="grid grid-cols-2 gap-2">
          {SPACING_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleChange('spacing', option.value)}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                tokens.spacing === option.value
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-text-main dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{option.icon}</span>
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Accent Color */}
      <div>
        <label className="block text-sm font-semibold text-text-main dark:text-white mb-2">
          Accent Color
        </label>
        <div className="flex gap-3">
          {COLOR_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleChange('accentColor', option.value)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                tokens.accentColor === option.value
                  ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-gray-900'
                  : ''
              } bg-gray-100 dark:bg-gray-800 text-text-main dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700`}
            >
              <span
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: option.color }}
              />
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default TokenSelector
