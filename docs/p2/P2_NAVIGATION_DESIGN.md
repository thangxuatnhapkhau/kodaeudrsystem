# P2-A Navigation Design — Context-Aware Navigation & Viewer Stack

## 1. Route & Context Schema

`EudrNav.captureState()` captures a lightweight, serializable snapshot of the user's exact location without storing sensitive tokens or document bytes:

```json
{
  "view": "Workspace",
  "caseId": "CASE-2183",
  "productId": "PROD-1",
  "materialId": "MAT-WALNUT",
  "sourceId": "SRC-W2",
  "chainNodeId": "NODE-2",
  "workspaceTab": "evidence",
  "workspaceStep": "source",
  "viewer": "document",
  "documentId": "DOC-FSC",
  "geoId": "",
  "viewerPage": 2,
  "dashboardKpiFilter": "",
  "myTasksFilter": "",
  "filterSnapshot": { "q": "", "status": "", "supplier": "", "owner": "", "material": "", "block": "", "geo": "", "due": "", "from": "", "to": "" },
  "scrollY": 0,
  "returnContext": null
}
```

## 2. Multi-Level Navigation Walkthrough

For the canonical workflow:
`Dashboard → Orders → SO25-2183 → Solid Walnut → Selected Source → GeoJSON Map → Source Evidence PDF`

1. **PDF → Back → GeoJSON Map**: Pops the top `document` viewer from `viewerStack`, restores the `geo` viewer for `MAT-WALNUT`, and restores the exact selected plot (`recordIndex`), map center (`[lat, lng]`), and zoom level via `EudrGeo.lastViewByMaterial`.
2. **GeoJSON Map → Back → Selected Source**: Pops the `geo` viewer, closes `#drawer` (destroying the Leaflet instance), and keeps `selected = 'CASE-2183'`, `material = 'MAT-WALNUT'`, `selectedSource = 'SRC-W2'`, `workspaceStep = 'source'`.
3. **Selected Source → Back → Solid Walnut**: Restores `workspaceStep = 'material'` with `MAT-WALNUT` selected.
4. **Solid Walnut → Back → Order Workspace**: Restores `workspaceStep = 'order'` on `SO25-2183`.
5. **Order Workspace → Back → Orders**: Returns to the `Orders` register with filter state intact.
6. **Forward**: Re-applies the forward snapshot from `navForward`.

## 3. Refresh Recovery, Deep Links & Access Revalidation

- Non-sensitive route context (`view`, `caseId`, `productId`, `materialId`, `sourceId`, `chainNodeId`, `workspaceTab`, `recentOrders`, `orderContexts`) is persisted in `sessionStorage` (`eudr_nav_state`) and supported via URL hash parameters (`#view=Workspace&caseId=...&materialId=...&sourceId=...` as well as legacy `#task=...`).
- On every `load()` or `EudrNav.revalidateAndRestore()`, each restored ID is verified against the authenticated user's `state.cases`, `state.products`, `state.materials`, `state.trace.sources`, and `state.chain`.
- If a deep-linked or restored resource is unauthorized or removed, `EudrNav` clears the invalid context, redirects to `Orders` (or `My Tasks` for suppliers), and displays: `"Access to the previously selected record is no longer available."`
