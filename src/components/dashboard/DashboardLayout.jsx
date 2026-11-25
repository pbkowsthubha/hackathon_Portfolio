import { useState } from 'react'
import Sidebar from './Sidebar'
import DashboardHeader from './DashboardHeader'
import './DashboardLayout.css'

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="dashboard-layout-root">
      {/* Sidebar Component */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Workspace Frame */}
      <div className="dashboard-content-area">
        <DashboardHeader onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
        <div className="dashboard-view-wrapper">{children}</div>
      </div>
    </div>
  )
}
