import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Database, TrendingUp, Brain, FileText, LogOut, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    toast.success("Logout realizado com sucesso");
    navigate('/auth');
  };

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Visão Geral', testId: 'nav-dashboard' },
    { path: '/dashboard/data', icon: Database, label: 'Data Connector', testId: 'nav-data' },
    { path: '/dashboard/analytics', icon: TrendingUp, label: 'Analytics & BI', testId: 'nav-analytics' },
    { path: '/dashboard/predictive', icon: Brain, label: 'Predictive', testId: 'nav-predictive' },
    { path: '/dashboard/reports', icon: FileText, label: 'Reports', testId: 'nav-reports' }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation */}
      <nav className="nav-glass sticky top-0 z-50" data-testid="dashboard-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Decisiv AI</h1>
            <Button 
              variant="ghost" 
              onClick={handleLogout}
              data-testid="logout-btn"
            >
              <LogOut size={18} className="mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Secondary Navigation */}
        <div className="mb-8 border-b border-slate-200">
          <nav className="flex gap-6 overflow-x-auto" data-testid="secondary-nav">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                    isActive 
                      ? 'border-blue-600 text-blue-600 font-semibold' 
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                  data-testid={item.testId}
                >
                  <Icon size={18} strokeWidth={isActive ? 2 : 1.5} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <Outlet />
      </div>
    </div>
  );
}