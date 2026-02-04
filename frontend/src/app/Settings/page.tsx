import React from 'react'
import AppShell from '@/components/layout/AppShell'

const SettingsPage = () => {
  return (
    <AppShell title="Settings" subtitle="Manage your profile and preferences" showSearch={false} showActions={false}>
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card-light dark:bg-card-dark rounded-2xl shadow-card border border-gray-100 dark:border-gray-800 p-6">
          <h3 className="text-lg font-bold text-text-main dark:text-white mb-4">Profile</h3>
          <form className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-text-main dark:text-white">Full name</label>
              <input
                className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/40"
                defaultValue="Alex Rivera"
                type="text"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-text-main dark:text-white">Email</label>
              <input
                className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/40"
                defaultValue="alex@example.com"
                type="email"
              />
            </div>
            <button className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/30">
              Save changes
            </button>
          </form>
        </div>

        <div className="bg-card-light dark:bg-card-dark rounded-2xl shadow-card border border-gray-100 dark:border-gray-800 p-6">
          <h3 className="text-lg font-bold text-text-main dark:text-white mb-4">Preferences</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-text-main dark:text-white">Email reminders</p>
                <p className="text-xs text-text-secondary">Get follow up reminders by email.</p>
              </div>
              <button className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                Enabled
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-text-main dark:text-white">AI suggestions</p>
                <p className="text-xs text-text-secondary">Show AI tips on application pages.</p>
              </div>
              <button className="px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-text-secondary text-xs font-semibold">
                Disabled
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-text-main dark:text-white">Weekly summary</p>
                <p className="text-xs text-text-secondary">Send weekly progress digest.</p>
              </div>
              <button className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                Enabled
              </button>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  )
}

export default SettingsPage

