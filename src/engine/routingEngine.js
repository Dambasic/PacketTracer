/**
 * Intelligent Routing Engine
 * Implements Dijkstra-based multi-criteria routing:
 * - Shortest Distance
 * - Lowest Delay (Latency)
 * - Congestion-Aware
 * - Reliability-Aware
 * - Security-Aware
 * - Balanced Intelligent Routing (Weighted Multi-Objective Optimization)
 */

export const ROUTING_STRATEGIES = {
  SHORTEST_DISTANCE: 'shortest-distance',
  LOWEST_DELAY: 'lowest-delay',
  CONGESTION_AWARE: 'congestion-aware',
  RELIABILITY_AWARE: 'reliability-aware',
  SECURITY_AWARE: 'security-aware',
  BALANCED: 'balanced'
};

export const DEFAULT_WEIGHTS = {
  distance: 0.15,
  delay: 0.25,
  congestion: 0.25,
  packetLoss: 0.15,
  reliability: 0.10,
  securityRisk: 0.10
};

/**
 * Normalizes user weights so their sum equals 1.0
 */
export function normalizeWeights(weights) {
  const safeWeights = {
    distance: Math.max(0, Number(weights?.distance || 0)),
    delay: Math.max(0, Number(weights?.delay || 0)),
    congestion: Math.max(0, Number(weights?.congestion || 0)),
    packetLoss: Math.max(0, Number(weights?.packetLoss || 0)),
    reliability: Math.max(0, Number(weights?.reliability || 0)),
    securityRisk: Math.max(0, Number(weights?.securityRisk || 0))
  };

  const sum = Object.values(safeWeights).reduce((a, b) => a + b, 0);
  if (sum === 0) return { ...DEFAULT_WEIGHTS };

  return {
    distance: safeWeights.distance / sum,
    delay: safeWeights.delay / sum,
    congestion: safeWeights.congestion / sum,
    packetLoss: safeWeights.packetLoss / sum,
    reliability: safeWeights.reliability / sum,
    securityRisk: safeWeights.securityRisk / sum
  };
}

/**
 * Builds an adjacency list representation from nodes and links.
 * Ignores failed nodes and failed links.
 * Supports bidirectional physical links.
 */
export function buildGraph(nodes, links) {
  const nodeMap = new Map();
  nodes.forEach(node => {
    nodeMap.set(node.id, {
      ...node,
      isOperational: node.status !== 'failed'
    });
  });

  const adjacency = new Map();
  nodes.forEach(node => {
    adjacency.set(node.id, []);
  });

  links.forEach(link => {
    // If link or either endpoint is failed, skip this link
    if (link.status === 'failed') return;
    const srcNode = nodeMap.get(link.source);
    const tgtNode = nodeMap.get(link.target);
    if (!srcNode?.isOperational || !tgtNode?.isOperational) return;

    // Forward direction
    adjacency.get(link.source)?.push({
      neighborId: link.target,
      link,
      direction: 'forward'
    });

    // Reverse direction (bidirectional Ethernet / optical links)
    adjacency.get(link.target)?.push({
      neighborId: link.source,
      link,
      direction: 'reverse'
    });
  });

  return { nodeMap, adjacency };
}

/**
 * Calculates edge cost based on the chosen strategy and normalized parameters.
 */
