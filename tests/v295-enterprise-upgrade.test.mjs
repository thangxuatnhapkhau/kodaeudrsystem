import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createHmac, randomUUID} from 'node:crypto';
import {runtime} from './runtime.mjs';

const root = new URL('../', import.meta.url);

// -----------------------------------------------------------------------------
// WORKSTREAM A: PERFORMANCE, STABILITY & SECURITY HARNESS
// -----------------------------------------------------------------------------
test('Workstream A: Netlify bridge HMAC signature correctly escapes non-ASCII characters to \\uXXXX', async () => {
 const bridgeModule = await import('../netlify/functions/_bridge.mjs');
 const text = 'Sản phẩm Gỗ Tràm & FSC®';
 const escaped = bridgeModule.escapePayload(text);
 assert.ok(!/[\u007f-\uffff]/.test(escaped));
 assert.equal(JSON.parse(`"${escaped}"`), text);
});

test('Workstream A: Apps Script Bridge builds BRIDGE_ACTIONS safely and resets cache on doPost', () => {
 const r = runtime();
 assert.equal(typeof r.ctx.BRIDGE_ACTIONS, 'object');
 assert.equal(typeof r.ctx.BRIDGE_ACTIONS['bootstrap'], 'function');
 assert.equal(typeof r.ctx.BRIDGE_ACTIONS['syncCalendar'], 'function');
 assert.equal(r.ctx.BRIDGE_ACTIONS['nonExistentAction_12345'], undefined);
});

test('Workstream A: Code.gs patch_ performs multi-column batch updates into a single setValues call', () => {
 const r = runtime();
 r.seed();
 const task = r.tables['04_EVIDENCE_TRACKER'][0];
 const before = task.updated_at;
 r.actor(undefined, 'updateTask', randomUUID(), [task.id, {priority: 'URGENT', due: '2026-11-01'}]);
 r.ctx.patch_('04_EVIDENCE_TRACKER', task.id, {priority: 'URGENT', due: '2026-11-01'});
 const updated = r.tables['04_EVIDENCE_TRACKER'].find(t => t.id === task.id);
 assert.equal(updated.priority, 'URGENT');
 assert.equal(updated.due, '2026-11-01');
});

// -----------------------------------------------------------------------------
// WORKSTREAM B: ENTERPRISE UX/UI & LOCALIZATION
// -----------------------------------------------------------------------------
test('Workstream B: public/i18n.js strictly defaults to English (en) when unset in localStorage', () => {
 const code = fs.readFileSync(new URL('public/i18n.js', root), 'utf8');
 assert.match(code, /let language=localStorage\.getItem\('eudr_language'\)\|\|'en';/);
});

test('Workstream B: public/i18n.js provides accurate Vietnamese translations for v2.9.5 terms', () => {
 const ctx = {
  window: {},
  localStorage: {getItem: () => null, setItem: () => {}},
  document: {documentElement: {lang: ''}, querySelectorAll: () => [], getElementById: () => null},
  WeakMap,
  Set,
  Object,
  Node: {TEXT_NODE: 3}
 };
 vm.createContext(ctx);
 vm.runInContext(fs.readFileSync(new URL('public/i18n.js', root), 'utf8'), ctx);
 const {t, setLanguage} = ctx.window.EudrI18n;
 setLanguage('vi');
 assert.equal(t('Regulatory Rule Registry (3-Tier Hierarchy)'), 'Danh mục Quy tắc Pháp lý & Chính sách (Phân cấp 3 tầng)');
 assert.equal(t('Zoom out PDF'), 'Thu nhỏ PDF');
 assert.equal(t('Zoom in PDF'), 'Phóng to PDF');
 assert.equal(t('Reset PDF zoom'), 'Đặt lại tỷ lệ PDF');
 assert.equal(t('SHA-256 verified'), 'Đã xác thực SHA-256');
 assert.equal(t('Manual sync required'), 'Cần đồng bộ thủ công');
});

// -----------------------------------------------------------------------------
// WORKSTREAM C: LUCIAN MOTION SYSTEM & DESIGN TOKENS
// -----------------------------------------------------------------------------
test('Workstream C: public/style.css defines Lucian cubic-bezier ease, animations, and reduced-motion guard', () => {
 const css = fs.readFileSync(new URL('public/style.css', root), 'utf8');
 assert.match(css, /--ease-lucian:\s*cubic-bezier\(0\.22,\s*1,\s*0\.36,\s*1\);/);
 assert.match(css, /@keyframes lucianDrawerIn/);
 assert.match(css, /@media\(prefers-reduced-motion:\s*reduce\)/);
 assert.match(css, /\.readiness-ring/);
 assert.match(css, /\.reg-tier-badge/);
});

