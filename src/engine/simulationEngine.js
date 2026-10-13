/**
 * Packet Simulation Engine
 * Simulates discrete packet transmission, queuing, stochastic packet loss,
 * congestion delays, protocol behavior (TCP vs UDP), and dynamic in-transit rerouting.
 */

import { findOptimalRoute, ROUTING_STRATEGIES, DEFAULT_WEIGHTS } from './routingEngine.js';

let packetCounter = 1000;

export const PACKET_STATUS = {
  QUEUED: 'queued',
  IN_TRANSIT: 'in_transit',
  DELIVERED: 'delivered',
  DROPPED: 'dropped',
  REROUTED: 'rerouted',
  FAILED: 'failed'
};

export const PROTOCOL_TYPES = {
  TCP: 'TCP (Reliable, Retransmission)',
  UDP: 'UDP (Best-Effort, Low Overhead)'
};

/**
 * Initializes a batch of simulation packets
 */
export function createSimulationBatch({
  sourceId,
  destinationId,
  count = 5,
  packetSize = 64, // KB
  priority = 'Normal',
  protocol = 'tcp',
  nodes,
  links,
  strategy = ROUTING_STRATEGIES.BALANCED,
  customWeights = DEFAULT_WEIGHTS
}) {
  const initialRouteResult = findOptimalRoute({
    sourceId,
    destinationId,
    nodes,
    links,
    strategy,
    customWeights
  });

  const now = Date.now();
  const packets = [];

  for (let i = 0; i < count; i++) {
    packetCounter++;
    const pktId = `PKT-${packetCounter}`;

    if (!initialRouteResult.success) {
      packets.push({
        id: pktId,
        seq: i + 1,
        source: sourceId,
        destination: destinationId,
        size: packetSize,
        priority,
        protocol,
        status: PACKET_STATUS.FAILED,
        failureReason: initialRouteResult.reason,
        currentNode: sourceId,
        currentHopIndex: 0,
        plannedPath: [],
        traversedPath: [sourceId],
        rerouteCount: 0,
        rerouteHistory: [],
        accumulatedDelay: 0,
        progressOnCurrentLink: 0,
        createdAt: now + i * 150,
        completedAt: now,
        retries: 0
      });
      continue;
    }

    packets.push({
      id: pktId,
      seq: i + 1,
      source: sourceId,
      destination: destinationId,
      size: packetSize,
      priority,
      protocol,
      status: PACKET_STATUS.QUEUED,
      failureReason: null,
      currentNode: sourceId,
      currentHopIndex: 0,
      plannedPath: [...initialRouteResult.path],
      traversedPath: [sourceId],
      rerouteCount: 0,
      rerouteHistory: [],
      accumulatedDelay: 0,
      progressOnCurrentLink: 0,
      createdAt: now + i * 200, // staggered dispatch
      completedAt: null,
      retries: 0
    });
  }

  return {
    packets,
    initialRoute: initialRouteResult
  };
}

/**
 * Advances the simulation by one discrete tick.
 * Handles movement, congestion delays, failures, and dynamic in-flight rerouting.
 */
