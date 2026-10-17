import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';

const html = fs.readFileSync('public/index.html', 'utf8');
const i18nCode = fs.readFileSync('public/i18n.js', 'utf8');
const traceCode = fs.readFileSync('public/trace.js', 'utf8');
const geoCode = fs.readFileSync('public/geo.js', 'utf8');
const appCode = fs.readFileSync('public/app.js', 'utf8').replace(/\nload\(\);/, '\n');

function createFixtureState(role = 'ADMIN') {
  return {
    user: {
      email: role === 'SUPPLIER_USER' ? 'supplier@woodco.vn' : 'reviewer@koda.vn',
      name: role === 'SUPPLIER_USER' ? 'WoodCo Supplier' : 'KODA Reviewer',
      role,
      department: role === 'SUPPLIER_USER' ? 'Supplier' : 'Compliance',
      supplier_id: role === 'SUPPLIER_USER' ? 'SUP-1' : '',
      capabilities: ['ORDER_EDIT', 'MATERIAL_EDIT', 'SUPPLIER_EDIT', 'CHAIN_EDIT', 'EVIDENCE_UPLOAD', 'EVIDENCE_REVIEW', 'POLICY_EDIT', 'AI_USE', 'AI_REVIEW', 'GEO_EDIT', 'GEO_REVIEW', 'EXPORT', 'WORKFLOW_CLOSE']
    },
    cases: [
      {
        id: 'CASE-2183',
        so: 'SO25-2183',
        customer: 'Nordic Living',
        customer_code: 'NL-01',
        product: 'Dining Table',
        status: 'IN_PROGRESS',
        readiness: 50,
        accepted: 2,
        total: 4,
        owner: 'reviewer@koda.vn',
        shipment_date: '2026-06-15',
        due: '2026-06-01',
        created_at: '2026-04-01T00:00:00Z',
        updated_at: '2026-04-10T00:00:00Z'
      },
      {
        id: 'CASE-CLOSED',
        so: 'SO25-1900',
        customer: 'Berlin Home',
        product: 'Oak Chair',
        status: 'CLOSED',
        readiness: 100,
        accepted: 3,
        total: 3,
        owner: 'reviewer@koda.vn',
        due: '2026-03-01',
        created_at: '2026-02-01T00:00:00Z',
        updated_at: '2026-03-01T00:00:00Z'
      }
    ],
    products: [
      {id: 'PROD-1', case_id: 'CASE-2183', sequence: 1, product_name: 'Walnut Dining Table', quantity: 100, quantity_uom: 'pcs', active: 'YES'},
      {id: 'PROD-2', case_id: 'CASE-2183', sequence: 2, product_name: 'Oak Bench', quantity: 50, quantity_uom: 'pcs', active: 'YES'}
    ],
    materials: [
      {id: 'MAT-WALNUT', case_id: 'CASE-2183', material: 'Solid Walnut', category: 'SOLID_WOOD', supplier_po: 'PO-W-01', active: 'YES'},
      {id: 'MAT-OAK', case_id: 'CASE-2183', material: 'European White Oak', category: 'SOLID_WOOD', supplier_po: 'PO-O-02', active: 'YES'}
    ],
    trace: {
      sources: [
        {id: 'SRC-W1', case_id: 'CASE-2183', material_id: 'MAT-WALNUT', supplier_po: 'PO-W-01', po_line: '10', lot_no: 'LOT-W1', active: 'YES'},
        {id: 'SRC-W2', case_id: 'CASE-2183', material_id: 'MAT-WALNUT', supplier_po: 'PO-W-01', po_line: '20', lot_no: 'LOT-W2', active: 'YES'}
      ],
      usage: [
        {id: 'USE-1', case_id: 'CASE-2183', product_id: 'PROD-1', material_id: 'MAT-WALNUT', source_id: 'SRC-W1', active: 'YES'},
        {id: 'USE-2', case_id: 'CASE-2183', product_id: 'PROD-1', material_id: 'MAT-WALNUT', source_id: 'SRC-W2', active: 'YES'},
        {id: 'USE-3', case_id: 'CASE-2183', product_id: 'PROD-2', material_id: 'MAT-OAK', source_id: '', active: 'YES'}
      ],
      edges: [
        {id: 'EDGE-1', source_id: 'SRC-W1', from_node_id: 'NODE-1', to_node_id: 'NODE-2'},
        {id: 'EDGE-2', source_id: 'SRC-W2', from_node_id: 'NODE-1', to_node_id: 'NODE-2'}
      ],
      recordLinks: []
    },
    chain: [
      {id: 'NODE-1', case_id: 'CASE-2183', material_id: 'MAT-WALNUT', parent_id: '', supplier_id: 'SUP-1', display_name: 'Sawmill Alpha', tier: 1, node_type: 'PROCESSOR', terminal: 'NO'},
      {id: 'NODE-2', case_id: 'CASE-2183', material_id: 'MAT-WALNUT', parent_id: 'NODE-1', supplier_id: 'SUP-1', display_name: 'Forest Plot Delta', tier: 2, node_type: 'PLOT', plot_id: 'PLOT-99', terminal: 'YES'}
    ],
    tasks: [
      {id: 'TASK-REQ-MISSING', case_id: 'CASE-2183', material_id: 'MAT-WALNUT', chain_node_id: '', evidence: 'Harvest permit', evidence_block: '02_FSC_Certification', required: 'YES', override_state: 'REQUIRED', status: 'MISSING', owner: 'reviewer@koda.vn', supplier_id: 'SUP-1', due: '2020-01-01', active: 'YES'},
      {id: 'TASK-REQ-REVIEW', case_id: 'CASE-2183', material_id: 'MAT-WALNUT', chain_node_id: '', evidence: 'FSC Certificate', evidence_block: '02_FSC_Certification', required: 'YES', override_state: 'REQUIRED', status: 'SUBMITTED', owner: 'reviewer@koda.vn', assigned_reviewer: 'reviewer@koda.vn', document_id: 'DOC-FSC', due: '2099-12-31', active: 'YES'},
      {id: 'TASK-REQ-APPROVED', case_id: 'CASE-2183', material_id: 'MAT-WALNUT', chain_node_id: '', evidence: 'Transport Bill', evidence_block: '03_Transport', required: 'YES', override_state: 'REQUIRED', status: 'APPROVED', owner: 'reviewer@koda.vn', document_id: 'DOC-TR', due: '2099-12-31', active: 'YES'},
      {id: 'TASK-OPTIONAL-MISSING', case_id: 'CASE-2183', material_id: 'MAT-WALNUT', chain_node_id: '', evidence: 'Optional Photo', evidence_block: '01_Commercial_Shipping', required: 'YES', override_state: 'OPTIONAL', status: 'MISSING', owner: 'reviewer@koda.vn', due: '2020-01-01', active: 'YES'},
      {id: 'TASK-NOT-REQ', case_id: 'CASE-2183', material_id: 'MAT-WALNUT', chain_node_id: '', evidence: 'Waived Doc', evidence_block: '01_Commercial_Shipping', required: 'NO', override_state: 'NOT_REQUIRED', status: 'MISSING', owner: 'reviewer@koda.vn', due: '2020-01-01', active: 'YES'}
    ],
    docs: [
      {id: 'DOC-FSC', case_id: 'CASE-2183', material_id: 'MAT-WALNUT', task_id: 'TASK-REQ-REVIEW', name: 'fsc-evidence.pdf', kind: 'EVIDENCE', version: 1, active: 'YES', active_version: 'YES', status: 'SUBMITTED', sha256: 'abc1234567890def', size_bytes: 20480},
      {id: 'DOC-TR', case_id: 'CASE-2183', material_id: 'MAT-WALNUT', task_id: 'TASK-REQ-APPROVED', name: 'transport.pdf', kind: 'EVIDENCE', version: 1, active: 'YES', active_version: 'YES', status: 'APPROVED', sha256: 'def9876543210abc', size_bytes: 10240}
    ],
    geo: [
      {
        id: 'GEO-1',
        case_id: 'CASE-2183',
        material_id: 'MAT-WALNUT',
        chain_node_id: 'NODE-2',
        plot_id: 'PLOT-99',
        country: 'VN',
        geometry_type: 'Point',
        latitude: 11.123456,
        longitude: 106.654321,
        precision_digits: 6,
        area_ha: 2.5,
        source_document_id: 'DOC-FSC',
        status: 'SUBMITTED',
        verification_status: 'REVIEW_REQUIRED',
        geojson: JSON.stringify({
          type: 'FeatureCollection',
          features: [{type: 'Feature', properties: {plot_id: 'PLOT-99'}, geometry: {type: 'Point', coordinates: [106.654321, 11.123456]}}]
        })
      }
    ],
    suppliers: [{id: 'SUP-1', name: 'WoodCo Vietnam', supplier_code: 'WC-01', email: 'supplier@woodco.vn', active: 'YES'}],
    owners: [{email: 'reviewer@koda.vn', name: 'KODA Reviewer', department: 'Compliance', role: 'ADMIN', active: 'YES'}],
    notifications: [],
    settings: [{key: 'RULES_CONFIRMED', value: 'YES'}],
    countryRisk: [{country_code: 'VN', risk_level: 'STANDARD', rule_version: 'EU-2025', checked_at: '2026-04-01'}],
    regulationRules: [],
    regulationRegistryReady: true,
    requirements: [],
    audit: []
  };
}

