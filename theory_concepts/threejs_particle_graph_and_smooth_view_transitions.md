
# Concept Note: Three.js Algorithmic Particle Graph & Silky Smooth View Transitions

## 1. Algorithmic Constellation in Three.js (DSA Theme)
Instead of a generic particle field, an algorithmic tracking tool benefits from a **Graph Constellation Network** representing vertices (data structure nodes) and edges (pointers / algorithmic transitions):

```
     Node (x1, y1, z1)
          ●─────────────● Node (x2, y2, z2)
         / \           /
        /   \         /
       /     \       /
      ●───────●─────●
   Node 3    Node 4   Node 5
```

### Architecture of the Dynamic Line Buffer
In Three.js, drawing dynamic connections between $N$ nodes without garbage-collection overhead requires a pre-allocated single `LineSegments` buffer:
- **Maximum Segments**: $M = \frac{N(N-1)}{2}$
- **Buffer Allocation**: `Float32Array(M * 2 * 3)` (each line segment has 2 vertices of 3 coordinates each).
- In every animation frame:
  1. Update node coordinates via drift vectors: $\vec{p}_i(t) = \vec{p}_i(0) + \vec{v}_i \cdot t$.
  2. For pairs $(i, j)$ with Euclidean distance $d < D_{\text{threshold}}$, append endpoints into the line buffer.
  3. Call `geometry.setDrawRange(0, segmentCount * 2)` and mark `attributes.position.needsUpdate = true`.

### Smooth Mouse Reactivity (Damped Lerping)
Directly binding camera position to raw mouse events causes jittery, high-frequency stuttering. Instead, apply **Exponential Smoothing (Lerp)**:
$$\vec{m}_{\text{smooth}} \leftarrow \vec{m}_{\text{smooth}} + (\vec{m}_{\text{target}} - \vec{m}_{\text{smooth}}) \times \alpha \quad (\alpha \approx 0.05)$$
- **Camera Parallax**: Tilts gently with $\vec{m}_{\text{smooth}}$, creating 3D depth.
- **Node Repulsion**: Nodes within a radius of the projected mouse coordinate receive an inverse-distance displacement vector, softly parting away from the user's cursor.

---

## 2. Eliminating Stutter in Radial View Transitions (`flushSync`)

### The React 19 Asynchronous Snapshot Problem
When executing `document.startViewTransition(callback)`:
1. The browser captures the initial DOM snapshot (`::view-transition-old(root)`).
2. The `callback` is called.
3. If React performs an asynchronous state update (`setTheme(...)`), React defers DOM mutation.
4. The browser takes the final snapshot (`::view-transition-new(root)`) *before* React commits DOM updates, causing tearing or sudden snap.

### The Solution: Synchronous DOM Flushing
```javascript
import { flushSync } from 'react-dom';

document.startViewTransition(() => {
  flushSync(() => {
    setTheme(nextTheme);
  });
  // DOM is guaranteed to be 100% updated before snapshot is taken
});
```

### Decoupling Conflicting CSS Transitions
If `body` or `.glass-panel` has `transition: background-color 0.25s`, this transition fights with the `clip-path` animation.
By adding a temporary `.theme-transitioning` class to `<html>` that sets `transition: none !important` during the animation lifecycle, the radial wipe reveals the exact final porcelain or obsidian tone with zero artifacting or color banding.