export function advanceSimulationStep({
  packets,
  nodes,
  links,
  strategy = ROUTING_STRATEGIES.BALANCED,
  customWeights = DEFAULT_WEIGHTS,
  onEvent = () => {}
}) {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const linkMap = new Map();
  links.forEach(l => {
    linkMap.set(`${l.source}->${l.target}`, l);
    linkMap.set(`${l.target}->${l.source}`, l); // bidirectional
  });

  let anyActive = false;

  const updatedPackets = packets.map(packet => {
    // Only process queued or in-transit packets
    if (packet.status !== PACKET_STATUS.QUEUED && packet.status !== PACKET_STATUS.IN_TRANSIT) {
      return packet;
    }

    anyActive = true;
    const pkt = { ...packet };

    // 1. If queued, promote to in-transit
    if (pkt.status === PACKET_STATUS.QUEUED) {
      pkt.status = PACKET_STATUS.IN_TRANSIT;
      pkt.currentNode = pkt.source;
      pkt.currentHopIndex = 0;
      pkt.progressOnCurrentLink = 0;
      return pkt;
    }

    // 2. Already at destination?
    if (pkt.currentNode === pkt.destination) {
      pkt.status = PACKET_STATUS.DELIVERED;
      pkt.completedAt = Date.now();
      onEvent({
        type: 'PACKET_DELIVERED',
        severity: 'success',
        affected: pkt.destination,
        message: `Packet ${pkt.id} successfully delivered to ${pkt.destination} (Delay: ${pkt.accumulatedDelay.toFixed(1)} ms, Reroutes: ${pkt.rerouteCount}).`
      });
      return pkt;
    }

    // 3. Check next hop along planned path
    const nextHopIndex = pkt.currentHopIndex + 1;
    const plannedNextNodeId = pkt.plannedPath[nextHopIndex];

    if (!plannedNextNodeId) {
      // Reached end of planned path without reaching destination -> trigger reroute
      return handlePacketReroute({
        pkt,
        nodes,
        links,
        strategy,
        customWeights,
        onEvent,
        reason: 'End of planned path reached prior to destination.'
      });
    }

    // Find physical link between currentNode and plannedNextNodeId
    const currentLinkKey = `${pkt.currentNode}->${plannedNextNodeId}`;
    const link = linkMap.get(currentLinkKey);
    const targetNode = nodeMap.get(plannedNextNodeId);

    // Check if the link or next node has failed
    const isLinkBroken = !link || link.status === 'failed';
    const isNodeBroken = !targetNode || targetNode.status === 'failed';

    if (isLinkBroken || isNodeBroken) {
      const breakReason = isLinkBroken
        ? `Link ${pkt.currentNode} ➔ ${plannedNextNodeId} is down/severed.`
        : `Next router ${plannedNextNodeId} suffered hardware outage.`;

      onEvent({
        type: 'ROUTE_OBSTRUCTION',
        severity: 'warning',
        affected: isLinkBroken ? (link?.id || currentLinkKey) : plannedNextNodeId,
        message: `Packet ${pkt.id} halted at ${pkt.currentNode}: ${breakReason}. Initiating dynamic in-transit reroute.`
      });

      return handlePacketReroute({
        pkt,
        nodes,
        links,
        strategy,
        customWeights,
        onEvent,
        reason: breakReason
      });
    }

    // Check for severe congestion reroute trigger (if strategy is congestion-aware or balanced and link > 85% congested)
    if (
      link.congestion >= 85 &&
      (strategy === ROUTING_STRATEGIES.CONGESTION_AWARE || strategy === ROUTING_STRATEGIES.BALANCED) &&
      pkt.rerouteCount < 2
    ) {
      // Evaluate if an alternate path avoiding this link is superior
      const bypassCheck = findOptimalRoute({
        sourceId: pkt.currentNode,
        destinationId: pkt.destination,
        nodes,
        links,
        strategy,
        customWeights
      });

      if (bypassCheck.success && bypassCheck.path[1] !== plannedNextNodeId) {
        onEvent({
          type: 'CONGESTION_AVOIDANCE',
          severity: 'info',
          affected: link.id,
          message: `Packet ${pkt.id} proactively bypassed congested link (${link.congestion}% queue) at ${pkt.currentNode}.`
        });

        pkt.plannedPath = [pkt.currentNode, ...bypassCheck.path.slice(1)];
        pkt.currentHopIndex = 0;
        pkt.rerouteCount += 1;
        pkt.rerouteHistory.push({
          atNode: pkt.currentNode,
          timestamp: Date.now(),
          reason: `Congestion avoidance (link at ${link.congestion}%)`,
          newPath: [...pkt.plannedPath]
        });
        return pkt;
      }
    }

    // Advance progress on current link
    pkt.progressOnCurrentLink = (pkt.progressOnCurrentLink || 0) + 0.35; // increments toward 1.0

    if (pkt.progressOnCurrentLink < 1.0) {
      return pkt;
    }

    // Packet arrives at next node!
    pkt.progressOnCurrentLink = 0;

    // Simulate stochastic packet loss check on the link
    const lossChance = (link.packetLoss || 0) / 100;
    const isDropped = Math.random() < lossChance;

    if (isDropped) {
      if (pkt.protocol === 'tcp' && pkt.retries < 2) {
        pkt.retries += 1;
        onEvent({
          type: 'TCP_RETRANSMISSION',
          severity: 'warning',
          affected: link.id,
          message: `Packet ${pkt.id} dropped on ${link.id} (${link.packetLoss}% loss). TCP retransmission triggered (Attempt ${pkt.retries}/2).`
        });
        pkt.accumulatedDelay += (link.delay || 5) * 2; // RTT timeout penalty
        return pkt;
      } else {
        pkt.status = PACKET_STATUS.DROPPED;
        pkt.completedAt = Date.now();
        pkt.failureReason = `Packet dropped due to buffer loss/physical degradation on link ${link.id}.`;
        onEvent({
          type: 'PACKET_DROPPED',
          severity: 'critical',
          affected: link.id,
          message: `Packet ${pkt.id} permanently dropped on ${link.id} (${pkt.protocol.toUpperCase()} loss).`
        });
        return pkt;
      }
    }

    // Packet safely traversed this hop
    const effectiveLinkDelay = (link.delay || 2) * (1 + (link.congestion || 0) / 100);
    pkt.accumulatedDelay += effectiveLinkDelay + (targetNode?.processingDelay || 1);
    pkt.currentNode = plannedNextNodeId;
    pkt.currentHopIndex = nextHopIndex;
    pkt.traversedPath = [...pkt.traversedPath, plannedNextNodeId];

    // Check if reached destination
    if (pkt.currentNode === pkt.destination) {
      pkt.status = PACKET_STATUS.DELIVERED;
      pkt.completedAt = Date.now();
      onEvent({
        type: 'PACKET_DELIVERED',
        severity: 'success',
        affected: pkt.destination,
        message: `Packet ${pkt.id} delivered to ${pkt.destination} (Delay: ${pkt.accumulatedDelay.toFixed(1)} ms).`
      });
    }

    return pkt;
  });

  return {
    packets: updatedPackets,
    hasActivePackets: anyActive
  };
}

