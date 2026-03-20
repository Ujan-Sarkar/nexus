import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  UserCircle, 
  LogOut, 
  Menu, 
  Search, 
  Bell,
  Activity,
  ChevronRight,
  FlaskConical,
  Wallet,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GLASS_NAV, SIDEBAR_STYLE, cn } from '../lib/utils';

interface SidebarItem {
  label: string;
  icon: any;
  path: string;
}

export default function DashboardLayout({ children, role }: { children: React.ReactNode, role: string }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems: Record<string, SidebarItem[]> = {
    admin: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
      { label: 'Patients', icon: Users, path: '/admin/patients' },
      { label: 'Doctors', icon: UserCircle, path: '/admin/doctors' },
      { label: 'Revenue', icon: Wallet, path: '/admin/revenue' },
      { label: 'Lab Tests', icon: FlaskConical, path: '/admin/lab-tests' },
      { label: 'Settings', icon: Settings, path: '/admin/settings' },
    ],
    doctor: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/doctor' },
      { label: 'Archive', icon: Users, path: '/doctor/archive' },
      { label: 'Profile', icon: UserCircle, path: '/doctor/profile' },
    ],
    lab: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/lab' },
      { label: 'Test Archive', icon: FlaskConical, path: '/lab/archive' },
    ],
    revenue: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/revenue' },
      { label: 'Payments', icon: Wallet, path: '/revenue/payments' },
    ]
  };

  const currentMenu = menuItems[role] || [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Sidebar */}
      <AnimatePresence initial={false}>
        {isSidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 256, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className={cn(SIDEBAR_STYLE, "overflow-hidden whitespace-nowrap z-40")}
          >
            <div className="w-64">
              <div className="p-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Activity className="text-white w-5 h-5" />
                </div>
                <span className="font-bold text-xl tracking-tight text-slate-900">Nexus</span>
              </div>

              <nav className="mt-8 px-4 space-y-2">
                {currentMenu.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all group",
                      location.pathname === item.path 
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                        : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                    {location.pathname === item.path && (
                      <ChevronRight className="w-4 h-4 ml-auto" />
                    )}
                  </Link>
                ))}
              </nav>

              <div className="absolute bottom-8 left-0 w-full px-4">
                <button
                  onClick={() => { logout(); navigate('/'); }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className={GLASS_NAV}>
          <div className="px-6 h-16 flex items-center justify-between">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-all text-slate-600"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex-1 max-w-xl mx-8 hidden md:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Global search..." 
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-slate-100 rounded-lg relative text-slate-600">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-blue-600 rounded-full border-2 border-white" />
              </button>
              <div className="h-8 w-px bg-slate-200 mx-2" />
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">{role}</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <UserCircle className="text-white w-6 h-6" />
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="p-6 overflow-y-auto bg-slate-50">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
