import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useAuth } from "@/hooks/useAuth"
import {
  LayoutDashboard,
  FileText,
  AlertTriangle,
  MapPin,
  LogOut,
  Menu,
  Sparkles,
  BarChart3,
} from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Complaints", href: "/complaints", icon: FileText },
  { name: "Municipalities", href: "/municipalities", icon: MapPin },
  { name: "Escalated", href: "/escalated", icon: AlertTriangle },
]

export function Sidebar({ isStateAdmin = false }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, user } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const filteredNav = navigation.filter(item => {
    if (item.name === "Escalated") return isStateAdmin;
    if (item.name === "Municipalities") return isStateAdmin;
    return true;
  });

  return (
    <div className="hidden md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 p-4">
      <div className="flex-1 flex flex-col min-h-0 rounded-3xl border border-white/30 bg-gradient-to-b from-cyan-800 via-cyan-700 to-teal-700 shadow-2xl shadow-cyan-900/25">
        <div className="flex items-center h-20 flex-shrink-0 px-6 text-white">
          <div className="rounded-xl bg-white/15 p-2 backdrop-blur-sm">
            <BarChart3 className="h-7 w-7" />
          </div>
          <div className="ml-3">
            <p className="text-xl font-bold leading-tight">Samadhanam</p>
            <p className="text-xs uppercase tracking-[0.22em] text-cyan-100/90">Control Center</p>
          </div>
        </div>
        <div className="flex-1 flex flex-col overflow-y-auto px-4">
          <nav className="flex-1 py-3 space-y-1.5">
            {filteredNav.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "group flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                    isActive
                      ? "bg-white text-cyan-900 shadow-md"
                      : "text-cyan-100/90 hover:bg-white/15 hover:text-white"
                  )}
                >
                  <item.icon
                    className={cn(
                      "mr-3 h-5 w-5",
                      isActive ? "text-cyan-700" : "text-cyan-100/70"
                    )}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
        <div className="flex-shrink-0 space-y-3 p-4 border-t border-white/15">
          <div className="rounded-2xl border border-white/20 bg-white/10 p-3 text-cyan-50 backdrop-blur-sm">
            <p className="text-xs uppercase tracking-widest text-cyan-100/80">Signed In As</p>
            <p className="mt-1 text-sm font-semibold">{isStateAdmin ? "State Admin" : "Municipality Operator"}</p>
            <p className="mt-1 text-xs text-cyan-100/90 truncate">{isStateAdmin ? user?.state_name : user?.district_name}</p>
          </div>
          <Button
            variant="outline"
            className="w-full justify-start border-white/35 bg-white/10 text-white hover:bg-white/20 hover:text-white"
            onClick={handleLogout}
          >
            <LogOut className="mr-3 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  )
}

export function MobileSidebar({ isStateAdmin = false }) {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, user } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/login')
    setOpen(false)
  }

  const filteredNav = navigation.filter(item => {
    if (item.name === "Escalated") return isStateAdmin;
    if (item.name === "Municipalities") return isStateAdmin;
    return true;
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="md:hidden bg-white/75">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 border-none p-0 bg-transparent">
        <div className="h-full rounded-r-3xl border border-white/25 bg-gradient-to-b from-cyan-800 via-cyan-700 to-teal-700 text-white shadow-2xl shadow-cyan-950/30">
          <div className="flex items-center h-20 px-6 border-b border-white/20">
            <BarChart3 className="h-7 w-7" />
            <span className="ml-3 text-xl font-bold">Samadhanam</span>
          </div>
          <nav className="px-3 py-2 space-y-1">
            {filteredNav.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "group flex items-center rounded-xl px-3 py-2.5 text-sm font-medium",
                    isActive
                      ? "bg-white text-cyan-900"
                      : "text-cyan-100 hover:bg-white/15 hover:text-white"
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
          <div className="absolute bottom-0 w-full space-y-3 p-4 border-t border-white/20">
            <div className="rounded-2xl border border-white/20 bg-white/10 p-3 text-cyan-50">
              <p className="text-xs uppercase tracking-widest text-cyan-100/80">Signed In As</p>
              <p className="mt-1 text-sm font-semibold">{isStateAdmin ? "State Admin" : "Municipality Operator"}</p>
              <p className="mt-1 text-xs text-cyan-100/90 truncate">{isStateAdmin ? user?.state_name : user?.district_name}</p>
            </div>
            <Button
              variant="outline"
              className="w-full justify-start border-white/35 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              onClick={handleLogout}
            >
              <LogOut className="mr-3 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export function AppLayout({ children, isStateAdmin = false }) {
  return (
    <div className="min-h-screen page-enter">
      <Sidebar isStateAdmin={isStateAdmin} />
      <div className="md:pl-72">
        <header className="sticky top-0 z-20 border-b border-white/60 bg-white/70 backdrop-blur-md">
          <div className="mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <MobileSidebar isStateAdmin={isStateAdmin} />
              <div>
                <p className="text-sm font-semibold text-slate-700">Samadhanam Administration</p>
                <p className="text-xs text-slate-500">Complaint operations and governance</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-border/80 bg-white/80 px-3 py-1.5 text-xs text-slate-600">
              {isStateAdmin ? "State Overview" : "Municipality Desk"}
            </div>
          </div>
        </header>
        <main className="py-6 px-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  )
}
