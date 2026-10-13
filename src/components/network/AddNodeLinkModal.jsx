import React, { useState } from 'react';
import { useNetwork } from '../../context/NetworkContext.jsx';
import { PlusCircle, Cpu, Link as LinkIcon, X } from 'lucide-react';

export default function AddNodeLinkModal({ isOpen, onClose }) {
  const { nodes, addNode, addLink } = useNetwork();
  const [tab, setTab] = useState('node'); // 'node' | 'link'
  const [error, setError] = useState('');

  // Node form
  const [nodeForm, setNodeForm] = useState({
    id: '',
    label: '',
    type: 'router',
    ip: '',
    securityScore: 90,
    processingDelay: 2
  });

  // Link form
  const [linkForm, setLinkForm] = useState({
    source: nodes[0]?.id || '',
    target: nodes[1]?.id || '',
    bandwidth: 1000,
    distance: 20,
    delay: 4,
    congestion: 15,
    packetLoss: 0.1,
    reliability: 99.8,
    securityRisk: 5
  });

  if (!isOpen) return null;

  const handleAddNode = (e) => {
    e.preventDefault();
    setError('');
    const res = addNode(nodeForm);
    if (!res.success) {
      setError(res.error);
    } else {
      onClose();
    }
  };

  const handleAddLink = (e) => {
    e.preventDefault();
    setError('');
    const res = addLink(linkForm);
    if (!res.success) {
      setError(res.error);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-slate-800">Add Network Topology Element</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-100 px-5 pt-3 gap-4">
          <button
            onClick={() => { setTab('node'); setError(''); }}
            className={`pb-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
              tab === 'node'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Cpu className="w-4 h-4" />
            New Node (Device)
          </button>
          <button
            onClick={() => { setTab('link'); setError(''); }}
            className={`pb-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
              tab === 'link'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <LinkIcon className="w-4 h-4" />
            New Physical Link
          </button>
        </div>

        {error && (
          <div className="mx-5 mt-4 text-xs bg-red-50 text-red-700 p-2.5 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        {tab === 'node' ? (
          <form onSubmit={handleAddNode} className="p-5 space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Unique Node Identifier</label>
              <input
                type="text"
                placeholder="e.g. router-r6, host-c"
                value={nodeForm.id}
                onChange={e => setNodeForm({ ...nodeForm, id: e.target.value })}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Display Label</label>
              <input
                type="text"
                placeholder="e.g. Backup Router R6"
                value={nodeForm.label}
                onChange={e => setNodeForm({ ...nodeForm, label: e.target.value })}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Device Role</label>
                <select
                  value={nodeForm.type}
                  onChange={e => setNodeForm({ ...nodeForm, type: e.target.value })}
                  className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="router">Router</option>
                  <option value="host">Host PC</option>
                  <option value="server">Cloud Server</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">IP Address</label>
                <input
                  type="text"
                  placeholder="10.0.6.1"
                  value={nodeForm.ip}
                  onChange={e => setNodeForm({ ...nodeForm, ip: e.target.value })}
                  className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Security Score</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={nodeForm.securityScore}
                  onChange={e => setNodeForm({ ...nodeForm, securityScore: e.target.value })}
                  className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Processing Delay (ms)</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={nodeForm.processingDelay}
                  onChange={e => setNodeForm({ ...nodeForm, processingDelay: e.target.value })}
                  className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="text-xs px-3 py-1.5 text-slate-600 hover:text-slate-800 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="text-xs px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm"
              >
                Create Node
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleAddLink} className="p-5 space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Source Node</label>
                <select
                  value={linkForm.source}
                  onChange={e => setLinkForm({ ...linkForm, source: e.target.value })}
                  className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {nodes.map(n => (
                    <option key={n.id} value={n.id}>{n.label || n.id}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Target Node</label>
                <select
                  value={linkForm.target}
                  onChange={e => setLinkForm({ ...linkForm, target: e.target.value })}
                  className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {nodes.map(n => (
                    <option key={n.id} value={n.id}>{n.label || n.id}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Bandwidth (Mbps)</label>
                <input
                  type="number"
                  min="1"
                  value={linkForm.bandwidth}
                  onChange={e => setLinkForm({ ...linkForm, bandwidth: e.target.value })}
                  className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Base Delay (ms)</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.5"
                  value={linkForm.delay}
                  onChange={e => setLinkForm({ ...linkForm, delay: e.target.value })}
                  className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Distance (km)</label>
                <input
                  type="number"
                  min="1"
                  value={linkForm.distance}
                  onChange={e => setLinkForm({ ...linkForm, distance: e.target.value })}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Congestion %</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={linkForm.congestion}
                  onChange={e => setLinkForm({ ...linkForm, congestion: e.target.value })}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Security Risk %</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={linkForm.securityRisk}
                  onChange={e => setLinkForm({ ...linkForm, securityRisk: e.target.value })}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="text-xs px-3 py-1.5 text-slate-600 hover:text-slate-800 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="text-xs px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm"
              >
                Connect Link
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
