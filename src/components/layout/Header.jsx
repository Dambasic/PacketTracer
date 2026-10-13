import React from 'react';
import { useNetwork } from '../../context/NetworkContext.jsx';
import {
  Sparkles,
  Flame,
  Unplug,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle
} from 'lucide-react';

export default function Header({ onOpenGuidedDemo }) {
  const {
    nodes,
    links,
    calculateRoute,
    applyScenario,
    resetToDefaultTopology,
    activeScenarioId
  } = useNetwork();

  const failedCount = nodes.filter(n => n.status === 'failed').length +
                      links.filter(l => l.status === 'failed').length;
  const congestedCount = links.filter(l => l.congestion >= 70).length;

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between shrink-0 select-none">
      {/* Left: Mode & Status Indicator */}
      <div className="flex items-center gap-3">
        {/* Demo Mode Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200/70 text-amber-800 text-[11px] font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          <span>Demo Mode (Simulated Network)</span>
        </div>

        {/* Network Health Status */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600 border-l border-slate-200 pl-3">
          {failedCount > 0 ? (
            <span className="flex items-center gap-1 text-rose-600 font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              {failedCount} Issue{failedCount > 1 ? 's' : ''} Active
            </span>
          ) : congestedCount > 0 ? (
            <span className="flex items-center gap-1 text-amber-600 font-medium">
              <Flame className="w-3.5 h-3.5" />
              {congestedCount} Congested Link{congestedCount > 1 ? 's' : ''}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-emerald-600 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              All Systems Operational
            </span>
          )}
        </div>
      </div>

      {/* Right: Quick Actions */}
      <div className="flex items-center gap-2">
        {/* Quick Scenario Toggles */}
        <div className="hidden md:flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => applyScenario('high-congestion')}
            className={`px-2.5 py-1 text-xs rounded font-medium flex items-center gap-1 transition-colors ${
              activeScenarioId === 'high-congestion'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
            title="Inject 90% congestion on primary backbone link"
          >
            <Flame className="w-3 h-3" />
            Congestion
          </button>
          <button
            onClick={() => applyScenario('link-failure')}
            className={`px-2.5 py-1 text-xs rounded font-medium flex items-center gap-1 transition-colors ${
              activeScenarioId === 'link-failure'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
            title="Cut physical fiber link R1-R2"
          >
            <Unplug className="w-3 h-3" />
            Link Cut
          </button>
          <button
            onClick={resetToDefaultTopology}
            className="px-2 py-1 text-xs text-slate-500 hover:text-slate-800 rounded hover:bg-slate-200/60 transition-colors"
            title="Restore default topology"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>

        {/* Guided PBL Walkthrough Button */}
        <button
          onClick={onOpenGuidedDemo}
          className="px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/70 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span className="hidden sm:inline">PBL Walkthrough</span>
        </button>

        {/* Find Best Route Primary CTA */}
        <button
          onClick={() => calculateRoute()}
          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5 shadow-sm shadow-blue-500/20 transition-all hover:scale-[1.01]"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Find Best Route</span>
        </button>
      </div>
    </header>
  );
}
