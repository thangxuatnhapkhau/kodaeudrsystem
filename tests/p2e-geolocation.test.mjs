import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {randomUUID} from 'node:crypto';
import {JSDOM} from 'jsdom';
import {runtime} from './runtime.mjs';

const html = fs.readFileSync('public/index.html', 'utf8');
const i18nCode = fs.readFileSync('public/i18n.js', 'utf8');
const traceCode = fs.readFileSync('public/trace.js', 'utf8');
const geoCode = fs.readFileSync('public/geo.js', 'utf8');
const appCode = fs.readFileSync('public/app.js', 'utf8').replace(/\nload\(\);/, '\n');

function createP2EFixture({
  role = 'ADMIN',
  capabilities = ['ORDER_EDIT', 'MATERIAL_EDIT', 'SUPPLIER_EDIT', 'CHAIN_EDIT', 'EVIDENCE_UPLOAD', 'EVIDENCE_REVIEW', 'POLICY_EDIT', 'AI_USE', 'AI_REVIEW', 'GEO_EDIT', 'GEO_REVIEW', 'EXPORT', 'WORKFLOW_CLOSE'],
  geoRecords = null,
  chainNodes = null
} = {}) {
  return {
    user: {
      email: role === 'SUPPLIER_USER' ? 'supplier@woodco.vn' : 'reviewer@koda.vn',
      name: role === 'SUPPLIER_USER' ? 'WoodCo Supplier' : 'KODA Reviewer',
      role,
      department: role === 'SUPPLIER_USER' ? 'Supplier' : 'Compliance',
      supplier_id: role === 'SUPPLIER_USER' ? 'SUP-1' : '',
      capabilities
    },
    cases: [
      {
        id: 'CASE-2183',
        so: 'SO25-2183',
        customer: 'Nordic Living',
        product: 'Walnut Dining Table',
        status: 'IN_PROGRESS',
        readiness: 50,
        accepted: 2,
        total: 4,
        owner: 'reviewer@koda.vn'
      }
    ],
    products: [
      {id: 'PROD-1', case_id: 'CASE-2183', sequence: 1, product_name: 'Walnut Dining Table', quantity: 100, quantity_uom: 'pcs', active: 'YES'}
    ],
    materials: [
      {id: 'MAT-WALNUT', case_id: 'CASE-2183', material: 'Solid Walnut', category: 'SOLID_WOOD', supplier_po: 'PO-W-01', active: 'YES'},
      {id: 'MAT-EMPTY', case_id: 'CASE-2183', material: 'Rubberwood Core', category: 'SOLID_WOOD', supplier_po: 'PO-R-02', active: 'YES'}
    ],
    trace: {
      sources: [
        {id: 'SRC-W1', case_id: 'CASE-2183', material_id: 'MAT-WALNUT', supplier_po: 'PO-W-01', po_line: '10', lot_no: 'LOT-W1', active: 'YES'},
        {id: 'SRC-W2', case_id: 'CASE-2183', material_id: 'MAT-WALNUT', supplier_po: 'PO-W-01', po_line: '20', lot_no: 'LOT-W2', active: 'YES'}
      ],
      usage: [
        {id: 'USE-1', case_id: 'CASE-2183', product_id: 'PROD-1', material_id: 'MAT-WALNUT', source_id: 'SRC-W1', active: 'YES'},
        {id: 'USE-2', case_id: 'CASE-2183', product_id: 'PROD-1', material_id: 'MAT-WALNUT', source_id: 'SRC-W2', active: 'YES'}
      ],
      edges: [
        {id: 'EDGE-1', source_id: 'SRC-W1', from_node_id: 'NODE-1', to_node_id: 'NODE-2'},
        {id: 'EDGE-2', source_id: 'SRC-W2', from_node_id: 'NODE-1', to_node_id: 'NODE-2'}
      ],
      recordLinks: [
        {id: 'LNK-1', case_id: 'CASE-2183', material_id: 'MAT-WALNUT', source_id: 'SRC-W1', record_type: 'GEO', record_id: 'GEO-1', active: 'YES'}
      ]
    },
    chain: chainNodes !== null ? chainNodes : [
      {id: 'NODE-1', case_id: 'CASE-2183', material_id: 'MAT-WALNUT', parent_id: '', supplier_id: 'SUP-1', display_name: 'Sawmill Alpha', tier: 1, node_type: 'PROCESSOR', terminal: 'NO'},
      {id: 'NODE-2', case_id: 'CASE-2183', material_id: 'MAT-WALNUT', parent_id: 'NODE-1', supplier_id: 'SUP-1', display_name: 'Forest Plot Delta', tier: 2, node_type: 'PLOT', plot_id: 'PLOT-99', terminal: 'YES'},
      {id: 'NODE-PROD', case_id: 'CASE-2183', material_id: 'MAT-WALNUT', parent_id: 'NODE-1', supplier_id: 'SUP-1', display_name: 'Highland Forest Producer', tier: 2, node_type: 'PRODUCER', terminal: 'YES'}
    ],
    tasks: [
      {id: 'TASK-GEO-1', case_id: 'CASE-2183', material_id: 'MAT-WALNUT', chain_node_id: 'NODE-2', evidence: 'GEO location', evidence_block: '04_Geolocation', required: 'YES', status: 'MISSING', active: 'YES'}
    ],
    docs: [
      {id: 'DOC-GEO-SRC', case_id: 'CASE-2183', material_id: 'MAT-WALNUT', task_id: 'TASK-GEO-1', name: 'plot-99-boundary.geojson', kind: 'EVIDENCE', version: 1, active: 'YES', active_version: 'YES', status: 'APPROVED', sha256: 'abc1234567890def', size_bytes: 2048}
    ],
    geo: geoRecords !== null ? geoRecords : [
      {
        id: 'GEO-1',
        case_id: 'CASE-2183',
        material_id: 'MAT-WALNUT',
        chain_node_id: 'NODE-2',
        plot_id: 'PLOT-99',
        country_of_production: 'VN',
        production_range: '2026-01-01 / 2026-02-15',
        area_ha: 2.5,
        coordinate_precision_digits: 6,
        source_document_id: 'DOC-GEO-SRC',
        verification_status: 'REVIEW_REQUIRED',
        geometry_json: JSON.stringify({type: 'Point', coordinates: [106.654321, 11.123456]})
      },
      {
        id: 'GEO-2',
        case_id: 'CASE-2183',
        material_id: 'MAT-WALNUT',
        chain_node_id: 'NODE-PROD',
        plot_id: 'PLOT-100',
        country_of_production: 'VN',
        production_range: '2026-02-01 / 2026-03-01',
        area_ha: 6.4,
        coordinate_precision_digits: 7,
        source_document_id: 'DOC-GEO-SRC',
        verification_status: 'VERIFIED',
        reviewed_by: 'reviewer@koda.vn',
        reviewed_at: '2026-04-12T08:00:00Z',
        notes: 'Boundary verified against harvest map',
        geometry_json: JSON.stringify({
          type: 'Polygon',
          coordinates: [[[106.650001, 11.120001], [106.660001, 11.120001], [106.660001, 11.130001], [106.650001, 11.130001], [106.650001, 11.120001]]]
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

function bootGeoEnv(options = {}) {
  const dom = new JSDOM(html, {url: 'https://koda-eudr-system.netlify.app/', runScripts: 'outside-only'});
  const {window} = dom;
  window.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  window.HTMLDialogElement.prototype.close = function () { this.open = false; };
  window.scrollTo = () => {};
  window.confirm = () => true;
  let lastCreatedUrl = '';
  window.URL.createObjectURL = () => {
    lastCreatedUrl = 'blob:mock-geojson-export';
    return lastCreatedUrl;
  };
  window.URL.revokeObjectURL = () => {};

  let activeLeafletMaps = 0;
  let fitBoundsCalls = 0;
  let tileErrorCallback = null;
  let renderedFeatureList = [];

  if (options.leafletAvailable !== false) {
    const createLayer = (features = []) => {
      const layer = {
        features,
        addTo() { return layer; },
        remove() {},
        on() { return layer; },
        bindPopup() { return layer; },
        setStyle() { return layer; },
        getBounds() { return {isValid: () => true}; }
      };
      return layer;
    };
    window.L = {
      map() {
        activeLeafletMaps++;
        let center = {lat: 10.77, lng: 106.7};
        let zoom = 5;
        return {
          setView(coords, z) {
            center = {lat: coords[0], lng: coords[1]};
            zoom = z;
          },
          getCenter() { return center; },
          getZoom() { return zoom; },
          fitBounds() { fitBoundsCalls++; },
          invalidateSize() {},
          remove() { activeLeafletMaps--; }
        };
      },
      tileLayer() {
        return {
          on(evt, cb) { if (evt === 'tileerror') tileErrorCallback = cb; },
          addTo() {}
        };
      },
      control: {
        scale() { return {addTo() {}}; }
      },
      geoJSON(list, opts) {
        renderedFeatureList = Array.isArray(list) ? list : [list];
        for (const f of renderedFeatureList) {
          if (f) {
            opts?.style?.(f);
            if (f.geometry?.type === 'Point') opts?.pointToLayer?.(f, f.geometry.coordinates);
            opts?.onEachFeature?.(f, {bindPopup() {}});
          }
        }
        return createLayer(renderedFeatureList);
      },
      circleMarker() { return createLayer(); }
    };
  }

  const fixture = createP2EFixture(options);
  const apiCalls = [];
  window.fetch = async (_input, init) => {
    const body = JSON.parse(init?.body || '{}');
    apiCalls.push(body);
    if (options.apiHandler) {
      const custom = await options.apiHandler(body, fixture, apiCalls);
      if (custom !== undefined) return custom;
    }
    if (body.action === 'bootstrap') {
      return {ok: true, status: 200, json: async () => ({ok: true, data: fixture})};
    }
    if (body.action === 'addScopedRequirement') {
      const [caseId, payload] = body.args;
      const newTask = {
        id: 'TASK-NEW-GEO',
        case_id: caseId,
        material_id: payload.material_id,
        chain_node_id: payload.chain_node_id || '',
        evidence: payload.evidence,
        evidence_block: '04_Geolocation',
        required: 'YES',
        status: 'MISSING',
        active: 'YES'
      };
      fixture.tasks.push(newTask);
      return {ok: true, status: 200, json: async () => ({ok: true, data: {id: newTask.id}})};
    }
    if (body.action === 'uploadEvidence') {
      const [taskId, filePayload] = body.args;
      const docId = 'DOC-UPLOADED-' + apiCalls.length;
      const task = fixture.tasks.find(t => t.id === taskId);
      if (task) {
        task.document_id = docId;
        task.status = 'UPLOADED';
      }
      fixture.docs.push({
        id: docId,
        case_id: 'CASE-2183',
        material_id: task?.material_id || 'MAT-WALNUT',
        task_id: taskId,
        name: filePayload.name,
        kind: 'EVIDENCE',
        version: 1,
        active: 'YES',
        active_version: 'YES',
        status: 'UPLOADED',
        data_base64: filePayload.data
      });
      return {ok: true, status: 200, json: async () => ({ok: true, data: {id: docId, version: 1}})};
    }
    if (body.action === 'saveGeo') {
      const [caseId, input] = body.args;
      const geoId = 'GEO-SAVED-' + apiCalls.length;
      fixture.geo.push({
        id: geoId,
        case_id: caseId,
        material_id: input.material_id,
        chain_node_id: input.chain_node_id,
        plot_id: input.plot_id,
        country_of_production: input.country_of_production,
        production_range: input.production_range,
        area_ha: input.area_ha,
        coordinate_precision_digits: input.coordinate_precision_digits,
        source_document_id: input.source_document_id,
        verification_status: 'REVIEW_REQUIRED',
        notes: input.notes || '',
        geometry_json: JSON.stringify(input.geometry)
      });
      return {ok: true, status: 200, json: async () => ({ok: true, data: {id: geoId, status: 'REVIEW_REQUIRED'}})};
    }
    if (body.action === 'reviewGeo') {
      const [geoId, input] = body.args;
      const g = fixture.geo.find(x => x.id === geoId);
      if (g) {
        g.verification_status = input.status;
        g.notes = input.notes;
        g.reviewed_by = fixture.user.email;
        g.reviewed_at = '2026-04-15T10:00:00Z';
      }
      return {ok: true, status: 200, json: async () => ({ok: true, data: {id: geoId, status: input.status}})};
    }
    if (body.action === 'exportGeoJSON') {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          ok: true,
          data: {
            type: 'FeatureCollection',
            features: fixture.geo.map(g => ({
              type: 'Feature',
              properties: {plot_id: g.plot_id, verification_status: g.verification_status},
              geometry: JSON.parse(g.geometry_json)
            }))
          }
        })
      };
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
            size: 32,
            data: Buffer.from('{"type":"Point","coordinates":[106.654321,11.123456]}').toString('base64'),
            version: 1,
            active: 'YES',
            status: doc.status,
            sha256: doc.sha256 || 'abc',
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
    `\nsessionStorage.setItem('eudr_id_token', 'mock-token');` +
    `\nsessionStorage.setItem('eudr_token_expires', String(Date.now() + 3600000));` +
    `\nwindow.__getAppVar = k => eval(k);` +
    `\nwindow.__runApp = expr => eval(expr);` +
    `\nrender();`
  );

  return {
    window,
    document: window.document,
    fixture,
    apiCalls,
    getActiveLeafletMaps: () => activeLeafletMaps,
    getFitBoundsCalls: () => fitBoundsCalls,
    triggerTileError: () => tileErrorCallback?.(),
    getRenderedFeatures: () => renderedFeatureList,
    getLastCreatedUrl: () => lastCreatedUrl
  };
}

function selectMockFile(window, document, name, content, sizeOverride = null) {
  const input = document.getElementById('geoFile');
  const bytes = Buffer.from(content, 'utf8');
  const file = new window.File([bytes], name, {type: 'application/geo+json'});
  if (sizeOverride !== null) {
    Object.defineProperty(file, 'size', {value: sizeOverride});
  }
  Object.defineProperty(input, 'files', {value: [file], configurable: true});
  return input.onchange();
}

test('GEO-M01..GEO-M08: Map Viewer tab, plot selection, detail inspector, empty state, tile/Leaflet fallback, and role-gated Export GeoJSON', async () => {
  // GEO-M01: Open Geolocation Workspace for material with registered plots
  const env = bootGeoEnv();
  const {window, document} = env;
  window.go('Workspace', 'CASE-2183');
  await window.__runApp(`geoDialog('MAT-WALNUT')`);

  assert.equal(document.getElementById('drawer').open, true);
  assert.equal(env.getActiveLeafletMaps(), 1);
  assert.equal(document.querySelectorAll('[data-geo-record-item]').length, 2);

  // Verify 4 tabs exist: MAP, UPLOAD, REGISTER, REVIEW
  const tabIds = [...document.querySelectorAll('[data-geo-tab]')].map(b => b.dataset.geoTab);
  assert.deepEqual(tabIds, ['map', 'upload', 'register', 'review']);

  // GEO-M02: Click registered plot in list -> Map focuses selected plot and detail panel updates all 10 required fields
  const secondPlotBtn = document.querySelector('[data-geo-record="1"]');
  assert.ok(secondPlotBtn);
  secondPlotBtn.click();
  assert.equal(secondPlotBtn.getAttribute('aria-pressed'), 'true');
  assert.equal(document.querySelector('[data-geo-field="plot_id"]')?.textContent, 'PLOT-100');
  assert.equal(document.querySelector('[data-geo-field="geometry_type"]')?.textContent, 'Polygon');
  assert.equal(document.querySelector('[data-geo-field="country_of_production"]')?.textContent, 'VN');
  assert.equal(document.querySelector('[data-geo-field="area_ha"]')?.textContent, '6.4 ha');
  assert.equal(document.querySelector('[data-geo-field="production_range"]')?.textContent, '2026-02-01 / 2026-03-01');
  assert.equal(document.querySelector('[data-geo-field="coordinate_precision"]')?.textContent, '7 decimal digits');
  assert.equal(document.querySelector('[data-geo-field="material"]')?.textContent, 'Solid Walnut');
  assert.equal(document.querySelector('[data-geo-field="verification_status"]')?.textContent, 'VERIFIED');
  assert.ok(document.querySelector('[data-geo-field="chain_node"]')?.textContent.includes('Highland Forest Producer'));
  assert.ok(document.querySelector('[data-geo-field="evidence_document"]')?.textContent.includes('plot-99-boundary.geojson'));

  // GEO-M03: Click Show all plots -> Map fits all visible plots
  const beforeFits = env.getFitBoundsCalls();
  document.getElementById('geoFit').click();
  assert.ok(env.getFitBoundsCalls() > beforeFits);
  assert.equal(env.getRenderedFeatures().length, 2);

  // GEO-M05: Tile provider error -> Fallback status message shown; plot geometry and form remain usable
  env.triggerTileError();
  assert.equal(document.getElementById('geoMapStatus').textContent, 'Background map unavailable. Plot geometry remains visible.');
  assert.ok(document.getElementById('geoForm'));

  // GEO-M07: Export GeoJSON as internal authorized role -> Valid GeoJSON download triggered
  document.getElementById('geoExport').click();
  await new Promise(r => setTimeout(r, 10));
  assert.ok(env.apiCalls.some(c => c.action === 'exportGeoJSON'));
  assert.equal(env.getLastCreatedUrl(), 'blob:mock-geojson-export');

  // GEO-M04: Open material with no plots -> Clear empty state and Upload GeoJSON CTA shown
  await window.__runApp(`geoDialog('MAT-EMPTY')`);
  const emptyState = document.getElementById('geoEmptyState');
  assert.ok(emptyState, 'Empty state must render when material has 0 registered plots');
  assert.ok(emptyState.textContent.includes('No registered plots for this material/source.'));
  const uploadCta = document.getElementById('geoEmptyUploadCta');
  assert.ok(uploadCta, 'Upload GeoJSON CTA must be shown');
  uploadCta.click();
  assert.equal(document.querySelector('.geo-workspace').dataset.activeGeoTab, 'upload');

  // GEO-M06: Leaflet unavailable -> Fallback message shown; coordinates, upload and registration remain usable
  const noLeafletEnv = bootGeoEnv({leafletAvailable: false});
  await noLeafletEnv.window.__runApp(`geoDialog('MAT-WALNUT')`);
  assert.equal(
    noLeafletEnv.document.getElementById('geoMap').textContent,
    'Interactive map unavailable. Coordinates and registration remain available.'
  );
  assert.ok(noLeafletEnv.document.getElementById('geoFile'));
  assert.ok(noLeafletEnv.document.getElementById('geoForm'));

  // GEO-M08: Supplier user views Geolocation Workspace -> Export GeoJSON button hidden
  const supplierEnv = bootGeoEnv({
    role: 'SUPPLIER_USER',
    capabilities: ['EVIDENCE_UPLOAD', 'GEO_EDIT']
  });
  await supplierEnv.window.__runApp(`geoDialog('MAT-WALNUT')`);
  assert.equal(supplierEnv.document.getElementById('geoExport'), null);
});

test('GEO-U01..GEO-U10: GeoJSON Evidence Upload validation limits, multi-feature selector, existing/new task upload, and source auto-selection', async () => {
  const env = bootGeoEnv();
  const {window, document} = env;
  await window.__runApp(`geoDialog('MAT-WALNUT', {initialTab: 'upload'})`);

  // GEO-U01: Select valid Point GeoJSON
  const pointJson = JSON.stringify({
    type: 'Feature',
    properties: {plot_id: 'PLOT-PT-1'},
    geometry: {type: 'Point', coordinates: [106.712345, 11.212345]}
  });
  await selectMockFile(window, document, 'point.geojson', pointJson);
  assert.ok(document.getElementById('geoFileName').textContent.includes('point.geojson · 1 plot(s)'));
  assert.equal(document.querySelector('[data-upload-summary="geometry_type"]')?.textContent, 'Point');
  assert.equal(document.getElementById('geoGeometryStatus').textContent, 'Geometry ready for review.');
  document.getElementById('geoTask').value = 'TASK-GEO-1';
  document.getElementById('geoTask').onchange();
  assert.equal(document.getElementById('geoUpload').disabled, false);

  // GEO-U02: Select valid single-ring Polygon GeoJSON
  const polyJson = JSON.stringify({
    type: 'Feature',
    properties: {plot_id: 'PLOT-POLY-1'},
    geometry: {
      type: 'Polygon',
      coordinates: [[[106.1, 11.1], [106.2, 11.1], [106.2, 11.2], [106.1, 11.2], [106.1, 11.1]]]
    }
  });
  await selectMockFile(window, document, 'polygon.geojson', polyJson);
  assert.equal(document.querySelector('[data-upload-summary="geometry_type"]')?.textContent, 'Polygon');
  assert.equal(document.getElementById('geoGeometryStatus').textContent, 'Geometry ready for review.');

  // GEO-U03: Select valid FeatureCollection with multiple features -> Feature selector shown; switching feature updates preview and Plot ID
  const multiJson = JSON.stringify({
    type: 'FeatureCollection',
    features: [
      {type: 'Feature', properties: {plot_id: 'PLOT-A'}, geometry: {type: 'Point', coordinates: [106.111111, 11.111111]}},
      {type: 'Feature', properties: {plot_id: 'PLOT-B'}, geometry: {type: 'Point', coordinates: [106.222222, 11.222222]}}
    ]
  });
  await selectMockFile(window, document, 'collection.geojson', multiJson);
  const featSelect = document.getElementById('geoFeature');
  assert.equal(document.getElementById('geoFeatureLabel').hidden, false);
  assert.equal(featSelect.options.length, 2);
  assert.equal(document.getElementById('geoForm').elements.plot_id.value, 'PLOT-A');
  featSelect.value = '1';
  featSelect.onchange();
  assert.equal(document.getElementById('geoForm').elements.plot_id.value, 'PLOT-B');
  assert.ok(document.getElementById('geoCoordinates').textContent.includes('106.222222'));

  // GEO-U04: Select invalid JSON -> Clear validation message; upload and registration disabled
  await selectMockFile(window, document, 'broken.geojson', '{not valid json');
  assert.equal(document.getElementById('geoMessage').textContent, 'This file is not valid JSON.');
  assert.equal(document.getElementById('geoUpload').disabled, true);
  assert.equal(document.getElementById('geoRegister').disabled, true);

  // GEO-U05: Select file > 2 MB -> Clear 2 MB limit message; upload disabled
  await selectMockFile(window, document, 'huge.geojson', pointJson, 2000001);
  assert.equal(document.getElementById('geoMessage').textContent, 'Choose a .geojson or .json file up to 2 MB.');
  assert.equal(document.getElementById('geoUpload').disabled, true);
  assert.throws(() => window.EudrGeo.parse('x'.repeat(2000001)), /GeoJSON must be at most 2 MB/);

  // GEO-U06: Select GeoJSON > 100 features -> Clear feature limit message
  const over100 = JSON.stringify({
    type: 'FeatureCollection',
    features: Array.from({length: 101}, (_, i) => ({
      type: 'Feature',
      properties: {plot_id: 'P-' + i},
      geometry: {type: 'Point', coordinates: [106.1, 11.1]}
    }))
  });
  await selectMockFile(window, document, 'over100.geojson', over100);
  assert.equal(document.getElementById('geoMessage').textContent, 'Choose a GeoJSON with 1–100 features.');

  // GEO-U07: Select GeoJSON > 10,000 positions -> Clear position limit message
  const over10k = JSON.stringify({
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      properties: {plot_id: 'BIG-LINE'},
      geometry: {type: 'LineString', coordinates: Array.from({length: 10001}, (_, i) => [100 + (i % 50) * 0.001, 10 + (i % 50) * 0.001])}
    }]
  });
  await selectMockFile(window, document, 'over10k.geojson', over10k);
  assert.equal(document.getElementById('geoMessage').textContent, 'GeoJSON exceeds 10,000 positions.');

  // GEO-U08: Select coordinates outside [-180, 180] or [-90, 90] -> Clear coordinate range message
  const outOfRange = JSON.stringify({
    type: 'Feature',
    properties: {plot_id: 'BAD-COORD'},
    geometry: {type: 'Point', coordinates: [185.0, 95.0]}
  });
  await selectMockFile(window, document, 'outofrange.geojson', outOfRange);
  assert.equal(document.getElementById('geoMessage').textContent, 'Coordinates must be [longitude, latitude] within range.');

  // GEO-U09: Upload original GeoJSON to existing 04_Geolocation task -> Original file saved; source document auto-selected
  await selectMockFile(window, document, 'valid-plot.geojson', polyJson);
  document.getElementById('geoTask').value = 'TASK-GEO-1';
  document.getElementById('geoTask').onchange();
  await document.getElementById('geoUpload').onclick();
  const uploadCall = env.apiCalls.find(c => c.action === 'uploadEvidence');
  assert.ok(uploadCall);
  assert.equal(Buffer.from(uploadCall.args[1].data, 'base64').toString('utf8'), polyJson, 'Original GeoJSON bytes must remain unchanged');
  assert.ok(document.getElementById('geoForm').elements.source_document_id.value.startsWith('DOC-UPLOADED-'));
  assert.equal(document.getElementById('geoUploadSuccessCard').hidden, false);

  // GEO-U10: Create new 04_Geolocation task during upload (authorized user) -> Scoped task created and original GeoJSON uploaded
  await selectMockFile(window, document, 'second-plot.geojson', pointJson);
  document.getElementById('geoTask').value = '__NEW__';
  document.getElementById('geoTask').onchange();
  assert.equal(document.getElementById('geoNewTaskLabel').hidden, false);
  document.getElementById('geoNewTaskName').value = 'Northern Plot Boundary GeoJSON';
  await document.getElementById('geoUpload').onclick();
  assert.ok(env.apiCalls.some(c => c.action === 'addScopedRequirement' && c.args[1].evidence === 'Northern Plot Boundary GeoJSON'));
});

test('GEO-R01..GEO-R12: Plot Registration rules, Point >4 ha rejection, polygon topology checks, closed LineString conversion, missing chain node guard, and duplicate Plot ID detection', async () => {
  const env = bootGeoEnv();
  const {window, document} = env;
  await window.__runApp(`geoDialog('MAT-WALNUT', {initialTab: 'register'})`);
  const form = document.getElementById('geoForm');

  // GEO-R04..GEO-R08: Direct geometry topology checks
  // GEO-R04: Unclosed Polygon
  assert.throws(
    () => window.EudrGeo.checkGeometry({type: 'Polygon', coordinates: [[[106.1, 11.1], [106.2, 11.1], [106.2, 11.2], [106.1, 11.2]]]}),
    /Polygon rings must be closed/
  );
  // GEO-R05: Polygon with duplicate vertices
  assert.throws(
    () => window.EudrGeo.checkGeometry({type: 'Polygon', coordinates: [[[106.1, 11.1], [106.2, 11.1], [106.2, 11.1], [106.1, 11.2], [106.1, 11.1]]]}),
    /Polygon has duplicate vertices/
  );
  // GEO-R06: Self-intersecting Polygon (bowtie)
  assert.throws(
    () => window.EudrGeo.checkGeometry({type: 'Polygon', coordinates: [[[0, 0], [3, 3], [0, 2], [2, 0], [0, 0]]]}),
    /Polygon intersects itself/
  );
  // GEO-R07: Zero-area Polygon (collinear)
  assert.throws(
    () => window.EudrGeo.checkGeometry({type: 'Polygon', coordinates: [[[1, 1], [2, 2], [3, 3], [2, 2], [1, 1]]]}),
    /Polygon has duplicate vertices|Polygon has zero area/
  );
  assert.throws(
    () => window.EudrGeo.checkGeometry({type: 'Polygon', coordinates: [[[0, 0], [1, 0], [2, 0], [3, 0], [0, 0]]]}),
    /Polygon has zero area/
  );
  // GEO-R08: Polygon > 2,000 positions
  const ring2002 = Array.from({length: 2001}, (_, i) => [106 + Math.cos((i / 2001) * 2 * Math.PI) * 0.01, 11 + Math.sin((i / 2001) * 2 * Math.PI) * 0.01]);
  ring2002.push(ring2002[0]);
  assert.throws(
    () => window.EudrGeo.checkGeometry({type: 'Polygon', coordinates: [ring2002]}),
    /A registered polygon must have at most 2,000 positions/
  );

  // GEO-R09 & GEO-R10: Closed LineString confirmation and conversion
  const closedLineJson = JSON.stringify({
    type: 'Feature',
    properties: {plot_id: 'PLOT-LINE-201'},
    geometry: {
      type: 'LineString',
      coordinates: [[106.1, 11.1], [106.2, 11.1], [106.2, 11.2], [106.1, 11.2], [106.1, 11.1]]
    }
  });
  await selectMockFile(window, document, 'closed-line.geojson', closedLineJson);
  assert.equal(document.getElementById('geoLineLabel').hidden, false);
  // GEO-R09: Without confirmation, registration is disabled
  assert.equal(document.getElementById('geoRegister').disabled, true);
  assert.match(document.getElementById('geoGeometryStatus').textContent, /Confirm a closed plot boundary/);

  // GEO-R10: Check confirmation -> converted to Polygon for registration; audit note appended; original file unchanged
  const lineCheck = document.getElementById('geoLineConfirm');
  lineCheck.checked = true;
  lineCheck.onchange();
  assert.equal(document.getElementById('geoRegister').disabled, false);
  assert.equal(JSON.parse(form.elements.geometry.value).type, 'Polygon');

  form.elements.chain_node_id.value = 'NODE-PROD';
  form.elements.plot_id.value = 'PLOT-LINE-201';
  form.elements.country_of_production.value = 'VN';
  form.elements.production_range.value = '2026-01-01 / 2026-03-01';
  form.elements.area_ha.value = '5.2';
  form.elements.coordinate_precision_digits.value = '6';
  form.elements.source_document_id.value = 'DOC-GEO-SRC';
  form.elements.notes.value = 'Surveyed boundary';
  await form.onsubmit(new window.Event('submit', {bubbles: true, cancelable: true}));

  const lineSaveCall = env.apiCalls.find(c => c.action === 'saveGeo' && c.args[1].plot_id === 'PLOT-LINE-201');
  assert.ok(lineSaveCall);
  assert.equal(lineSaveCall.args[1].geometry.type, 'Polygon');
  assert.match(lineSaveCall.args[1].notes, /User confirmed closed LineString as plot boundary; Polygon registered\. Original GeoJSON unchanged\./);

  // GEO-R02: Attempt Point plot > 4 ha -> Rejected with clear polygon requirement message
  const pointJson = JSON.stringify({
    type: 'Feature',
    properties: {plot_id: 'PLOT-PT-BIG'},
    geometry: {type: 'Point', coordinates: [106.712345, 11.212345]}
  });
  await selectMockFile(window, document, 'pt-big.geojson', pointJson);
  const bigForm = document.getElementById('geoForm');
  bigForm.elements.chain_node_id.value = 'NODE-PROD';
  bigForm.elements.plot_id.value = 'PLOT-PT-BIG';
  bigForm.elements.country_of_production.value = 'VN';
  bigForm.elements.production_range.value = '2026-01-01 / 2026-02-01';
  bigForm.elements.area_ha.value = '4.5';
  bigForm.elements.coordinate_precision_digits.value = '6';
  bigForm.elements.source_document_id.value = 'DOC-GEO-SRC';
  await bigForm.onsubmit(new window.Event('submit', {bubbles: true, cancelable: true}));
  assert.match(document.getElementById('geoMessage').textContent, /For wood plots above 4 ha, provide a polygon/);

  // GEO-R01: Register valid Point plot <= 4 ha -> Plot saved with REVIEW_REQUIRED
  bigForm.elements.area_ha.value = '3.2';
  await bigForm.onsubmit(new window.Event('submit', {bubbles: true, cancelable: true}));
  assert.equal(document.getElementById('geoMessage').textContent, 'Plot registered · REVIEW_REQUIRED.');

  // GEO-R03: Register valid single-ring Polygon -> Plot saved with REVIEW_REQUIRED
  const polyJson = JSON.stringify({
    type: 'Feature',
    properties: {plot_id: 'PLOT-POLY-301'},
    geometry: {type: 'Polygon', coordinates: [[[106.3, 11.3], [106.4, 11.3], [106.4, 11.4], [106.3, 11.4], [106.3, 11.3]]]}
  });
  await selectMockFile(window, document, 'poly-301.geojson', polyJson);
  const polyForm = document.getElementById('geoForm');
  polyForm.elements.chain_node_id.value = 'NODE-PROD';
  polyForm.elements.plot_id.value = 'PLOT-POLY-301';
  polyForm.elements.country_of_production.value = 'VN';
  polyForm.elements.production_range.value = '2026-02-01 / 2026-03-01';
  polyForm.elements.area_ha.value = '8.5';
  polyForm.elements.coordinate_precision_digits.value = '7';
  polyForm.elements.source_document_id.value = 'DOC-GEO-SRC';
  await polyForm.onsubmit(new window.Event('submit', {bubbles: true, cancelable: true}));
  assert.equal(document.getElementById('geoMessage').textContent, 'Plot registered · REVIEW_REQUIRED.');

  // GEO-R12: Attempt duplicate Plot ID in same material scope -> Rejected with DUPLICATE_PLOT
  await selectMockFile(window, document, 'dup-plot.geojson', polyJson);
  const dupForm = document.getElementById('geoForm');
  dupForm.elements.chain_node_id.value = 'NODE-PROD';
  dupForm.elements.plot_id.value = 'PLOT-99'; // Already exists in MAT-WALNUT
  dupForm.elements.country_of_production.value = 'VN';
  dupForm.elements.production_range.value = '2026-02-01 / 2026-03-01';
  dupForm.elements.area_ha.value = '2.0';
  dupForm.elements.coordinate_precision_digits.value = '6';
  dupForm.elements.source_document_id.value = 'DOC-GEO-SRC';
  await dupForm.onsubmit(new window.Event('submit', {bubbles: true, cancelable: true}));
  assert.match(document.getElementById('geoMessage').textContent, /DUPLICATE_PLOT/);

  // GEO-R11: Attempt registration with missing Plot/Producer/Forest Owner node -> Registration blocked with clear guidance
  const noNodesEnv = bootGeoEnv({chainNodes: []});
  await noNodesEnv.window.__runApp(`geoDialog('MAT-WALNUT', {initialTab: 'register'})`);
  assert.ok(noNodesEnv.document.getElementById('geoMissingNodeWarn'));
  await selectMockFile(noNodesEnv.window, noNodesEnv.document, 'valid.geojson', pointJson);
  assert.equal(noNodesEnv.document.getElementById('geoRegister').disabled, true);
});

test('GEO-V01..GEO-V06: Geolocation Verification decisions (VERIFIED, REJECTED, MORE_INFO_REQUIRED), mandatory notes, capability gating, source PDF navigation, and compliance boundary disclaimer', async () => {
  const env = bootGeoEnv();
  const {window, document} = env;
  await window.__runApp(`geoDialog('MAT-WALNUT', {initialTab: 'review', initialPlotId: 'GEO-1'})`);

  // GEO-V06: Verification copy check -> UI explicitly states verification does not certify deforestation-free or legal compliance
  const disclaimer = document.querySelector('.geo-compliance-disclaimer');
  assert.ok(disclaimer);
  assert.match(disclaimer.textContent, /Verification does not certify deforestation-free status or legal compliance\./);

  // GEO-V02: Reviewer selects REJECTED without notes -> Blocked until notes entered
  const reviewForm = document.getElementById('geoReviewForm');
  assert.ok(reviewForm);
  document.getElementById('geoReviewTarget').value = 'GEO-1';
  document.getElementById('geoReviewDecision').value = 'REJECTED';
  document.getElementById('geoReviewNotes').value = '   ';
  await reviewForm.onsubmit(new window.Event('submit', {bubbles: true, cancelable: true}));
  assert.equal(document.getElementById('geoMessage').textContent, 'Enter review notes before recording a GEO decision.');
  assert.equal(env.apiCalls.some(c => c.action === 'reviewGeo'), false);

  // GEO-V03: Reviewer selects MORE_INFO_REQUIRED with notes -> Status updates; notes saved
  document.getElementById('geoReviewDecision').value = 'MORE_INFO_REQUIRED';
  document.getElementById('geoReviewNotes').value = 'Provide signed harvest boundary map with datum WGS84';
  await reviewForm.onsubmit(new window.Event('submit', {bubbles: true, cancelable: true}));
  assert.ok(env.apiCalls.some(c => c.action === 'reviewGeo' && c.args[0] === 'GEO-1' && c.args[1].status === 'MORE_INFO_REQUIRED'));
  assert.equal(env.fixture.geo.find(g => g.id === 'GEO-1').verification_status, 'MORE_INFO_REQUIRED');

  // GEO-V01: Authorized reviewer sets plot to VERIFIED -> Status updates; reviewer and notes saved
  const refreshedForm = document.getElementById('geoReviewForm');
  document.getElementById('geoReviewTarget').value = 'GEO-1';
  document.getElementById('geoReviewDecision').value = 'VERIFIED';
  document.getElementById('geoReviewNotes').value = 'Coordinates and area verified against approved GeoJSON evidence';
  await refreshedForm.onsubmit(new window.Event('submit', {bubbles: true, cancelable: true}));
  const updatedGeo = env.fixture.geo.find(g => g.id === 'GEO-1');
  assert.equal(updatedGeo.verification_status, 'VERIFIED');
  assert.equal(updatedGeo.reviewed_by, 'reviewer@koda.vn');

  // GEO-V05: Open source document from registered plot -> Document viewer opens; Back returns to Geolocation Workspace
  const docBtn = document.querySelector('#geoTabPanel-review [data-geo-document="DOC-GEO-SRC"]');
  assert.ok(docBtn);
  docBtn.click();
  await new Promise(r => setTimeout(r, 15));
  assert.equal(window.EudrNav.currentViewer()?.type, 'document');
  assert.equal(window.EudrNav.currentViewer()?.id, 'DOC-GEO-SRC');
  await window.EudrNav.back();
  assert.equal(window.EudrNav.currentViewer()?.type, 'geo');

  // GEO-V04: User without GEO_REVIEW capability -> Review action hidden and server-blocked
  const noReviewEnv = bootGeoEnv({capabilities: ['ORDER_EDIT', 'MATERIAL_EDIT', 'EVIDENCE_UPLOAD', 'GEO_EDIT']});
  await noReviewEnv.window.__runApp(`geoDialog('MAT-WALNUT', {initialTab: 'review'})`);
  assert.equal(noReviewEnv.document.getElementById('geoReviewForm'), null);
  assert.equal(noReviewEnv.document.querySelectorAll('[data-geo-review]').length, 0);

  // Server-side GEO_REVIEW enforcement in Apps Script GeoService.gs
  const r = runtime();
  r.seed();
  r.actor('a@supplier.example', 'reviewGeo', randomUUID(), ['geo-1', {status: 'VERIFIED', notes: 'Try bypass'}]);
  assert.throws(() => r.ctx.reviewGeo('geo-1', {status: 'VERIFIED', notes: 'Try bypass'}), e => e.code === 'PERMISSION_DENIED');
});

test('GEO-N01..GEO-N06: Context-aware navigation, Plot -> Source PDF -> Back to Plot -> Back to Order, tab state preservation, unsaved form guard, and Leaflet cleanup', async () => {
  const env = bootGeoEnv();
  const {window, document} = env;

  // Navigate to Workspace -> Select Product PROD-1, Material MAT-WALNUT, Source SRC-W2, Chain Node NODE-2
  window.go('Workspace', 'CASE-2183');
  document.querySelector('[data-material="MAT-WALNUT"]').click();
  document.querySelector('[data-source="SRC-W2"]').click();
  document.querySelector('[data-chain-node="NODE-2"]').click();

  // GEO-N01: Open Geolocation Workspace from Order/Material/Source -> Context shown correctly
  await window.__runApp(`geoDialog('MAT-WALNUT')`);
  assert.equal(document.querySelector('[data-geo-context="order"]')?.textContent, 'SO25-2183');
  assert.equal(document.querySelector('[data-geo-context="product"]')?.textContent, 'Walnut Dining Table');
  assert.equal(document.querySelector('[data-geo-context="material"]')?.textContent, 'Solid Walnut');
  assert.ok(document.querySelector('[data-geo-context="source"]')?.textContent.includes('PO-W-01'));
  assert.ok(document.querySelector('[data-geo-context="source"]')?.textContent.includes('LOT-W2'));
  assert.ok(document.querySelector('[data-geo-context="node"]')?.textContent.includes('Forest Plot Delta'));

  // GEO-N04: Switch between MAP, UPLOAD, REGISTER, REVIEW tabs -> Context preserved
  for (const tab of ['upload', 'register', 'review', 'map']) {
    document.getElementById('geoTabBtn-' + tab).click();
    assert.equal(document.getElementById('geoTabPanel-' + tab).hidden, false);
    assert.equal(document.querySelector('[data-geo-context="order"]')?.textContent, 'SO25-2183');
    assert.ok(document.querySelector('[data-geo-context="source"]')?.textContent.includes('LOT-W2'));
  }

  // GEO-N02: Select plot -> open source PDF -> press Back -> Returns to selected plot in Geolocation Workspace
  document.querySelector('[data-geo-record="1"]').click(); // Select PLOT-100 (index 1)
  assert.equal(document.querySelector('[data-geo-field="plot_id"]')?.textContent, 'PLOT-100');
  document.querySelector('[data-geo-document="DOC-GEO-SRC"]').click();
  await new Promise(r => setTimeout(r, 15));
  assert.equal(window.EudrNav.currentViewer()?.type, 'document');
  assert.equal(env.getActiveLeafletMaps(), 0, 'Leaflet map cleaned up while viewing PDF');

  await window.EudrNav.back();
  assert.equal(window.EudrNav.currentViewer()?.type, 'geo');
  assert.equal(env.getActiveLeafletMaps(), 1, 'Single Leaflet map restored on Back');
  assert.equal(document.querySelector('[data-geo-field="plot_id"]')?.textContent, 'PLOT-100', 'Selected plot PLOT-100 preserved after returning from PDF');

  // GEO-N05: Unsaved registration form -> press Back/Close -> Confirmation shown before losing input
  document.getElementById('geoTabBtn-register').click();
  const form = document.getElementById('geoForm');
  form.elements.plot_id.value = 'UNSAVED-PLOT';
  form.dispatchEvent(new window.Event('input', {bubbles: true}));
  assert.equal(window.EudrNav.isDirty(), true);

  let confirmAsked = 0;
  window.confirm = () => { confirmAsked++; return false; };
  const closedWhenDeclined = await window.EudrNav.closeViewer({fromCloseButton: true});
  assert.equal(closedWhenDeclined, false);
  assert.equal(confirmAsked, 1);
  assert.equal(document.getElementById('drawer').open, true);

  // Confirm discard and press Back to Order (GEO-N03)
  window.confirm = () => { confirmAsked++; return true; };
  document.getElementById('geoBackToOrder').click();
  assert.equal(document.getElementById('drawer').open, false);
  assert.equal(window.__runApp('view'), 'Workspace');
  assert.equal(window.__runApp('selected'), 'CASE-2183');
  assert.equal(window.__runApp('material'), 'MAT-WALNUT');
  assert.equal(window.__runApp('selectedSource'), 'SRC-W2');
  assert.equal(window.__runApp('selectedChainNode'), 'NODE-2');

  // GEO-N06: Close Geolocation Workspace and reopen -> Map initializes cleanly without duplicate Leaflet instance
  assert.equal(env.getActiveLeafletMaps(), 0);
  await window.__runApp(`geoDialog('MAT-WALNUT')`);
  assert.equal(env.getActiveLeafletMaps(), 1);
  window.EudrGeo.close();
  assert.equal(env.getActiveLeafletMaps(), 0);
});

test('GEO-L01..GEO-L08: Loading & Operation Status integration, duplicate-submit protection, 502/504 OUTCOME_UNKNOWN recovery, and export loading lock', async () => {
  let delayMs = 0;
  let failAction = '';
  let failStatus = 500;
  const env = bootGeoEnv({
    apiHandler: async body => {
      if (delayMs > 0) await new Promise(r => setTimeout(r, delayMs));
      if (failAction && body.action === failAction) {
        return {
          ok: false,
          status: failStatus,
          json: async () => ({ok: false, error: {code: failStatus >= 500 ? 'UPSTREAM_TIMEOUT' : 'INVALID_FILE', message: 'Simulated failure'}})
        };
      }
      return undefined;
    }
  });
  const {window, document} = env;
  await window.__runApp(`geoDialog('MAT-WALNUT', {initialTab: 'upload'})`);

  const validPolyJson = JSON.stringify({
    type: 'Feature',
    properties: {plot_id: 'PLOT-OPS-1'},
    geometry: {type: 'Polygon', coordinates: [[[106.1, 11.1], [106.2, 11.1], [106.2, 11.2], [106.1, 11.2], [106.1, 11.1]]]}
  });

  // GEO-L01: File parse in progress -> Local status feedback shown
  await selectMockFile(window, document, 'ops-plot.geojson', validPolyJson);
  assert.equal(document.getElementById('geoMessage').textContent, 'File previewed locally. It has not been uploaded.');

  // GEO-L02 & GEO-L03: Upload original GeoJSON -> Upload button locked; double-click sends only one request
  document.getElementById('geoTask').value = 'TASK-GEO-1';
  document.getElementById('geoTask').onchange();
  delayMs = 25;
  const uploadBtn = document.getElementById('geoUpload');
  const firstUpload = uploadBtn.onclick();
  assert.equal(uploadBtn.disabled, true);
  assert.equal(uploadBtn.getAttribute('aria-busy'), 'true');
  const secondUpload = await uploadBtn.onclick();
  assert.equal(secondUpload, undefined);
  await firstUpload;
  assert.equal(env.apiCalls.filter(c => c.action === 'uploadEvidence').length, 1);

  // GEO-L07: uploadEvidence fails -> Error shown; user can retry without losing selected context
  await selectMockFile(window, document, 'retry-plot.geojson', validPolyJson);
  document.getElementById('geoTask').value = 'TASK-GEO-1';
  document.getElementById('geoTask').onchange();
  delayMs = 0;
  failAction = 'uploadEvidence';
  failStatus = 400;
  await uploadBtn.onclick();
  assert.match(document.getElementById('geoMessage').textContent, /Simulated failure/);
  assert.equal(uploadBtn.disabled, false, 'User can retry upload without re-selecting file');

  // GEO-L06: saveGeo returns 502/504 -> Uncertain save status warning shown; form input preserved
  failAction = 'saveGeo';
  failStatus = 504;
  document.getElementById('geoTabBtn-register').click();
  const form = document.getElementById('geoForm');
  form.elements.chain_node_id.value = 'NODE-PROD';
  form.elements.plot_id.value = 'PLOT-OPS-1';
  form.elements.country_of_production.value = 'VN';
  form.elements.production_range.value = '2026-01-01 / 2026-02-01';
  form.elements.area_ha.value = '3.5';
  form.elements.coordinate_precision_digits.value = '6';
  form.elements.source_document_id.value = 'DOC-GEO-SRC';
  await form.onsubmit(new window.Event('submit', {bubbles: true, cancelable: true}));
  assert.match(document.getElementById('geoMessage').textContent, /Save status is uncertain/);
  assert.equal(form.elements.plot_id.value, 'PLOT-OPS-1', 'Form input must remain preserved after 504 timeout');
  assert.equal(window.EudrOps.list().at(-1).status, 'OUTCOME_UNKNOWN');

  // GEO-L04 & GEO-L05: Submit Validate & Register -> Register button locked; double-click sends only one saveGeo call
  failAction = '';
  delayMs = 25;
  const regPromise1 = form.onsubmit(new window.Event('submit', {bubbles: true, cancelable: true}));
  const regPromise2 = await form.onsubmit(new window.Event('submit', {bubbles: true, cancelable: true}));
  assert.equal(regPromise2, undefined);
  await regPromise1;
  assert.equal(env.apiCalls.filter(c => c.action === 'saveGeo').length, 2); // 1 failed + 1 succeeded

  // GEO-L08: exportGeoJSON running -> Export button shows loading state until file download or error
  document.getElementById('geoTabBtn-map').click();
  const exportBtn = document.getElementById('geoExport');
  delayMs = 25;
  const expPromise = exportBtn.onclick();
  assert.equal(exportBtn.disabled, true);
  assert.equal(exportBtn.getAttribute('aria-busy'), 'true');
  await expPromise;
  assert.equal(exportBtn.disabled, false);
});
