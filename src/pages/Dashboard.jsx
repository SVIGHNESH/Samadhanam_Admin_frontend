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
    <Card className="glass-panel border-white/80 hover:-translate-y-0.5 transition-transform">
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
      <Card className="mt-6 glass-panel border-white/80">
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
    <Card className="mt-6 glass-panel border-white/80">
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

function MunicipalRecentComplaints({ municipalityName }) {
  const { data: complaints, isLoading } = useQuery({
    queryKey: ['municipal-complaints', municipalityName],
    queryFn: async () => {
      const res = await dashboardApi.getComplaintsByMunicipality(municipalityName)
      return res.data?.complaints || []
    },
    staleTime: 30000,
  })

  if (isLoading) {
    return <Loader2 className="h-4 w-4 animate-spin" />
  }

  if (!complaints || complaints.length === 0) {
    return <p className="text-sm text-muted-foreground">No complaints</p>
  }

  return (
    <div className="space-y-3">
      {complaints.slice(0, 5).map((c) => (
        <div key={c._id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{c.title || 'Complaint'}</p>
            <p className="text-xs text-muted-foreground">{c.location}</p>
          </div>
          <Badge variant={c.status === 'Solved' ? 'success' : 'warning'} className="ml-2">
            {c.status || 'Pending'}
          </Badge>
        </div>
      ))}
    </div>
  )
}

function ErrorDisplay({ message, onRetry }) {
  return (
    <Card className="border-red-200 bg-red-50/80">
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
  const { user, isStateAdmin, isMunicipality } = useAuth()
  
  const stateQuery = useQuery({
    queryKey: ['dashboard-state', user?.state_id],
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
        dashboardApi.getEscalatedComplaints().catch((e) => {
          console.error('Escalated error:', e);
          return { data: { complaints: [] } };
        })
      ])
      return {
        stats: statsRes.data,
        municipalities: municipalitiesRes.data?.districts || [],
        escalated: escalatedRes.data?.complaints || []
      }
    },
    enabled: isStateAdmin,
    retry: 2,
    staleTime: 30000,
  })

  const municipalQuery = useQuery({
    queryKey: ['dashboard-municipal', user?.district_name],
    queryFn: async () => {
      const res = await dashboardApi.getMunicipalStats().catch((e) => {
        console.error('Municipal stats error:', e);
        return { data: { success: false } };
      })
      return res.data
    },
    enabled: isMunicipality,
    retry: 2,
    staleTime: 30000,
  })

  const isLoading = isStateAdmin ? stateQuery.isLoading : municipalQuery.isLoading
  const isError = isStateAdmin ? stateQuery.isError : municipalQuery.isError
  const refetch = isStateAdmin ? stateQuery.refetch : municipalQuery.refetch

  const stats = isStateAdmin ? stateQuery.data?.stats : municipalQuery.data?.stats
  const municipalities = isStateAdmin ? stateQuery.data?.municipalities || [] : []
  const escalated = isStateAdmin ? stateQuery.data?.escalated || [] : []
  const recentComplaints = isMunicipality ? municipalQuery.data?.recentComplaints || [] : []

  const totalComplaints = isMunicipality ? (stats?.total || 0) : ((stats?.totalSolved || 0) + (stats?.totalPending || 0))
  const pendingComplaints = isMunicipality ? (stats?.pending || 0) : (stats?.totalPending || 0)
  const solvedComplaints = isMunicipality ? (stats?.solved || 0) : (stats?.totalSolved || 0)

  if (isLoading) {
    return (
      <AppLayout isStateAdmin={isStateAdmin}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    )
  }

  if (isError) {
    return (
      <AppLayout isStateAdmin={isStateAdmin}>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-muted-foreground">Failed to load dashboard data</p>
        </div>
        <ErrorDisplay 
          message="Failed to load dashboard statistics" 
          onRetry={() => refetch()} 
        />
      </AppLayout>
    )
  }

  return (
    <AppLayout isStateAdmin={isStateAdmin}>
      <div className="mb-8 rounded-3xl border border-white/70 bg-white/65 p-6 shadow-sm backdrop-blur-sm">
        <h1 className="text-3xl font-bold text-slate-900">
          {isStateAdmin 
            ? `State Dashboard - ${user?.state_name || 'Admin'}` : 
            `Municipality Dashboard - ${user?.district_name || 'Operator'}`}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {isStateAdmin 
            ? 'Overview of all municipalities in your state' : 
            'Manage complaints for your municipality'}
        </p>
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

      {isMunicipality && recentComplaints.length > 0 && (
        <Card className="mt-6 glass-panel border-white/80">
          <CardHeader>
            <CardTitle>Recent Complaints</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentComplaints.slice(0, 5).map((c) => (
                <div key={c._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{c.title || 'Complaint'}</p>
                    <p className="text-sm text-muted-foreground">{c.location}</p>
                  </div>
                  <Badge variant={c.status === 'Solved' ? 'success' : 'warning'} className="ml-2">
                    {c.status || 'Pending'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </AppLayout>
  )
}