function bootEnv({role = 'ADMIN', initialHash = '', apiHandler = null} = {}) {
  const url = 'https://koda-eudr-system.netlify.app/' + (initialHash || '');
  const dom = new JSDOM(html, {url, runScripts: 'outside-only'});
  const {window} = dom;
  window.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  window.HTMLDialogElement.prototype.close = function () { this.open = false; };
  window.scrollTo = () => {};
  window.confirm = () => true;
  window.URL.createObjectURL = () => 'blob:mock-url';
  window.URL.revokeObjectURL = () => {};

  let activeLeafletMaps = 0;
  const createLayer = () => {
    const layer = {
      addTo() { return layer; },
      on() { return layer; },
      bindTooltip() { return layer; },
      setStyle() { return layer; },
      getBounds() { return {isValid: () => true}; },
      eachLayer(fn) { fn(layer); }
    };
    return layer;
  };
  window.L = {
    map() {
      activeLeafletMaps++;
      let center = {lat: 11.123456, lng: 106.654321};
      let zoom = 14;
      const handlers = {};
      return {
        setView(coords, z) {
          center = {lat: coords[0], lng: coords[1]};
          zoom = z;
        },
        getCenter() { return center; },
        getZoom() { return zoom; },
        fitBounds() {},
        invalidateSize() {},
        on(evt, fn) { handlers[evt] = fn; },
        remove() { activeLeafletMaps--; }
      };
    },
    tileLayer() { return {addTo() {}}; },
    featureGroup() { return createLayer(); },
    geoJSON() { return createLayer(); },
    circleMarker() { return createLayer(); }
  };
  window.__getActiveLeafletMaps = () => activeLeafletMaps;

  const fixture = createFixtureState(role);
  window.fetch = async (_input, init) => {
    const body = JSON.parse(init?.body || '{}');
    if (apiHandler) {
      const custom = await apiHandler(body, fixture);
      if (custom !== undefined) return custom;
    }
    if (body.action === 'bootstrap') {
      return {ok: true, status: 200, json: async () => ({ok: true, data: fixture})};
    }
    if (body.action === 'getDocument') {
      const doc = fixture.docs.find(d => d.id === body.args?.[0]) || fixture.docs[0];
      return {
        ok: true,
        status: 200,
        json: async () => ({
          ok: true,
          data: {
            id: doc.id,
            name: doc.name,
            type: 'text/plain',
            size: 12,
            data: Buffer.from('PDF-CONTENT').toString('base64'),
            version: doc.version,
            active: doc.active,
            status: doc.status,
            sha256: doc.sha256,
            comments: [],
            versions: [{id: doc.id, version: 1, status: doc.status, active_version: 'YES'}]
          }
        })
      };
    }
    return {ok: true, status: 200, json: async () => ({ok: true, data: {ok: true}})};
  };

  window.eval(i18nCode);
  window.eval(traceCode);
  window.eval(geoCode);
  window.eval(
    appCode +
    `\nstate = ${JSON.stringify(fixture)};` +
    `\nwindow.__getAppVar = k => eval(k);` +
    `\nwindow.__runApp = expr => eval(expr);` +
    `\nrender();`
  );
  return {window, document: window.document, fixture};
}

