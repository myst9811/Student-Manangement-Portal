import { useNavigate } from 'react-router-dom'
import { Users, UserCheck, UserX, BookOpen, ArrowRight, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useStudentsList } from '@/hooks/useStudents'
import { useCoursesList } from '@/hooks/useCourses'

function StatCard({ icon: Icon, iconBg, iconColor, label, value, sub, loading }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
            <p className="text-3xl font-bold text-gray-900">
              {loading ? (
                <span className="inline-block w-12 h-8 bg-gray-100 rounded animate-pulse" />
              ) : (
                value ?? '—'
              )}
            </p>
            {sub && (
              <p className="text-xs text-gray-400 mt-1">{sub}</p>
            )}
          </div>
          <div className={`p-3 rounded-xl ${iconBg}`}>
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function QuickAction({ icon: Icon, label, description, to, variant = 'default' }) {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => navigate(to)}
      className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm transition-all text-left group"
    >
      <div className="p-2.5 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors flex-shrink-0">
        <Icon className="h-5 w-5 text-blue-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
    </button>
  )
}

export default function DashboardPage() {
  const activeQuery    = useStudentsList({ page: 1, page_size: 1 })
  const allQuery       = useStudentsList({ page: 1, page_size: 1, include_inactive: true })
  const coursesQuery   = useCoursesList({ page: 1, page_size: 1 })

  const activeTotal   = activeQuery.data?.meta?.total
  const allTotal      = allQuery.data?.meta?.total
  const inactiveTotal = allTotal != null && activeTotal != null ? allTotal - activeTotal : undefined
  const coursesTotal  = coursesQuery.data?.meta?.total

  const loading = activeQuery.isPending || allQuery.isPending || coursesQuery.isPending

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Overview</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Live summary of your school's data
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-200 rounded-full px-3 py-1.5">
          <TrendingUp className="h-3.5 w-3.5" />
          <span className="font-medium">Live data</span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          label="Total Students"
          value={allTotal}
          sub="All records including inactive"
          loading={loading}
        />
        <StatCard
          icon={UserCheck}
          iconBg="bg-green-50"
          iconColor="text-green-600"
          label="Active Students"
          value={activeTotal}
          sub="Currently enrolled"
          loading={loading}
        />
        <StatCard
          icon={UserX}
          iconBg="bg-red-50"
          iconColor="text-red-500"
          label="Inactive Students"
          value={inactiveTotal}
          sub="Deactivated records"
          loading={loading}
        />
        <StatCard
          icon={BookOpen}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
          label="Total Courses"
          value={coursesTotal}
          sub="Available course catalogue"
          loading={loading}
        />
      </div>

      {/* Quick actions */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <QuickAction
            icon={Users}
            label="Manage Students"
            description="View, add, edit, or deactivate student records"
            to="/students"
          />
          <QuickAction
            icon={BookOpen}
            label="Manage Courses"
            description="View and add courses to the catalogue"
            to="/courses"
          />
        </div>
      </div>
    </div>
  )
}
