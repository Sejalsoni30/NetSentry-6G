# ShiftGuard-6G: Network Reliability Observatory

A single-page, scroll-driven, cinematic 3D showcase website for **ShiftGuard-6G** — a research benchmark for stress-testing AI network predictions under compound shifts and incomplete telemetry.

> **Research Posture**: This is a showcase and design benchmark project. All telemetry and experimental figures are simulated/illustrative and explicitly labeled as such.

---

## 🔬 Core Idea: "Things That Open and Close"

The site is designed as a continuous camera journey through a 3D structural observatory called the **Shift Gate**. Every core concept is revealed by physical opening and closing interactions, driven both by smooth scrolling and direct tactile triggers:

1. **Giant Aperture / Iris Doors**: Mechanical multi-blade irises that rotate and part radially to admit the camera into the corridor and close behind.
2. **Glass Shutter Panels**: Frosted glass panes that slide apart horizontally on hover or click to reveal live simulated wave schematics, with edge light flares.
3. **Telemetry Curtain**: A dense array of vertical laser data lines that parts smoothly down the center upon scroll traversal and re-closes on reverse.
4. **Expandable 3D Chambers**: Modular accordion structures that unfold from flat structural tiles into spatial testing chambers with ease-out-expo physics.
5. **Six-Door Corridor**: Progressive pneumatic blast doors along a 3D spatial tunnel with dynamic reliability meters (Cyan $\rightarrow$ Amber $\rightarrow$ Red).

---

## 🎨 Visual Identity & Palette

- **Near-Black Navy (`#05070D`)**: Deep observatory backdrop with atmospheric fog and subtle film grain.
- **Electric Cyan (`#22E4FF`)**: Nominal, reliable, and high-confidence regimes.
- **Amber (`#FFB020`)**: Elevated uncertainty, drift, and compound perturbation warnings.
- **Signal Red (`#FF3B5C`)**: Critical degradation, telemetry dropouts, and safe abstention deferral.
- **Typography**: Space Grotesk / Syne display font for headlines; JetBrains Mono for telemetry metrics, timestamps, and parameters.

---

## 🛠️ Tech Stack

- **Framework**: Vite + React 19 + TypeScript
- **3D Engine**: Three.js via `@react-three/fiber` and `@react-three/drei`
- **Animation & Motion**: GSAP (GreenSock) + ScrollTrigger
- **Smooth Scroll**: Lenis (`lenis`) for fluid, momentum-based scrolling
- **Styling**: Tailwind CSS with custom glassmorphism and glow tokens
- **Icons**: Lucide React

---

## 🚀 Getting Started

### Prerequisites

- Node.js `v18+` (tested on Node `v24+`)
- npm `v9+`

### Installation

```bash
git clone https://github.com/example/shiftguard-6g.git
cd shiftguard-6g
npm install
```

### Local Development

Start the local Vite development server:

```bash
npm run dev
```

Visit `http://localhost:5173` in your browser.

### Production Build

Create an optimized static bundle in `/dist`:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

---

## 🌐 Deployment Guide

### Deploying to Vercel

1. Push your repository to GitHub.
2. In the Vercel dashboard, click **"Add New Project"** and select the `shiftguard-6g` repository.
3. Keep the default settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Click **Deploy**.

### Deploying to GitHub Pages

1. In `vite.config.ts`, ensure `base: './'` is set:
   ```ts
   export default defineConfig({
     base: './',
     plugins: [react()],
   });
   ```
2. Build the project:
   ```bash
   npm run build
   ```
3. Deploy the `/dist` directory via GitHub Pages (e.g. using the `gh-pages` npm package or GitHub Actions workflow).

---

## 📂 Project Structure

```text
ShiftGuard-6G/
├── src/
│   ├── components/
│   │   ├── sections/          # All 10 section scenes
│   │   │   ├── HeroSection.tsx
│   │   │   ├── ProblemSection.tsx
│   │   │   ├── QuestionSection.tsx
│   │   │   ├── ChambersSection.tsx
│   │   │   ├── ExperimentsSection.tsx
│   │   │   ├── ComparisonSection.tsx
│   │   │   ├── MetricsSection.tsx
│   │   │   ├── RoadmapSection.tsx
│   │   │   ├── StackSection.tsx
│   │   │   └── FinalSection.tsx
│   │   ├── CustomCursor.tsx   # Aperture ring cursor
│   │   ├── Header.tsx         # Fixed HUD with progress counter (01/10)
│   │   ├── ProgressRail.tsx   # Side quick-jump navigation rail
│   │   ├── Preloader.tsx      # Closed aperture iris loading sequence
│   │   └── Footer.tsx         # Research disclaimer & links
│   ├── scenes/                # 3D Three.js components
│   │   ├── ObservatoryCanvas.tsx # Canvas, camera rig, lights, fog
│   │   ├── NetworkLattice.tsx    # Instanced glowing 3D node lattice
│   │   ├── ShiftGateIris3D.tsx   # Mechanical 3D iris aperture
│   │   ├── TelemetryCurtain3D.tsx# Vertical parting laser data lines
│   │   └── CorridorDoors3D.tsx   # Six progressive pneumatic blast doors
│   ├── hooks/
│   │   └── useObservatoryStore.tsx # State: activeSection, quality, motion
│   ├── data/
│   │   └── content.ts         # Central repository of all site copy & data
│   ├── App.tsx                # Master orchestration (Lenis + GSAP)
│   ├── index.css              # Glassmorphism, noise grain, scanlines
│   └── main.tsx
├── DESIGN_NOTES.md            # Motion architecture & expansion guide
└── README.md
```

---

## 🛡️ Accessibility & Performance

- **Reduce Motion**: Fully honors `prefers-reduced-motion` and features a manual toggle in the header, locking 3D motion and replacing camera travel with calm section transitions.
- **Quality Toggle**: "High" (full PBR materials, bloom, instanced nodes, particulate dust) vs "Low" (optimized rendering for lower-power devices).
- **Keyboard Navigation**: All accordions, doors, and interactive shutters are fully operable via `Tab`, `Enter`, and `Space`.
- **Sound-Free Haptics**: Click and hover interactions deliver instant visual micro-feedback via crisp cyan and amber glow pulses.
