import React, { useState } from 'react';
import { useNetwork } from '../context/NetworkContext.jsx';
import NetworkCanvas from '../components/network/NetworkCanvas.jsx';
import NodeDetailModal from '../components/network/NodeDetailModal.jsx';
import LinkDetailModal from '../components/network/LinkDetailModal.jsx';
import AddNodeLinkModal from '../components/network/AddNodeLinkModal.jsx';
import { PRESET_SCENARIOS } from '../data/defaultTopology.js';
import {
  Plus,
  RotateCcw,
  Sliders,
  AlertCircle,
  ShieldAlert,
  Flame,
  CheckCircle2,
  Unplug,
  Cpu,
  Link as LinkIcon
} from 'lucide-react';

export default function NetworkPage() {
  const {
    nodes,
    links,
    selectedElement,
    setSelectedElement,
    activeScenarioId,
    applyScenario,
    resetToDefaultTopology,
    toggleNodeStatus,
    toggleLinkStatus
  } = useNetwork();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Inspector modal target
  const inspectedNode = selectedElement?.type === 'node'
    ? nodes.find(n => n.id === selectedElement.data.id) || selectedElement.data
    : null;

  const inspectedLink = selectedElement?.type === 'link'
    ? links.find(l => l.id === selectedElement.data.id) || selectedElement.data
    : null;

  return (
    <div className="space-y-5">
      {/* Page Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-800">Interactive Network Topology Studio</h2>
          <p className="text-xs text-slate-500">
            Click devices or links to inspect, tune metrics, or simulate hardware/fiber outages
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Preset Scenario Selector */}
          <select
            value={activeScenarioId}
            onChange={(e) => applyScenario(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {PRESET_SCENARIOS.map(sc => (
              <option key={sc.id} value={sc.id}>{sc.name}</option>
            ))}
          </select>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Element
          </button>

          <button
            onClick={resetToDefaultTopology}
            className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200/70 rounded-lg flex items-center gap-1.5 transition-colors"
            title="Reset to default topology"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </div>

      {/* Main Studio View */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Network Canvas (3 cols) */}
        <div className="lg:col-span-3">
          <NetworkCanvas height="h-[600px]" onSelectElement={setSelectedElement} />
        </div>

        {/* Selected Element Quick Inspector & Metric Tables (1 col) */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="font-semibold text-slate-800 text-xs uppercase tracking-wider">
              Element Inspector
            </h3>

            {selectedElement ? (
              selectedElement.type === 'node' ? (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <Cpu className="w-4 h-4 text-indigo-600" />
                      {inspectedNode?.label || inspectedNode?.id}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${inspectedNode?.status === 'failed' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {inspectedNode?.status?.toUpperCase()}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Type:</span>
                      <span className="font-medium capitalize">{inspectedNode?.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">IP Address:</span>
                      <span className="font-mono">{inspectedNode?.ip}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Security Score:</span>
                      <span className="font-semibold text-indigo-700">{inspectedNode?.securityScore}/100</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Proc. Delay:</span>
                      <span>{inspectedNode?.processingDelay} ms</span>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                    <button
                      onClick={() => toggleNodeStatus(inspectedNode.id)}
                      className={`w-full py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                        inspectedNode?.status === 'failed'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                      }`}
                    >
                      {inspectedNode?.status === 'failed' ? 'Restore Node' : 'Fail Node (Crash)'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <LinkIcon className="w-4 h-4 text-blue-600" />
                      {inspectedLink?.source} ⇄ {inspectedLink?.target}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${inspectedLink?.status === 'failed' ? 'bg-rose-100 text-rose-700' : (inspectedLink?.congestion >= 70 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700')}`}>
                      {inspectedLink?.status?.toUpperCase()}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Bandwidth:</span>
                      <span className="font-medium">{inspectedLink?.bandwidth} Mbps</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Propagation Delay:</span>
                      <span>{inspectedLink?.delay} ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Congestion:</span>
                      <span className={`font-semibold ${inspectedLink?.congestion >= 70 ? 'text-amber-600' : 'text-slate-700'}`}>
                        {inspectedLink?.congestion}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Packet Loss:</span>
                      <span>{inspectedLink?.packetLoss}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Reliability:</span>
                      <span>{inspectedLink?.reliability}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Security Risk:</span>
                      <span className="text-rose-600 font-semibold">{inspectedLink?.securityRisk}%</span>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                    <button
                      onClick={() => toggleLinkStatus(inspectedLink.id)}
                      className={`w-full py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                        inspectedLink?.status === 'failed'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                      }`}
                    >
                      {inspectedLink?.status === 'failed' ? 'Restore Link' : 'Sever Link (Fiber Cut)'}
                    </button>
                  </div>
                </div>
              )
            ) : (
              <div className="text-xs text-slate-400 py-6 text-center italic">
                Click any device node or connection link on the canvas to inspect and configure its parameters.
              </div>
            )}
          </div>

          {/* Topology Summary Statistics Card */}
          <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs space-y-2 text-xs">
            <h4 className="font-semibold text-slate-800 uppercase tracking-wider text-[11px]">
              Topology Summary
            </h4>
            <div className="flex justify-between text-slate-600">
              <span>Total Nodes:</span>
              <span className="font-semibold text-slate-800">{nodes.length}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Total Links:</span>
              <span className="font-semibold text-slate-800">{links.length}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Avg Link Bandwidth:</span>
              <span className="font-semibold text-slate-800">
                {(links.reduce((acc, l) => acc + l.bandwidth, 0) / (links.length || 1)).toFixed(0)} Mbps
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Failed Elements:</span>
              <span className={`font-semibold ${nodes.filter(n => n.status === 'failed').length + links.filter(l => l.status === 'failed').length > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {nodes.filter(n => n.status === 'failed').length + links.filter(l => l.status === 'failed').length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Node Detail Modal */}
      {inspectedNode && (
        <NodeDetailModal node={inspectedNode} onClose={() => setSelectedElement(null)} />
      )}

      {/* Link Detail Modal */}
      {inspectedLink && (
        <LinkDetailModal link={inspectedLink} onClose={() => setSelectedElement(null)} />
      )}

      {/* Add Node or Link Modal */}
      <AddNodeLinkModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </div>
  );
}
