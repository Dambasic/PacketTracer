import React from 'react';
import {
  LayoutDashboard,
  Network,
  GitFork,
  Boxes,
  ScrollText,
  BarChart3,
  History,
  Settings,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'network', label: 'Network', icon: Network },
  { id: 'routing', label: 'Routing', icon: GitFork },
  { id: 'packets', label: 'Packets', icon: Boxes },
  { id: 'events', label: 'Events', icon: ScrollText },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'history', label: 'History', icon: History },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ activeTab, onSelectTab }) {
  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col h-screen shrink-0 select-none">
      {/* Brand & Subtitle */}
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 text-sm tracking-tight leading-none">
              INTELLIGENT PACKET ROUTING
            </h1>
            <span className="text-[10px] text-blue-600 font-medium tracking-wide uppercase">
              Adaptive & Security-Aware
            </span>
          </div>
        </div>
        <p className="mt-2 text-[11px] text-slate-500 leading-tight">
          Adaptive, Congestion-Aware and Security-Aware Network Routing
        </p>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-blue-500" />}
            </button>
          );
        })}
      </nav>

      {/* Footer Info Box */}
      <div className="p-3 m-3 bg-slate-50 rounded-lg border border-slate-200/60">
        <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
          <span>Engine Status</span>
          <span className="text-emerald-600 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Active
          </span>
        </div>
        <div className="mt-1.5 text-[10px] text-slate-400">
          Dijkstra Multi-Objective Core
        </div>
      </div>
    </aside>
  );
}
