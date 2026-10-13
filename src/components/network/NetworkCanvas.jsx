import React, { useEffect, useRef, useState, useMemo } from 'react';
import cytoscape from 'cytoscape';
import { useNetwork } from '../../context/NetworkContext.jsx';
import { ZoomIn, ZoomOut, Maximize2, RotateCcw, AlertTriangle, Shield, Activity, Power } from 'lucide-react';

export default function NetworkCanvas({ onSelectElement, height = 'h-[520px]', showControls = true }) {
  const containerRef = useRef(null);
  const cyRef = useRef(null);
  const {
    nodes,
    links,
    activeRoute,
    packets,
    selectedElement,
    setSelectedElement,
    toggleNodeStatus,
    toggleLinkStatus,
    resetToDefaultTopology
  } = useNetwork();

  const [activeNodePositions, setActiveNodePositions] = useState({});

  // Initialize and update Cytoscape instance
  useEffect(() => {
    if (!containerRef.current) return;

    // Convert nodes to Cytoscape elements
    const elements = [
      ...nodes.map(n => {
        let color = '#0284c7'; // Host (blue)
        let shape = 'ellipse';
        if (n.type === 'router') {
          color = '#4f46e5'; // Router (indigo)
          shape = 'round-rectangle';
        } else if (n.type === 'server') {
          color = '#7c3aed'; // Server (purple)
          shape = 'round-diamond';
        }

        const isFailed = n.status === 'failed';
        const isInRoute = activeRoute?.path?.includes(n.id);

        return {
          data: {
            id: n.id,
            label: n.label,
            type: n.type,
            status: n.status,
            color: isFailed ? '#ef4444' : color,
            borderColor: isInRoute ? '#2563eb' : (isFailed ? '#b91c1c' : '#ffffff'),
            borderWidth: isInRoute ? 4 : 2,
            shape: shape,
            opacity: isFailed ? 0.6 : 1.0,
            rawNode: n
          },
          position: n.position || { x: 200, y: 200 }
        };
      }),
      ...links.map(l => {
        const isFailed = l.status === 'failed';
        const isCongested = l.congestion >= 70;
        const isInRoute = activeRoute?.path && activeRoute.path.some((nid, idx) => {
          if (idx === activeRoute.path.length - 1) return false;
          const next = activeRoute.path[idx + 1];
          return (l.source === nid && l.target === next) || (l.target === nid && l.source === next);
        });

        let lineColor = '#94a3b8'; // Slate 400
        let lineStyle = 'solid';
        let lineWidth = 2;

        if (isFailed) {
          lineColor = '#ef4444'; // Red
          lineStyle = 'dashed';
          lineWidth = 2;
        } else if (isCongested) {
          lineColor = '#f59e0b'; // Amber
          lineStyle = 'dashed';
          lineWidth = 3;
        }

        if (isInRoute && !isFailed) {
          lineColor = '#2563eb'; // Blue active route
          lineWidth = 4;
        }

        return {
          data: {
            id: l.id,
            source: l.source,
            target: l.target,
            label: `${l.delay}ms | ${l.congestion}%`,
            lineColor,
            lineStyle,
            lineWidth,
            rawLink: l
          }
        };
      })
    ];

    if (!cyRef.current) {
      const cy = cytoscape({
        container: containerRef.current,
        elements,
        style: [
          {
            selector: 'node',
            style: {
              'background-color': 'data(color)',
              'label': 'data(label)',
              'shape': 'data(shape)',
              'width': 48,
              'height': 48,
              'color': '#0f172a',
              'font-size': '11px',
              'font-weight': 600,
              'text-valign': 'bottom',
              'text-margin-y': 6,
              'border-width': 'data(borderWidth)',
              'border-color': 'data(borderColor)',
              'opacity': 'data(opacity)',
              'transition-property': 'background-color, border-color, border-width',
              'transition-duration': '0.2s'
            }
          },
          {
            selector: 'edge',
            style: {
              'width': 'data(lineWidth)',
              'line-color': 'data(lineColor)',
              'line-style': 'data(lineStyle)',
              'curve-style': 'bezier',
              'label': 'data(label)',
              'font-size': '10px',
              'color': '#64748b',
              'text-background-opacity': 0.85,
              'text-background-color': '#ffffff',
              'text-background-padding': '2px',
              'text-background-shape': 'roundrectangle',
              'transition-property': 'line-color, width',
              'transition-duration': '0.2s'
            }
          },
          {
            selector: ':selected',
            style: {
              'border-color': '#1d4ed8',
              'border-width': 4,
              'shadow-blur': 12,
              'shadow-color': '#93c5fd',
              'shadow-opacity': 0.8
            }
          }
        ],
        layout: {
          name: 'preset',
          fit: true,
          padding: 40
        },
        minZoom: 0.4,
        maxZoom: 2.5,
        wheelSensitivity: 0.2
      });

      // Node drag listener
      cy.on('dragfree', 'node', (evt) => {
        const node = evt.target;
        const pos = node.position();
        setActiveNodePositions(prev => ({
          ...prev,
          [node.id()]: pos
        }));
      });

      // Tap element to select
      cy.on('tap', 'node', (evt) => {
        const nodeData = evt.target.data('rawNode');
        setSelectedElement({ type: 'node', data: nodeData });
        if (onSelectElement) onSelectElement({ type: 'node', data: nodeData });
      });

      cy.on('tap', 'edge', (evt) => {
        const linkData = evt.target.data('rawLink');
        setSelectedElement({ type: 'link', data: linkData });
        if (onSelectElement) onSelectElement({ type: 'link', data: linkData });
      });

      cy.on('tap', (evt) => {
        if (evt.target === cy) {
          setSelectedElement(null);
          if (onSelectElement) onSelectElement(null);
        }
      });

      cyRef.current = cy;
    } else {
      // Update elements smoothly
      const cy = cyRef.current;
      cy.batch(() => {
        // Remove dead elements
        const currentIds = new Set(elements.map(e => e.data.id));
        cy.elements().forEach(el => {
          if (!currentIds.has(el.id())) cy.remove(el);
        });

        // Add or update elements
        elements.forEach(el => {
          const existing = cy.getElementById(el.data.id);
          if (existing.length === 0) {
            cy.add(el);
          } else {
            existing.data(el.data);
            if (el.position && !existing.grabbed()) {
              // only update position if not manually dragging
              existing.position(el.position);
            }
          }
        });
      });
    }

    // Capture initial node positions for packet overlay
    const positions = {};
    cyRef.current.nodes().forEach(n => {
      positions[n.id()] = n.position();
    });
    setActiveNodePositions(positions);

  }, [nodes, links, activeRoute]);

  // Keep node positions in sync when cy moves
  const handleCyRender = () => {
    if (!cyRef.current) return;
    const positions = {};
    cyRef.current.nodes().forEach(n => {
      // transform cytoscape rendered position to canvas container coordinates
      const renderedPos = n.renderedPosition();
      positions[n.id()] = renderedPos;
    });
    setActiveNodePositions(positions);
  };

  useEffect(() => {
    if (!cyRef.current) return;
    cyRef.current.on('pan zoom render', handleCyRender);
    return () => {
      if (cyRef.current) cyRef.current.off('pan zoom render', handleCyRender);
    };
  }, []);

  // Controls
  const handleZoomIn = () => cyRef.current && cyRef.current.zoom(cyRef.current.zoom() * 1.25);
  const handleZoomOut = () => cyRef.current && cyRef.current.zoom(cyRef.current.zoom() * 0.8);
  const handleFit = () => cyRef.current && cyRef.current.fit(undefined, 40);

  // Calculate live in-transit packet coordinates for overlay rendering
  const activePacketPositions = useMemo(() => {
    if (!packets || packets.length === 0 || !cyRef.current) return [];

    return packets
      .filter(p => p.status === 'in_transit')
      .map(p => {
        const currentPos = activeNodePositions[p.currentNode];
        const nextHop = p.plannedPath[p.currentHopIndex + 1];
        const nextPos = nextHop ? activeNodePositions[nextHop] : null;

        if (!currentPos || !nextPos) return null;

        const progress = Math.min(1, Math.max(0, p.progressOnCurrentLink || 0));
        const x = currentPos.x + (nextPos.x - currentPos.x) * progress;
        const y = currentPos.y + (nextPos.y - currentPos.y) * progress;

        return {
          id: p.id,
          seq: p.seq,
          protocol: p.protocol,
          x,
          y,
          currentNode: p.currentNode,
          nextHop
        };
      })
      .filter(Boolean);
  }, [packets, activeNodePositions]);

  return (
    <div className={`relative w-full ${height} bg-slate-900 rounded-xl border border-slate-700/60 overflow-hidden shadow-inner select-none`}>
      {/* Network Canvas Grid Pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'radial-gradient(circle, #38bdf8 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />

      {/* Cytoscape Root Container */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      {/* Animated Packets Moving Over Canvas */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {activePacketPositions.map(pkt => (
          <div
            key={pkt.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-75 flex flex-col items-center"
            style={{ left: `${pkt.x}px`, top: `${pkt.y}px` }}
          >
            <div className="relative">
              <div className="w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white shadow-[0_0_12px_#34d399] animate-pulse" />
              <div className="absolute -inset-1 rounded-full bg-emerald-400 opacity-40 animate-ping" />
            </div>
            <span className="text-[9px] font-mono font-bold bg-slate-900/90 text-emerald-300 px-1 py-0.5 rounded shadow mt-1 whitespace-nowrap">
              {pkt.id}
            </span>
          </div>
        ))}
      </div>

      {/* Legend Overlay */}
      <div className="absolute top-3 left-3 bg-slate-900/85 backdrop-blur-md border border-slate-700/80 rounded-lg p-2.5 text-xs text-slate-300 shadow-lg flex flex-col gap-1.5 pointer-events-auto">
        <div className="font-semibold text-slate-100 flex items-center gap-1.5 border-b border-slate-700 pb-1">
          <Activity className="w-3.5 h-3.5 text-blue-400" />
          <span>Topology Status</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
          <span>Host Device</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded bg-indigo-500" />
          <span>Router Node</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rotate-45 bg-purple-500" />
          <span>Cloud Server</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-0.5 bg-blue-500" />
          <span>Active Route Path</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-0.5 border-t border-dashed border-amber-400" />
          <span>Congested Link (&gt;70%)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span>Offline / Failed Element</span>
        </div>
      </div>

      {/* Canvas Tool Controls */}
      {showControls && (
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-slate-900/85 backdrop-blur-md border border-slate-700/80 rounded-lg p-1.5 shadow-lg">
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleFit}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Fit to Screen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-slate-700 mx-0.5" />
          <button
            onClick={resetToDefaultTopology}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Reset Sample Topology"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Quick Status Pill */}
      <div className="absolute top-3 right-3 bg-slate-900/85 backdrop-blur-md border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-300 shadow flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="font-mono text-slate-200">
          {nodes.filter(n => n.status !== 'failed').length}/{nodes.length} Nodes Online
        </span>
      </div>
    </div>
  );
}