export function calculateEdgeCost(link, targetNode, strategy, weights, maxBounds) {
  const safeMax = {
    distance: maxBounds?.maxDistance || 100,
    delay: maxBounds?.maxDelay || 50
  };

  // Base metrics
  const distNorm = Math.min(1, Math.max(0, (link.distance || 1) / safeMax.distance));
  
  // Latency with queuing delay expansion based on congestion (M/M/1 queue model approximation)
  const congestionPercent = Math.min(99, Math.max(0, link.congestion || 0));
  const queueMultiplier = 1 + (congestionPercent / (100 - congestionPercent)) * 0.5;
  const effectiveDelay = (link.delay || 1) * queueMultiplier + (targetNode?.processingDelay || 0);
  const delayNorm = Math.min(1, Math.max(0, effectiveDelay / safeMax.delay));

  const congNorm = congestionPercent / 100;
  const lossNorm = Math.min(1, Math.max(0, (link.packetLoss || 0) / 10)); // normalized up to 10% loss
  const unreliabilityNorm = Math.min(1, Math.max(0, (100 - (link.reliability || 99)) / 5)); // normalized up to 5% unreliability
  const secRiskNorm = Math.min(1, Math.max(0, (link.securityRisk || 0) / 100));

  switch (strategy) {
    case ROUTING_STRATEGIES.SHORTEST_DISTANCE:
      // Direct hop / physical distance (pure topology metric)
      return link.distance || 1;

    case ROUTING_STRATEGIES.LOWEST_DELAY:
      // Effective propagation + router processing latency
      return effectiveDelay;

    case ROUTING_STRATEGIES.CONGESTION_AWARE:
      // Heavy penalty on links > 60% congestion
      const penalty = congestionPercent > 70 ? Math.pow(congestionPercent / 50, 2) : 1;
      return (link.delay || 1) * (1 + congNorm * 4) * penalty;

    case ROUTING_STRATEGIES.RELIABILITY_AWARE:
      // Minimizes failure & packet drop probability: -log(reliability * (1 - loss))
      const relFraction = Math.max(0.01, (link.reliability || 99) / 100);
      const passFraction = Math.max(0.01, 1 - (link.packetLoss || 0) / 100);
      return -Math.log(relFraction * passFraction) * 100;

    case ROUTING_STRATEGIES.SECURITY_AWARE:
      // Penalizes untrusted nodes and risky fiber segments
      const nodeTrustScore = (targetNode?.securityScore || 100) / 100;
      const nodeRisk = 1 - nodeTrustScore;
      return secRiskNorm * 60 + nodeRisk * 40 + (link.delay || 1) * 0.1;

    case ROUTING_STRATEGIES.BALANCED:
    default: {
      const w = weights;
      // Multi-criteria composite objective function
      const cost =
        w.distance * distNorm +
        w.delay * delayNorm +
        w.congestion * congNorm +
        w.packetLoss * lossNorm +
        w.reliability * unreliabilityNorm +
        w.securityRisk * secRiskNorm;
      
      // Ensure positive non-zero cost
      return Math.max(0.001, cost);
    }
  }
}

/**
 * Computes maximum bounds for distance and delay in the given topology for normalization
 */
function computeTopologyBounds(links) {
  let maxDistance = 1;
  let maxDelay = 1;
  links.forEach(l => {
    if (l.distance > maxDistance) maxDistance = l.distance;
    if (l.delay > maxDelay) maxDelay = l.delay;
  });
  return {
    maxDistance: Math.max(10, maxDistance * 1.2),
    maxDelay: Math.max(15, maxDelay * 2)
  };
}

/**
 * Computes the optimal path from sourceId to destinationId using Dijkstra's algorithm.
 */
