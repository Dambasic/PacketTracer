# INTELLIGENT PACKET ROUTING
### *Adaptive, Congestion-Aware and Security-Aware Network Routing*

A College Project-Based Learning (PBL) web application and interactive simulation platform designed to demonstrate how multi-criteria intelligent routing algorithms overcome network congestion, fiber link failures, packet loss, and cyber-security risks.

---

## 🌐 1. Project Overview & Core PBL Problem

In conventional IP networking, traditional routing protocols (such as RIP, static routing, or basic OSPF) calculate paths primarily using hop count or static interface bandwidth. When high traffic surges cause bufferbloat, physical fiber cables are severed, or intermediate autonomous systems (AS) become untrusted, conventional routers blindly forward packets into saturated bottlenecks or blackholes, triggering catastrophic packet drops and latency surges.

### Core Problem Solved:
> *"How can a network deliver data efficiently and reliably when congestion, link failures, or security risks make the original route unsuitable?"*

**Intelligent Packet Routing** addresses this challenge through:
1. **Multi-Objective Cost Optimization:** Dynamically computes paths balancing latency, queue congestion, packet drop rates, compound uptime, and cyber trust ratings.
2. **In-Flight Dynamic Rerouting:** When an in-transit packet encounters a failed link or buffer saturation, localized rerouting recalculates the forward path from the packet's **current node** to the destination—without restarting the packet from its source.
3. **Interactive Simulation & PBL Walkthrough:** Features a step-by-step guided evaluation comparing empirical baseline metrics vs intelligent routing.

---

## 🚀 2. System Architecture & Tech Stack

The application is structured as a self-contained, high-performance Single Page Application (SPA) optimized for seamless deployment on **Vercel**:

- **Frontend Framework:** React 18 & Vite (Ultra-fast HMR and Rollup production bundling).
- **Network Graph Engine:** Cytoscape.js with custom coordinate rendering and animated packet overlays.
- **Styling & UI:** Tailwind CSS with a clean, restrained network operations dashboard palette.
- **Iconography:** Lucide React.
- **Routing & Simulation Engines:** Pure, modular JavaScript algorithms (`src/engine/routingEngine.js` and `src/engine/simulationEngine.js`).
- **State & Local Persistence:** React Context API backed by browser `localStorage` for scenarios, custom topologies, factor weights, and run archives.
- **Deployment Platform:** **Vercel** (`vercel.json` SPA rewrite rules for zero-config routing refreshes).
- **Test Runner:** Vitest (10 comprehensive unit and integration tests).

---

## 📂 3. Project Directory Structure

```
intelligent-packet-routing/
├── public/                 # Static assets & web manifest
├── src/
│   ├── __tests__/          # Vitest unit and integration test suites
│   │   ├── routingEngine.test.js
│   │   └── simulationIntegration.test.js
│   ├── components/         # Reusable UI & subsystem components
│   │   ├── layout/         # Header & Sidebar navigation
│   │   ├── network/        # Cytoscape NetworkCanvas, Inspector Modals, Add Element
│   │   └── pbl/            # GuidedDemoModal (6-step PBL evaluation)
│   ├── context/            # Central NetworkContext with localStorage synchronization
│   ├── data/               # Default realistic topology & preset scenarios
│   ├── engine/             # Dijkstra routing engine & discrete packet simulator
│   ├── pages/              # 8 dashboard views
│   │   ├── DashboardPage.jsx
│   │   ├── NetworkPage.jsx
│   │   ├── RoutingPage.jsx
│   │   ├── PacketsPage.jsx
│   │   ├── EventsPage.jsx
│   │   ├── AnalyticsPage.jsx
│   │   ├── HistoryPage.jsx
│   │   └── SettingsPage.jsx
│   ├── styles/             # Global Tailwind directives & custom keyframes
│   ├── App.jsx             # Top-level routing & layout shell
│   └── main.jsx            # React root entry point
├── index.html              # HTML template with typography & metadata
├── package.json            # Scripts & project dependencies
├── postcss.config.js       # PostCSS configuration
├── tailwind.config.js      # Tailwind theme & color tokens
├── vercel.json             # Vercel SPA rewrite configuration
├── vite.config.js          # Vite bundler configuration & code splitting
└── README.md               # Documentation & deployment guide
```

---

## 🧮 4. Mathematical Routing Model & Algorithms

### Modified Dijkstra Multi-Objective Function
For each edge $e = (u, v)$ with target node $v$:
$$\text{Cost}(e) = w_{dist} \cdot \bar{D} + w_{delay} \cdot \bar{L} + w_{cong} \cdot \bar{C} + w_{loss} \cdot \bar{P} + w_{rel} \cdot \bar{U} + w_{sec} \cdot \bar{S}$$

