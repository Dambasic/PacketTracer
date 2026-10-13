import React from 'react';
import { useNetwork } from '../context/NetworkContext.jsx';
import { DEFAULT_WEIGHTS, ROUTING_STRATEGIES } from '../engine/routingEngine.js';
import {
  Settings,
  RotateCcw,
  Trash2,
  BookOpen,
  Sliders,
  ShieldCheck,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

export default function SettingsPage() {
  const {
    weights,
    setWeights,
    resetToDefaultTopology,
    clearHistory,
    simulationParams,
    setSimulationParams
  } = useNetwork();

  const handleResetWeights = () => {
    setWeights(DEFAULT_WEIGHTS);
  };

  const handleResetAllData = () => {
    if (window.confirm('Reset all network topology, preferences, and local data back to initial baseline?')) {
      resetToDefaultTopology();
      setWeights(DEFAULT_WEIGHTS);
      clearHistory();
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600" />
          System Settings & PBL Educational Theory
        </h2>
        <p className="text-xs text-slate-500">
          Configure default simulation thresholds, manage local cache, and inspect mathematical algorithms
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Defaults & Data Management */}
        <div className="space-y-6">
          {/* Default Simulation Settings */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-semibold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-600" />
              Default Simulation Parameters
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-medium text-slate-600 mb-1">Default Batch Size</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={simulationParams.count}
                  onChange={e => setSimulationParams({ ...simulationParams, count: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">Default Payload (KB)</label>
                <input
                  type="number"
                  min="1"
                  max="1024"
                  value={simulationParams.packetSize}
                  onChange={e => setSimulationParams({ ...simulationParams, packetSize: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-medium text-slate-600 mb-1">Default Protocol</label>
                <select
                  value={simulationParams.protocol}
                  onChange={e => setSimulationParams({ ...simulationParams, protocol: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="tcp">TCP (Reliable, Retransmit)</option>
                  <option value="udp">UDP (Best-Effort)</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">Default Priority</label>
                <select
                  value={simulationParams.priority}
                  onChange={e => setSimulationParams({ ...simulationParams, priority: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Low">Low</option>
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>
          </div>

          {/* Reset & Storage Clear */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs space-y-3.5">
            <h3 className="font-semibold text-slate-800 text-xs uppercase tracking-wider text-rose-600 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-600" />
              Data & State Management
            </h3>
            <p className="text-xs text-slate-500">
              Clear saved topologies, factor weights, and run archives from browser localStorage.
            </p>

            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={handleResetWeights}
                className="w-full py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Factor Weights to Defaults
              </button>
              <button
                onClick={handleResetAllData}
                className="w-full py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Factory Reset All Local Data & Topology
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Educational PBL Knowledge Base */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="font-semibold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-600" />
            Algorithmic Reference & Mathematical Models
          </h3>

          <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/70">
              <span className="font-bold text-slate-800 block text-xs mb-1">
                1. Modified Dijkstra Multi-Objective Routing
              </span>
              <p>
                Unlike standard shortest path that sums link distance \(d\), our engine constructs a composite non-negative cost function:
              </p>
              <code className="block my-1.5 p-2 bg-white rounded border border-slate-200 font-mono text-[10px] text-blue-800">
                Cost(e) = w_dist*D + w_delay*L + w_cong*C + w_loss*P + w_rel*U + w_sec*S
              </code>
              <p className="text-[11px] text-slate-500">
                Where all components are normalized into [0, 1] bounds and factor weights satisfy \(\sum w_i = 1\).
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/70">
              <span className="font-bold text-slate-800 block text-xs mb-1">
                2. Non-Linear Queuing Delay Model (M/M/1 Approximation)
              </span>
              <p>
                As link utilization \(\rho \to 100\%\), queuing delay exhibits asymptotic growth. The engine models effective latency as:
              </p>
              <code className="block my-1.5 p-2 bg-white rounded border border-slate-200 font-mono text-[10px] text-indigo-800">
                EffectiveDelay = Delay_base * (1 + (Congestion / (100 - Congestion)) * 0.5)
              </code>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/70">
              <span className="font-bold text-slate-800 block text-xs mb-1">
                3. Dynamic In-Flight Rerouting Mechanism
              </span>
              <p>
                When a link fails or experiences congestion while a packet is in transit, the packet triggers a localized path recalculation starting from its <strong>current node</strong> to the original destination. It does not restart from the source, preserving forward progress and eliminating duplicate transmission overhead.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
