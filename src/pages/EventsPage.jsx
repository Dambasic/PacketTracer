import React, { useState } from 'react';
import { useNetwork } from '../context/NetworkContext.jsx';
import {
  ScrollText,
  Filter,
  Trash2,
  Download,
  AlertTriangle,
  Info,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function EventsPage() {
  const { events, setEvents } = useNetwork();
  const [severityFilter, setSeverityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const eventTypes = Array.from(new Set(events.map(e => e.type)));

  const filteredEvents = events.filter(e => {
    if (severityFilter !== 'all' && e.severity !== severityFilter) return false;
    if (typeFilter !== 'all' && e.type !== typeFilter) return false;
    return true;
  });

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear the network events log?')) {
      setEvents([]);
    }
  };

  const handleExport = () => {
    const csvContent = [
      ['Timestamp', 'Severity', 'Type', 'Affected Element', 'Message'].join(','),
      ...events.map(e => [
        `"${e.timestamp}"`,
        `"${e.severity}"`,
        `"${e.type}"`,
        `"${e.affected}"`,
        `"${e.message.replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `network_events_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-blue-600" />
            Network Audit & Event Log
          </h2>
          <p className="text-xs text-slate-500">
            Real-time chronological events for link drops, congestion triggers, dynamic reroutes, and packet delivery
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={events.length === 0}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            onClick={handleClear}
            disabled={events.length === 0}
            className="px-3 py-1.5 text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 disabled:opacity-50 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Log
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 font-medium">
          <Filter className="w-3.5 h-3.5" />
          <span>Filters:</span>
        </div>

        {/* Severity Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">Severity:</span>
          <select
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Severities</option>
            <option value="info">Info</option>
            <option value="success">Success</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        {/* Event Type Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">Event Type:</span>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            {eventTypes.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="ml-auto text-xs font-mono text-slate-400">
          Showing {filteredEvents.length} of {events.length} events
        </div>
      </div>

      {/* Events Feed Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredEvents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/70">
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">Severity</th>
                  <th className="py-2.5 px-4">Event Type</th>
                  <th className="py-2.5 px-4">Affected Element</th>
                  <th className="py-2.5 px-4">Detailed Explanation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {filteredEvents.map(e => {
                  let badge = 'bg-slate-100 text-slate-700';
                  let icon = <Info className="w-3 h-3 text-slate-500" />;

                  if (e.severity === 'success') {
                    badge = 'bg-emerald-100 text-emerald-800';
                    icon = <CheckCircle className="w-3 h-3 text-emerald-600" />;
                  } else if (e.severity === 'warning') {
                    badge = 'bg-amber-100 text-amber-800';
                    icon = <AlertTriangle className="w-3 h-3 text-amber-600" />;
                  } else if (e.severity === 'critical') {
                    badge = 'bg-rose-100 text-rose-800';
                    icon = <AlertCircle className="w-3 h-3 text-rose-600" />;
                  }

                  return (
                    <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap">{e.timestamp}</td>
                      <td className="py-2.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${badge}`}>
                          {icon}
                          {e.severity}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-slate-800 whitespace-nowrap">{e.type}</td>
                      <td className="py-2.5 px-4 text-indigo-700 font-medium whitespace-nowrap">{e.affected}</td>
                      <td className="py-2.5 px-4 text-slate-600 font-sans text-xs">{e.message}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-slate-400 italic">
            No network events match the current filter criteria.
          </div>
        )}
      </div>
    </div>
  );
}