Where:
- $\bar{D} = \frac{\text{Distance}}{\text{MaxDistance}}$ (Normalized physical fiber distance)
- $\bar{L} = \frac{\text{EffectiveDelay}}{\text{MaxDelay}}$ (Queuing-dilated propagation latency)
- $\bar{C} = \frac{\text{Congestion}}{100}$ (Queue saturation level)
- $\bar{P} = \frac{\text{PacketLoss}}{10}$ (Stochastic drop rate)
- $\bar{U} = \frac{100 - \text{Reliability}}{5}$ (Compound unreliability)
- $\bar{S} = \frac{\text{SecurityRisk}}{100}$ (Cyber untrusted ASN penalty)

### Non-Linear Queuing Delay (M/M/1 Approximation)
As buffer utilization approaches capacity:
$$\text{EffectiveDelay} = \text{Delay}_{base} \times \left(1 + \frac{\text{Congestion}}{100 - \min(\text{Congestion}, 99)} \times 0.5\right) + \text{Delay}_{proc}$$

---

## 💻 5. Local Development & Testing Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
The application will be accessible at `http://localhost:3000`.

### 3. Run Automated Tests
```bash
npm test
```
Executes all 10 unit and integration tests verifying:
- Dijkstra shortest path under healthy conditions
- Congestion avoidance steering
- Dynamic link and node outage rerouting
- Unreachable destination exception handling
- Normalized weight constraints
- In-transit packet reroute without restarting from source

### 4. Build for Production
```bash
npm run build
```
Generates the optimized static distribution inside `dist/`.

---

## 🚀 6. Step-by-Step GitHub & Vercel Deployment Guide

You can deploy this project directly to **Vercel** connected to your **GitHub repository**.

### Step A: Push Project to GitHub

1. Open your terminal and navigate to the project directory:
   ```bash
   cd /Users/paarth/.gemini/antigravity/scratch/intelligent-packet-routing
   ```

2. Initialize Git (if not already initialized):
   ```bash
   git init
   git add .
   git commit -m "feat: initial commit of Intelligent Packet Routing PBL platform"
   ```

3. Create a **New Repository** on your GitHub account ([github.com/new](https://github.com/new)):
   - Repository Name: `intelligent-packet-routing`
   - Visibility: Public or Private
   - **Do NOT** initialize with README, .gitignore, or license (already present).

4. Link and push your local commits to GitHub:
   ```bash
   git branch -M main
   git remote add origin https://github.com/YOUR_GITHUB_USERNAME/intelligent-packet-routing.git
   git push -u origin main
   ```
   *(Replace `YOUR_GITHUB_USERNAME` with your actual GitHub username).*

---

### Step B: Import and Deploy on Vercel

1. Log in to your [Vercel Dashboard](https://vercel.com).
2. Click **Add New...** ➔ **Project**.
3. Under **Import Git Repository**, find `intelligent-packet-routing` and click **Import**.
4. Configure Project Settings:
   - **Project Name:** `intelligent-packet-routing`
   - **Framework Preset:** `Vite` (automatically detected)
   - **Root Directory:** `./`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
5. Click **Deploy**.
6. Within 30–60 seconds, Vercel will complete the build and provide your live production URL (e.g., `https://intelligent-packet-routing.vercel.app`).
7. **Direct URL Refresh Guarantee:** Thanks to the included `vercel.json` SPA configuration, navigating directly to `/network`, `/routing`, `/packets`, or refreshing any page works immediately without 404 errors.

---

## 🎓 7. College PBL Evaluation Checklist

| PBL Requirement | Status | Verification Detail |
|---|:---:|---|
| **Dijkstra Multi-Criteria Engine** | ✅ Verified | Supports 6 strategies & dynamic normalized weights |
| **Interactive Topology Canvas** | ✅ Verified | Drag-and-drop Cytoscape graph with link/node property editors |
| **Failure & Outage Simulation** | ✅ Verified | Live simulation of severed fiber links and router hardware crashes |
| **Dynamic In-Transit Rerouting** | ✅ Verified | Reroutes from packet's current position without restarting at source |
| **Real-time Packet Visualizer** | ✅ Verified | Glowing animated packet stream traversing active canvas edges |
| **Comparative Analytics** | ✅ Verified | Side-by-side empirical performance table vs static baseline |
| **CSV Export & Import** | ✅ Verified | Full CSV session archive export and external telemetry import |
| **Persistence & Reset** | ✅ Verified | Safe `localStorage` cache with factory reset options |
| **Automated Test Coverage** | ✅ Verified | 10 passing unit & integration tests (`npm test`) |
| **Vercel Production Readiness** | ✅ Verified | Zero-config `dist` build with SPA URL rewrite support |

---

## 📜 License
Educational Project-Based Learning (PBL) Software. Developed for academic demonstration and networking research.
