/**
 * Default realistic network topology for Intelligent Packet Routing simulation.
 * Includes End-User Hosts, Edge/Core Routers, Firewalls, and Destination Servers.
 */

export const INITIAL_NODES = [
  {
    id: 'host-a',
    label: 'Client PC-A',
    type: 'host',
    status: 'online',
    ip: '192.168.1.10',
    securityScore: 95,
    processingDelay: 1,
    position: { x: 80, y: 150 }
  },
  {
    id: 'host-b',
    label: 'Client PC-B',
    type: 'host',
    status: 'online',
    ip: '192.168.1.20',
    securityScore: 90,
    processingDelay: 1,
    position: { x: 80, y: 350 }
  },
  {
    id: 'router-r1',
    label: 'Edge Router R1',
    type: 'router',
    status: 'online',
    ip: '10.0.1.1',
    securityScore: 90,
    processingDelay: 2,
    position: { x: 260, y: 250 }
  },
  {
    id: 'router-r2',
    label: 'Core Router R2 (Primary Backbone)',
    type: 'router',
    status: 'online',
    ip: '10.0.2.1',
    securityScore: 85,
    processingDelay: 4,
    position: { x: 460, y: 120 }
  },
  {
    id: 'router-r3',
    label: 'Core Router R3 (Secure Transit)',
    type: 'router',
    status: 'online',
    ip: '10.0.3.1',
    securityScore: 98,
    processingDelay: 3,
    position: { x: 460, y: 380 }
  },
  {
    id: 'router-r4',
    label: 'Mesh Router R4 (Cross-Connect)',
    type: 'router',
    status: 'online',
    ip: '10.0.4.1',
    securityScore: 80,
    processingDelay: 3,
    position: { x: 640, y: 250 }
  },
  {
    id: 'router-r5',
    label: 'Egress Router R5',
    type: 'router',
    status: 'online',
    ip: '10.0.5.1',
    securityScore: 92,
    processingDelay: 2,
    position: { x: 820, y: 250 }
  },
  {
    id: 'server-dest',
    label: 'Cloud Server (Alpha)',
    type: 'server',
    status: 'online',
    ip: '172.16.10.50',
    securityScore: 99,
    processingDelay: 2,
    position: { x: 1000, y: 250 }
  }
];

export const INITIAL_LINKS = [
  // Client A to Edge R1
  {
    id: 'link-ha-r1',
    source: 'host-a',
    target: 'router-r1',
    bandwidth: 1000, // Mbps
    distance: 5,     // km
    delay: 2,        // ms
    congestion: 10,  // %
    packetLoss: 0.1, // %
    reliability: 99.9, // %
    securityRisk: 5,   // %
    status: 'healthy'
  },
  // Client B to Edge R1
  {
    id: 'link-hb-r1',
    source: 'host-b',
    target: 'router-r1',
    bandwidth: 1000,
    distance: 5,
    delay: 3,
    congestion: 15,
    packetLoss: 0.2,
    reliability: 99.8,
    securityRisk: 8,
    status: 'healthy'
  },
  // Edge R1 to Core R2 (Primary high-speed backbone, prone to congestion)
  {
    id: 'link-r1-r2',
    source: 'router-r1',
    target: 'router-r2',
    bandwidth: 10000,
    distance: 20,
    delay: 4,
    congestion: 25,
    packetLoss: 0.3,
    reliability: 99.7,
    securityRisk: 10,
    status: 'healthy'
  },
  // Edge R1 to Core R3 (Alternative secure link, slightly higher delay)
  {
    id: 'link-r1-r3',
    source: 'router-r1',
    target: 'router-r3',
    bandwidth: 5000,
    distance: 35,
    delay: 8,
    congestion: 10,
    packetLoss: 0.05,
    reliability: 99.99,
    securityRisk: 2,
    status: 'healthy'
  },
  // Core R2 to Mesh R4
  {
    id: 'link-r2-r4',
    source: 'router-r2',
    target: 'router-r4',
    bandwidth: 10000,
    distance: 25,
    delay: 5,
    congestion: 30,
    packetLoss: 0.4,
    reliability: 99.5,
    securityRisk: 12,
    status: 'healthy'
  },
  // Core R3 to Mesh R4
  {
    id: 'link-r3-r4',
    source: 'router-r3',
    target: 'router-r4',
    bandwidth: 5000,
    distance: 30,
    delay: 7,
    congestion: 12,
    packetLoss: 0.1,
    reliability: 99.9,
    securityRisk: 3,
    status: 'healthy'
  },
  // Core R2 directly to Egress R5 (High-speed express link)
  {
    id: 'link-r2-r5',
    source: 'router-r2',
    target: 'router-r5',
    bandwidth: 10000,
    distance: 45,
    delay: 9,
    congestion: 20,
    packetLoss: 0.2,
    reliability: 99.6,
    securityRisk: 15,
    status: 'healthy'
  },
  // Core R3 to Egress R5 (Backup encrypted fiber)
  {
    id: 'link-r3-r5',
    source: 'router-r3',
    target: 'router-r5',
    bandwidth: 2500,
    distance: 50,
    delay: 11,
    congestion: 8,
    packetLoss: 0.05,
    reliability: 99.95,
    securityRisk: 1,
    status: 'healthy'
  },
  // Mesh R4 to Egress R5
  {
    id: 'link-r4-r5',
    source: 'router-r4',
    target: 'router-r5',
    bandwidth: 10000,
    distance: 15,
    delay: 3,
    congestion: 18,
    packetLoss: 0.1,
    reliability: 99.8,
    securityRisk: 8,
    status: 'healthy'
  },
  // Egress R5 to Destination Cloud Server
  {
    id: 'link-r5-server',
    source: 'router-r5',
    target: 'server-dest',
    bandwidth: 20000,
    distance: 10,
    delay: 2,
    congestion: 15,
    packetLoss: 0.02,
    reliability: 99.99,
    securityRisk: 2,
    status: 'healthy'
  }
];

