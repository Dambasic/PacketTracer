import React, { useState } from 'react';
import { useNetwork } from '../context/NetworkContext.jsx';
import {
  ROUTING_STRATEGIES,
  DEFAULT_WEIGHTS,
  normalizeWeights
} from '../engine/routingEngine.js';
import {
  GitFork,
  Sliders,
  Shield,
  Activity,
  Zap,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  Layers,
  Info
} from 'lucide-react';

export default function RoutingPage() {
  const {
    nodes,
    links,
    weights,
    setWeights,
    routingStrategy,
    setRoutingStrategy,
    activeRoute,
    calculateRoute,
    routeEndpoints,
    setRouteEndpoints
  } = useNetwork();

  const [srcNode, setSrcNode] = useState(routeEndpoints.sourceId || 'host-a');
  const [dstNode, setDstNode] = useState(routeEndpoints.destinationId || 'server-dest');

  const normalizedWeights = normalizeWeights(weights);

  const handleWeightChange = (key, val) => {
    const updated = {
      ...weights,
      [key]: Math.max(0, Number(val))
    };
    setWeights(updated);
  };

  const handleExecuteRouting = (e) => {
    e?.preventDefault();
    setRouteEndpoints({ sourceId: srcNode, destinationId: dstNode });
    calculateRoute(srcNode, dstNode, routingStrategy, weights);
  };

  const strategyDescriptions = {
    [ROUTING_STRATEGIES.SHORTEST_DISTANCE]: 'Minimizes physical fiber length (km) or hop count. Traditional static routing behavior (RIP/OSPF base metric).',
    [ROUTING_STRATEGIES.LOWEST_DELAY]: 'Minimizes cumulative round-trip latency including propagation and router processing queues.',
    [ROUTING_STRATEGIES.CONGESTION_AWARE]: 'Actively detours around saturated links (>70% queue) to eliminate bufferbloat and packet drops.',
    [ROUTING_STRATEGIES.RELIABILITY_AWARE]: 'Maximizes compound link uptime and avoids high packet loss lines for mission-critical telemetry.',
    [ROUTING_STRATEGIES.SECURITY_AWARE]: 'Strictly steers traffic through certified trusted routers and avoids vulnerable/unencrypted segments.',
    [ROUTING_STRATEGIES.BALANCED]: 'Weighted multi-objective optimization balancing latency, congestion avoidance, reliability, and security.'
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <GitFork className="w-5 h-5 text-blue-600" />
            Intelligent Multi-Criteria Routing Engine
          </h2>
          <p className="text-xs text-slate-500">
            Dijkstra shortest path algorithm with multi-objective cost functions and dynamic weight normalization
          </p>
        </div>

        {/* Source & Destination Selector Form */}
        <form onSubmit={handleExecuteRouting} className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
            <span className="text-slate-400 font-medium">From:</span>
            <select
              value={srcNode}
              onChange={e => setSrcNode(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              {nodes.map(n => (
                <option key={n.id} value={n.id}>{n.label || n.id}</option>
              ))}
            </select>
          </div>

          <span className="text-slate-400 text-xs">➔</span>

          <div className="flex items-center gap-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
            <span className="text-slate-400 font-medium">To:</span>
            <select
              value={dstNode}
              onChange={e => setDstNode(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              {nodes.map(n => (
                <option key={n.id} value={n.id}>{n.label || n.id}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            Compute Route
          </button>
        </form>
      </div>

      {/* Main Grid: Strategy & Weights (Left) + Route Results (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Strategy Selector & Weight Tuning */}
        <div className="space-y-6">
          {/* Strategy Card */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs space-y-3.5">
            <h3 className="font-semibold text-slate-800 text-xs uppercase tracking-wider">
              1. Routing Strategy Objective
            </h3>
            <div className="space-y-2">
              {Object.entries(strategyDescriptions).map(([stratKey, desc]) => {
                const isSelected = routingStrategy === stratKey;
                return (
                  <button
                    key={stratKey}
                    onClick={() => {
                      setRoutingStrategy(stratKey);
                      calculateRoute(srcNode, dstNode, stratKey, weights);
                    }}
                    className={`w-full text-left p-3 rounded-lg border text-xs transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 text-blue-900 shadow-xs'
                        : 'border-slate-200/80 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between font-semibold capitalize">
                      <span>{stratKey.replace('-', ' ')}</span>
                      {isSelected && <CheckCircle className="w-4 h-4 text-blue-600" />}
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500 leading-snug">{desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Factor Weights Customizer (Active when Balanced strategy selected) */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-800 text-xs uppercase tracking-wider">
                  2. Balanced Cost Weights
                </h3>
                <p className="text-[11px] text-slate-500">Auto-normalized dynamically (Sum = 1.0)</p>
              </div>
              <button
                onClick={() => setWeights(DEFAULT_WEIGHTS)}
                className="text-[11px] text-blue-600 hover:text-blue-700 font-medium hover:underline"
              >
                Reset Defaults
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {[
                { key: 'distance', label: 'Physical Distance' },
                { key: 'delay', label: 'Propagation & Queuing Delay' },
                { key: 'congestion', label: 'Link Congestion Penalty' },
                { key: 'packetLoss', label: 'Packet Loss Sensitivity' },
                { key: 'reliability', label: 'Uptime / Reliability Weight' },
                { key: 'securityRisk', label: 'Security Risk Penalty' }
              ].map(({ key, label }) => (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between text-slate-700">
                    <span>{label}</span>
                    <span className="font-mono font-semibold text-blue-700">
                      {(normalizedWeights[key] * 100).toFixed(0)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={weights[key] ?? 0.2}
                    onChange={e => handleWeightChange(key, e.target.value)}
                    className="w-full accent-blue-600"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 2 Columns: Calculated Route Details, Baseline Comparison & Explanation */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Route Overview Card */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                  Calculation Result
                </span>
                <h3 className="text-base font-bold text-slate-800 capitalize">
                  {routingStrategy.replace('-', ' ')} Route
                </h3>
              </div>
              {activeRoute?.success && (
                <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Cost Score: {activeRoute.totalCost}
                </span>
              )}
            </div>

            {activeRoute?.success ? (
              <div className="space-y-4">
                {/* Visual Path Flow */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="block text-[11px] text-slate-500 font-medium mb-2">Traversed Sequence:</span>
                  <div className="flex items-center flex-wrap gap-2 font-mono text-xs">
                    {activeRoute.nodes.map((node, idx) => (
                      <React.Fragment key={node.id}>
                        <div className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 shadow-xs flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${node.type === 'host' ? 'bg-sky-500' : (node.type === 'server' ? 'bg-purple-500' : 'bg-indigo-500')}`} />
                          <span className="font-semibold text-slate-800">{node.label || node.id}</span>
                        </div>
                        {idx < activeRoute.nodes.length - 1 && (
                          <span className="text-slate-400 font-bold">➔</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* Key Path Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60">
                    <span className="text-slate-500 block text-[11px]">Total Latency</span>
                    <span className="text-base font-bold text-slate-800">{activeRoute.metrics.totalDelay} ms</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{activeRoute.hopCount} physical hops</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60">
                    <span className="text-slate-500 block text-[11px]">Max Congestion</span>
                    <span className={`text-base font-bold ${activeRoute.metrics.maxCongestion >= 70 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {activeRoute.metrics.maxCongestion}%
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Avg: {activeRoute.metrics.avgCongestion}%</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60">
                    <span className="text-slate-500 block text-[11px]">Compound Reliability</span>
                    <span className="text-base font-bold text-emerald-600">{activeRoute.metrics.overallReliability}%</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Loss: {activeRoute.metrics.cumulativeLoss}%</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60">
                    <span className="text-slate-500 block text-[11px]">Security Rating</span>
                    <span className="text-base font-bold text-indigo-700">{activeRoute.metrics.overallSecurityScore}/100</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Trust Certified</span>
                  </div>
                </div>

                {/* Algorithmic Rationale / Explanation */}
                <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200/80 text-xs text-blue-900 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5 text-blue-950">
                    <Info className="w-3.5 h-3.5 text-blue-600" />
                    Why was this route selected?
                  </div>
                  <p className="leading-relaxed text-blue-800">{activeRoute.explanation}</p>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-rose-50 rounded-xl border border-rose-200 text-rose-800 text-xs space-y-2">
                <div className="font-bold flex items-center gap-1.5 text-rose-900 text-sm">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Route Calculation Failed
                </div>
                <p>{activeRoute?.reason || 'Select operational endpoints and click Compute Route.'}</p>
              </div>
            )}
          </div>

          {/* Baseline vs Intelligent Route Comparison Card */}
          {activeRoute?.baselineComparison && (
            <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Baseline vs Intelligent Comparison</h3>
                  <p className="text-xs text-slate-500">
                    Quantified advantages of multi-criteria routing over static shortest-distance routing
                  </p>
                </div>
                <span className="text-xs font-semibold px-2 py-1 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Performance Differential
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">Delay Differential</span>
                  <div className={`text-base font-bold ${activeRoute.baselineComparison.delaySaved >= 0 ? 'text-emerald-600' : 'text-slate-700'}`}>
                    {activeRoute.baselineComparison.delaySaved > 0 ? `-${activeRoute.baselineComparison.delaySaved} ms` : `+${Math.abs(activeRoute.baselineComparison.delaySaved)} ms`}
                  </div>
                  <span className="text-[10px] text-slate-400">vs baseline {activeRoute.baselineComparison.baselineMetrics.totalDelay} ms</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">Congestion Avoided</span>
                  <div className={`text-base font-bold ${activeRoute.baselineComparison.congestionAvoided > 0 ? 'text-emerald-600' : 'text-slate-700'}`}>
                    {activeRoute.baselineComparison.congestionAvoided > 0 ? `-${activeRoute.baselineComparison.congestionAvoided}%` : '0%'}
                  </div>
                  <span className="text-[10px] text-slate-400">baseline peak {activeRoute.baselineComparison.baselineMetrics.maxCongestion}%</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">Security Boost</span>
                  <div className={`text-base font-bold ${activeRoute.baselineComparison.securityImprovement > 0 ? 'text-indigo-600' : 'text-slate-700'}`}>
                    {activeRoute.baselineComparison.securityImprovement > 0 ? `+${activeRoute.baselineComparison.securityImprovement}` : '0'} pts
                  </div>
                  <span className="text-[10px] text-slate-400">vs baseline {activeRoute.baselineComparison.baselineMetrics.overallSecurityScore}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">Loss Reduction</span>
                  <div className="text-base font-bold text-emerald-600">
                    {activeRoute.baselineComparison.packetLossReduction > 0 ? `-${activeRoute.baselineComparison.packetLossReduction}%` : '0%'}
                  </div>
                  <span className="text-[10px] text-slate-400">fewer dropped packets</span>
                </div>
              </div>
            </div>
          )}

          {/* Traversed Links Breakdown Table */}
          {activeRoute?.success && (
            <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs space-y-3">
              <h3 className="font-semibold text-slate-800 text-xs uppercase tracking-wider">
                Traversed Hop Hop-by-Hop Telemetry
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                      <th className="py-2 px-3">Segment</th>
                      <th className="py-2 px-3">Delay</th>
                      <th className="py-2 px-3">Congestion</th>
                      <th className="py-2 px-3">Reliability</th>
                      <th className="py-2 px-3">Security Risk</th>
                      <th className="py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {activeRoute.links.map(l => (
                      <tr key={l.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-semibold text-slate-800">{l.source} ⇄ {l.target}</td>
                        <td className="py-2 px-3 text-slate-600">{l.delay} ms</td>
                        <td className="py-2 px-3">
                          <span className={`font-semibold ${l.congestion >= 70 ? 'text-amber-600' : 'text-slate-700'}`}>
                            {l.congestion}%
                          </span>
                        </td>
                        <td className="py-2 px-3 text-emerald-600">{l.reliability}%</td>
                        <td className="py-2 px-3 text-slate-600">{l.securityRisk}%</td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
                            OPERATIONAL
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
