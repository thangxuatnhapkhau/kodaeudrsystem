import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { randomUUID, createHash } from 'node:crypto';
import { runtime } from './runtime.mjs';

const code = c => e => e.code === c;
const clone = o => JSON.parse(JSON.stringify(o));
const hash = s => createHash('sha256').update(s).digest('hex');

function setupEAW() {
  const r = runtime();
  r.seed();
  r.ctx.traceReady_ = () => {};
  r.ctx.verifyAIStoredSource_ = () => {};
  r.ctx.v290Ready_ = () => {};
  r.ctx.resetDbCache_ = () => {};
  r.properties.ENVIRONMENT = 'STAGING';
  r.properties.DB_ID = 'staging-db';
  r.properties.ROOT_ID = 'root';

  const schema = vm.runInContext('SCHEMA', r.ctx);
  const sheets = new Map();
  function makeSheet(name, header) {
    const h = Array.from(header);
    return {
      getName: () => name,
      getLastColumn: () => h.length,
      getLastRow: () => 1,
      getMaxColumns: () => 100,
      appendRow(v) { h.push(...v); },
      getRange: (_r, col, _n, count) => ({
        getValues: () => [h.slice(col - 1, col - 1 + count)],
        setValues: v => { v[0].forEach((x, i) => h[col - 1 + i] = x); }
      }),
      getDataRange: () => ({ getValues: () => [h] }),
      setFrozenRows() {},
      headers: h
    };
  }
  for (const [name, cols] of Object.entries(schema)) {
    sheets.set(name, makeSheet(name, cols));
  }
  r.ctx.db_ = () => ({
    getId: () => 'staging-sheet-id',
    getSheetByName: n => sheets.get(n),
    getSheets: () => [...sheets.values()],
    insertSheet: n => { const s = makeSheet(n, []); sheets.set(n, s); return s; }
  });
  r.sheets = sheets;

  // Setup material source
  r.tables['29_MATERIAL_SOURCES'].push({
    id: 'source_a',
    case_id: 'ca',
    material_id: 'ma',
    supplier_id: 'sa',
    supplier_po: 'PO-A',
    po_line: '1',
    lot_no: 'LOT-A',
    active: 'YES'
  });

  // Add internal users with specific roles and capabilities
  const users = [
    { email: 'purchasing@test.example', name: 'Purchasing User', role: 'PURCHASING', active: 'YES', capabilities: '["AI_USE"]', assigned_orders: '["ca"]' },
    { email: 'sourcing@test.example', name: 'Sourcing User', role: 'SOURCING', active: 'YES', capabilities: '["AI_USE"]', assigned_orders: '["ca"]' },
    { email: 'reviewer@test.example', name: 'EUDR Reviewer', role: 'EUDR_REVIEWER', active: 'YES', capabilities: '["AI_REVIEW","EVIDENCE_REVIEW"]', assigned_orders: '["ca"]' },
    { email: 'independent_reviewer@test.example', name: 'Independent Reviewer', role: 'EUDR_REVIEWER', active: 'YES', capabilities: '["AI_REVIEW","EVIDENCE_REVIEW"]', assigned_orders: '["ca"]' },
    { email: 'other_pur@test.example', name: 'Other Purchasing', role: 'PURCHASING', active: 'YES', capabilities: '["AI_USE"]', assigned_orders: '["cb"]' }
  ];
  r.tables['05_OWNER_MASTER'].push(...users);

  // Setup Document
  const docFile = r.folders.get('root').createFile(r.ctx.Utilities.newBlob('%PDF-DOC_A', 'application/pdf', 'doc_a.pdf'));
  r.tables['06_DOCUMENT_REGISTER'].push({
    id: 'doc_a',
    case_id: 'ca',
    material_id: 'ma',
    source_id: 'source_a',
    kind: 'EVIDENCE',
    active_version: 'YES',
    sha256: hash('%PDF-DOC_A'),
    file_id: docFile.getId(),
    name: 'doc_a.pdf',
    mime_type: 'application/pdf',
    status: 'APPROVED',
    uploaded_by: 'purchasing@test.example'
  });

  // Setup AI Review Import
  const reviewResult = {
    review_id: 'rev_1',
    case_id: 'ca',
    material_id: 'ma',
    source_id: 'source_a',
    summary: 'Findings require clarification',
    assessments: [{ dimension: 'LEGALITY', status: 'REQUIRES_CLARIFICATION', summary: 'Missing permit', reason: 'Not attached' }],
    findings: [
      {
        finding_id: 'F-01',
        dimension: 'LEGALITY',
        severity: 'HIGH',
        finding_type: 'MISSING',
        observed_value: 'No harvest permit found',
        reason: 'Permit missing for lot L1',
        recommended_action: 'Obtain official harvest permit from forest owner',
        suggested_department: 'Purchasing',
        document_ids: ['doc_a'],
        citations: [{ document_id: 'doc_a', page: 1 }]
      },
      {
        finding_id: 'F-02',
        dimension: 'TRACEABILITY',
        severity: 'CRITICAL',
        finding_type: 'MISMATCH',
        observed_value: 'Volume mismatch: 100m3 vs 80m3',
        reason: 'Invoice does not match transport docket',
        recommended_action: 'Clarify volume discrepancy with supplier',
        suggested_department: 'Sourcing',
        document_ids: ['doc_a'],
        citations: [{ document_id: 'doc_a', page: 1 }]
      }
    ]
  };

  const reviewJson = JSON.stringify(reviewResult);
  const resultFile = r.folders.get('root').createFile(r.ctx.Utilities.newBlob(reviewJson, 'application/json', 'rev_1.json'));
  const scope = r.ctx.v290Scope_('ca', { material_id: 'ma', source_id: 'source_a' }, r.ctx.user_());
  const snapshot_hash = r.ctx.v290Snapshot_(scope);
  r.tables['36_AI_REVIEW_IMPORTS'].push({
    id: 'rev_1',
    case_id: 'ca',
    material_id: 'ma',
    source_id: 'source_a',
    status: 'IMPORTED',
    document_ids: '["doc_a"]',
    snapshot_hash: snapshot_hash,
    result_file_id: resultFile.getId(),
    result_sha256: hash(reviewJson),
    imported_at: '2026-10-19T08:00:00.000Z'
  });

  return r;
}

