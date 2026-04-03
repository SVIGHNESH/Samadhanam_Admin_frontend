import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { dashboardApi } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { AppLayout } from '@/components/layout/Layout'
import { Search, MapPin, Loader2, Building2, AlertCircle, RefreshCw } from 'lucide-react'

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

  const { 
    data, 
    isLoading,
    isError,
    refetch 
  } = useQuery({
    queryKey: ['municipalities'],
    queryFn: async () => {
      if (isStateAdmin) {
        const res = await dashboardApi.getAllMunicipalities()
        return res.data?.districts || []
      } else {
        const res = await dashboardApi.getComplaintsByMunicipality(user?.district_name)
        return res.data?.complaints || []
      }
    },
    retry: 2,
    staleTime: 30000,
  })

  const municipalities = isStateAdmin ? (data || []) : []
  const complaints = !isStateAdmin ? (data || []) : []

  const filteredMunicipalities = municipalities.filter(m => 
    m.district_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.state_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            My Municipality - {user?.district_name}
          </h1>
          <p className="text-muted-foreground">Manage complaints for your municipality</p>
        </div>
        
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
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
          <Card>
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
          <Card>
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

        <Card className="mt-6">
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Municipalities</h1>
        <p className="text-muted-foreground">View all municipalities and their complaint statistics</p>
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
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate(`/municipalities/${municipality.district_name}`)}
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
                  <span className="text-muted-foreground">State</span>
                  <span className="font-medium">{municipality.state_name}</span>
                </div>
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
                  <span className="font-medium">{(municipality.pending || 0) + (municipality.solved || 0)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppLayout>
  )
}
