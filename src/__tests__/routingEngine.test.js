import { describe, it, expect } from 'vitest';
import {
  findOptimalRoute,
  calculateEdgeCost,
  normalizeWeights,
  ROUTING_STRATEGIES,
  DEFAULT_WEIGHTS
} from '../engine/routingEngine.js';
import { INITIAL_NODES, INITIAL_LINKS } from '../data/defaultTopology.js';
import { advanceSimulationStep, PACKET_STATUS } from '../engine/simulationEngine.js';

describe('Intelligent Routing Engine Tests', () => {
  it('should find shortest distance route under normal conditions', () => {
    const result = findOptimalRoute({
      sourceId: 'host-a',
      destinationId: 'server-dest',
      nodes: INITIAL_NODES,
      links: INITIAL_LINKS,
      strategy: ROUTING_STRATEGIES.SHORTEST_DISTANCE
    });

    expect(result.success).toBe(true);
    expect(result.path[0]).toBe('host-a');
    expect(result.path[result.path.length - 1]).toBe('server-dest');
    expect(result.hopCount).toBeGreaterThan(0);
    expect(result.metrics.totalDelay).toBeGreaterThan(0);
  });

  it('should avoid congested links in Congestion-Aware strategy', () => {
    // Inject heavy congestion on R1-R2
    const congestedLinks = INITIAL_LINKS.map(l => {
      if (l.id === 'link-r1-r2') return { ...l, congestion: 95 };
      return l;
    });

    const baselineResult = findOptimalRoute({
      sourceId: 'host-a',
      destinationId: 'server-dest',
      nodes: INITIAL_NODES,
      links: congestedLinks,
      strategy: ROUTING_STRATEGIES.SHORTEST_DISTANCE
    });

    const smartResult = findOptimalRoute({
      sourceId: 'host-a',
      destinationId: 'server-dest',
      nodes: INITIAL_NODES,
      links: congestedLinks,
      strategy: ROUTING_STRATEGIES.CONGESTION_AWARE
    });

    expect(smartResult.success).toBe(true);
    // Baseline shortest path uses R2 because it's geographically shorter
    expect(baselineResult.path).toContain('router-r2');
    // Congestion-aware route must bypass R2 and use router-r3
    expect(smartResult.path).toContain('router-r3');
    expect(smartResult.path).not.toContain('router-r2');
    expect(smartResult.metrics.maxCongestion).toBeLessThan(90);
  });

  it('should safely route around severed link (link failure)', () => {
    const severedLinks = INITIAL_LINKS.map(l => {
      if (l.id === 'link-r1-r2') return { ...l, status: 'failed' };
      return l;
    });

    const result = findOptimalRoute({
      sourceId: 'host-a',
      destinationId: 'server-dest',
      nodes: INITIAL_NODES,
      links: severedLinks,
      strategy: ROUTING_STRATEGIES.BALANCED
    });

    expect(result.success).toBe(true);
    expect(result.path).not.toContain('router-r2');
    expect(result.path).toContain('router-r3');
  });

  it('should safely route around failed router (node failure)', () => {
    const failedNodes = INITIAL_NODES.map(n => {
      if (n.id === 'router-r2') return { ...n, status: 'failed' };
      return n;
    });

    const result = findOptimalRoute({
      sourceId: 'host-a',
      destinationId: 'server-dest',
      nodes: failedNodes,
      links: INITIAL_LINKS,
      strategy: ROUTING_STRATEGIES.BALANCED
    });

    expect(result.success).toBe(true);
    expect(result.path).not.toContain('router-r2');
    expect(result.path).toContain('router-r3');
  });

  it('should return descriptive failure when destination is completely unreachable', () => {
    // Cut all incoming links to server-dest
    const isolatedLinks = INITIAL_LINKS.map(l => {
      if (l.target === 'server-dest' || l.source === 'server-dest') {
        return { ...l, status: 'failed' };
      }
      return l;
    });

    const result = findOptimalRoute({
      sourceId: 'host-a',
      destinationId: 'server-dest',
      nodes: INITIAL_NODES,
      links: isolatedLinks,
      strategy: ROUTING_STRATEGIES.BALANCED
    });

    expect(result.success).toBe(false);
    expect(result.reason).toMatch(/unreachable/i);
  });

  it('should normalize user weights correctly and maintain positive bounds', () => {
    const rawWeights = {
      distance: 10,
      delay: 20,
      congestion: 20,
      packetLoss: 10,
      reliability: 20,
      securityRisk: 20
    };

    const normalized = normalizeWeights(rawWeights);
    const sum = Object.values(normalized).reduce((a, b) => a + b, 0);

    expect(sum).toBeCloseTo(1.0, 4);
    expect(normalized.delay).toBe(0.2);
    expect(normalized.congestion).toBe(0.2);
  });

  it('should perform in-flight dynamic rerouting without restarting from source', () => {
    // Create a mock packet currently at router-r1 aiming for router-r2
    const mockPacket = {
      id: 'PKT-TEST',
      source: 'host-a',
      destination: 'server-dest',
      status: PACKET_STATUS.IN_TRANSIT,
      currentNode: 'router-r1',
      currentHopIndex: 0,
      plannedPath: ['router-r1', 'router-r2', 'router-r5', 'server-dest'],
      traversedPath: ['host-a', 'router-r1'],
      rerouteCount: 0,
      rerouteHistory: [],
      accumulatedDelay: 10,
      progressOnCurrentLink: 0,
      protocol: 'tcp',
      retries: 0
    };

    // Sever link-r1-r2
    const brokenLinks = INITIAL_LINKS.map(l => {
      if (l.id === 'link-r1-r2') return { ...l, status: 'failed' };
      return l;
    });

    const events = [];
    const stepResult = advanceSimulationStep({
      packets: [mockPacket],
      nodes: INITIAL_NODES,
      links: brokenLinks,
      strategy: ROUTING_STRATEGIES.BALANCED,
      customWeights: DEFAULT_WEIGHTS,
      onEvent: ev => events.push(ev)
    });

    const updated = stepResult.packets[0];
    expect(updated.rerouteCount).toBe(1);
    expect(updated.currentNode).toBe('router-r1'); // did NOT restart from host-a
    expect(updated.plannedPath).toContain('router-r3'); // dynamically rerouted via R3
    expect(events.some(e => e.type === 'DYNAMIC_REROUTE')).toBe(true);
  });
});
