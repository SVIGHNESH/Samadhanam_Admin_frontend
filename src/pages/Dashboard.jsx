import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { dashboardApi } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { AppLayout } from '@/components/layout/Layout'
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  Loader2,
  RefreshCw,
  AlertCircle
} from 'lucide-react'

function StatsCard({ title, value, icon: Icon, color, trend }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-x-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
            {trend && (
              <div className="flex items-center mt-1 text-sm text-green-600">
                <TrendingUp className="h-4 w-4 mr-1" />
                {trend}
              </div>
            )}
          </div>
          <div className={`p-3 rounded-full ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function MunicipalStats({ municipalities }) {
  if (!municipalities || municipalities.length === 0) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Municipalities Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No municipality data available</p>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Municipalities Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {municipalities.slice(0, 5).map((m) => (
            <div key={m._id || m.district_id} className="flex items-center justify-between">
              <div>
                <p className="font-medium">{m.district_name}</p>
                <p className="text-sm text-muted-foreground">{m.state_name}</p>
              </div>
              <div className="flex gap-4 text-sm">
                <Badge variant="warning">{m.pending || 0} pending</Badge>
                <Badge variant="success">{m.solved || 0} solved</Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function ErrorDisplay({ message, onRetry }) {
  return (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="p-6 flex flex-col items-center justify-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-red-600 font-medium mb-4">{message || 'Something went wrong'}</p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const { user, isStateAdmin } = useAuth()
  
  const { 
    data: statsData, 
    isLoading: statsLoading,
    isError: statsError,
    refetch: refetchStats 
  } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [statsRes, municipalitiesRes, escalatedRes] = await Promise.all([
        dashboardApi.getStats().catch((e) => {
          console.error('Stats error:', e);
          return { data: { success: false } };
        }),
        dashboardApi.getAllMunicipalities().catch((e) => {
          console.error('Municipalities error:', e);
          return { data: { success: false, districts: [] } };
        }),
        isStateAdmin 
          ? dashboardApi.getEscalatedComplaints().catch((e) => {
              console.error('Escalated error:', e);
              return { data: { complaints: [] } };
            })
          : Promise.resolve({ data: { complaints: [] } })
      ])
      return {
        stats: statsRes.data,
        municipalities: municipalitiesRes.data?.districts || [],
        escalated: escalatedRes.data?.complaints || []
      }
    },
    retry: 2,
    staleTime: 30000,
  })

  const stats = statsData?.stats
  const municipalities = statsData?.municipalities || []
  const escalated = statsData?.escalated || []

  const totalComplaints = stats?.total || 0
  const pendingComplaints = stats?.pending || 0
  const solvedComplaints = stats?.solved || 0

  if (statsLoading) {
    return (
      <AppLayout isStateAdmin={isStateAdmin}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    )
  }

  if (statsError) {
    return (
      <AppLayout isStateAdmin={isStateAdmin}>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-muted-foreground">Failed to load dashboard data</p>
        </div>
        <ErrorDisplay 
          message="Failed to load dashboard statistics" 
          onRetry={() => refetchStats()} 
        />
      </AppLayout>
    )
  }

  return (
    <AppLayout isStateAdmin={isStateAdmin}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {isStateAdmin 
            ? `State Dashboard - ${user?.state_name || 'Admin'}` : 
            `Municipality Dashboard - ${user?.district_name || 'Operator'}`}
        </h1>
        <p className="text-muted-foreground">Overview of civic issue management</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Complaints"
          value={totalComplaints}
          icon={FileText}
          color="bg-blue-500"
        />
        <StatsCard
          title="Pending"
          value={pendingComplaints}
          icon={Clock}
          color="bg-orange-500"
        />
        <StatsCard
          title="Solved"
          value={solvedComplaints}
          icon={CheckCircle}
          color="bg-green-500"
        />
        {isStateAdmin && (
          <StatsCard
            title="Escalated"
            value={escalated.length}
            icon={AlertTriangle}
            color="bg-red-500"
          />
        )}
      </div>

      {isStateAdmin && <MunicipalStats municipalities={municipalities} />}
    </AppLayout>
  )
}