/**
 * Recalculates route dynamically from packet's CURRENT node to destination.
 * Crucial PBL requirement: Does NOT restart packet from original source!
 */
function handlePacketReroute({ pkt, nodes, links, strategy, customWeights, onEvent, reason }) {
  const rerouteResult = findOptimalRoute({
    sourceId: pkt.currentNode,
    destinationId: pkt.destination,
    nodes,
    links,
    strategy,
    customWeights
  });

  if (!rerouteResult.success) {
    pkt.status = PACKET_STATUS.FAILED;
    pkt.completedAt = Date.now();
    pkt.failureReason = `Unreachable destination from current node '${pkt.currentNode}': ${rerouteResult.reason}`;
    onEvent({
      type: 'PACKET_FAILED',
      severity: 'critical',
      affected: pkt.currentNode,
      message: `Packet ${pkt.id} failed at ${pkt.currentNode}: No alternative path exists to ${pkt.destination}.`
    });
    return pkt;
  }

  // Successfully discovered alternative dynamic path
  pkt.rerouteCount += 1;
  pkt.rerouteHistory.push({
    atNode: pkt.currentNode,
    timestamp: Date.now(),
    reason,
    newPath: [...rerouteResult.path]
  });

  // Re-stitch planned path: keep already traversed portion, attach new dynamic route
  pkt.plannedPath = [pkt.currentNode, ...rerouteResult.path.slice(1)];
  pkt.currentHopIndex = 0;
  pkt.progressOnCurrentLink = 0;

  onEvent({
    type: 'DYNAMIC_REROUTE',
    severity: 'info',
    affected: pkt.currentNode,
    message: `Packet ${pkt.id} dynamically rerouted from ${pkt.currentNode} via [${rerouteResult.path.join(' ➔ ')}] (${reason}).`
  });

  return pkt;
}
