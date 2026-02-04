import React from 'react'

interface StatCardProps {
  title: string
  value: string | number
  icon: string
  iconColor: string
  trend?: string
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, iconColor, trend }) => {
  return (
    <div className="bg-card-light dark:bg-card-dark p-5 rounded-2xl shadow-card border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className={`p-2 ${iconColor} rounded-lg`}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        {trend && (
          <span className="flex items-center text-[10px] font-semibold text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">
            {trend}
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-text-secondary text-sm font-medium">{title}</p>
        <h3 className="text-3xl font-bold text-text-main dark:text-white tracking-tight mt-1">{value}</h3>
      </div>
    </div>
  )
}

export default StatCard