test('NAV-01..NAV-06 & NAV-10..NAV-11: Full context-aware navigation chain (Dashboard -> Orders -> SO25-2183 -> Solid Walnut -> Source -> GeoJSON Map -> Source Evidence PDF -> Back chain & Forward)', async () => {
  const {window, document} = bootEnv();

  // Start on Dashboard
  assert.equal(window.__runApp('view'), 'Dashboard');

  // 1. Navigate Dashboard -> Orders
  window.EudrNav.navigate({view: 'Orders'});
  assert.equal(window.__runApp('view'), 'Orders');

  // 2. Navigate Orders -> SO25-2183 Workspace
  window.go('Workspace', 'CASE-2183');
  assert.equal(window.__runApp('view'), 'Workspace');
  assert.equal(window.__runApp('selected'), 'CASE-2183');

  // 3. Select Solid Walnut material
  const walnutBtn = document.querySelector('[data-material="MAT-WALNUT"]');
  assert.ok(walnutBtn, 'Solid Walnut material button must exist');
  walnutBtn.click();
  assert.equal(window.__runApp('material'), 'MAT-WALNUT');
  assert.equal(window.__runApp('workspaceStep'), 'material');

  // 4. Select second source SRC-W2
  const sourceBtn = document.querySelector('[data-source="SRC-W2"]');
  assert.ok(sourceBtn, 'Second PO/lot source button must exist');
  sourceBtn.click();
  assert.equal(window.__runApp('selectedSource'), 'SRC-W2');
  assert.equal(window.__runApp('workspaceStep'), 'source');

  // 5. Open GeoJSON Map viewer
  await window.__runApp(`geoDialog('MAT-WALNUT')`);
  assert.equal(document.getElementById('drawer').open, true);
  assert.equal(window.EudrNav.currentViewer()?.type, 'geo');
  assert.equal(window.__getActiveLeafletMaps(), 1);

  // 6. Open Source Evidence PDF from inside GeoJSON Map
  await window.__runApp(`documentView('DOC-FSC')`);
  assert.equal(window.EudrNav.currentViewer()?.type, 'document');
  assert.equal(window.EudrNav.currentViewer()?.id, 'DOC-FSC');
  assert.equal(window.EudrNav.getViewerStack().length, 2);
  // Previous Leaflet map instance was cleaned up when drawer switched to PDF
  assert.equal(window.__getActiveLeafletMaps(), 0);

  // Expected Back 1: PDF -> GeoJSON Map
  await window.EudrNav.back();
  assert.equal(window.EudrNav.currentViewer()?.type, 'geo');
  assert.equal(window.EudrNav.getViewerStack().length, 1);
  assert.equal(document.getElementById('drawer').open, true);
  assert.equal(window.__getActiveLeafletMaps(), 1);

  // Expected Back 2: GeoJSON Map -> Selected Source (SRC-W2)
  await window.EudrNav.back();
  assert.equal(document.getElementById('drawer').open, false);
  assert.equal(window.EudrNav.getViewerStack().length, 0);
  assert.equal(window.__getActiveLeafletMaps(), 0, 'Leaflet map must be destroyed when closing GeoJSON drawer');
  assert.equal(window.__runApp('view'), 'Workspace');
  assert.equal(window.__runApp('selected'), 'CASE-2183');
  assert.equal(window.__runApp('material'), 'MAT-WALNUT');
  assert.equal(window.__runApp('selectedSource'), 'SRC-W2', 'Must restore exact selected source SRC-W2, not default to first source');

  // Expected Back 3: Selected Source -> Solid Walnut (Material step)
  await window.EudrNav.back();
  assert.equal(window.__runApp('view'), 'Workspace');
  assert.equal(window.__runApp('material'), 'MAT-WALNUT');
  assert.equal(window.__runApp('workspaceStep'), 'material');

  // Expected Back 4: Solid Walnut -> Order Workspace root
  await window.EudrNav.back();
  assert.equal(window.__runApp('view'), 'Workspace');
  assert.equal(window.__runApp('selected'), 'CASE-2183');
  assert.equal(window.__runApp('workspaceStep'), 'order');

  // Expected Back 5: Order Workspace -> Orders
  await window.EudrNav.back();
  assert.equal(window.__runApp('view'), 'Orders');

  // NAV-06: Forward navigation after Back restores Order Workspace
  assert.equal(window.EudrNav.canGoForward(), true);
  await window.EudrNav.forward();
  assert.equal(window.__runApp('view'), 'Workspace');
  assert.equal(window.__runApp('selected'), 'CASE-2183');
});

