import { Outlet } from 'react-router-dom'

// Temporary scaffold — replaced in Phase 3 with magic-mcp generated layout
export default function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Outlet />
    </div>
  )
}
