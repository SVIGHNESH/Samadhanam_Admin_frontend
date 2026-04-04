import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  Cell,
} from 'recharts'
import { dashboardApi } from '@/lib/api'
import { summarizeComplaints } from '@/lib/complaintStats'
import { useAuth } from '@/hooks/useAuth'
import { AppLayout } from '@/components/layout/Layout'
import { Search, MapPin, Loader2, Building2, AlertCircle, RefreshCw, X } from 'lucide-react'

const TIME_FILTERS = [
  { key: 'week', label: 'Week', days: 7 },
  { key: 'month', label: 'Month', days: 30 },
  { key: 'quarter', label: '3 Months', days: 90 },
  { key: 'year', label: 'Year', days: 365 },
  { key: 'all', label: 'All Time', days: null },
]

const ESCALATION_DAYS = 7

function getRangeStartDate(filterKey) {
  const filter = TIME_FILTERS.find((item) => item.key === filterKey)
  if (!filter || !filter.days) return null

  const start = new Date()
  start.setDate(start.getDate() - filter.days)
  return start
}

function filterComplaintsByTime(complaints, filterKey) {
  const rangeStart = getRangeStartDate(filterKey)
  if (!rangeStart) return complaints

  return complaints.filter((complaint) => {
    if (!complaint.createdAt) return true
    const complaintDate = new Date(complaint.createdAt)
    return complaintDate >= rangeStart
  })
}

function buildMunicipalityMetrics(complaints, filterKey) {
  const filteredComplaints = filterComplaintsByTime(complaints, filterKey)
  const total = filteredComplaints.length
  const solved = filteredComplaints.filter((complaint) => complaint.status === 'Solved').length

  const escalated = filteredComplaints.filter((complaint) => {
    const status = (complaint.status || '').toLowerCase()
    if (status === 'solved') return false
    if (status === 'escalated') return true
    if (!complaint.createdAt) return false

    const ageMs = Date.now() - new Date(complaint.createdAt).getTime()
    return ageMs > ESCALATION_DAYS * 24 * 60 * 60 * 1000
  }).length

  return { total, solved, escalated }
}