test('NAV-07..NAV-09 & NAV-12: Browser popstate, refresh recovery, unauthorized deep-link protection, and unsaved form guard', async () => {
  const {window} = bootEnv({initialHash: '#view=Workspace&caseId=CASE-2183&materialId=MAT-WALNUT&sourceId=SRC-W2'});

  // Refresh recovery from hash
  window.EudrNav.restoreFromUrlOrSession();
  window.__runApp('render()');
  assert.equal(window.__runApp('view'), 'Workspace');
  assert.equal(window.__runApp('selected'), 'CASE-2183');
  assert.equal(window.__runApp('material'), 'MAT-WALNUT');
  assert.equal(window.__runApp('selectedSource'), 'SRC-W2');

  // Verify no sensitive token or file bytes in URL hash or sessionStorage
  assert.ok(!window.location.hash.includes('PDF-CONTENT'));
  assert.ok(!window.sessionStorage.getItem('eudr_nav_state').includes('PDF-CONTENT'));

  // NAV-12: Unauthorized or revoked deep link is cleared and shows access message
  window.location.hash = '#view=Workspace&caseId=CASE-UNAUTHORIZED-999';
  const reval = window.EudrNav.revalidateAccess();
  assert.equal(reval.revoked, true);
  assert.equal(window.__runApp('selected'), '');
  assert.equal(window.__runApp('view'), 'Orders');

  // NAV-09: Unsaved form navigation guard blocks navigation when user declines confirm
  window.EudrNav.markDirty(true);
  window.confirm = () => false;
  const moved = window.EudrNav.navigate({view: 'Dashboard'});
  assert.equal(moved, false);
  assert.equal(window.__runApp('view'), 'Orders');

  // When user confirms, navigation proceeds and clears dirty flag
  window.confirm = () => true;
  const movedAfterConfirm = window.EudrNav.navigate({view: 'Dashboard'});
  assert.equal(movedAfterConfirm, true);
  assert.equal(window.__runApp('view'), 'Dashboard');
});