function act(r, email, action, ...args) {
  r.actor(email, action, randomUUID(), args);
  return r.ctx[action](...args);
}

test('UAT-01: Direct AI Review & Triage by Purchasing/Sourcing', () => {
  const r = setupEAW();

  // Purchasing triages F-01 into a Corrective Action Issue
  const res1 = act(r, 'purchasing@test.example', 'triageReviewFinding', 'rev_1', {
    finding_id: 'F-01',
    decision: 'CREATE_ACTION'
  });
  assert.ok(res1.id);
  assert.equal(res1.status, 'PROPOSED');

  // Verify created issue in table 37
  const issue = r.tables['37_REVIEW_ISSUES'].find(i => i.id === res1.id);
  assert.ok(issue);
  assert.equal(issue.finding_id, 'F-01');
  assert.equal(issue.case_id, 'ca');
  assert.equal(issue.priority, 'HIGH');
  assert.equal(issue.finding_type, 'MISSING');
  assert.equal(issue.required_action, 'Obtain official harvest permit from forest owner');
});

test('UAT-02: Deduplication: Repeated triage returns existing issue without duplicating row', () => {
  const r = setupEAW();

  const res1 = act(r, 'purchasing@test.example', 'triageReviewFinding', 'rev_1', {
    finding_id: 'F-01',
    decision: 'CREATE_ACTION'
  });

  const res2 = act(r, 'purchasing@test.example', 'triageReviewFinding', 'rev_1', {
    finding_id: 'F-01',
    decision: 'CREATE_ACTION'
  });

  assert.equal(res1.id, res2.id);
  const matching = r.tables['37_REVIEW_ISSUES'].filter(i => i.id === res1.id);
  assert.equal(matching.length, 1);
});