export function findOptimalRoute({
  sourceId,
  destinationId,
  nodes,
  links,
  strategy = ROUTING_STRATEGIES.BALANCED,
  customWeights = DEFAULT_WEIGHTS
}) {
  if (!sourceId || !destinationId) {
    return {
      success: false,
      reason: 'Source and destination nodes must be specified.'
    };
  }

  if (sourceId === destinationId) {
    return {
      success: false,
      reason: 'Source and destination nodes cannot be identical.'
    };
  }

  const { nodeMap, adjacency } = buildGraph(nodes, links);

  const srcNode = nodeMap.get(sourceId);
  const dstNode = nodeMap.get(destinationId);

  if (!srcNode) return { success: false, reason: `Source node '${sourceId}' not found.` };
  if (!dstNode) return { success: false, reason: `Destination node '${destinationId}' not found.` };
  if (!srcNode.isOperational) return { success: false, reason: `Source node '${srcNode.label}' is currently marked as failed.` };
  if (!dstNode.isOperational) return { success: false, reason: `Destination node '${dstNode.label}' is currently marked as failed.` };

  const weights = normalizeWeights(customWeights);
  const maxBounds = computeTopologyBounds(links);

  // Dijkstra data structures
  const distances = new Map();
  const previous = new Map();
  const visited = new Set();
  const queue = [];

  nodes.forEach(node => {
    distances.set(node.id, Infinity);
    previous.set(node.id, null);
  });

  distances.set(sourceId, 0);
  queue.push({ id: sourceId, cost: 0 });

  while (queue.length > 0) {
    // Sort queue for min-heap behavior
    queue.sort((a, b) => a.cost - b.cost);
    const { id: currentId, cost: currentCost } = queue.shift();

    if (visited.has(currentId)) continue;
    visited.add(currentId);

    if (currentId === destinationId) break;

    const neighbors = adjacency.get(currentId) || [];
    for (const { neighborId, link } of neighbors) {
      if (visited.has(neighborId)) continue;

      const neighborNode = nodeMap.get(neighborId);
      const edgeCost = calculateEdgeCost(link, neighborNode, strategy, weights, maxBounds);
      const newCost = currentCost + edgeCost;

      if (newCost < distances.get(neighborId)) {
        distances.set(neighborId, newCost);
        previous.set(neighborId, { prevId: currentId, link });
        queue.push({ id: neighborId, cost: newCost });
      }
    }
  }

  // Reconstruct path
  if (distances.get(destinationId) === Infinity) {
    return {
      success: false,
      reason: `Destination '${dstNode.label}' is unreachable from '${srcNode.label}'. No operational path exists (all alternative routes broken or offline).`
    };
  }

  const pathNodeIds = [];
  const pathLinks = [];
  let curr = destinationId;

  while (curr !== null) {
    pathNodeIds.unshift(curr);
    const prevInfo = previous.get(curr);
    if (prevInfo) {
      pathLinks.unshift(prevInfo.link);
      curr = prevInfo.prevId;
    } else {
      curr = null;
    }
  }

  // Compute aggregate metrics for the discovered route
  const pathNodes = pathNodeIds.map(id => nodeMap.get(id));
  const metrics = calculatePathMetrics(pathNodes, pathLinks);

  // Generate explanation
  const explanation = generateRouteExplanation({
    pathNodes,
    pathLinks,
    strategy,
    metrics
  });

  // Also calculate baseline shortest-distance route for comparison
  let baselineRoute = null;
  if (strategy !== ROUTING_STRATEGIES.SHORTEST_DISTANCE) {
    baselineRoute = findOptimalRoute({
      sourceId,
      destinationId,
      nodes,
      links,
      strategy: ROUTING_STRATEGIES.SHORTEST_DISTANCE,
      customWeights
    });
  }

  return {
    success: true,
    strategy,
    sourceId,
    destinationId,
    path: pathNodeIds,
    nodes: pathNodes,
    links: pathLinks,
    hopCount: pathLinks.length,
    metrics,
    totalCost: Number(distances.get(destinationId).toFixed(4)),
    explanation,
    baselineComparison: baselineRoute?.success ? {
      baselinePath: baselineRoute.path,
      baselineMetrics: baselineRoute.metrics,
      delaySaved: Number((baselineRoute.metrics.totalDelay - metrics.totalDelay).toFixed(1)),
      congestionAvoided: Number((baselineRoute.metrics.maxCongestion - metrics.maxCongestion).toFixed(1)),
      securityImprovement: Number((metrics.overallSecurityScore - baselineRoute.metrics.overallSecurityScore).toFixed(1)),
      packetLossReduction: Number((baselineRoute.metrics.cumulativeLoss - metrics.cumulativeLoss).toFixed(2))
    } : null
  };
}

/**
 * Calculates aggregate network performance metrics for a sequence of traversed nodes and links.
 */