export const PRESET_SCENARIOS = [
  {
    id: 'normal',
    name: 'Normal Operating Conditions',
    description: 'All links healthy with standard enterprise traffic loads (10-30% congestion). Baseline shortest path matches lowest latency.',
    apply: (nodes, links) => {
      const updatedNodes = nodes.map(n => ({ ...n, status: 'online' }));
      const updatedLinks = links.map(l => ({
        ...l,
        status: 'healthy',
        congestion: Math.min(l.congestion, 30)
      }));
      return { nodes: updatedNodes, links: updatedLinks };
    }
  },
  {
    id: 'high-congestion',
    name: 'Heavy Backbone Congestion',
    description: 'Primary backbone link (R1 -> R2) experiences severe congestion spike (88%), buffer saturation, and high latency.',
    apply: (nodes, links) => {
      const updatedNodes = nodes.map(n => ({ ...n, status: 'online' }));
      const updatedLinks = links.map(l => {
        if (l.id === 'link-r1-r2' || l.id === 'link-r2-r5') {
          return {
            ...l,
            congestion: 92,
            delay: l.delay * 3.5,
            packetLoss: 8.5,
            status: 'congested'
          };
        }
        return { ...l, status: l.status === 'failed' ? 'healthy' : l.status };
      });
      return { nodes: updatedNodes, links: updatedLinks };
    }
  },
  {
    id: 'link-failure',
    name: 'Primary Fiber Cut (Link Failure)',
    description: 'Catastrophic fiber severed between R1 and R2. Standard static routing fails completely; dynamic intelligent routing reroutes via R3.',
    apply: (nodes, links) => {
      const updatedNodes = nodes.map(n => ({ ...n, status: 'online' }));
      const updatedLinks = links.map(l => {
        if (l.id === 'link-r1-r2') {
          return { ...l, status: 'failed', congestion: 0, packetLoss: 100 };
        }
        return { ...l, status: 'healthy' };
      });
      return { nodes: updatedNodes, links: updatedLinks };
    }
  },
  {
    id: 'security-compromise',
    name: 'Security Risk & Untrusted Route',
    description: 'Core router R2 and transit links flagged with high security risk (untrusted ASN / packet snooping risk 85%). Security-aware routing forces encryption route via R3.',
    apply: (nodes, links) => {
      const updatedNodes = nodes.map(n => {
        if (n.id === 'router-r2') return { ...n, securityScore: 25 };
        return n;
      });
      const updatedLinks = links.map(l => {
        if (l.id === 'link-r1-r2' || l.id === 'link-r2-r5' || l.id === 'link-r2-r4') {
          return { ...l, securityRisk: 88 };
        }
        return { ...l, securityRisk: Math.min(l.securityRisk, 10) };
      });
      return { nodes: updatedNodes, links: updatedLinks };
    }
  },
  {
    id: 'node-failure',
    name: 'Core Router Hardware Failure',
    description: 'Router R2 suffers hardware crash and goes completely offline. All connected links become impassable.',
    apply: (nodes, links) => {
      const updatedNodes = nodes.map(n => {
        if (n.id === 'router-r2') return { ...n, status: 'failed' };
        return { ...n, status: 'online' };
      });
      const updatedLinks = links.map(l => {
        if (l.source === 'router-r2' || l.target === 'router-r2') {
          return { ...l, status: 'failed' };
        }
        return { ...l, status: 'healthy' };
      });
      return { nodes: updatedNodes, links: updatedLinks };
    }
  }
];