test('UAT-03: Delegated Assignment Rules enforce active Purchasing/Sourcing users with Order access', () => {
  const r = setupEAW();

  // Purchasing creates action assigned to sourcing user (valid)
  const res = act(r, 'purchasing@test.example', 'createKodaReviewIssue', 'rev_1', {
    finding_id: 'F-01',
    confirmed: true,
    owner: 'sourcing@test.example'
  });
  assert.equal(res.status, 'ASSIGNED');
  const issue = r.tables['37_REVIEW_ISSUES'].find(i => i.id === res.id);
  assert.equal(issue.owner, 'sourcing@test.example');

  // Purchasing attempts to assign to user who does not have access to Order 'ca' -> FAILS
  assert.throws(() => {
    act(r, 'purchasing@test.example', 'updateKodaReviewIssue', res.id, {
      owner: 'other_pur@test.example',
      reason: 'Reassigning',
      confirmed: true
    });
  }, code('INVALID_INPUT'));

  // Purchasing attempts to assign to supplier user or arbitrary email -> FAILS
  assert.throws(() => {
    act(r, 'purchasing@test.example', 'updateKodaReviewIssue', res.id, {
      owner: 'a@supplier.example',
      reason: 'Reassigning to supplier',
      confirmed: true
    });
  }, code('INVALID_INPUT'));

  // Admin can assign to internal user
  const adminRes = act(r, 'admin@test.example', 'updateKodaReviewIssue', res.id, {
    owner: 'purchasing@test.example',
    reason: 'Admin reassigns',
    confirmed: true
  });
  assert.equal(adminRes.status, 'ASSIGNED');
});

test('UAT-04: Needs Clarification Workflow records reason and decision', () => {
  const r = setupEAW();

  const res = act(r, 'sourcing@test.example', 'triageReviewFinding', 'rev_1', {
    finding_id: 'F-02',
    decision: 'NEEDS_CLARIFICATION',
    reason: 'Need clarification on invoice weight discrepancy'
  });

  assert.equal(res.triage_decision, 'NEEDS_CLARIFICATION');
  const issue = r.tables['37_REVIEW_ISSUES'].find(i => i.id === res.id);
  assert.equal(issue.triage_decision, 'NEEDS_CLARIFICATION');
  assert.equal(issue.triage_reason, 'Need clarification on invoice weight discrepancy');

  const history = JSON.parse(issue.audit_history);
  assert.ok(history.some(h => h.decision === 'NEEDS_CLARIFICATION' && h.actor === 'sourcing@test.example'));
});

test('UAT-05: Dismiss Finding Workflow & Role Gating', () => {
  const r = setupEAW();

  // Sourcing requests dismissal
  const res = act(r, 'sourcing@test.example', 'triageReviewFinding', 'rev_1', {
    finding_id: 'F-02',
    decision: 'DISMISS_REQUESTED',
    reason: 'False positive; lot is exempted by Article 3'
  });
  assert.equal(res.triage_decision, 'DISMISS_REQUESTED');

  // Sourcing attempts to CONFIRM dismissal -> FAILS (Reviewer/Admin required)
  assert.throws(() => {
    act(r, 'sourcing@test.example', 'triageReviewFinding', 'rev_1', {
      finding_id: 'F-02',
      decision: 'CONFIRM_DISMISS',
      reason: 'Self confirm'
    });
  }, code('PERMISSION_DENIED'));

  // Reviewer confirms dismissal -> SUCCEEDS, status becomes REJECTED / DISMISSED
  const confirmRes = act(r, 'reviewer@test.example', 'triageReviewFinding', 'rev_1', {
    finding_id: 'F-02',
    decision: 'CONFIRM_DISMISS',
    reason: 'Confirmed exemption documented in phytosanitary certificate'
  });
  assert.equal(confirmRes.status, 'REJECTED');
  assert.equal(confirmRes.triage_decision, 'DISMISSED');

  const issue = r.tables['37_REVIEW_ISSUES'].find(i => i.id === res.id);
  assert.equal(issue.status, 'REJECTED');
  assert.equal(issue.reviewed_by, 'reviewer@test.example');
});

