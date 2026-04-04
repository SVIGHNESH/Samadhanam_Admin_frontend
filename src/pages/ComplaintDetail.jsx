import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { dashboardApi } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { AppLayout } from '@/components/layout/Layout'
import { 
  Loader2, ArrowLeft, MapPin, Clock, User, CheckCircle
} from 'lucide-react'

export default function ComplaintDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isStateAdmin } = useAuth()

  const { data: complaint, isLoading, isError, refetch } = useQuery({
    queryKey: ['complaint', id],
    queryFn: async () => {
      const res = await dashboardApi.getComplaintById(id)
      return res.data?.complaint
    },
    retry: 2,
    staleTime: 30000,
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

  if (!complaint) {
    return (
      <AppLayout isStateAdmin={isStateAdmin}>
        <div className="text-center py-12">
          <p>Complaint not found</p>
          <Button onClick={() => navigate(-1)} className="mt-4">
            Go Back
          </Button>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout isStateAdmin={isStateAdmin}>
      <div className="mb-6 rounded-3xl border border-white/70 bg-white/65 p-6 shadow-sm backdrop-blur-sm">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-900">{complaint.title}</h1>
          {getStatusBadge(complaint.status)}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="glass-panel border-white/80">
          <CardHeader>
            <CardTitle>Complaint Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Description</Label>
              <p className="mt-1">{complaint.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{complaint.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>Submitted: {new Date(complaint.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>Type: {complaint.type}</span>
            </div>
            {complaint.municipalityName && (
              <div className="flex items-center gap-2">
                <Badge variant="outline">{complaint.municipalityName}</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          {complaint.imageUrl && (
            <Card className="glass-panel border-white/80">
              <CardHeader>
                <CardTitle>Complaint Image</CardTitle>
              </CardHeader>
              <CardContent>
                <img 
                  src={complaint.imageUrl} 
                  alt="Complaint" 
                  className="w-full rounded-lg"
                />
              </CardContent>
            </Card>
          )}

          {complaint.evidenceUrl && (
            <Card className="glass-panel border-white/80">
              <CardHeader>
                <CardTitle>Resolution Evidence</CardTitle>
              </CardHeader>
              <CardContent>
                <img 
                  src={complaint.evidenceUrl} 
                  alt="Evidence" 
                  className="w-full rounded-lg"
                />
                {complaint.geminiVerified && (
                  <div className="mt-2 flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">AI Verified</span>
                    {complaint.verificationConfidence && (
                      <span className="text-sm">({complaint.verificationConfidence}% confidence)</span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
