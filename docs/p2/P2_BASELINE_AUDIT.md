# P2 Baseline Audit Report — KODA EUDR Workspace

- **Pinned Baseline Commit**: `04418c465713769cac77d8ab6b9668fa02d4289b`
- **Dedicated Feature Branch**: `feature/eudr-p2-ux-navigation`
- **Production URL**: `https://koda-eudr-system.netlify.app/`
- **Audit Scope**: Frontend state management, navigation lifecycle, drawer/modal viewer handling, sidebar hierarchy, dashboard KPI calculations, and asynchronous loading/operation feedback.

## 1. Confirmed Baseline State Variables & Navigation Functions

Inspection of `public/app.js`, `public/geo.js`, `public/trace.js`, `public/pdf-preview.mjs`, and `public/index.html` confirmed the following baseline implementation:

- **Global Frontend State Variables (`public/app.js`)**:
  - `state`: Bootstrap payload (`user`, `cases`, `products`, `materials`, `trace`, `chain`, `tasks`, `docs`, `geo`, `suppliers`, `owners`, `notifications`, `settings`, `countryRisk`, `regulationRules`, `requirements`, `audit`).
  - `view`: Top-level view string (`Dashboard`, `Orders`, `My Tasks`, `Calendar`, `AI Assistant`, `Export`, `Audit Trail`, `Workspace`, `Users`, `Suppliers`, `Settings`).
  - `selected`: Active Order ID (`case_id`).
  - `selectedProduct`: Active Product ID (`product_id`).
  - `material`: Active Material ID (`material_id`).
  - `selectedSource`: Active PO/lot source ID (`source_id`).
  - `selectedChainNode`: Active supply-chain node ID (`chain_node_id`).
  - `workspaceTab`: Active tab inside Order Workspace (`evidence`, `chat`, `review`, `classify`, `issues`, `customer`).
  - `busy`: Single boolean lock used only during `act()` / form submissions.

- **Core Navigation & Rendering Functions**:
  - `go(v, id)`: Directly mutated `view` and `selected`, resetting `material`, `selectedChainNode`, and `selectedSource` whenever switching orders.
  - `render()`: Rebuilt `#nav` as a flat ungrouped list of `<button>` elements and invoked the active view renderer.
  - `workspace()`: Rendered the Order Workspace and fell back to `products[0]`, `mats[0]`, and `sourceChoices[0]` whenever prior context was not preserved.
  - `drawer(html)` / `closeDrawer()`: Operated on a single shared `<dialog id="drawer">` element without a viewer stack.
  - `load()`: Re-fetched `bootstrap` and re-rendered without restoring nested navigation history.

## 2. Verification of Baseline Findings (1–8)

| # | Baseline Finding | Audit Status | Technical Evidence in Baseline Code |
|---|---|---|---|
| 1 | No complete navigation history across nested workspace views | **Confirmed** | Clicking Product, Material, Source, or Supply Chain node in `workspace()` directly reassigned variables and re-rendered without recording history steps. |
| 2 | Opening a different viewer replaces the existing drawer | **Confirmed** | `drawer(html)` immediately called `closeDrawer()` and replaced `#drawerContent.innerHTML`. Opening a source PDF from `EudrGeo.open()` (`onDocument: documentView`) destroyed the GeoJSON drawer and Leaflet map instance. |
| 3 | Users cannot reliably return from GeoJSON/PDF to the exact previous context | **Confirmed** | Closing the drawer after opening a PDF from GeoJSON dismissed the dialog completely rather than returning to the GeoJSON map or restoring the selected plot/zoom. |
| 4 | Workspace selection can be reset during rendering or reloading | **Confirmed** | `go('Workspace', id)` cleared `material`, `selectedChainNode`, and `selectedSource` on order switches, and browser refresh lost `view`, `selected`, `selectedProduct`, `material`, and `selectedSource` unless `#task=` was present. |
| 5 | Loading feedback is inconsistent across functions | **Confirmed** | `documentView()` wrote plain text `'Loading PDF preview…'`, `fileBytes()` wrote `'Loading document X%'` to `#msg`, and `load()` had no structured skeleton or operation indicator. |
| 6 | Some operations use text such as `"Saving…"` rather than a consistent progress UI | **Confirmed** | `act()` set `$('msg').textContent = 'Saving…'` and disabled all buttons on the page without operation-level tracking or uncertain-outcome distinction. |
| 7 | Dashboard KPI aggregation and actionable navigation need improvement | **Confirmed** | `.hero-panel` summed `overdue.length + missing.length + reviewing.length` (mixing **orders** and **tasks** into a single number), included `OPTIONAL` tasks in `missing`, and rendered static `div.kpi` cards with no click drill-down. |
| 8 | Sidebar layout is not optimized for multi-level workflows | **Confirmed** | `#nav` rendered a flat list of buttons under a single static `OPERATIONS` label, with no collapsible desktop state, no mobile drawer toggle, and no active/recent order quick-return card. |

## 3. Parallel-Development Isolation Verification (P0/P1)

- `14_SUPPLIERS`, `15_SUPPLY_CHAIN`, `29_MATERIAL_SOURCES`, `30_PRODUCT_MATERIAL_USAGE`, `31_SOURCE_EDGES`, `34_SOURCE_RECORD_LINKS`, and all Apps Script / Netlify backend services remain untouched by P2.
- All P2 changes are isolated to frontend UX, navigation, dashboard KPI computation, and operation status management on branch `feature/eudr-p2-ux-navigation`.
