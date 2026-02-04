import React from 'react'
import AppShell from '@/components/layout/AppShell'
import DashboardView from '@/components/dashboard/DashboardView'
import AuthGate from '@/components/auth/AuthGate'

const DashboardPage = () => {
  return (
    <AppShell title="Dashboard" subtitle="Overview & follow-ups">
      <AuthGate>
        <DashboardView />
      </AuthGate>
    </AppShell>
  )
}

export default DashboardPage

