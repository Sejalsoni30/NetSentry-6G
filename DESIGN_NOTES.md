# ShiftGuard-6G: Design Notes & Motion System

This document outlines the architectural principles behind the **"Things That Open and Close"** motion design system and provides practical instructions for extending the observatory with new chambers and experiment doors.

---

## 1. The "Open and Close" Motion Philosophy

In traditional web showcases, section changes rely on flat slide-overs or opacity fades. In **ShiftGuard-6G**, every conceptual transition represents a physical boundary crossing inside a 3D signal laboratory. 

Every mechanical interaction obeys three rules:
1. **Physical Weight & Inertia**: Mechanical elements open with an exponential deceleration curve (`cubic-bezier(0.16, 1, 0.3, 1)`) and a subtle mechanical overshoot ($\sim 2\%$).
2. **Reversibility**: Scrolling backwards reverses every physical actuation in exact inverse sequence.
3. **Sound-Free Visual Feedback**: Instead of audio effects, tactile confirmations are provided through crisp cyan (`#22E4FF`) and amber (`#FFB020`) edge flares and central actuator glow bursts.

---

## 2. Motion Subsystems

### A. The Aperture Iris System (`ShiftGateIris3D.tsx`)
- **Structure**: 8 mechanical polygon blades arranged in a radial ring casing.
- **Math**:
  Given blade index $i \in \{0, \dots, N-1\}$ and open factor $\omega \in [0, 1]$:
  $$\theta_i = \frac{2\pi \cdot i}{N}$$
  $$r(\omega) = r_{\text{closed}} + \omega \cdot (r_{\text{open}} - r_{\text{closed}})$$
  $$x_i(\omega) = r(\omega) \cos(\theta_i), \quad y_i(\omega) = r(\omega) \sin(\theta_i)$$
  $$\phi_i(\omega) = \theta_i + \omega \cdot \Delta\phi$$
- As $\omega$ increases, blades rotate while retracting radially outward, clearing the central tunnel for camera traverse.

### B. Glass Shutter Split (`ProblemSection.tsx`)
- Dual-pane frosted panels with `backdrop-filter: blur(16px)` and edge flare strips.
- When closed: panels overlap, showing status labels and dormant metrics.
- When opened: panels slide horizontally apart, revealing interactive SVG telemetry wave schematics.
- **Combine Shifts**: Locks all 4 disturbance shutters open simultaneously, simultaneously dispatching a `destabilize` event to `NetworkLattice.tsx` which injects noise into node coordinates and transitions node colors from cyan to turbulent amber and signal red.

### C. The Telemetry Curtain (`TelemetryCurtain3D.tsx`)
- Generated as vertical light streams along $X \in [-W/2, W/2]$.
- As the user scrolls into Scene 3 ("The Question"), lines part outward from the center line.
- The displacement follows an exponential center-repulsion curve:
  $$\Delta x(x) = \text{sgn}(x) \cdot \omega \cdot \frac{W}{2} \cdot \exp\left(-2.2 \cdot \frac{|x|}{W/2}\right)$$
  Lines nearest to the optical center part with maximum velocity, creating the visual sensation of walking through parted laser strings.

### D. The Six-Door Spatial Corridor (`CorridorDoors3D.tsx`)
- Progressive pneumatic airlocks arranged along $Z = [ -35\text{m}, -75\text{m} ]$.
- As the camera approaches each door threshold ($Z_{\text{door}}$), the left and right blast plates split horizontally along $X$:
  $$X_{\text{left}} = -1.9 - 3.6 \cdot \omega, \quad X_{\text{right}} = 1.9 + 3.6 \cdot \omega$$
- Behind each door, an animated Reliability Meter reflects confidence decay across compound stress regimes.

---

## 3. How to Add a New Chamber

To introduce a fifth chamber (e.g., **Chamber E: Automated Fallback Controller**):

### Step 1: Add the Data Entry in `src/data/content.ts`
Locate `SITE_CONTENT.whatItIs.chambers` and append the new chamber configuration:

```typescript
{
  id: "chamber-e",
  letter: "E",
  title: "Automated Fallback Controller",
  role: "Safe State Deferral",
  description: "Directs traffic flows to conservative heuristic baselines when the Reliability Engine triggers an abstention.",
  inputs: ["Abstention flag", "Cell backup routes", "QoS margin tables"],
  outputs: ["Fallback steering command", "Safe-mode telemetry log"],
  telemetryMetric: "Switchover Delay < 0.2ms"
}
```

### Step 2: Add the Schematic in `src/components/sections/ChambersSection.tsx`
In `renderChamberSchematic()`, add a `case 'chamber-e':`:

```tsx
case 'chamber-e':
  return (
    <div className="w-full p-4 rounded-lg bg-navy-950/80 border border-cyan-dim/30 font-mono text-xs text-slate-300">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
        <span className="text-[10px] text-cyan-glow uppercase tracking-wider">FALLBACK CONTROLLER</span>
        <span className="text-[10px] text-cyan-glow">READY</span>
      </div>
      <div className="p-2 rounded bg-navy-900 border border-cyan-dim/40 flex justify-between">
        <span>Fallback Routing:</span>
        <span className="text-cyan-glow font-bold">Heuristic Static Buffer</span>
      </div>
    </div>
  );
```

The accordion system automatically renders the new card, manages its 3D unfolding state, and ensures exactly one chamber remains open at a time.

---

## 4. How to Add a New Experiment Door

To append a 7th experiment (e.g., **Door 7: Sub-THz Atmospheric Attenuation**):

### Step 1: Add the Door in `src/data/content.ts`
Locate `SITE_CONTENT.experiments.doors` and add door 7:

```typescript
{
  id: 7,
  stage: "07 / ATTENUATION",
  title: "Dynamic Molecular Blockage",
  condition: "Transient weather & molecular absorption shifts at 140 GHz",
  objective: "Quantify prediction stability during rapid micro-scale atmospheric attenuation.",
  simulatedRiskLevel: "red",
  confidenceScore: "14.5%",
  abstentionSuggested: true
}
```

### Step 2: Update the 3D Corridor in `src/scenes/CorridorDoors3D.tsx`
1. Expand the door colors array:
   ```typescript
   const doorColors = ['#22E4FF', '#22E4FF', '#FFB020', '#FFB020', '#FF3B5C', '#FF3B5C', '#FF3B5C'];
   ```
2. Change `Array.from({ length: 6 })` to `Array.from({ length: 7 })`.

The camera rig in `ObservatoryCanvas.tsx` will automatically compute the spatial depth trajectory along the extended corridor.

---

## 5. Performance Budget & Quality Guidelines

- **Instancing**: The network lattice uses a single Three.js `InstancedMesh` with 160 nodes in High mode and 60 nodes in Low mode. Never create individual mesh objects for nodes.
- **Draw Calls**: The telemetry curtain utilizes a single `LineSegments` buffer geometry with dynamic vertex coordinate manipulation, maintaining only 1 draw call.
- **Damping**: All camera motions and physical door positions utilize `THREE.MathUtils.damp(current, target, lambda, delta)` for frame-rate-independent 60fps smoothing.
