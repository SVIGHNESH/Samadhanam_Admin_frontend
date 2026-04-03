import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table'
import { dashboardApi } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { AppLayout } from '@/components/layout/Layout'
import { 
  Search, AlertTriangle, Loader2, Eye, MapPin, Clock, RefreshCw
} from 'lucide-react'

export default function EscalatedPage() {
  const { user, isStateAdmin } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')

  const { 
    data: complaints, 
    isLoading,
    isError,
    refetch 
  } = useQuery({
    queryKey: ['escalated-complaints'],
    queryFn: async () => {
      const res = await dashboardApi.getEscalatedComplaints()
      return res.data?.complaints || []
    },
    enabled: isStateAdmin,
    retry: 2,
    staleTime: 30000,
  })

  const escalateMutation = useMutation({
    mutationFn: () => dashboardApi.triggerEscalation(),
    onSuccess: () => {
      queryClient.invalidateQueries(['escalated-complaints'])
    }
  })

  const filteredComplaints = complaints?.filter(c => 
    !searchTerm || 
    c.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.municipalityName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.location?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const getStatusBadge = (status) => {
    const variants = {
      'Pending': 'warning',
      'In Progress': 'secondary',
      'Solved': 'success',
      'Escalated': 'error'
    }
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>
  }

  if (!isStateAdmin) {
    return (
      <AppLayout isStateAdmin={false}>
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold">Access Restricted</h2>
          <p className="text-muted-foreground">This page is only available for State Admins</p>
        </div>
      </AppLayout>
    )
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
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            Escalated Complaints
          </h1>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
            <p className="text-red-600 font-medium mb-4">Failed to load escalated complaints</p>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </AppLayout>
    )
  }

  return (
    <AppLayout isStateAdmin={isStateAdmin}>
      <div className="mb-6 rounded-3xl border border-white/70 bg-white/65 p-6 shadow-sm backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-red-500" />
              Escalated Complaints
            </h1>
            <p className="mt-2 text-muted-foreground">
              Complaints that require immediate attention (pending for more than 7 days)
            </p>
          </div>
          <Button 
            variant="outline"
            onClick={() => escalateMutation.mutate()}
            disabled={escalateMutation.isPending}
          >
            {escalateMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Check Escalations
          </Button>
        </div>
      </div>

      <Card className="glass-panel border-white/80">
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search escalated complaints..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredComplaints.length} escalated complaint{filteredComplaints.length !== 1 ? 's' : ''}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredComplaints.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold">No Escalated Complaints</h2>
              <p className="text-muted-foreground">All complaints are being handled within the expected time</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Municipality</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Days Old</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredComplaints.map((complaint) => (
                  <TableRow key={complaint._id} className="bg-red-50">
                    <TableCell className="font-medium">{complaint.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {complaint.municipalityName}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{complaint.location}</TableCell>
                    <TableCell>{complaint.type}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 text-red-600 font-medium">
                        <Clock className="h-3 w-3" />
                        {Math.floor((new Date() - new Date(complaint.createdAt)) / (1000 * 60 * 60 * 24))} days
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(complaint.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => navigate(`/complaints/${complaint._id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AppLayout>
  )
}
