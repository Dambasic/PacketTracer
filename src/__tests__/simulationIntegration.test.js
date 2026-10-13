import { describe, it, expect } from 'vitest';
import { INITIAL_NODES, INITIAL_LINKS } from '../data/defaultTopology.js';
import {
  findOptimalRoute,
  calculatePathMetrics,
  ROUTING_STRATEGIES,
  DEFAULT_WEIGHTS,
  normalizeWeights
} from '../engine/routingEngine.js';
import {
  createSimulationBatch,
  advanceSimulationStep,
  PACKET_STATUS
} from '../engine/simulationEngine.js';

describe('End-to-End Simulation & Resilience Verification', () => {
  it('should deliver packets end-to-end under normal healthy conditions', () => {
    const { packets } = createSimulationBatch({
      sourceId: 'host-a',
      destinationId: 'server-dest',
      count: 3,
      packetSize: 64,
      priority: 'Normal',
      protocol: 'tcp',
      nodes: INITIAL_NODES,
      links: INITIAL_LINKS,
      strategy: ROUTING_STRATEGIES.BALANCED,
      customWeights: DEFAULT_WEIGHTS
    });

    expect(packets.length).toBe(3);
    expect(packets[0].status).toBe(PACKET_STATUS.QUEUED);

    let currentPackets = packets;
    let iterations = 0;
    const maxIterations = 50;

    while (iterations < maxIterations) {
      const stepResult = advanceSimulationStep({
        packets: currentPackets,
        nodes: INITIAL_NODES,
        links: INITIAL_LINKS,
        strategy: ROUTING_STRATEGIES.BALANCED,
        customWeights: DEFAULT_WEIGHTS
      });
      currentPackets = stepResult.packets;
      iterations++;
      if (!stepResult.hasActivePackets) break;
    }

    const delivered = currentPackets.filter(p => p.status === PACKET_STATUS.DELIVERED);
    expect(delivered.length).toBe(3);
    expect(delivered[0].accumulatedDelay).toBeGreaterThan(0);
    expect(delivered[0].traversedPath[delivered[0].traversedPath.length - 1]).toBe('server-dest');
  });

  it('should trigger in-transit reroute without resetting to source when link fails mid-flight', () => {
    // Start with healthy topology
    const { packets } = createSimulationBatch({
      sourceId: 'host-a',
      destinationId: 'server-dest',
      count: 1,
      packetSize: 64,
      protocol: 'tcp',
      nodes: INITIAL_NODES,
      links: INITIAL_LINKS,
      strategy: ROUTING_STRATEGIES.SHORTEST_DISTANCE
    });

    // Advance until packet arrives at edge router R1
    let currentPackets = packets;
    for (let i = 0; i < 5; i++) {
      const res = advanceSimulationStep({
        packets: currentPackets,
        nodes: INITIAL_NODES,
        links: INITIAL_LINKS,
        strategy: ROUTING_STRATEGIES.SHORTEST_DISTANCE
      });
      currentPackets = res.packets;
      if (currentPackets[0].currentNode === 'router-r1') break;
    }

    expect(currentPackets[0].currentNode).toBe('router-r1');

    // Mid-transit link failure: Sever primary link R1 ➔ R2
    const brokenLinks = INITIAL_LINKS.map(l => {
      if (l.id === 'link-r1-r2') return { ...l, status: 'failed' };
      return l;
    });

    const events = [];
    const stepResult = advanceSimulationStep({
      packets: currentPackets,
      nodes: INITIAL_NODES,
      links: brokenLinks,
      strategy: ROUTING_STRATEGIES.BALANCED,
      customWeights: DEFAULT_WEIGHTS,
      onEvent: ev => events.push(ev)
    });

    const updatedPkt = stepResult.packets[0];
    // Crucial check: packet did NOT restart from host-a
    expect(updatedPkt.currentNode).toBe('router-r1');
    expect(updatedPkt.rerouteCount).toBe(1);
    expect(updatedPkt.plannedPath).toContain('router-r3');
    expect(events.some(e => e.type === 'DYNAMIC_REROUTE')).toBe(true);
  });

  it('should compute valid path metrics and handle custom weight normalization edge cases', () => {
    // Zero weight handling
    const zeroWeights = {
      distance: 0,
      delay: 0,
      congestion: 0,
      packetLoss: 0,
      reliability: 0,
      securityRisk: 0
    };
    const norm = normalizeWeights(zeroWeights);
    const sum = Object.values(norm).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 4);

    // Negative weight handling
    const negWeights = {
      distance: -5,
      delay: 10,
      congestion: 10,
      packetLoss: 0,
      reliability: 0,
      securityRisk: 0
    };
    const normNeg = normalizeWeights(negWeights);
    expect(normNeg.distance).toBe(0);
    expect(normNeg.delay).toBe(0.5);
    expect(normNeg.congestion).toBe(0.5);
  });
});
