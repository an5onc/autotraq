import { Link } from 'react-router-dom';
import {
  Gauge,
  Package,
  ScanLine,
  ClipboardList,
  BarChart3,
  Shield,
  Car,
  ArrowRight,
  Github,
  Users,
  Zap,
  Database,
} from 'lucide-react';

const features = [
  {
    icon: Package,
    title: 'Parts Catalog',
    desc: 'SKU-based parts management with conditions, fitments, images, and interchange groups.',
    color: 'amber',
  },
  {
    icon: ScanLine,
    title: 'Barcode System',
    desc: 'Generate and scan barcodes for instant part lookups and user login.',
    color: 'emerald',
  },
  {
    icon: ClipboardList,
    title: 'Request Workflow',
    desc: 'Create, approve, and fulfill part requests with complete status tracking.',
    color: 'blue',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    desc: 'Real-time inventory stats, trend charts, top movers, and dead stock alerts.',
    color: 'purple',
  },
  {
    icon: Shield,
    title: 'Role-Based Access',
    desc: 'Admin, Manager, Fulfillment, and Viewer roles with audit logging.',
    color: 'red',
  },
  {
    icon: Car,
    title: 'Vehicle Fitment',
    desc: 'Map parts to specific year/make/model/trim for accurate inventory.',
    color: 'cyan',
  },
];

const teamMembers = [
  { name: 'Anson Cordeiro', role: 'Lead Developer & Architect', initials: 'AC' },
  { name: 'Agustus Allred', role: 'Backend Developer', initials: 'AA' },
  { name: 'Ben Scarlett', role: 'Frontend Developer', initials: 'BS' },
  { name: 'Dean Carothers', role: 'Database & DevOps', initials: 'DC' },
  { name: 'Fatima Cortez', role: 'Frontend & Data Visualization Developer', initials: 'FC' },
];

const techStack = [
  { name: 'React 18', icon: Zap },
  { name: 'TypeScript', icon: Zap },
  { name: 'Express.js', icon: Database },
  { name: 'MySQL + Prisma', icon: Database },
  { name: 'Tailwind CSS', icon: Zap },
  { name: 'Railway', icon: Database },
];

const colorMap: Record<string, string> = {
  amber: 'bg-amber-500/10 text-amber-400',
  emerald: 'bg-emerald-500/10 text-emerald-400',
  blue: 'bg-blue-500/10 text-blue-400',
  purple: 'bg-purple-500/10 text-purple-400',
  red: 'bg-red-500/10 text-red-400',
  cyan: 'bg-cyan-500/10 text-cyan-400',
};

export function WelcomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center">
              <Gauge className="w-5 h-5 text-slate-900" />
            </div>
            <span className="text-lg font-black tracking-widest">AUTOTRAQ</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#features" className="text-sm text-slate-400 hover:text-white transition-colors hidden sm:block">Features</a>
            <a href="#team" className="text-sm text-slate-400 hover:text-white transition-colors hidden sm:block">Team</a>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-sm rounded-xl transition-colors"
            >
              Sign In
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative w-full pt-32 pb-20 px-6 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(245,158,11,0.15),_transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(245,158,11,0.08),_transparent_50%)]" />
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `repeating-linear-gradient(90deg, #fff 0px, #fff 1px, transparent 1px, transparent 80px),
                                repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 80px)`,
            }}
          />
        </div>

        <div className="relative w-full max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-sm font-medium mb-8">
            <Gauge className="w-4 h-4" />
            Automotive Parts Inventory System
          </div>

          <h1 className="text-5xl sm:text-7xl font-black tracking-tight mb-6">
            <span className="text-white">Precision Parts.</span>
            <br />
            <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">Total Control.</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            A full-stack inventory management system built for real-world automotive warehouse workflows.
            Track parts, manage requests, scan barcodes, and analyze stock — all in one place.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/login"
              className="inline-flex items-center gap-3 px-8 py-4 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-base rounded-xl transition-colors shadow-lg shadow-amber-500/20"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="https://github.com/an5onc/autotraq"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-8 py-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-medium text-base rounded-xl transition-colors"
            >
              <Github className="w-5 h-5" />
              View Source
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Built for the Shop Floor</h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Every feature designed with real warehouse workflows in mind.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors"
              >
                <div className={`w-12 h-12 rounded-xl ${colorMap[f.color]} flex items-center justify-center mb-4`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-16 px-6 border-t border-slate-800/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-8">Tech Stack</h2>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {techStack.map((t) => (
              <span
                key={t.name}
                className="px-5 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-sm text-slate-300 font-medium"
              >
                {t.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section id="team" className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Users className="w-5 h-5 text-amber-400" />
            <h2 className="text-3xl font-bold">The Team</h2>
          </div>
          <p className="text-slate-400 mb-12">
            Built at University of Northern Colorado, 2025–2026
          </p>

          <div className="flex flex-wrap items-center justify-center gap-6">
            {teamMembers.map((m) => (
              <div
                key={m.name}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-64 hover:border-amber-500/30 transition-colors"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center mx-auto mb-4 text-xl font-bold text-slate-900">
                  {m.initials}
                </div>
                <h3 className="text-lg font-semibold text-white">{m.name}</h3>
                <p className="text-sm text-slate-400 mt-1">{m.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 border-t border-slate-800/50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to dive in?</h2>
          <p className="text-slate-400 mb-8">Sign in to start managing your inventory.</p>
          <Link
            to="/login"
            className="inline-flex items-center gap-3 px-8 py-4 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-base rounded-xl transition-colors shadow-lg shadow-amber-500/20"
          >
            Sign In to AutoTraq
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-slate-800/50">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-amber-500 rounded-lg flex items-center justify-center">
              <Gauge className="w-3.5 h-3.5 text-slate-900" />
            </div>
            <span className="text-sm font-bold tracking-wider text-slate-400">AUTOTRAQ</span>
          </div>
          <p className="text-xs text-slate-600">© {new Date().getFullYear()} AutoTraq · University of Northern Colorado</p>
        </div>
      </footer>
    </div>
  );
}

export default WelcomePage;
