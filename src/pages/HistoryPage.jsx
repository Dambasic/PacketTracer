import React, { useState } from 'react';
import { useNetwork } from '../context/NetworkContext.jsx';
import {
  History,
  Trash2,
  Download,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Boxes,
  Clock,
  ArrowRight
} from 'lucide-react';

export default function HistoryPage() {
  const { history, clearHistory, exportHistoryCSV } = useNetwork();
  const [selectedRun, setSelectedRun] = useState(null);

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear all saved simulation history? This cannot be undone.')) {
      clearHistory();
    }
  };

  const handleDownload = () => {
    const csv = exportHistoryCSV();
    if (!csv) return;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `simulation_history_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            Simulation History & Run Archive
          </h2>
          <p className="text-xs text-slate-500">
            Locally persisted records of all test executions, delivery ratios, and reroute events
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            disabled={history.length === 0}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            onClick={handleClear}
            disabled={history.length === 0}
            className="px-3 py-1.5 text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 disabled:opacity-50 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear History
          </button>
        </div>
      </div>

      {/* History Records Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        {history.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/70">
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Endpoints</th>
                  <th className="py-3 px-4">Strategy</th>
                  <th className="py-3 px-4">Protocol</th>
                  <th className="py-3 px-4">Packets</th>
                  <th className="py-3 px-4">PDR (%)</th>
                  <th className="py-3 px-4">Avg Delay</th>
                  <th className="py-3 px-4">Reroutes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {history.map(run => (
                  <tr key={run.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {run.formattedTime || new Date(run.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {run.source} ➔ {run.destination}
                    </td>
                    <td className="py-3 px-4">
                      <span className="capitalize px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-sans font-medium text-[10px]">
                        {run.strategy}
                      </span>
                    </td>
                    <td className="py-3 px-4 uppercase text-slate-600">{run.protocol}</td>
                    <td className="py-3 px-4 text-slate-700">
                      {run.delivered}/{run.packetCount}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-bold ${run.pdr >= 95 ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {run.pdr}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{run.avgDelay} ms</td>
                    <td className="py-3 px-4">
                      <span className={`font-semibold ${run.reroutes > 0 ? 'text-indigo-600' : 'text-slate-400'}`}>
                        {run.reroutes}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-xs text-slate-400 space-y-2">
            <Boxes className="w-8 h-8 text-slate-300 mx-auto" />
            <p>No simulation history records saved yet.</p>
            <p className="text-[11px]">Dispatch packets from the Packets or Dashboard page to record empirical runs.</p>
          </div>
        )}
      </div>
    </div>
  );
}
