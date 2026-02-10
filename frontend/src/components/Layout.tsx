import { ReactNode, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Wrench, Package, ClipboardList, Car, BarChart3, LogOut, Shield, ScanLine,
  PanelLeftClose, PanelLeftOpen, Search, ChevronDown, ChevronRight,
  Plus, List, Usb, Camera, Truck, GitCompare, BarChart2, ArrowDownUp,
  Users, UserPlus, ShieldAlert, QrCode, LayoutDashboard, Command,
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

interface SubItem {
  label: string;
  to: string;
  icon: React.ElementType;
}

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
  subItems?: SubItem[];
}

// Admin nav is added dynamically based on role
const baseNavItems: NavItem[] = [
  {
    to: '/dashboard',
    icon: LayoutDashboard,
    label: 'Dashboard',
  },
  {
    to: '/parts',
    icon: Wrench,
    label: 'Parts',
    subItems: [
      { label: 'Catalog', to: '/parts', icon: List },
      { label: 'Search Parts', to: '/parts?focus=search', icon: Search },
      { label: 'New Part', to: '/parts?action=new', icon: Plus },
      { label: 'Interchange', to: '/parts?view=groups', icon: GitCompare },
    ],
  },
  {
    to: '/vehicles',
    icon: Car,
    label: 'Vehicles',
    subItems: [
      { label: 'All Vehicles', to: '/vehicles', icon: List },
      { label: 'Search Vehicles', to: '/vehicles?focus=search', icon: Search },
      { label: 'New Vehicle', to: '/vehicles?action=new', icon: Plus },
      { label: 'Fitments', to: '/vehicles?view=fitments', icon: Truck },
    ],
  },
  {
    to: '/inventory',
    icon: Package,
    label: 'Inventory',
    subItems: [
      { label: 'Overview', to: '/inventory', icon: BarChart2 },
      { label: 'Search Inventory', to: '/inventory?focus=search', icon: Search },
      { label: 'Transactions', to: '/inventory?view=events', icon: ArrowDownUp },
    ],
  },
  {
    to: '/requests',
    icon: ClipboardList,
    label: 'Requests',
    subItems: [
      { label: 'All Requests', to: '/requests', icon: List },
      { label: 'New Request', to: '/requests?action=new', icon: Plus },
    ],
  },
  {
    to: '/scan',
    icon: ScanLine,
    label: 'Scan',
    subItems: [
      { label: 'Camera Scan', to: '/scan?mode=camera', icon: Camera },
      { label: 'USB Scanner', to: '/scan?mode=usb', icon: Usb },
      { label: 'SKU Lookup', to: '/scan?mode=manual', icon: Search },
    ],
  },
];

export function Layout({ children }: LayoutProps) {
  const { user, logout, isAdmin, isManager } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const adminNavItem: NavItem = {
    to: '/admin',
    icon: Shield,
    label: 'Admin',
    subItems: [
      { label: 'Users', to: '/admin?tab=users', icon: Users },
      { label: 'Role Requests', to: '/admin?tab=requests', icon: ShieldAlert },
      { label: 'Create User', to: '/admin?tab=create', icon: UserPlus },
      { label: 'My Barcode', to: '/admin?tab=my-barcode', icon: QrCode },
    ],
  };

  const navItems: NavItem[] = (isAdmin || isManager)
    ? [...baseNavItems, adminNavItem]
    : baseNavItems;

  const [expandedSections, setExpandedSections] = useState<Set<string>>(() => {
    const active = navItems.find(item => location.pathname.startsWith(item.to));
    return new Set(active ? [active.to] : []);
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleSection = (to: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(to)) next.delete(to);
      else next.add(to);
      return next;
    });
  };

  const isActiveSection = (to: string) => location.pathname.startsWith(to);

  return (
    <div className="flex h-screen bg-slate-950">
      {/* Sidebar */}
      <aside
        className={`${collapsed ? 'w-20' : 'w-[280px]'} bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 transition-all duration-300 ease-in-out`}
      >
        {/* Logo */}
        <div className={`${collapsed ? 'px-4 py-5' : 'px-6 py-6'} border-b border-slate-800`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center shrink-0">
              <BarChart3 className="w-5 h-5 text-slate-900" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <h1 className="text-base font-bold text-white tracking-wider leading-tight">AUTOTRAQ</h1>
                <p className="text-[10px] text-slate-500 tracking-widest uppercase">Inventory System</p>
              </div>
            )}
          </div>
        </div>

        {/* Search / Command Bar Trigger */}
        {!collapsed && (
          <div className="px-5 py-3 border-b border-slate-800/50">
            <button
              onClick={() => {
                // Trigger cmd+k via custom event
                const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true });
                window.dispatchEvent(event);
              }}
              className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-xs text-slate-500 hover:text-slate-300 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 transition-colors cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span className="flex-1 text-left">Search...</span>
              <kbd className="flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-900 rounded border border-slate-700 text-[10px]">
                <Command className="w-2.5 h-2.5" />K
              </kbd>
            </button>
          </div>
        )}

        {/* Collapse toggle */}
        <div className={`${collapsed ? 'px-3' : 'px-5'} py-3 border-b border-slate-800/50`}>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 transition-colors cursor-pointer"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <PanelLeftOpen className="w-4 h-4 mx-auto" />
            ) : (
              <>
                <PanelLeftClose className="w-4 h-4" />
                <span>Hide</span>
              </>
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 ${collapsed ? 'px-3 py-4' : 'px-5 py-5'} space-y-1.5 overflow-y-auto`}>
          {navItems.map(({ to, icon: Icon, label, subItems }) => {
            const active = isActiveSection(to);
            const expanded = expandedSections.has(to) && !collapsed;

            return (
              <div key={to}>
                <NavLink
                  to={to}
                  onClick={(e) => {
                    if (!collapsed && subItems) {
                      e.preventDefault();
                      toggleSection(to);
                    }
                  }}
                  className={`flex items-center gap-3 ${collapsed ? 'px-3 py-3 justify-center' : 'px-4 py-3'} rounded-lg text-sm font-medium transition-all duration-200 ${
                    active
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                  title={collapsed ? label : undefined}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1">{label}</span>
                      {subItems && (
                        expanded
                          ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                          : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                      )}
                    </>
                  )}
                </NavLink>

                {expanded && subItems && (
                  <div className="ml-5 pl-4 border-l border-slate-800 mt-1 mb-2 space-y-0.5">
                    {subItems.map((sub) => (
                      <NavLink
                        key={sub.to}
                        to={sub.to}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-slate-500 hover:text-slate-300 hover:bg-slate-800/50`}
                      >
                        <sub.icon className="w-3.5 h-3.5 shrink-0" />
                        {sub.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User */}
        <div className={`${collapsed ? 'px-3 py-4' : 'px-5 py-5'} border-t border-slate-800`}>
          {!collapsed && (
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-amber-400 shrink-0">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3 h-3 text-slate-500" />
                  <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
                </div>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className={`flex items-center gap-2 w-full ${collapsed ? 'px-3 py-3 justify-center' : 'px-4 py-2.5'} rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer`}
            title={collapsed ? 'Sign Out' : undefined}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && 'Sign Out'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-10 lg:p-12">
          {children}
        </div>
      </main>
    </div>
  );
}