// -----------------------------------------------------------------------------
// WORKSTREAM D: EVIDENCE & PDF WORKBENCH
// -----------------------------------------------------------------------------
test('Workstream D: public/pdf-preview.mjs toolbar includes zoom controls without forbidden inline styles', () => {
 const js = fs.readFileSync(new URL('public/pdf-preview.mjs', root), 'utf8');
 assert.match(js, /aria-label',\s*'Zoom out PDF'/);
 assert.match(js, /aria-label',\s*'Reset PDF zoom'/);
 assert.match(js, /aria-label',\s*'Zoom in PDF'/);
 assert.doesNotMatch(js, /\.style\./);
 assert.doesNotMatch(js, /setAttribute\(['"]style['"]/);
});

test('Workstream D: public/app.js memoizes file bytes and clears cache on clearAuth', () => {
 const js = fs.readFileSync(new URL('public/app.js', root), 'utf8');
 assert.match(js, /const DOCUMENT_BYTE_CACHE=new Map\(\);/);
 assert.match(js, /DOCUMENT_BYTE_CACHE\.clear\(\);/);
 assert.match(js, /SHA-256 verified/);
});

// -----------------------------------------------------------------------------
// WORKSTREAM E: REGULATORY CONTROL CENTER (3-TIER HIERARCHY)
// -----------------------------------------------------------------------------
test('Workstream E: bootstrap() returns version 2.9.5 and 3-tier regulation rules safely', () => {
 const r = runtime();
 r.seed();
 r.actor('admin@test.example', 'bootstrap');
 const res = r.ctx.bootstrap();
 assert.equal(res.version, '2.9.5');
 assert.ok(Array.isArray(res.regulationRules));
 assert.equal(typeof res.regulationRegistryReady, 'boolean');
 assert.ok(res.calendarConfig);
});

test('Workstream E: saveKodaRegulationRule validates 3-tier categories and immutable ID', () => {
 const r = runtime();
 r.ctx.db_ = () => ({ getSheetByName: table => ({ name: table }) });
 r.actor('admin@test.example', 'saveKodaRegulationRule');
 assert.throws(() => r.ctx.saveKodaRegulationRule({category: 'INVALID_TIER', confirmed: true}), /Confirm rule category/);

 const rule = {
  id: 'RULE-EUDR-ART-9-V1',
  category: 'LEGAL_REQUIREMENT',
  rule_version: '2025/2650',
  effective_date: '2026-01-01',
  source_url: 'https://eur-lex.europa.eu/eli/reg/2023/1115/oj',
  scope: 'Commodity wood articles',
  required_data: 'Geolocation polygons for plots over 4 ha',
  validation_method: 'Automated centroid check against Global Forest Watch',
  confirmed: true
 };
 const saved = r.ctx.saveKodaRegulationRule(rule);
 assert.equal(saved.id, 'RULE-EUDR-ART-9-V1');
 assert.equal(saved.status, 'APPROVED');

 // Immutable: creating existing ID in new request fails with VERSION_CONFLICT
 r.actor('admin@test.example', 'saveKodaRegulationRule');
 assert.throws(() => r.ctx.saveKodaRegulationRule(rule), e => e.code === 'VERSION_CONFLICT');
});

// -----------------------------------------------------------------------------
// WORKSTREAM F: CALENDAR FOLLOW-UP & GOVERNANCE
// -----------------------------------------------------------------------------
test('Workstream F: CALENDAR_SYNC_ENABLED=MANUAL defers auto-sync and syncCalendar executes it', () => {
 const r = runtime();
 r.seed();
 r.tables['09_CONFIG'] = [{key: 'CALENDAR_SYNC_ENABLED', value: 'MANUAL'}];
 const task = r.tables['04_EVIDENCE_TRACKER'][0];

 // Automatic background sync call (manual=false) is deferred
 const deferred = r.ctx.syncTaskCalendar_(task);
 assert.equal(deferred.status, 'MANUAL_SYNC_REQUIRED');

 // Explicit manual sync succeeds
 r.actor('admin@test.example', 'syncCalendar');
 const syncResult = r.ctx.syncCalendar();
 assert.ok(Array.isArray(syncResult));
 assert.equal(syncResult.find(x => x.taskId === task.id)?.status, 'SYNCED');
});

test('Workstream F: REMINDERS_ENABLED=NO clears popup reminder overrides', () => {
 const r = runtime();
 r.seed();
 r.tables['09_CONFIG'] = [{key: 'REMINDERS_ENABLED', value: 'NO'}, {key: 'CALENDAR_SYNC_ENABLED', value: 'AUTO'}];
 const task = r.tables['04_EVIDENCE_TRACKER'][0];
 r.actor('admin@test.example', 'syncTaskCalendar_');
 const res = r.ctx.syncTaskCalendar_(task, true);
 assert.equal(res.status, 'SYNCED');
 const event = r.events.get(res.eventId);
 assert.deepEqual(event.reminders, {useDefault: false, overrides: []});
});