test('UAT-06: Supplier Evidence Request Lifecycle (M2)', () => {
  const r = setupEAW();

  const issueRes = act(r, 'purchasing@test.example', 'createKodaReviewIssue', 'rev_1', {
    finding_id: 'F-01',
    confirmed: true,
    owner: 'purchasing@test.example'
  });
  assert.equal(issueRes.status, 'ASSIGNED');

  // 1. Create supplier evidence request (DRAFT)
  const reqRes = act(r, 'purchasing@test.example', 'saveSupplierEvidenceRequest', {
    issue_id: issueRes.id,
    channel: 'EMAIL',
    due_date: '2026-11-01',
    requested_information: 'Please provide harvest permit for plot 4A',
    required_clarification: 'Clarify expiration date on certificate'
  });
  assert.ok(reqRes.id);
  assert.equal(reqRes.status, 'DRAFT');

  // 2. Mark Sent -> request becomes SENT, issue auto-advances from ASSIGNED to IN_PROGRESS
  const sentRes = act(r, 'purchasing@test.example', 'recordSupplierEvidenceRequestSent', reqRes.id, {
    channel: 'EMAIL',
    sent_at: '2026-10-19T09:00:00.000Z'
  });
  assert.equal(sentRes.status, 'SENT');

  const updatedIssue = r.tables['37_REVIEW_ISSUES'].find(i => i.id === issueRes.id);
  assert.equal(updatedIssue.status, 'IN_PROGRESS');

  // 3. Record Response -> request becomes RESPONDED with notes and linked documents
  const respRes = act(r, 'purchasing@test.example', 'recordSupplierEvidenceRequestResponse', reqRes.id, {
    response_note: 'Supplier emailed signed harvest permit',
    response_document_ids: ['doc_a'],
    responded_at: '2026-10-19T10:00:00.000Z'
  });
  assert.equal(respRes.status, 'RESPONDED');

  const reqRow = r.tables['47_SUPPLIER_EVIDENCE_REQUESTS'].find(req => req.id === reqRes.id);
  assert.equal(reqRow.status, 'RESPONDED');
  assert.equal(reqRow.response_note, 'Supplier emailed signed harvest permit');
});

test('UAT-07: Action Center Filtering & 5-Tab Queries', () => {
  const r = setupEAW();

  // Create issue for purchasing
  const i1 = act(r, 'purchasing@test.example', 'createKodaReviewIssue', 'rev_1', {
    finding_id: 'F-01',
    confirmed: true,
    owner: 'purchasing@test.example',
    due_date: '2026-10-01' // overdue
  });

  // Create issue for sourcing
  const i2 = act(r, 'sourcing@test.example', 'createKodaReviewIssue', 'rev_1', {
    finding_id: 'F-02',
    confirmed: true,
    owner: 'sourcing@test.example',
    due_date: '2026-12-01'
  });

  const centerPurchasing = act(r, 'purchasing@test.example', 'getEvidenceActionCenter', {});
  assert.equal(centerPurchasing.counts.my_actions, 1);
  assert.equal(centerPurchasing.counts.overdue, 1);
  assert.equal(centerPurchasing.issues.length, 2);

  // Filter by owner
  const filteredOwner = act(r, 'purchasing@test.example', 'getEvidenceActionCenter', { owner: 'sourcing@test.example' });
  assert.equal(filteredOwner.issues.length, 1);
  assert.equal(filteredOwner.issues[0].owner, 'sourcing@test.example');
});

