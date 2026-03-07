import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, BookOpen, Hash, AlignLeft, CalendarDays } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useCourse } from '@/hooks/useCourses'

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className="p-1.5 bg-gray-50 rounded-md flex-shrink-0 mt-0.5">
        <Icon className="h-4 w-4 text-gray-400" />
      </div>
      <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm text-gray-900 mt-0.5">{value || <span className="text-gray-300 italic">Not provided</span>}</p>
      </div>
    </div>
  )
}

export default function CourseDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data, isPending, isError } = useCourse(id)
  const course = data?.data

  if (isPending) {
    return (
      <div className="flex justify-center items-center py-32">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (isError || !course) {
    return (
      <div className="py-24 text-center">
        <p className="text-gray-500 mb-4">Course not found.</p>
        <Button variant="outline" onClick={() => navigate('/courses')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Courses
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Back */}
      <button
        onClick={() => navigate('/courses')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Courses
      </button>

      {/* Header card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-purple-50 rounded-xl flex-shrink-0">
              <BookOpen className="h-7 w-7 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl font-bold text-gray-900">{course.course_name}</h2>
                <Badge variant="default" className="font-mono">{course.course_code}</Badge>
              </div>
              {course.description && (
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">{course.description}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Course Details</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <InfoRow icon={Hash}         label="Course Code"  value={course.course_code} />
          <InfoRow icon={BookOpen}     label="Course Name"  value={course.course_name} />
          <InfoRow icon={AlignLeft}    label="Description"  value={course.description} />
          <InfoRow
            icon={CalendarDays}
            label="Date Added"
            value={new Date(course.created_at).toLocaleDateString('en-US', {
              year: 'numeric', month: 'long', day: 'numeric',
            })}
          />
        </CardContent>
      </Card>
    </div>
  )
}
