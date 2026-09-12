# Concept Note: Radial View Transitions & Physical Card Depth Architecture

## 1. Radial View Transitions (Circular Reveal Animation)
When changing themes, an abrupt full-screen flash breaks immersion. Modern web applications use a **Radial Circular Reveal** originating directly from the trigger button:
```
  [Sun/Moon Button] (x, y)
          ●  (r = 0)
       ╭─────╮
     ╭─       ─╮ (r = radius)
   ╭─           ─╮
   │   New Theme │  --> Expands to hypot(w, h)
   ╰─           ─╯
```

### The View Transitions API Formula
1. Calculate Euclidean maximum distance from click coordinate $(x, y)$ to the four screen corners:
   $$\text{endRadius} = \sqrt{\max(x, W - x)^2 + \max(y, H - y)^2}$$
2. Invoke `document.startViewTransition(callback)` to freeze the DOM snapshot.
3. Apply a CSS `clip-path` animation to the pseudo-element `::view-transition-new(root)` from:
   $$\text{circle}(0\text{px at } x\text{px } y\text{px}) \longrightarrow \text{circle}(\text{endRadius}\text{px at } x\text{px } y\text{px})$$
4. Provide an immediate fallback for browsers or automated test environments lacking View Transitions API.

---

## 2. Layered Physical Card Depth
Flat cards feel lifeless. True depth in minimalist UI is achieved through a **3-Layer Shadow Model**:
1. **Direct Contact Shadow**: Small blur, tight spread (`0 2px 4px rgba(0,0,0,0.1)`) anchoring the card to the surface.
2. **Ambient Occlusion Shadow**: Wide blur, deep spread (`0 12px 30px rgba(...)`) creating the illusion of elevation.
3. **Specular Highlight Bevel**: Subtle top inner glow (`inset 0 1px 0 rgba(255,255,255,0.08)`) simulating light hitting the top edge of a physical glass pane.

### Dynamic Elevation on Hover
When hovered, the card moves along the Z-axis (`translateY(-4px) scale(1.008)`), widening the ambient shadow and increasing border luminosity with a spring curve (`cubic-bezier(0.16, 1, 0.3, 1)`).

---

## 3. Eliminating "Stark White Box" Clashes
When building translucent dark/light interfaces, hardcoded opaque backgrounds (`bg-white` or `bg-slate-100`) disrupt visual harmony. 
Instead, secondary chips and counters must use **Translucent Harmonized Neutral Tints**:
- `bg-slate-200/50 dark:bg-slate-800/40`
- `border-slate-300/40 dark:border-white/[0.06]`
This allows the underlying obsidian/porcelain glass tone to show through without visual dissonance.