test('UAT-08: Action Dashboard computes 8 KPIs and 4 Breakdowns', () => {
  const r = setupEAW();

  const i1 = act(r, 'purchasing@test.example', 'createKodaReviewIssue', 'rev_1', {
    finding_id: 'F-01',
    confirmed: true,
    owner: 'purchasing@test.example',
    blocking: 'YES',
    due_date: '2026-10-01' // overdue
  });

  const dash = act(r, 'purchasing@test.example', 'getActionDashboard', {});
  assert.equal(dash.kpis.total_open_actions, 1);
  assert.equal(dash.kpis.overdue_actions, 1);
  assert.equal(dash.kpis.closure_blocking_actions, 1);
  assert.equal(dash.kpis.closure_gate_status, 'BLOCKED');

  // Verify breakdowns exist
  assert.ok(Array.isArray(dash.breakdowns.by_department));
  assert.ok(Array.isArray(dash.breakdowns.by_supplier));
  assert.ok(Array.isArray(dash.breakdowns.by_priority));
  assert.ok(Array.isArray(dash.breakdowns.by_root_cause));
});

test('UAT-09: Re-review comparison detects resolved or persisting findings', () => {
  const r = setupEAW();

  const i1 = act(r, 'purchasing@test.example', 'createKodaReviewIssue', 'rev_1', {
    finding_id: 'F-01',
    confirmed: true,
    owner: 'purchasing@test.example'
  });

  // No newer review yet
  const comp1 = act(r, 'purchasing@test.example', 'compareReviewFindings', i1.id);
  assert.equal(comp1.status, 'NO_NEW_REVIEW_YET');

  // Seed a newer review where F-01 is gone (resolved)
  const newResult = {
    review_id: 'rev_2',
    case_id: 'ca',
    material_id: 'ma',
    source_id: 'source_a',
    summary: 'All findings cleared',
    assessments: [{ dimension: 'LEGALITY', status: 'VERIFIED', summary: 'Permit valid' }],
    findings: []
  };
  const newJson = JSON.stringify(newResult);
  const newFile = r.folders.get('root').createFile(r.ctx.Utilities.newBlob(newJson, 'application/json', 'rev_2.json'));
  const scope = r.ctx.v290Scope_('ca', { material_id: 'ma', source_id: 'source_a' }, r.ctx.user_());
  const snapshot_hash = r.ctx.v290Snapshot_(scope);
  r.tables['36_AI_REVIEW_IMPORTS'].push({
    id: 'rev_2',
    case_id: 'ca',
    material_id: 'ma',
    source_id: 'source_a',
    status: 'IMPORTED',
    document_ids: '["doc_a"]',
    snapshot_hash: snapshot_hash,
    result_file_id: newFile.getId(),
    result_sha256: hash(newJson),
    imported_at: '2026-10-19T12:00:00.000Z'
  });

  const comp2 = act(r, 'purchasing@test.example', 'compareReviewFindings', i1.id);
  assert.equal(comp2.status, 'RESOLVED_IN_NEW');
});

test('UAT-10: Separation of Duties strictly prevents self-verification', () => {
  const r = setupEAW();

  // Create issue owned by reviewer@test.example
  const i1 = act(r, 'reviewer@test.example', 'createKodaReviewIssue', 'rev_1', {
    finding_id: 'F-01',
    confirmed: true,
    owner: 'reviewer@test.example'
  });

  // Submit evidence
  act(r, 'reviewer@test.example', 'updateKodaReviewIssue', i1.id, {
    status: 'EVIDENCE_SUBMITTED',
    resolution_evidence: ['doc_a'],
    reason: 'Harvest permit provided',
    confirmed: true
  });

  // reviewer@test.example attempts to resolve their OWN issue -> BLOCKED
  assert.throws(() => {
    act(r, 'reviewer@test.example', 'updateKodaReviewIssue', i1.id, {
      status: 'RESOLVED',
      reason: 'I verify my own work',
      confirmed: true
    });
  }, code('SEPARATION_OF_DUTIES_VIOLATION'));

  // Admin who is not owner/submitter/uploader CAN resolve
  const resolveRes = act(r, 'admin@test.example', 'updateKodaReviewIssue', i1.id, {
    status: 'RESOLVED',
    reason: 'Admin verified evidence and certificate authenticity',
    confirmed: true
  });
  assert.equal(resolveRes.status, 'RESOLVED');

  const resolvedIssue = r.tables['37_REVIEW_ISSUES'].find(i => i.id === i1.id);
  assert.equal(resolvedIssue.verified_by, 'admin@test.example');
  assert.ok(resolvedIssue.verified_at);
});

