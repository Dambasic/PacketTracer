import React from 'react';
import { useNetwork } from '../context/NetworkContext.jsx';
import NetworkCanvas from '../components/network/NetworkCanvas.jsx';
import {
  Activity,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  Unplug,
  Search,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Send
} from 'lucide-react';

export default function DashboardPage({ onNavigate, onOpenGuidedDemo }) {
  const {
    nodes,
    links,
    activeRoute,
    calculateRoute,
    sessionStats,
    events,
    applyScenario,
    activeScenarioId,
    startSimulation,
    isSimulating
  } = useNetwork();

  // Compute live metrics from application state
  const onlineNodes = nodes.filter(n => n.status !== 'failed').length;
  const operationalLinks = links.filter(l => l.status !== 'failed').length;
  const failedLinks = links.filter(l => l.status === 'failed').length;
  const failedNodes = nodes.filter(n => n.status === 'failed').length;
  const congestedLinks = links.filter(l => l.congestion >= 70).length;
  const totalIssues = failedLinks + failedNodes + congestedLinks;

  const pdr = sessionStats.totalSent > 0
    ? ((sessionStats.delivered / sessionStats.totalSent) * 100).toFixed(1)
    : '100.0';

  const avgLatency = activeRoute?.metrics?.totalDelay
    ? `${activeRoute.metrics.totalDelay} ms`
    : (sessionStats.avgDelay > 0 ? `${sessionStats.avgDelay.toFixed(1)} ms` : '18.4 ms');

  return (
    <div className="space-y-6">
      {/* Top Welcome & Objective Bar */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            Adaptive Network Engineering PBL System
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Intelligent Packet Routing Dashboard
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-blue-100/90 leading-relaxed">
            Multi-criteria routing dynamically bypasses high-congestion bottlenecks, fiber failures, and compromised transit nodes using weighted Dijkstra optimization.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={() => calculateRoute()}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white text-xs font-semibold rounded-lg flex items-center gap-2 shadow-sm transition-transform active:scale-95"
            >
              <Search className="w-3.5 h-3.5" />
              Find Best Route Now
            </button>
            <button
              onClick={onOpenGuidedDemo}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-lg flex items-center gap-2 border border-white/20 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Launch Guided PBL Walkthrough
            </button>
          </div>
        </div>
      </div>

      {/* 4 Primary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Network Status */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Network Status</span>
            <div className={`p-2 rounded-lg ${totalIssues === 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-800">
              {totalIssues === 0 ? 'Healthy' : (failedLinks > 0 || failedNodes > 0 ? 'Degraded' : 'Congested')}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
              <span className="font-medium text-slate-700">{onlineNodes}/{nodes.length}</span> nodes,{' '}
              <span className="font-medium text-slate-700">{operationalLinks}/{links.length}</span> links active
            </div>
          </div>
        </div>

        {/* Metric 2: Packets Delivered */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Packet Delivery Ratio</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-800">{pdr}%</div>
            <div className="mt-1 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">{sessionStats.delivered}</span> delivered / {sessionStats.totalSent} sent
            </div>
          </div>
        </div>

        {/* Metric 3: Average Delay */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Average Path Delay</span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-800">{avgLatency}</div>
            <div className="mt-1 text-xs text-slate-500">
              Active route hop count: <span className="font-semibold text-slate-700">{activeRoute?.hopCount || 3}</span> hops
            </div>
          </div>
        </div>

        {/* Metric 4: Active Network Issues */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Active Network Issues</span>
            <div className={`p-2 rounded-lg ${totalIssues > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'}`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-800">{totalIssues}</div>
            <div className="mt-1 text-xs text-slate-500">
              {failedLinks + failedNodes} offline, {congestedLinks} saturated links
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Canvas & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Interactive Topology Canvas */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-800 text-sm">Live Network Topology Preview</h3>
              <p className="text-xs text-slate-500">
                Interactive node layout with live congestion indicators and real-time packet transit
              </p>
            </div>
            <button
              onClick={() => onNavigate('network')}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 hover:underline"
            >
              Full Topology Editor
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <NetworkCanvas height="h-[380px]" />

          {/* Quick Simulation Bar below canvas */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-600">Quick Injections:</span>
              <button
                onClick={() => applyScenario('high-congestion')}
                className={`px-2.5 py-1 text-xs rounded-md border transition-colors flex items-center gap-1 ${
                  activeScenarioId === 'high-congestion'
                    ? 'bg-amber-500 text-white border-amber-600'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Flame className="w-3 h-3 text-amber-500" />
                92% Congestion
              </button>
              <button
                onClick={() => applyScenario('link-failure')}
                className={`px-2.5 py-1 text-xs rounded-md border transition-colors flex items-center gap-1 ${
                  activeScenarioId === 'link-failure'
                    ? 'bg-rose-500 text-white border-rose-600'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Unplug className="w-3 h-3 text-rose-500" />
                Sever Link R1-R2
              </button>
            </div>

            <button
              onClick={() => startSimulation({ count: 5 })}
              disabled={isSimulating}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg text-white flex items-center gap-1.5 transition-colors ${
                isSimulating
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-xs'
              }`}
            >
              <Send className="w-3 h-3" />
              {isSimulating ? 'Simulation Running...' : 'Dispatch 5 Packets'}
            </button>
          </div>
        </div>

        {/* Right Col: Active Route Summary & Recent Events */}
        <div className="space-y-6">
          {/* Active Route Summary Card */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-800 text-sm">Active Calculated Route</h3>
              <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                {activeRoute?.strategy || 'balanced'}
              </span>
            </div>

            {activeRoute?.success ? (
              <div className="space-y-3">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 font-mono text-xs text-slate-800 flex items-center flex-wrap gap-1.5">
                  {activeRoute.path.map((nodeId, idx) => (
                    <React.Fragment key={nodeId}>
                      <span className="font-semibold text-blue-700">{nodeId}</span>
                      {idx < activeRoute.path.length - 1 && (
                        <span className="text-slate-400">➔</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-slate-50 rounded-lg">
                    <span className="text-slate-500 block text-[11px]">Est. Total Delay</span>
                    <span className="font-bold text-slate-800">{activeRoute.metrics.totalDelay} ms</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg">
                    <span className="text-slate-500 block text-[11px]">Max Congestion</span>
                    <span className={`font-bold ${activeRoute.metrics.maxCongestion > 70 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {activeRoute.metrics.maxCongestion}%
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg">
                    <span className="text-slate-500 block text-[11px]">Packet Loss</span>
                    <span className="font-bold text-slate-800">{activeRoute.metrics.cumulativeLoss}%</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg">
                    <span className="text-slate-500 block text-[11px]">Security Score</span>
                    <span className="font-bold text-indigo-700">{activeRoute.metrics.overallSecurityScore}/100</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 bg-blue-50/50 p-2.5 rounded-lg border border-blue-100 leading-relaxed">
                  {activeRoute.explanation}
                </p>
              </div>
            ) : (
              <div className="p-4 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-200">
                {activeRoute?.reason || 'No path calculated yet. Click Find Best Route.'}
              </div>
            )}
          </div>

          {/* Recent Network Events Feed */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-800 text-sm">Recent Network Events</h3>
              <button
                onClick={() => onNavigate('events')}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline"
              >
                View All
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {events.slice(0, 5).map(ev => (
                <div
                  key={ev.id}
                  className="p-2 rounded-lg border border-slate-100 bg-slate-50/60 text-xs space-y-0.5"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-700">{ev.type}</span>
                    <span className="text-slate-400 font-mono text-[10px]">{ev.timestamp}</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-snug truncate">{ev.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
