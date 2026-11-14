---
name: xyflow-canvas
description: Architectural guidelines, performance optimizations, custom node design, and edge animation protocols for building the visual Pipeline Studio using @xyflow/react.
---

# XYFlow Canvas & Visual Graph Engine Skill

Use this skill whenever designing, modifying, or optimizing the visual graph canvas, custom nodes, edges, or inspector panels in `frontend/src/components/canvas/`.

---

## 1. Core Contract & Setup Guardrails

1. **Mandatory CSS Import:**
   * Always import base styles in the canvas component:
     ```typescript
     import '@xyflow/react/dist/style.css';
     ```
2. **Explicit Parent Dimensions:**
   * The parent wrapper of `<ReactFlow />` MUST have explicit, non-zero dimensions (e.g., `className="w-full h-full relative"` with absolute or flex parent). If dimensions collapse to 0px, nodes will not render.
3. **Stable Node & Edge Type Definitions:**
   * NEVER define `nodeTypes` or `edgeTypes` inside the React component render function. Defining them inline causes React Flow to unmount and remount all nodes on every parent render cycle:
     ```typescript
     // ✅ CORRECT: Defined outside component scope
     const nodeTypes: NodeTypes = {
       watchDEXPrice: WatchDEXPriceNode,
       watchTransfers: WatchTransfersNode,
       periodicCron: PeriodicCronNode,
       priceThresholdGuard: PriceThresholdGuardNode,
       cooldownGuard: CooldownGuardNode,
       balanceThreshold: BalanceThresholdNode,
       dexSwap: DEXSwapNode,
       emergencySafeSweep: EmergencySafeSweepNode,
       notifyLogWebhook: NotifyLogWebhookNode,
       logicGate: LogicGateNode,
     };
     ```
4. **Memoization:**
   * Every custom node component MUST be wrapped in `React.memo()` to prevent canvas-wide re-rendering when a single node changes state.

---

## 2. Constrained Typed Ports & Graph Grammar

To ensure users never build invalid or cyclic graphs, enforce strict handle constraints:

* **Trigger Nodes (🔵):**
  * `Source Handle` ONLY (right side). Target handles are strictly disallowed.
* **Condition / Filter Nodes (🟡):**
  * Exactly 1 `Target Handle` (left side) and 1 `Source Handle` (right side).
* **Action Nodes (🟢):**
  * `Target Handle` ONLY (left side). Source handles are strictly disallowed.
* **Logic Gate Node (⚪):**
  * 2 `Target Handles` (top-left for Signal A, bottom-left for Signal B) and 1 `Source Handle` (right side).
* **Connection Validator (`isValidConnection`):**
  ```typescript
  const isValidConnection = (connection: Connection) => {
    // 1. Prevent self-connection
    if (connection.source === connection.target) return false;

    // 2. Enforce typed flows: Cannot connect Action -> Trigger
    const sourceNode = getNode(connection.source);
    const targetNode = getNode(connection.target);
    if (!sourceNode || !targetNode) return false;

    if (sourceNode.type?.startsWith('action')) return false;
    if (targetNode.type?.startsWith('watch')) return false;

    return true;
  };
  ```

---

## 3. High-Performance Photon Pulse Animations (60 FPS)

During live WebSocket streaming when origin events fire, animate pulses along edges without degrading canvas performance:

* **Anti-Pattern:** Updating React state at 100+ updates/sec to move an SVG dot coordinate.
* **Best Practice:** Apply a targeted CSS class (e.g. `.edge-pulse-active`) to the specific SVG path element. Use GPU-accelerated CSS `stroke-dashoffset` keyframe animation:
  ```css
  @keyframes photonPulse {
    0% {
      stroke-dashoffset: 100%;
      stroke: #00e5ff;
    }
    50% {
      stroke: #ffd600;
    }
    100% {
      stroke-dashoffset: 0%;
      stroke: #00e676;
    }
  }

  .edge-pulse-active path {
    stroke-dasharray: 8 4;
    animation: photonPulse 1.2s cubic-bezier(0.4, 0, 0.2, 1);
  }
  ```

---

## 4. The 10 Visual Node States & Color Hierarchy

Custom nodes must visually communicate their live on-chain lifecycle:

| State Key | Border / Glow Color | Visual Behavior |
| :--- | :--- | :--- |
| `IDLE` | `#78909C` (Slate) | Static 1px subtle border |
| `CONFIGURED` | `#1E88E5` (Blue) | Highlighted border on hover/focus |
| `LISTENING` | `#0288D1` (Cyan Dark) | Slow rhythmic breathing pulse |
| `EVENT_CAPTURED` | `#00E5FF` (Cyan Neon)| 200ms instantaneous flash |
| `EVALUATING` | `#FFA726` (Amber) | Subtle spinning progress ring |
| `CONDITION_MET` | `#FFD600` (Yellow Gold)| Radiant glowing box-shadow |
| `FIRING_CALLBACK`| `#E040FB` (Neon Purple)| Photon burst emitted to outgoing edge |
| `SUCCESS` | `#00E676` (Neon Green) | Solid green border with checkmark badge |
| `COOLDOWN` | `#FF6D00` (Orange) | Hourglass icon with countdown timer |
| `REVERTED` | `#FF1744` (Red) | Gentle shake animation with alert tooltip |

---

## 5. Graph Serialization & Hydration Standards

* When the user clicks **Deploy Automation**, export the canvas state via `serializeGraph()` to match `packages/shared/src/schemas/pipeline.schema.ts`.
* When the user clicks **[ Use Recipe ]** in the Template Library, load the preset into the canvas using `useReactFlow().setNodes()` and `setEdges()`, and auto-fit the view with `fitView({ padding: 0.2, duration: 400 })`.
