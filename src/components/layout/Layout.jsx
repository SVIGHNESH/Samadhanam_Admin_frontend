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
  X,
  Users,
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
    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-primary">
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center h-16 flex-shrink-0 px-4 text-white">
          <BarChart3 className="h-8 w-8 mr-2" />
          <span className="text-xl font-bold">Samadhanam</span>
        </div>
        <div className="flex-1 flex flex-col overflow-y-auto">
          <nav className="flex-1 px-2 py-4 space-y-1">
            {filteredNav.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                    isActive
                      ? "bg-white/20 text-white"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <item.icon
                    className={cn(
                      "mr-3 flex-shrink-0 h-5 w-5",
                      isActive ? "text-white" : "text-white/60"
                    )}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
        <div className="flex-shrink-0 p-4 border-t border-white/20">
          <div className="text-white/80 text-sm mb-2">
            {isStateAdmin ? "State Admin" : "Municipality Operator"}
          </div>
          <div className="text-white text-xs mb-3 truncate">
            {isStateAdmin ? user?.state_name : user?.district_name}
          </div>
          <Button
            variant="outline"
            className="w-full justify-start text-white border-white/20 hover:bg-white/10 hover:text-white"
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
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0 bg-primary">
        <div className="flex items-center justify-between h-16 px-4 text-white border-b border-white/20">
          <span className="text-xl font-bold">Samadhanam</span>
          <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
            <X className="h-5 w-5 text-white" />
          </Button>
        </div>
        <nav className="px-2 py-4 space-y-1">
          {filteredNav.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                  isActive
                    ? "bg-white/20 text-white"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                )}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>
        <div className="absolute bottom-0 w-full p-4 border-t border-white/20">
          <Button
            variant="outline"
            className="w-full justify-start text-white border-white/20 hover:bg-white/10 hover:text-white"
            onClick={handleLogout}
          >
            <LogOut className="mr-3 h-4 w-4" />
            Logout
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export function AppLayout({ children, isStateAdmin = false }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar isStateAdmin={isStateAdmin} />
      <MobileSidebar isStateAdmin={isStateAdmin} />
      <div className="md:pl-64">
        <main className="py-6 px-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  )
}
