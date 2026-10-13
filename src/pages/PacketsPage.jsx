import React, { useState } from 'react';
import { useNetwork } from '../context/NetworkContext.jsx';
import NetworkCanvas from '../components/network/NetworkCanvas.jsx';
import { PACKET_STATUS } from '../engine/simulationEngine.js';
import {
  Boxes,
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Send,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Shield,
  HelpCircle
} from 'lucide-react';

export default function PacketsPage() {
  const {
    nodes,
    packets,
    isSimulating,
    simulationSpeed,
    setSimulationSpeed,
    startSimulation,
    pauseSimulation,
    resumeSimulation,
    resetSimulation,
    routingStrategy
  } = useNetwork();

  const [form, setForm] = useState({
    sourceId: 'host-a',
    destinationId: 'server-dest',
    count: 5,
    packetSize: 64, // KB
    priority: 'Normal',
    protocol: 'tcp'
  });

  const handleStart = (e) => {
    e?.preventDefault();
    startSimulation(form);
  };

  const deliveredCount = packets.filter(p => p.status === PACKET_STATUS.DELIVERED).length;
  const inTransitCount = packets.filter(p => p.status === PACKET_STATUS.IN_TRANSIT).length;
  const droppedCount = packets.filter(p => p.status === PACKET_STATUS.DROPPED).length;
  const failedCount = packets.filter(p => p.status === PACKET_STATUS.FAILED).length;
  const reroutedCount = packets.reduce((acc, p) => acc + (p.rerouteCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Boxes className="w-5 h-5 text-blue-600" />
            Discrete Packet Transmission Simulator
          </h2>
          <p className="text-xs text-slate-500">
            Interactive packet-level testbed with in-transit dynamic rerouting and protocol semantics (TCP vs UDP)
          </p>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
            {deliveredCount} Delivered
          </span>
          <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
            {inTransitCount} In Flight
          </span>
          <span className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
            {reroutedCount} Reroutes
          </span>
          {droppedCount + failedCount > 0 && (
            <span className="px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
              {droppedCount + failedCount} Lost
            </span>
          )}
        </div>
      </div>

      {/* Main Grid: Parameters Control (Left) + Live Canvas (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Simulator Controls Form */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="font-semibold text-slate-800 text-xs uppercase tracking-wider">
            Packet Dispatch Settings
          </h3>

          <form onSubmit={handleStart} className="space-y-3.5 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-600 mb-1">Source Device</label>
                <select
                  value={form.sourceId}
                  onChange={e => setForm({ ...form, sourceId: e.target.value })}
                  disabled={isSimulating}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {nodes.map(n => (
                    <option key={n.id} value={n.id}>{n.label || n.id}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">Destination Target</label>
                <select
                  value={form.destinationId}
                  onChange={e => setForm({ ...form, destinationId: e.target.value })}
                  disabled={isSimulating}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {nodes.map(n => (
                    <option key={n.id} value={n.id}>{n.label || n.id}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-600 mb-1">Packet Batch Count</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={form.count}
                  onChange={e => setForm({ ...form, count: Number(e.target.value) })}
                  disabled={isSimulating}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">Packet Payload (KB)</label>
                <input
                  type="number"
                  min="1"
                  max="1024"
                  value={form.packetSize}
                  onChange={e => setForm({ ...form, packetSize: Number(e.target.value) })}
                  disabled={isSimulating}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-600 mb-1">QoS Priority</label>
                <select
                  value={form.priority}
                  onChange={e => setForm({ ...form, priority: e.target.value })}
                  disabled={isSimulating}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Low">Low (Background)</option>
                  <option value="Normal">Normal (Standard)</option>
                  <option value="High">High (Interactive/Voice)</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">Transport Protocol</label>
                <select
                  value={form.protocol}
                  onChange={e => setForm({ ...form, protocol: e.target.value })}
                  disabled={isSimulating}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="tcp">TCP (Reliable, Retransmit)</option>
                  <option value="udp">UDP (Best-Effort)</option>
                </select>
              </div>
            </div>

            {/* Simulation Speed */}
            <div>
              <label className="block font-medium text-slate-600 mb-1">Simulation Speed</label>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 4].map(spd => (
                  <button
                    key={spd}
                    type="button"
                    onClick={() => setSimulationSpeed(spd)}
                    className={`py-1.5 rounded-lg border font-semibold transition-colors ${
                      simulationSpeed === spd
                        ? 'bg-blue-50 border-blue-600 text-blue-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {spd}x Speed
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="submit"
                disabled={isSimulating}
                className={`w-full py-2.5 font-semibold text-white rounded-lg flex items-center justify-center gap-2 shadow-xs transition-transform ${
                  isSimulating
                    ? 'bg-slate-300 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 active:scale-98'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                Dispatch Packet Batch
              </button>

              <div className="grid grid-cols-2 gap-2">
                {isSimulating ? (
                  <button
                    type="button"
                    onClick={pauseSimulation}
                    className="py-1.5 font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center gap-1.5"
                  >
                    <Pause className="w-3.5 h-3.5" />
                    Pause
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={resumeSimulation}
                    disabled={packets.length === 0}
                    className="py-1.5 font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 rounded-lg flex items-center justify-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Resume
                  </button>
                )}

                <button
                  type="button"
                  onClick={resetSimulation}
                  className="py-1.5 font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </button>
              </div>
            </div>
          </form>

          {/* Educational Disclaimer */}
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200/80 text-[11px] text-amber-800 leading-snug">
            <strong>Simulation Model Note:</strong> Packets are discrete simulated mathematical entities with stochastic loss and queue delays. No actual socket operations or external network scanning is performed.
          </div>
        </div>

        {/* Right 2 Columns: Live Network Topology Canvas */}
        <div className="lg:col-span-2 space-y-4">
          <NetworkCanvas height="h-[460px]" />
        </div>
      </div>

      {/* Real-time Packet Feed Table */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-800 text-xs uppercase tracking-wider">
            Live Packet Registry & Telemetry
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            {packets.length} Packets Monitored
          </span>
        </div>

        {packets.length > 0 ? (
          <div className="overflow-x-auto max-h-72 overflow-y-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold sticky top-0 bg-white">
                  <th className="py-2.5 px-3">Packet ID</th>
                  <th className="py-2.5 px-3">Protocol</th>
                  <th className="py-2.5 px-3">Current Hop</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Accumulated Delay</th>
                  <th className="py-2.5 px-3">Reroutes</th>
                  <th className="py-2.5 px-3">Planned Path</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {packets.map(pkt => {
                  let statusBadge = 'bg-slate-100 text-slate-700';
                  if (pkt.status === PACKET_STATUS.DELIVERED) statusBadge = 'bg-emerald-100 text-emerald-800';
                  if (pkt.status === PACKET_STATUS.IN_TRANSIT) statusBadge = 'bg-blue-100 text-blue-800 animate-pulse';
                  if (pkt.status === PACKET_STATUS.DROPPED || pkt.status === PACKET_STATUS.FAILED) statusBadge = 'bg-rose-100 text-rose-800';

                  return (
                    <tr key={pkt.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-slate-800">{pkt.id}</td>
                      <td className="py-2.5 px-3 uppercase text-slate-600">{pkt.protocol}</td>
                      <td className="py-2.5 px-3 font-semibold text-indigo-700">{pkt.currentNode}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${statusBadge}`}>
                          {pkt.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        {pkt.accumulatedDelay > 0 ? `${pkt.accumulatedDelay.toFixed(1)} ms` : '—'}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`font-semibold ${pkt.rerouteCount > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                          {pkt.rerouteCount}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 max-w-xs truncate" title={pkt.plannedPath.join(' ➔ ')}>
                        {pkt.plannedPath.join(' ➔ ')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-400 italic">
            No packets dispatched yet. Configure parameters above and click Dispatch Packet Batch.
          </div>
        )}
      </div>
    </div>
  );
}
