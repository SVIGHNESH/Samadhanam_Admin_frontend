import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { authApi } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { BarChart3, Loader2, ShieldCheck, Building2 } from 'lucide-react'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // Try state admin login first
      const stateResponse = await authApi.login({ enteredUserName: username, enteredPassword: password })
      
      if (stateResponse.data.success) {
        login(stateResponse.data.state, stateResponse.data.token)
        navigate('/')
        return
      }
    } catch (stateError) {
      // Try municipality login
      try {
        const municipalResponse = await authApi.municipalLogin({ enteredUserName: username, enteredPassword: password })
        
        if (municipalResponse.data.success) {
          login(municipalResponse.data.operator, municipalResponse.data.token)
          navigate('/')
          return
        }
      } catch (municipalError) {
        setError('Invalid username or password')
      }
    }

    setIsLoading(false)
  }

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-10">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-16 -top-12 h-72 w-72 rounded-full bg-cyan-300/35 blur-3xl" />
        <div className="absolute right-0 top-20 h-80 w-80 rounded-full bg-amber-300/30 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-teal-300/25 blur-3xl" />
      </div>

      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center">
        <div className="grid w-full gap-6 lg:grid-cols-2">
          <div className="hidden lg:flex flex-col justify-between rounded-3xl border border-white/70 bg-white/60 p-10 shadow-xl backdrop-blur-md page-enter">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-cyan-700">
                <ShieldCheck className="h-3.5 w-3.5" />
                Secure Civic Platform
              </div>
              <h1 className="mt-6 text-5xl font-bold leading-tight text-slate-900">
                SAMADHANAM
              </h1>
              <h6 className="mt-6 text-4xl font-bold leading-tight text-slate-900">
                Better city response starts with better visibility.
              </h6>
              <p className="mt-4 max-w-md text-sm text-slate-600">
                Monitor complaint flow, municipal performance, and critical escalations from one unified command center.
              </p>
            </div>
            <div className="grid gap-3 text-sm">
              <div className="rounded-2xl border border-white/80 bg-white/75 p-4">
                Real-time complaint dashboards for district operators
              </div>
              <div className="rounded-2xl border border-white/80 bg-white/75 p-4">
                Escalation tracking designed for state administrators
              </div>
            </div>
          </div>

          <Card className="w-full border-white/80 bg-white/75 shadow-xl backdrop-blur-md page-enter">
            <CardHeader className="space-y-2 text-center">
              <div className="flex justify-center mb-2">
                <div className="rounded-2xl bg-cyan-100 p-3">
                  <BarChart3 className="h-10 w-10 text-cyan-700" />
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-widest text-cyan-700">
                <Building2 className="h-3.5 w-3.5" />
                Samadhanam Administration
              </div>
              <CardTitle className="text-3xl font-bold text-slate-900">Welcome Back</CardTitle>
              <CardDescription>
                Sign in to continue managing complaints and municipalities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="h-11 rounded-xl bg-white/95"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 rounded-xl bg-white/95"
                    required
                  />
                </div>
                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 text-center">{error}</div>
                )}
                <Button type="submit" className="h-11 w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Please wait
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
