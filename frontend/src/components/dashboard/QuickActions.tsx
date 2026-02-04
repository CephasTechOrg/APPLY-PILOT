import React from 'react'
import Link from 'next/link'

interface QuickAction {
  id: string
  label: string
  icon: string
  color: string
  description: string
  href: string
}

const QuickActions: React.FC = () => {
  const actions: QuickAction[] = [
    { 
      id: '1', 
      label: 'Tailor Resume', 
      icon: 'auto_awesome', 
      color: 'bg-primary text-white',
      description: 'AI-powered resume customization',
      href: '/AITools/tailor-resume'
    },
    { 
      id: '2', 
      label: 'Add Application', 
      icon: 'add_circle', 
      color: 'bg-blue-500 text-white',
      description: 'Track a new job application',
      href: '/Applications'
    },
    { 
      id: '3', 
      label: 'Upload Resume', 
      icon: 'upload_file', 
      color: 'bg-green-500 text-white',
      description: 'Add a new resume version',
      href: '/Resumes/upload'
    },
    { 
      id: '4', 
      label: 'Generate Cover Letter', 
      icon: 'edit_note', 
      color: 'bg-purple-500 text-white',
      description: 'AI-generated cover letters',
      href: '/AITools/cover-letter'
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3">
      {actions.map((action) => (
        <Link
          key={action.id}
          href={action.href}
          className="flex flex-col items-center gap-2 p-4 min-h-[132px] bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <div className={`p-3 rounded-xl ${action.color} group-hover:scale-110 transition-transform`}>
            <span className="material-symbols-outlined">{action.icon}</span>
          </div>
          <span className="text-sm font-semibold text-text-main dark:text-white text-center">{action.label}</span>
          <span className="text-xs text-text-secondary text-center hidden sm:block">{action.description}</span>
        </Link>
      ))}
    </div>
  )
}

export default QuickActions