export function calculatePathMetrics(pathNodes, pathLinks) {
  let totalDistance = 0;
  let propagationDelay = 0;
  let processingDelay = 0;
  let congestionSum = 0;
  let maxCongestion = 0;
  let minBandwidth = Infinity;
  let reliabilityProduct = 1.0;
  let lossPassRate = 1.0;
  let totalSecurityScore = 0;

  pathNodes.forEach(node => {
    processingDelay += node?.processingDelay || 0;
    totalSecurityScore += (node?.securityScore || 80);
  });

  pathLinks.forEach(link => {
    totalDistance += link.distance || 0;
    
    // Effective link delay with queuing dilation
    const cong = Math.min(99, link.congestion || 0);
    const queueDelay = (cong / (100 - cong)) * (link.delay || 2) * 0.5;
    propagationDelay += (link.delay || 0) + queueDelay;

    congestionSum += cong;
    if (cong > maxCongestion) maxCongestion = cong;
    if (link.bandwidth < minBandwidth) minBandwidth = link.bandwidth;

    reliabilityProduct *= ((link.reliability || 99) / 100);
    lossPassRate *= (1 - (link.packetLoss || 0) / 100);

    // Factor in link security risk (100 - risk)
    totalSecurityScore += (100 - (link.securityRisk || 0));
  });

  const totalElements = pathNodes.length + pathLinks.length;
  const overallSecurityScore = totalElements > 0 ? totalSecurityScore / totalElements : 100;
  const cumulativeLoss = (1 - lossPassRate) * 100;
  const overallReliability = reliabilityProduct * 100;
  const avgCongestion = pathLinks.length > 0 ? congestionSum / pathLinks.length : 0;
  const totalDelay = propagationDelay + processingDelay;

  return {
    totalDistance: Math.round(totalDistance),
    totalDelay: Number(totalDelay.toFixed(1)),
    propagationDelay: Number(propagationDelay.toFixed(1)),
    processingDelay: Number(processingDelay.toFixed(1)),
    avgCongestion: Math.round(avgCongestion),
    maxCongestion: Math.round(maxCongestion),
    bottleneckBandwidth: minBandwidth === Infinity ? 1000 : minBandwidth,
    overallReliability: Number(overallReliability.toFixed(2)),
    cumulativeLoss: Number(cumulativeLoss.toFixed(2)),
    overallSecurityScore: Math.round(overallSecurityScore)
  };
}

/**
 * Generates an intuitive human-readable engineering explanation of why this path was recommended.
 */
function generateRouteExplanation({ pathNodes, pathLinks, strategy, metrics }) {
  const nodeNames = pathNodes.map(n => n.label || n.id).join(' ➔ ');
  const hopCount = pathLinks.length;

  switch (strategy) {
    case ROUTING_STRATEGIES.SHORTEST_DISTANCE:
      return `Selected minimum physical hop route traversing ${hopCount} link(s) (${nodeNames}). Focuses exclusively on physical length (${metrics.totalDistance} km) regardless of congestion or security risks.`;

    case ROUTING_STRATEGIES.LOWEST_DELAY:
      return `Optimized for lowest round-trip latency (${metrics.totalDelay} ms). Selected paths with low queuing buildup and minimal processing delay (${metrics.processingDelay} ms) across ${hopCount} hops.`;

    case ROUTING_STRATEGIES.CONGESTION_AWARE:
      return `Steered traffic away from saturated links. Maximum bottleneck congestion on this path is restricted to ${metrics.maxCongestion}% (avg ${metrics.avgCongestion}%), avoiding packet drops caused by router queue overflow.`;

    case ROUTING_STRATEGIES.RELIABILITY_AWARE:
      return `Prioritized mission-critical links with ${metrics.overallReliability}% compound link uptime and minimal simulated physical packet loss (${metrics.cumulativeLoss}%).`;

    case ROUTING_STRATEGIES.SECURITY_AWARE:
      return `Enforced strict cyber-trust constraints (Overall Security Score: ${metrics.overallSecurityScore}/100). Bypassed suspicious or high-risk transit segments in favor of encrypted, certified routers.`;

    case ROUTING_STRATEGIES.BALANCED:
    default:
      return `Balanced multi-objective decision: Achieves ${metrics.totalDelay} ms delay, keeps congestion capped at ${metrics.maxCongestion}%, maintains ${metrics.overallReliability}% reliability, and provides a security score of ${metrics.overallSecurityScore}/100 across ${hopCount} hops.`;
  }
}
