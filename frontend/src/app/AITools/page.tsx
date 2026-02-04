import React from 'react'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'

const tools = [
  {
    id: '1',
    title: 'Tailor Resume',
    description: 'Match your resume to a job description.',
    icon: 'auto_awesome',
    href: '/AITools/tailor-resume',
    color: 'bg-primary/10 text-primary',
  },
  {
    id: '2',
    title: 'Generate Cover Letter',
    description: 'Create a personalized cover letter in seconds.',
    icon: 'edit_note',
    href: '/AITools/cover-letter',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    id: '3',
    title: 'ATS Checklist',
    description: 'Identify missing keywords for better matches.',
    icon: 'fact_check',
    href: '/AITools/ats-checklist',
    color: 'bg-green-50 text-green-600',
  },
]

const AIToolsPage = () => {
  return (
    <AppShell title="AI Tools" subtitle="Automate resume tailoring and content" showSearch={false} showActions={false}>
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tools.map((tool) => (
          <Link
            key={tool.id}
            href={tool.href}
            className="bg-card-light dark:bg-card-dark rounded-2xl shadow-card border border-gray-100 dark:border-gray-800 p-6 hover:shadow-md transition-shadow"
          >
            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${tool.color}`}>
              <span className="material-symbols-outlined text-2xl">{tool.icon}</span>
            </div>
            <h3 className="text-lg font-bold text-text-main dark:text-white mt-4">{tool.title}</h3>
            <p className="text-sm text-text-secondary mt-2">{tool.description}</p>
          </Link>
        ))}
      </section>
    </AppShell>
  )
}

export default AIToolsPage

