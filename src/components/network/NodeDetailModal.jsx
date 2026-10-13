import React, { useState, useEffect } from 'react';
import { useNetwork } from '../../context/NetworkContext.jsx';
import { Shield, Power, Trash2, Cpu, Activity, X } from 'lucide-react';

export default function NodeDetailModal({ node, onClose }) {
  const { updateNode, toggleNodeStatus, removeNode } = useNetwork();
  const [formData, setFormData] = useState({ ...node });
  const [error, setError] = useState('');

  useEffect(() => {
    setFormData({ ...node });
  }, [node]);

  if (!node) return null;

  const handleSave = (e) => {
    e.preventDefault();
    updateNode({
      ...formData,
      securityScore: Math.min(100, Math.max(0, Number(formData.securityScore))),
      processingDelay: Math.max(0, Number(formData.processingDelay))
    });
    onClose();
  };

  const handleToggleFailure = () => {
    toggleNodeStatus(node.id);
    onClose();
  };

  const handleDelete = () => {
    const res = removeNode(node.id);
    if (!res.success) {
      setError(res.error);
    } else {
      onClose();
    }
  };

  const isFailed = node.status === 'failed';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-slate-800">Node Properties</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-4">
          {error && (
            <div className="text-xs bg-red-50 text-red-700 p-2.5 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Node Label</label>
            <input
              type="text"
              value={formData.label}
              onChange={e => setFormData({ ...formData, label: e.target.value })}
              className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Device Role</label>
              <select
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="host">Host PC</option>
                <option value="router">Router</option>
                <option value="server">Cloud Server</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">IP Address</label>
              <input
                type="text"
                value={formData.ip || ''}
                onChange={e => setFormData({ ...formData, ip: e.target.value })}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Security Score (0-100)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.securityScore}
                onChange={e => setFormData({ ...formData, securityScore: e.target.value })}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Processing Delay (ms)
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={formData.processingDelay}
                onChange={e => setFormData({ ...formData, processingDelay: e.target.value })}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button
              type="button"
              onClick={handleToggleFailure}
              className={`w-full py-2 px-3 text-xs font-medium rounded-lg flex items-center justify-center gap-2 transition-colors ${
                isFailed
                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              {isFailed ? 'Restore Node to Online' : 'Simulate Hardware Outage (Fail Node)'}
            </button>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleDelete}
              className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-rose-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remove Node
            </button>
            <div className="flex items-center gap-2">
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
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