test('SIDE-01..SIDE-06: Categorized sidebar, role-based visibility, desktop collapse, mobile drawer, active order card, and KODA branding', () => {
  const {window, document} = bootEnv({role: 'ADMIN'});

  // SIDE-06: Official KODA logo and dark green brand sidebar classes preserved
  const logo = document.querySelector('.brand img');
  assert.ok(logo);
  assert.equal(logo.getAttribute('src'), '/koda-logo.png');
  assert.ok(document.querySelector('.brand-caption')?.textContent.includes('EUDR'));

  // Categorized groups for ADMIN: OPERATIONS, EUDR MANAGEMENT, ADMINISTRATION
  const groupLabels = [...document.querySelectorAll('#nav .sidebar-section')].map(el => el.textContent.trim());
  assert.deepEqual(groupLabels, ['OPERATIONS', 'EUDR MANAGEMENT', 'ADMINISTRATION']);

  // SIDE-02: Desktop collapse / expand
  const collapseBtn = document.getElementById('sidebarCollapseBtn');
  const shell = document.getElementById('appShell');
  assert.ok(collapseBtn);
  assert.equal(shell.classList.contains('sidebar-collapsed'), false);
  collapseBtn.click();
  assert.equal(shell.classList.contains('sidebar-collapsed'), true);
  collapseBtn.click();
  assert.equal(shell.classList.contains('sidebar-collapsed'), false);

  // SIDE-03: Mobile drawer open/close
  const mobileBtn = document.getElementById('mobileMenuBtn');
  const sidebar = document.getElementById('sidebar');
  mobileBtn.click();
  assert.equal(sidebar.classList.contains('mobile-open'), true);
  mobileBtn.click();
  assert.equal(sidebar.classList.contains('mobile-open'), false);

  // SIDE-04: Active/recent order indicator in sidebar
  window.go('Workspace', 'CASE-2183');
  const activeCard = document.querySelector('#sidebarOrderContext .sidebar-active-card');
  assert.ok(activeCard, 'Active order context card must render when an order is selected');
  assert.ok(activeCard.textContent.includes('SO25-2183'));

  // Navigate to Calendar and use sidebar active order card to return directly to SO25-2183
  window.go('Calendar');
  assert.equal(window.__runApp('view'), 'Calendar');
  const returnBtn = document.getElementById('sidebarQuickReturnBtn');
  assert.ok(returnBtn, 'Recent order return button remains visible when visiting Calendar');
  returnBtn.click();
  assert.equal(window.__runApp('view'), 'Workspace');
  assert.equal(window.__runApp('selected'), 'CASE-2183');

  // SIDE-01: Supplier role sees only authorized navigation items (no Users/Settings/AI Assistant/Suppliers)
  const supplierEnv = bootEnv({role: 'SUPPLIER_USER'});
  const supplierNavItems = [...supplierEnv.document.querySelectorAll('#nav [data-view]')].map(b => b.dataset.view);
  assert.ok(supplierNavItems.includes('Orders'));
  assert.ok(supplierNavItems.includes('My Tasks'));
  assert.ok(!supplierNavItems.includes('Users'));
  assert.ok(!supplierNavItems.includes('Settings'));
  assert.ok(!supplierNavItems.includes('AI Assistant'));
});

