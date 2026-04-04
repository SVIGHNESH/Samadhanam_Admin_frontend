import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
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
import { Search, Loader2, Eye, AlertCircle, RefreshCw } from 'lucide-react'

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

export default function ComplaintsPage() {
  const { user, isStateAdmin } = useAuth()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const { 
    data, 
    isLoading, 
    isError,
    refetch 
  } = useQuery({
    queryKey: ['complaints', user?.district_name],
    queryFn: async () => {
      if (isStateAdmin) {
        const res = await dashboardApi.getAllMunicipalities()
        const allComplaints = []
        for (const m of res.data?.districts || []) {
          try {
            const cRes = await dashboardApi.getComplaintsByMunicipality(m.district_name)
            allComplaints.push(...(cRes.data?.complaints || []))
          } catch (e) {
            console.error(`Error fetching ${m.district_name}:`, e)
          }
        }
        return allComplaints
      } else {
        const res = await dashboardApi.getComplaintsByMunicipality(user?.district_name)
        return res.data?.complaints || []
      }
    },
    retry: 2,
    staleTime: 30000,
  })

  const complaints = data || []

  const filteredComplaints = complaints.filter(c => {
    const matchesSearch = !searchTerm || 
      c.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.location?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status) => {
    const variants = {
      'Pending': 'warning',
      'In Progress': 'secondary',
      'Solved': 'success',
      'Rejected': 'destructive',
      'Escalated': 'error'
    }
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>
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
          <h1 className="text-2xl font-bold text-slate-900">Complaints</h1>
        </div>
        <ErrorDisplay 
          message="Failed to load complaints" 
          onRetry={() => refetch()} 
        />
      </AppLayout>
    )
  }

  return (
    <AppLayout isStateAdmin={isStateAdmin}>
      <div className="mb-6 rounded-3xl border border-white/70 bg-white/65 p-6 shadow-sm backdrop-blur-sm">
        <h1 className="text-3xl font-bold text-slate-900">Complaints</h1>
        <p className="mt-2 text-muted-foreground">
          {isStateAdmin ? 'View all complaints across municipalities' : 'Manage complaints for your municipality'}
        </p>
      </div>

      <Card className="glass-panel border-white/80">
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search complaints..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                All
              </Button>
              <Button 
                variant={statusFilter === 'Pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('Pending')}
              >
                Pending
              </Button>
              <Button 
                variant={statusFilter === 'Solved' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('Solved')}
              >
                Solved
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredComplaints.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No complaints found
                  </TableCell>
                </TableRow>
              ) : (
                filteredComplaints.map((complaint) => (
                  <TableRow key={complaint._id}>
                    <TableCell className="font-medium">{complaint.title}</TableCell>
                    <TableCell className="max-w-xs truncate">{complaint.location}</TableCell>
                    <TableCell>{complaint.type}</TableCell>
                    <TableCell>{getStatusBadge(complaint.status)}</TableCell>
                    <TableCell>{complaint.createdAt ? new Date(complaint.createdAt).toLocaleDateString() : 'N/A'}</TableCell>
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
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </AppLayout>
  )
}
