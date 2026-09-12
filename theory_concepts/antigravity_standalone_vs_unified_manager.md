# Architecture Concept: Standalone Window vs Unified Workbench in Electron

## 1. First Principles: Multi-Window Architectures in Electron
Electron applications are split into two primary process boundaries:
1. **The Main Process** (`Node.js` runtime): Owns application lifecycle, native OS menus, window management (`BrowserWindow`), and system-level IPC routing.
2. **The Renderer Process** (`Chromium` runtime): Runs the web UI, DOM manipulation, styling, and client-side view components.

When designing complex developer tools (such as IDEs with autonomous AI agent orchestrators), architects face a classic systems trade-off:
- **Topology A: Multi-Window Standalone Architecture**
- **Topology B: Unified Single-Window Workbench Architecture**

---

## 2. Multi-Window Standalone Manager (`enableStandaloneManager: true`)
In earlier versions or dedicated managerial modes:
- The **Code Editor** runs in its own `BrowserWindow`.
- The **Agent Manager** runs in a separate, dedicated `BrowserWindow` (e.g. `O7.Manager`).
- **Communication Flow**: Inter-Process Communication (IPC) via Electron's `ipcMain` / `ipcRenderer` and Shared State (`UnifiedStateSync`).
- **Characteristics**:
  - `xr = e.standaloneManagerEnabled ? void 0 : Mdo(W)`: When standalone mode is enabled, the agent manager does not mount the embedded VS Code `editorFeature`.
  - `setExistingWindowState`: In standalone mode, window state changes (materialize, shadow, minimize) are treated as dedicated top-level window operations rather than panel toggles.
  - **Pros**: Dedicated screen real estate, ideal for multi-monitor setups where agent supervision occurs on a secondary display.
  - **Cons**: Window management friction, floating window clobbering, and duplicate window chrome.

---

## 3. Unified Workbench Architecture (`enableStandaloneManager: false`)
In modern Antigravity IDE:
- The Agent Manager is rendered natively as an integrated workbench panel/sidebar (`antigravity.openAgent`, `Ctrl + ;` switcher).
- The `editorFeature` is passed directly into the agent component tree (`Ga().editorFeature`), enabling direct file opening, diff review injection, and synchronized editor layout manipulation.
- **Pros**: Seamless single-window workflow, unified hotkey navigation, and zero floating window management overhead.

---

## 4. How the Setting Operates Under the Hood
In `/opt/Antigravity/resources/app/out/main.js`:
```javascript
function v3e(e) {
    return e.getValue("codeiumDev.disableOneLS") !== true;
}

function nK(e) {
    return e.getValue("codeiumDev.enableStandaloneManager") === true && v3e(e);
}
```
During window initialization:
```javascript
standaloneManagerEnabled: nK(this.configurationService)
```
The configuration service resolves `codeiumDev.enableStandaloneManager` from `~/.config/Antigravity IDE/User/settings.json`.

---

## 5. Summary Comparison

| Metric | Standalone Manager (`true`) | Unified Workbench (`false` default) |
| :--- | :--- | :--- |
| **Window Host** | Separate Electron `BrowserWindow` | Primary Workbench Window |
| **Editor Integration** | Decoupled IPC (`editorFeature = void 0`) | Native In-Process (`Ga().editorFeature`) |
| **Ideal Use Case** | Dedicated multi-monitor supervision | Focused single-display coding & inline pair-programming |
| **Lifecycle Hook** | Requires full window recreate / reload | Hot-reloaded within editor layout |