test('DASH-01..DASH-07: Unit-consistent KPI calculations, optional task exclusion, clickable KPI drill-down, and Back to Dashboard', () => {
  const {window, document} = bootEnv({role: 'ADMIN'});

  const metrics = window.__runApp('computeDashboardMetrics()');
  // Active orders = 1 (CASE-2183 is IN_PROGRESS, CASE-CLOSED is CLOSED)
  assert.equal(metrics.active.length, 1);
  // Required tasks = 3 (TASK-REQ-MISSING, TASK-REQ-REVIEW, TASK-REQ-APPROVED)
  // TASK-OPTIONAL-MISSING and TASK-NOT-REQ must be excluded from required counts!
  assert.equal(metrics.requiredTasks.length, 3);
  assert.equal(metrics.missingRequired.length, 1);
  assert.equal(metrics.overdueTasks.length, 1);
  assert.equal(metrics.awaitingMyReview.length, 1);
  assert.equal(metrics.waitingSupplier.length, 1);
  assert.equal(metrics.approvedRequired.length, 1);

  // Verify hero-metrics-breakdown separates units instead of mixing orders and tasks
  const pills = [...document.querySelectorAll('.hero-metric-pill')].map(el => el.textContent.trim());
  assert.equal(pills.length, 4);
  assert.ok(pills[1].includes('1 Overdue evidence tasks'));
  assert.ok(pills[2].includes('1 Missing required evidence'));

  // DASH-04 & DASH-05: Click Overdue Evidence Tasks KPI -> opens My Tasks filtered -> Back to Dashboard
  const overdueKpiBtn = document.querySelector('[data-kpi="OVERDUE_TASKS"]');
  assert.ok(overdueKpiBtn);
  overdueKpiBtn.click();
  assert.equal(window.__runApp('view'), 'My Tasks');
  assert.equal(window.__runApp('myTasksFilter'), 'OVERDUE_TASKS');
  assert.ok(document.getElementById('myTasksKpiBanner')?.textContent.includes('Overdue Evidence Tasks'));

  const backToDashBtn = document.getElementById('kpiBackToDashboard');
  assert.ok(backToDashBtn);
  backToDashBtn.click();
  assert.equal(window.__runApp('view'), 'Dashboard');

  // Click Active Orders KPI -> opens Orders filtered to active orders
  const activeOrdersKpiBtn = document.querySelector('[data-kpi="ACTIVE_ORDERS"]');
  activeOrdersKpiBtn.click();
  assert.equal(window.__runApp('view'), 'Orders');
  assert.equal(window.__runApp('dashboardKpiFilter'), 'ACTIVE_ORDERS');
  assert.equal(window.__runApp('filtered().length'), 1);
});