function ErrorDisplay({ message, onRetry }) {
  return (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="p-6 flex flex-col items-center justify-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-red-600 font-medium mb-4">{message}</p>
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

export default function MunicipalitiesPage() {
  const { isStateAdmin, user } = useAuth()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMunicipality, setSelectedMunicipality] = useState(null)
  const [timeFilter, setTimeFilter] = useState('month')

  const { 
    data, 
    isLoading,
    isError,
    refetch 
  } = useQuery({
    queryKey: ['municipalities', isStateAdmin, user?.district_name],
    queryFn: async () => {
      if (isStateAdmin) {
        const res = await dashboardApi.getAllMunicipalities()
        const districts = res.data?.districts || []

        const municipalitiesWithStats = await Promise.all(
          districts.map(async (district) => {
            try {
              const complaintsRes = await dashboardApi.getComplaintsByMunicipality(district.district_name)
              const complaints = complaintsRes.data?.complaints || []
              const stats = summarizeComplaints(complaints)

              return {
                ...district,
                pending: stats.pending,
                solved: stats.solved,
                total: stats.total,
              }
            } catch (error) {
              console.error(`Failed to fetch complaints for ${district.district_name}:`, error)
              return {
                ...district,
                pending: 0,
                solved: 0,
                total: 0,
              }
            }
          })
        )

        return municipalitiesWithStats
      } else {
        const res = await dashboardApi.getComplaintsByMunicipality(user?.district_name)
        return res.data?.complaints || []
      }
    },
    retry: 2,
    staleTime: 30000,
    refetchInterval: 30000,
    refetchIntervalInBackground: true,
  })

  const municipalities = isStateAdmin ? (data || []) : []
  const complaints = !isStateAdmin ? (data || []) : []

  const {
    data: municipalityComplaints = [],
    isLoading: isMunicipalityGraphLoading,
    isError: isMunicipalityGraphError,
    refetch: refetchMunicipalityGraph,
  } = useQuery({
    queryKey: ['municipality-complaints', selectedMunicipality?.district_name],
    queryFn: async () => {
      const res = await dashboardApi.getComplaintsByMunicipality(selectedMunicipality?.district_name)
      return res.data?.complaints || []
    },
    enabled: isStateAdmin && !!selectedMunicipality,
    retry: 2,
    staleTime: 30000,
    refetchInterval: 30000,
    refetchIntervalInBackground: true,
  })

  const municipalityMetrics = buildMunicipalityMetrics(municipalityComplaints, timeFilter)
  const graphData = [
    {
      metric: 'Total Problems',
      value: municipalityMetrics.total,
      fill: '#0891b2',
    },
    {
      metric: 'Solved Problems',
      value: municipalityMetrics.solved,
      fill: '#16a34a',
    },
    {
      metric: 'Escalated Problems',
      value: municipalityMetrics.escalated,
      fill: '#ef4444',
    },
  ]

  const filteredMunicipalities = municipalities.filter(m => 
    m.district_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.state_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const closeMunicipalityModal = () => {
    setSelectedMunicipality(null)
    setTimeFilter('month')
  }

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
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {isStateAdmin ? 'Municipalities' : 'My Municipality'}
          </h1>
        </div>
        <ErrorDisplay 
          message="Failed to load data" 
          onRetry={() => refetch()} 
        />
      </AppLayout>
    )
  }

  if (!isStateAdmin) {
    return (
      <AppLayout isStateAdmin={false}>
        <div className="mb-6 rounded-3xl border border-white/70 bg-white/65 p-6 shadow-sm backdrop-blur-sm">
          <h1 className="text-3xl font-bold text-slate-900">
            My Municipality - {user?.district_name}
          </h1>
          <p className="mt-2 text-muted-foreground">Manage complaints for your municipality</p>
        </div>
        
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="glass-panel border-white/80">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Complaints</p>
                  <p className="text-2xl font-bold">{complaints.length}</p>
                </div>
                <Building2 className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card className="glass-panel border-white/80">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-orange-500">
                    {complaints.filter(c => c.status === 'Pending').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-panel border-white/80">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Solved</p>
                  <p className="text-2xl font-bold text-green-500">
                    {complaints.filter(c => c.status === 'Solved').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6 glass-panel border-white/80">
          <CardHeader>
            <CardTitle>Recent Complaints</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {complaints.slice(0, 10).map((complaint) => (
                <div 
                  key={complaint._id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/complaints/${complaint._id}`)}
                >
                  <div>
                    <p className="font-medium">{complaint.title}</p>
                    <p className="text-sm text-muted-foreground">{complaint.location}</p>
                  </div>
                  <Badge variant={complaint.status === 'Solved' ? 'success' : 'warning'}>
                    {complaint.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </AppLayout>
    )
  }

  return (
    <AppLayout isStateAdmin={isStateAdmin}>
      <div className="mb-6 rounded-3xl border border-white/70 bg-white/65 p-6 shadow-sm backdrop-blur-sm">
        <h1 className="text-3xl font-bold text-slate-900">Municipalities</h1>
        <p className="mt-2 text-muted-foreground">View all municipalities and their complaint statistics</p>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search municipalities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredMunicipalities.map((municipality) => (
          <Card 
            key={municipality._id || municipality.district_id}
            className="glass-panel border-white/80 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg"
            onClick={() => setSelectedMunicipality(municipality)}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-primary" />
                {municipality.district_name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pending</span>
                  <span className="font-medium text-orange-500">{municipality.pending || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Solved</span>
                  <span className="font-medium text-green-500">{municipality.solved || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-medium">{municipality.total || ((municipality.pending || 0) + (municipality.solved || 0))}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedMunicipality && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-4xl border-white/85 bg-white/95 shadow-2xl">
            <CardHeader className="border-b border-border/60 pb-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl text-slate-900">
                    {selectedMunicipality.district_name} - Problems Overview
                  </CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    See total, solved, and escalated problems with time-based filtering
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={closeMunicipalityModal}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="pt-6">
              <div className="mb-5 flex flex-wrap gap-2">
                {TIME_FILTERS.map((filter) => (
                  <Button
                    key={filter.key}
                    size="sm"
                    variant={timeFilter === filter.key ? 'default' : 'outline'}
                    onClick={() => setTimeFilter(filter.key)}
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>

              {isMunicipalityGraphLoading && (
                <div className="flex h-72 items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}

              {isMunicipalityGraphError && (
                <ErrorDisplay
                  message="Failed to load municipality chart data"
                  onRetry={() => refetchMunicipalityGraph()}
                />
              )}

              {!isMunicipalityGraphLoading && !isMunicipalityGraphError && (
                <>
                  <div className="h-72 w-full rounded-2xl border border-border/70 bg-white/75 p-3">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={graphData} margin={{ top: 12, right: 18, left: 0, bottom: 12 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                        <XAxis dataKey="metric" tick={{ fontSize: 12 }} />
                        <YAxis allowDecimals={false} />
                        <Tooltip
                          formatter={(value) => [value, 'Problems']}
                          contentStyle={{ borderRadius: '12px', borderColor: '#cbd5e1' }}
                        />
                        <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                          {graphData.map((entry) => (
                            <Cell key={entry.metric} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-3">
                      <p className="text-xs uppercase tracking-wider text-cyan-700">Total Problems</p>
                      <p className="mt-1 text-2xl font-bold text-cyan-900">{municipalityMetrics.total}</p>
                    </div>
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                      <p className="text-xs uppercase tracking-wider text-emerald-700">Solved Problems</p>
                      <p className="mt-1 text-2xl font-bold text-emerald-900">{municipalityMetrics.solved}</p>
                    </div>
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                      <p className="text-xs uppercase tracking-wider text-red-700">Escalated Problems</p>
                      <p className="mt-1 text-2xl font-bold text-red-900">{municipalityMetrics.escalated}</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </AppLayout>
  )
}
