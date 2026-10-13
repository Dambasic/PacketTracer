import React, { useState, useEffect } from 'react';
import { useNetwork } from '../../context/NetworkContext.jsx';
import { Activity, Power, Trash2, X, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function LinkDetailModal({ link, onClose }) {
  const { updateLink, toggleLinkStatus, removeLink } = useNetwork();
  const [formData, setFormData] = useState({ ...link });

  useEffect(() => {
    setFormData({ ...link });
  }, [link]);

  if (!link) return null;

  const handleSave = (e) => {
    e.preventDefault();
    updateLink({
      ...formData,
      bandwidth: Math.max(1, Number(formData.bandwidth)),
      distance: Math.max(1, Number(formData.distance)),
      delay: Math.max(0.1, Number(formData.delay)),
      congestion: Math.min(100, Math.max(0, Number(formData.congestion))),
      packetLoss: Math.min(100, Math.max(0, Number(formData.packetLoss))),
      reliability: Math.min(100, Math.max(0, Number(formData.reliability))),
      securityRisk: Math.min(100, Math.max(0, Number(formData.securityRisk)))
    });
    onClose();
  };

  const handleToggleFailure = () => {
    toggleLinkStatus(link.id);
    onClose();
  };

  const handleDelete = () => {
    removeLink(link.id);
    onClose();
  };

  const isFailed = link.status === 'failed';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-semibold text-slate-800">Physical Link Settings</h3>
              <p className="text-xs text-slate-500 font-mono">
                {link.source} ⇄ {link.target}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Bandwidth Capacity (Mbps)
              </label>
              <input
                type="number"
                min="1"
                value={formData.bandwidth}
                onChange={e => setFormData({ ...formData, bandwidth: e.target.value })}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Base Propagation Delay (ms)
              </label>
              <input
                type="number"
                min="0.1"
                step="0.5"
                value={formData.delay}
                onChange={e => setFormData({ ...formData, delay: e.target.value })}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Physical Distance (km)
              </label>
              <input
                type="number"
                min="1"
                value={formData.distance}
                onChange={e => setFormData({ ...formData, distance: e.target.value })}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Congestion Queue (%)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.congestion}
                  onChange={e => setFormData({ ...formData, congestion: e.target.value })}
                  className="w-full accent-amber-500"
                />
                <span className="text-xs font-mono font-medium w-9 text-right text-slate-700">
                  {formData.congestion}%
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Packet Loss (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.packetLoss}
                onChange={e => setFormData({ ...formData, packetLoss: e.target.value })}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Reliability (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.05"
                value={formData.reliability}
                onChange={e => setFormData({ ...formData, reliability: e.target.value })}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Security Risk (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.securityRisk}
                onChange={e => setFormData({ ...formData, securityRisk: e.target.value })}
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
              {isFailed ? 'Restore Link to Operational' : 'Sever Link (Simulate Fiber Cut / Failure)'}
            </button>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleDelete}
              className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-rose-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Link
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
