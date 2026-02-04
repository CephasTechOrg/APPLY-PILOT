import React from 'react'

interface PipelineChartProps {
  data: {
    saved: number
    applied: number
    interview: number
    offer: number
    rejected: number
  }
}

const PipelineChart: React.FC<PipelineChartProps> = ({ data }) => {
  const stages = [
    { key: 'saved', label: 'Saved', color: 'bg-gray-400' },
    { key: 'applied', label: 'Applied', color: 'bg-blue-500' },
    { key: 'interview', label: 'Interview', color: 'bg-purple-500' },
    { key: 'offer', label: 'Offer', color: 'bg-green-500' },
    { key: 'rejected', label: 'Rejected', color: 'bg-red-400' },
  ]

  const total = Object.values(data).reduce((sum, value) => sum + value, 0)
  const maxValue = Math.max(...Object.values(data), 1)

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-center">
        <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full mb-3">
          <span className="material-symbols-outlined text-2xl text-text-secondary">bar_chart</span>
        </div>
        <p className="text-sm text-text-secondary font-medium">No pipeline data yet</p>
        <p className="text-xs text-text-secondary mt-1">
          Add applications to start tracking your pipeline
        </p>
      </div>
    )
  }

  return (
    <div className="flex items-end justify-between gap-4 h-48">
      {stages.map((stage) => {
        const value = data[stage.key as keyof typeof data]
        const height = (value / maxValue) * 100
        const percentage = total > 0 ? Math.round((value / total) * 100) : 0
        return (
          <div key={stage.key} className="flex flex-col items-center flex-1 gap-2">
            <span className="text-sm font-bold text-text-main dark:text-white">{value}</span>
            <div
              className="w-full bg-gray-100 dark:bg-gray-700 rounded-t-lg relative"
              style={{ height: '140px' }}
            >
              <div 
                className={`${stage.color} absolute bottom-0 w-full rounded-t-lg transition-all duration-500`}
                style={{ height: `${height}%` }}
                aria-label={`${stage.label}: ${value} (${percentage}%)`}
                title={`${stage.label}: ${value} (${percentage}%)`}
              />
            </div>
            <span className="text-xs text-text-secondary font-medium text-center">{stage.label}</span>
            <span className="text-[10px] text-text-secondary/70">{percentage}%</span>
          </div>
        )
      })}
    </div>
  )
}

export default PipelineChart