test('LOAD-01..LOAD-14: Centralized EudrOps state machine, duplicate-submit lock, chunk progress, error recovery, and OUTCOME_UNKNOWN handling', async () => {
  let callDelayMs = 0;
  let shouldFailStatus = 0;
  const {window, document} = bootEnv({
    apiHandler: async body => {
      if (callDelayMs > 0) await new Promise(r => setTimeout(r, callDelayMs));
      if (shouldFailStatus > 0 && body.action === 'updateOrder') {
        return {
          ok: false,
          status: shouldFailStatus,
          json: async () => ({ok: false, error: {code: 'UPSTREAM_TIMEOUT', message: 'Gateway timeout'}})
        };
      }
      return undefined;
    }
  });

  // 1. Direct EudrOps lifecycle: RUNNING -> SUCCEEDED
  const op1 = window.EudrOps.start({action: 'uploadChunk', label: 'Uploading GeoJSON', level: 4, progress: 50, unitLabel: '1/2 chunks'});
  assert.equal(window.EudrOps.get(op1).status, 'RUNNING');
  assert.equal(document.getElementById('opsStatusBtn').dataset.opsTone, 'running');
  window.EudrOps.succeed(op1, 'Upload complete');
  assert.equal(window.EudrOps.get(op1).status, 'SUCCEEDED');

  // 2. Write action timeout / 504 -> OUTCOME_UNKNOWN state
  shouldFailStatus = 504;
  await window.__runApp(`act('updateOrder', 'CASE-2183', {so: 'SO25-2183'})`);
  const latestOp = window.EudrOps.list().at(-1);
  assert.equal(latestOp.action, 'updateOrder');
  assert.equal(latestOp.status, 'OUTCOME_UNKNOWN');
  assert.ok(document.getElementById('msg').textContent.includes('uncertain'));

  // 3. Duplicate submit prevention while busy
  shouldFailStatus = 0;
  callDelayMs = 30;
  const firstCall = window.__runApp(`act('updateOrder', 'CASE-2183', {so: 'SO25-2183'})`);
  const secondCall = await window.__runApp(`act('updateOrder', 'CASE-2183', {so: 'SO25-2183'})`);
  assert.equal(secondCall, undefined, 'Second concurrent act() call must be blocked while busy');
  await firstCall;
});