test('UAT-11: Closure Gate blocks case completion when open issues exist', () => {
  const r = setupEAW();

  const i1 = act(r, 'purchasing@test.example', 'createKodaReviewIssue', 'rev_1', {
    finding_id: 'F-01',
    confirmed: true,
    owner: 'purchasing@test.example'
  });

  // Setup baseline prerequisites for completeCase so it reaches the review issues gate
  r.tables['18_AI_PROMPT_RUNS'] = [{ id: 'r_1', case_id: 'ca', function: 'DOCUMENT_REVIEW', result_status: 'REVIEWED' }];
  r.tables['07_AI_REVIEW_QUEUE'].forEach(f => { if (f.case_id === 'ca') f.status = 'REVIEWED'; });
  r.tables['04_EVIDENCE_TRACKER'].forEach(t => { if (t.case_id === 'ca') t.status = 'APPROVED'; });
  r.tables['09_CONFIG'].push({ key: 'RULES_CONFIRMED', value: 'YES' });
  r.ctx.aiCoverageCurrent_ = () => true;
  r.ctx.legalState_ = () => ({ reviewDue: false });
  r.ctx.materialIssues_ = () => [];
  r.tables['19_EXPORT_LOG'].push({ id: 'ex_1', case_id: 'ca', include_history: 'NO' });

  // Case closure is BLOCKED due to open review issues
  assert.throws(() => {
    act(r, 'admin@test.example', 'completeCase', 'ca', {
      confirmed: true,
      comment: 'Attempting early closure'
    });
  }, code('CLOSURE_BLOCKED'));

  // Submit evidence and resolve the issue
  act(r, 'purchasing@test.example', 'updateKodaReviewIssue', i1.id, {
    status: 'EVIDENCE_SUBMITTED',
    resolution_evidence: ['doc_a'],
    reason: 'Permit attached',
    confirmed: true
  });
  act(r, 'admin@test.example', 'updateKodaReviewIssue', i1.id, {
    status: 'RESOLVED',
    reason: 'Verified',
    confirmed: true
  });

  // Now case closure SUCCEEDS
  const closeRes = act(r, 'admin@test.example', 'completeCase', 'ca', {
    confirmed: true,
    comment: 'All evidence verified and issues resolved'
  });
  assert.equal(closeRes.status, 'CLOSED');
});

test('UAT-12: Migration & Rollback creates Drive backup and updates schema safely', () => {
  const r = setupEAW();
  r.sheets.delete('47_SUPPLIER_EVIDENCE_REQUESTS');

  const dry = act(r, 'admin@test.example', 'previewEvidenceActionMigration');
  assert.equal(dry.dry_run, true);
  assert.ok(dry.plan.some(p => p.table === '47_SUPPLIER_EVIDENCE_REQUESTS' && p.create === true));

  const applied = act(r, 'admin@test.example', 'applyEvidenceActionMigration');
  assert.equal(applied.status, 'DONE');
  assert.equal(applied.version, '1.0.0');

  const configVer = r.tables['09_CONFIG'].find(c => c.key === 'EVIDENCE_ACTION_VERSION');
  assert.equal(configVer?.value, '1.0.0');

  // Verify backup created in Drive
  const backupFolder = r.folders.get('folder-1') || [...r.folders.values()].find(f => f.getName().includes('Backup'));
  assert.ok(backupFolder);

  // Rollback restores original state
  const rolledBack = act(r, 'admin@test.example', 'rollbackEvidenceActionMigration', applied.backup_id);
  assert.equal(rolledBack.status, 'ROLLED_BACK');
});
