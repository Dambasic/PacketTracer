import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { INITIAL_NODES, INITIAL_LINKS, PRESET_SCENARIOS } from '../data/defaultTopology.js';
import {
  findOptimalRoute,
  ROUTING_STRATEGIES,
  DEFAULT_WEIGHTS,
  normalizeWeights
} from '../engine/routingEngine.js';
import {
  createSimulationBatch,
  advanceSimulationStep,
  PACKET_STATUS
} from '../engine/simulationEngine.js';

const NetworkContext = createContext(null);

const STORAGE_KEYS = {
  NODES: 'ipr_nodes_v1',
  LINKS: 'ipr_links_v1',
  WEIGHTS: 'ipr_weights_v1',
  HISTORY: 'ipr_history_v1',
  SETTINGS: 'ipr_settings_v1'
};

export function NetworkProvider({ children }) {
  // 1. Topology State
  const [nodes, setNodes] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NODES);
      return saved ? JSON.parse(saved) : INITIAL_NODES;
    } catch {
      return INITIAL_NODES;
    }
  });

  const [links, setLinks] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LINKS);
      return saved ? JSON.parse(saved) : INITIAL_LINKS;
    } catch {
      return INITIAL_LINKS;
    }
  });

  // 2. Routing Configuration
  const [weights, setWeights] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.WEIGHTS);
      return saved ? JSON.parse(saved) : DEFAULT_WEIGHTS;
    } catch {
      return DEFAULT_WEIGHTS;
    }
  });

  const [routingStrategy, setRoutingStrategy] = useState(ROUTING_STRATEGIES.BALANCED);
  const [activeRoute, setActiveRoute] = useState(null);
  const [routeEndpoints, setRouteEndpoints] = useState({
    sourceId: 'host-a',
    destinationId: 'server-dest'
  });

  // 3. Selection & Inspecting
  const [selectedElement, setSelectedElement] = useState(null);

  // 4. Scenarios
  const [activeScenarioId, setActiveScenarioId] = useState('normal');

  // 5. Events Log
  const [events, setEvents] = useState([
    {
      id: 'ev-init-1',
      timestamp: new Date().toLocaleTimeString(),
      type: 'SYSTEM_STARTUP',
      severity: 'info',
      affected: 'Core Mesh',
      message: 'Intelligent Packet Routing engine initialized with 8 nodes and 10 links.'
    }
  ]);

  // 6. Packet Simulator State
  const [packets, setPackets] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(1); // 1x, 2x, 4x
  const [simulationParams, setSimulationParams] = useState({
    sourceId: 'host-a',
    destinationId: 'server-dest',
    count: 5,
    packetSize: 64,
    priority: 'Normal',
    protocol: 'tcp'
  });

  // 7. Session Stats
  const [sessionStats, setSessionStats] = useState({
    totalSent: 0,
    delivered: 0,
    dropped: 0,
    failed: 0,
    reroutes: 0,
    avgDelay: 0,
    delays: []
  });

  // 8. Persistent History
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HISTORY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.NODES, JSON.stringify(nodes));
      localStorage.setItem(STORAGE_KEYS.LINKS, JSON.stringify(links));
    } catch (e) {
      console.warn('Storage save error', e);
    }
  }, [nodes, links]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.WEIGHTS, JSON.stringify(weights));
    } catch (e) {
      console.warn('Storage save error', e);
    }
  }, [weights]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    } catch (e) {
      console.warn('Storage save error', e);
    }
  }, [history]);

  // Event logger helper
  const logEvent = useCallback((event) => {
    const newEvent = {
      id: `ev-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toLocaleTimeString(),
      ...event
    };
    setEvents(prev => [newEvent, ...prev.slice(0, 199)]); // Keep last 200 events
  }, []);

  // Compute Route
  const calculateRoute = useCallback((srcId, dstId, strat, w) => {
    const source = srcId || routeEndpoints.sourceId;
    const dest = dstId || routeEndpoints.destinationId;
    const currentStrat = strat || routingStrategy;
    const currentWeights = w || weights;

    const result = findOptimalRoute({
      sourceId: source,
      destinationId: dest,
      nodes,
      links,
      strategy: currentStrat,
      customWeights: currentWeights
    });

    setActiveRoute(result);
    setRouteEndpoints({ sourceId: source, destinationId: dest });

    if (result.success) {
      logEvent({
        type: 'ROUTE_CALCULATED',
        severity: 'info',
        affected: `${source} ➔ ${dest}`,
        message: `Calculated ${currentStrat} path (${result.hopCount} hops, ${result.metrics.totalDelay} ms delay).`
      });
    } else {
      logEvent({
        type: 'ROUTE_ERROR',
        severity: 'critical',
        affected: `${source} ➔ ${dest}`,
        message: `Route calculation failed: ${result.reason}`
      });
    }

    return result;
  }, [nodes, links, routeEndpoints, routingStrategy, weights, logEvent]);

  // Recalculate route whenever topology or strategy changes
  useEffect(() => {
    if (routeEndpoints.sourceId && routeEndpoints.destinationId) {
      const res = findOptimalRoute({
        sourceId: routeEndpoints.sourceId,
        destinationId: routeEndpoints.destinationId,
        nodes,
        links,
        strategy: routingStrategy,
        customWeights: weights
      });
      setActiveRoute(res);
    }
  }, [nodes, links, routingStrategy, weights, routeEndpoints]);

  // Apply Pre-configured Network Scenario
  const applyScenario = useCallback((scenarioId) => {
    const scenario = PRESET_SCENARIOS.find(s => s.id === scenarioId);
    if (!scenario) return;

    const { nodes: updatedNodes, links: updatedLinks } = scenario.apply(nodes, links);
    setNodes(updatedNodes);
    setLinks(updatedLinks);
    setActiveScenarioId(scenarioId);

    logEvent({
      type: 'SCENARIO_APPLIED',
      severity: 'warning',
      affected: scenario.name,
      message: `Preset scenario "${scenario.name}" activated: ${scenario.description}`
    });
  }, [nodes, links, logEvent]);

  // Toggle Link State (Healthy <-> Failed)
  const toggleLinkStatus = useCallback((linkId) => {
    setLinks(prev => prev.map(link => {
      if (link.id === linkId) {
        const nextStatus = link.status === 'failed' ? 'healthy' : 'failed';
        logEvent({
          type: nextStatus === 'failed' ? 'LINK_FAILURE' : 'LINK_RECOVERY',
          severity: nextStatus === 'failed' ? 'critical' : 'success',
          affected: link.id,
          message: `Link ${link.source} ➔ ${link.target} was ${nextStatus === 'failed' ? 'severed' : 'restored to operational state'}.`
        });
        return {
          ...link,
          status: nextStatus,
          congestion: nextStatus === 'failed' ? 0 : Math.min(link.congestion, 40)
        };
      }
      return link;
    }));
  }, [logEvent]);

  // Toggle Node State (Online <-> Failed)
  const toggleNodeStatus = useCallback((nodeId) => {
    setNodes(prev => prev.map(node => {
      if (node.id === nodeId) {
        const nextStatus = node.status === 'failed' ? 'online' : 'failed';
        logEvent({
          type: nextStatus === 'failed' ? 'NODE_FAILURE' : 'NODE_RECOVERY',
          severity: nextStatus === 'failed' ? 'critical' : 'success',
          affected: node.label || node.id,
          message: `Node ${node.label || node.id} marked as ${nextStatus === 'failed' ? 'offline (hardware failure)' : 'restored online'}.`
        });
        return { ...node, status: nextStatus };
      }
      return node;
    }));
  }, [logEvent]);

  // Update Node Properties
  const updateNode = useCallback((updatedNode) => {
    setNodes(prev => prev.map(n => n.id === updatedNode.id ? updatedNode : n));
    if (selectedElement?.type === 'node' && selectedElement.data.id === updatedNode.id) {
      setSelectedElement({ type: 'node', data: updatedNode });
    }
  }, [selectedElement]);

  // Update Link Properties
  const updateLink = useCallback((updatedLink) => {
    setLinks(prev => prev.map(l => l.id === updatedLink.id ? updatedLink : l));
    if (selectedElement?.type === 'link' && selectedElement.data.id === updatedLink.id) {
      setSelectedElement({ type: 'link', data: updatedLink });
    }
  }, [selectedElement]);

  // Add Node with Validation
  const addNode = useCallback((newNode) => {
    if (!newNode.id || !newNode.label) {
      return { success: false, error: 'Node ID and Label are required.' };
    }
    if (nodes.some(n => n.id === newNode.id)) {
      return { success: false, error: `Node ID '${newNode.id}' already exists.` };
    }

    const nodeWithDefaults = {
      id: newNode.id.trim().toLowerCase().replace(/\s+/g, '-'),
      label: newNode.label.trim(),
      type: newNode.type || 'router',
      status: 'online',
      ip: newNode.ip || `10.0.${nodes.length + 1}.1`,
      securityScore: Number(newNode.securityScore || 90),
      processingDelay: Number(newNode.processingDelay || 2),
      position: newNode.position || { x: 500, y: 250 }
    };

    setNodes(prev => [...prev, nodeWithDefaults]);
    logEvent({
      type: 'TOPOLOGY_UPDATE',
      severity: 'info',
      affected: nodeWithDefaults.label,
      message: `Added new ${nodeWithDefaults.type} node ${nodeWithDefaults.label}.`
    });
    return { success: true, node: nodeWithDefaults };
  }, [nodes, logEvent]);

  // Remove Node with Validation
  const removeNode = useCallback((nodeId) => {
    if (nodes.length <= 2) {
      return { success: false, error: 'Cannot remove node. Network must contain at least 2 nodes.' };
    }

    setNodes(prev => prev.filter(n => n.id !== nodeId));
    // Remove all connected links as well
    setLinks(prev => prev.filter(l => l.source !== nodeId && l.target !== nodeId));
    if (selectedElement?.data?.id === nodeId) {
      setSelectedElement(null);
    }

    logEvent({
      type: 'TOPOLOGY_UPDATE',
      severity: 'warning',
      affected: nodeId,
      message: `Removed node ${nodeId} and connected physical links.`
    });
    return { success: true };
  }, [nodes, selectedElement, logEvent]);

  // Add Link with Validation
  const addLink = useCallback((newLink) => {
    if (!newLink.source || !newLink.target) {
      return { success: false, error: 'Both Source and Target nodes must be selected.' };
    }
    if (newLink.source === newLink.target) {
      return { success: false, error: 'Self-connecting loop links are not permitted.' };
    }

    const exists = links.some(
      l => (l.source === newLink.source && l.target === newLink.target) ||
           (l.source === newLink.target && l.target === newLink.source)
    );
    if (exists) {
      return { success: false, error: 'A link between these two nodes already exists.' };
    }

    const linkWithDefaults = {
      id: `link-${newLink.source}-${newLink.target}`,
      source: newLink.source,
      target: newLink.target,
      bandwidth: Number(newLink.bandwidth || 1000),
      distance: Number(newLink.distance || 15),
      delay: Number(newLink.delay || 4),
      congestion: Number(newLink.congestion || 10),
      packetLoss: Number(newLink.packetLoss || 0.1),
      reliability: Number(newLink.reliability || 99.8),
      securityRisk: Number(newLink.securityRisk || 5),
      status: 'healthy'
    };

    setLinks(prev => [...prev, linkWithDefaults]);
    logEvent({
      type: 'TOPOLOGY_UPDATE',
      severity: 'info',
      affected: linkWithDefaults.id,
      message: `Connected link established between ${newLink.source} and ${newLink.target}.`
    });
    return { success: true, link: linkWithDefaults };
  }, [links, logEvent]);

  // Remove Link
  const removeLink = useCallback((linkId) => {
    setLinks(prev => prev.filter(l => l.id !== linkId));
    if (selectedElement?.data?.id === linkId) {
      setSelectedElement(null);
    }
    logEvent({
      type: 'TOPOLOGY_UPDATE',
      severity: 'warning',
      affected: linkId,
      message: `Removed link ${linkId}.`
    });
    return { success: true };
  }, [selectedElement, logEvent]);

  // Reset to sample topology
  const resetToDefaultTopology = useCallback(() => {
    setNodes(INITIAL_NODES);
    setLinks(INITIAL_LINKS);
    setActiveScenarioId('normal');
    setSelectedElement(null);
    logEvent({
      type: 'TOPOLOGY_RESET',
      severity: 'info',
      affected: 'Topology',
      message: 'Reset network topology to default enterprise baseline.'
    });
  }, [logEvent]);

  // SIMULATION CONTROLS
  const startSimulation = useCallback((customParams = {}) => {
    const params = { ...simulationParams, ...customParams };
    setSimulationParams(params);

    const { packets: newPackets, initialRoute } = createSimulationBatch({
      sourceId: params.sourceId,
      destinationId: params.destinationId,
      count: params.count,
      packetSize: params.packetSize,
      priority: params.priority,
      protocol: params.protocol,
      nodes,
      links,
      strategy: routingStrategy,
      customWeights: weights
    });

    setPackets(newPackets);
    setIsSimulating(true);

    logEvent({
      type: 'SIMULATION_STARTED',
      severity: 'info',
      affected: `${params.sourceId} ➔ ${params.destinationId}`,
      message: `Dispatched ${params.count} ${params.protocol.toUpperCase()} packets using ${routingStrategy} strategy.`
    });
  }, [simulationParams, nodes, links, routingStrategy, weights, logEvent]);

  const pauseSimulation = useCallback(() => {
    setIsSimulating(false);
  }, []);

  const resumeSimulation = useCallback(() => {
    setIsSimulating(true);
  }, []);

  const resetSimulation = useCallback(() => {
    setIsSimulating(false);
    setPackets([]);
  }, []);

  // Simulation Animation & Progression Loop
  useEffect(() => {
    if (!isSimulating || packets.length === 0) return;

    const intervalMs = Math.max(80, Math.floor(350 / simulationSpeed));
    const timer = setInterval(() => {
      setPackets(prevPackets => {
        const { packets: updated, hasActivePackets } = advanceSimulationStep({
          packets: prevPackets,
          nodes,
          links,
          strategy: routingStrategy,
          customWeights: weights,
          onEvent: logEvent
        });

        // When all packets complete, finalize stats and save run to history
        if (!hasActivePackets && prevPackets.some(p => p.status === PACKET_STATUS.IN_TRANSIT || p.status === PACKET_STATUS.QUEUED)) {
          setIsSimulating(false);

          // Calculate summary metrics
          const deliveredCount = updated.filter(p => p.status === PACKET_STATUS.DELIVERED).length;
          const droppedCount = updated.filter(p => p.status === PACKET_STATUS.DROPPED).length;
          const failedCount = updated.filter(p => p.status === PACKET_STATUS.FAILED).length;
          const totalReroutes = updated.reduce((acc, p) => acc + (p.rerouteCount || 0), 0);
          const deliveredPackets = updated.filter(p => p.status === PACKET_STATUS.DELIVERED);
          const avgDelay = deliveredPackets.length > 0
            ? deliveredPackets.reduce((sum, p) => sum + p.accumulatedDelay, 0) / deliveredPackets.length
            : 0;

          const pdr = updated.length > 0 ? (deliveredCount / updated.length) * 100 : 0;

          const runSummary = {
            id: `run-${Date.now()}`,
            timestamp: new Date().toISOString(),
            formattedTime: new Date().toLocaleString(),
            source: simulationParams.sourceId,
            destination: simulationParams.destinationId,
            packetCount: updated.length,
            protocol: simulationParams.protocol,
            strategy: routingStrategy,
            scenario: activeScenarioId,
            delivered: deliveredCount,
            dropped: droppedCount,
            failed: failedCount,
            pdr: Number(pdr.toFixed(1)),
            avgDelay: Number(avgDelay.toFixed(1)),
            reroutes: totalReroutes
          };

          setSessionStats(prev => ({
            totalSent: prev.totalSent + updated.length,
            delivered: prev.delivered + deliveredCount,
            dropped: prev.dropped + droppedCount,
            failed: prev.failed + failedCount,
            reroutes: prev.reroutes + totalReroutes,
            avgDelay: avgDelay,
            delays: [...prev.delays, avgDelay]
          }));

          setHistory(prev => [runSummary, ...prev]);

          logEvent({
            type: 'SIMULATION_COMPLETE',
            severity: 'success',
            affected: 'Simulation Engine',
            message: `Run finished: ${deliveredCount}/${updated.length} delivered (${pdr.toFixed(1)}% PDR, ${totalReroutes} reroutes).`
          });
        }

        return updated;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isSimulating, simulationSpeed, nodes, links, routingStrategy, weights, simulationParams, activeScenarioId, logEvent]);

  // Clear local history
  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEYS.HISTORY);
    } catch (e) {
      console.warn(e);
    }
  }, []);

  // Export CSV of Simulation Runs
  const exportHistoryCSV = useCallback(() => {
    if (history.length === 0) return '';
    const headers = ['Run ID', 'Timestamp', 'Source', 'Destination', 'Protocol', 'Strategy', 'Scenario', 'Total Packets', 'Delivered', 'Dropped', 'Failed', 'PDR (%)', 'Avg Delay (ms)', 'Reroutes'];
    const rows = history.map(h => [
      h.id,
      h.timestamp,
      h.source,
      h.destination,
      h.protocol,
      h.strategy,
      h.scenario,
      h.packetCount,
      h.delivered,
      h.dropped,
      h.failed,
      h.pdr,
      h.avgDelay,
      h.reroutes
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    return csvContent;
  }, [history]);

  // Import Network Measurements from CSV
  const importMeasurementCSV = useCallback((csvText) => {
    try {
      const lines = csvText.trim().split('\n');
      if (lines.length < 2) throw new Error('CSV is empty or missing headers');

      let updatedCount = 0;
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map(p => p.trim());
        if (parts.length < 2) continue;

        const row = {};
        headers.forEach((h, idx) => {
          row[h] = parts[idx];
        });

        const linkId = row.link_id || row.id;
        if (linkId) {
          setLinks(prev => prev.map(l => {
            if (l.id === linkId) {
              updatedCount++;
              return {
                ...l,
                delay: row.delay ? Number(row.delay) : l.delay,
                congestion: row.congestion ? Number(row.congestion) : l.congestion,
                packetLoss: row.packet_loss ? Number(row.packet_loss) : l.packetLoss,
                reliability: row.reliability ? Number(row.reliability) : l.reliability,
                securityRisk: row.security_risk ? Number(row.security_risk) : l.securityRisk
              };
            }
            return l;
          }));
        }
      }

      logEvent({
        type: 'DATA_IMPORT',
        severity: 'info',
        affected: 'Link Measurements',
        message: `Imported external measurements for ${updatedCount} network link(s).`
      });

      return { success: true, count: updatedCount };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [logEvent]);

  const value = {
    nodes,
    links,
    weights,
    setWeights,
    routingStrategy,
    setRoutingStrategy,
    activeRoute,
    routeEndpoints,
    setRouteEndpoints,
    calculateRoute,
    selectedElement,
    setSelectedElement,
    activeScenarioId,
    applyScenario,
    toggleLinkStatus,
    toggleNodeStatus,
    updateNode,
    updateLink,
    addNode,
    removeNode,
    addLink,
    removeLink,
    resetToDefaultTopology,
    events,
    logEvent,
    setEvents,
    packets,
    isSimulating,
    simulationSpeed,
    setSimulationSpeed,
    simulationParams,
    setSimulationParams,
    startSimulation,
    pauseSimulation,
    resumeSimulation,
    resetSimulation,
    sessionStats,
    history,
    clearHistory,
    exportHistoryCSV,
    importMeasurementCSV
  };

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
}
