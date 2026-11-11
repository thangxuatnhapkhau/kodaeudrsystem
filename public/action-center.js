// KODA EUDR Workspace — Evidence Action Center (EAW-1.0.0)
window.EudrActionCenter = (() => {
  const esc = x => String(x ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const tr = x => window.EudrI18n?.t(x) || x;
  const list = x => { try { return JSON.parse(x || '[]'); } catch { return []; } };

  let currentTab = 'my_actions';
  let cachedData = null;
  let filters = { q: '', case_id: '', department: '', priority: '', supplier_id: '' };

  async function render({ call, state, mount, openDocument, openOrder, navigate, drawer }) {
    mount.innerHTML = `<div class="action-center-container" role="region" aria-label="${esc(tr('Evidence Action Center'))}">
      <div class="action-center-loading"><span class="spinner spinner--inline"></span> ${esc(tr('Loading Action Center…'))}</div>
    </div>`;

    async function loadData() {
      try {
        const res = await call('getEvidenceActionCenter', {});
        cachedData = res;
        draw();
      } catch (err) {
        mount.innerHTML = `<div class="card error-card">
          <h3>${esc(tr('Failed to load Action Center'))}</h3>
          <p>${esc((err.code ? err.code + ' · ' : '') + err.message)}</p>
          <button type="button" id="acRetryBtn">${esc(tr('Retry'))}</button>
        </div>`;
        const retry = mount.querySelector('#acRetryBtn');
        if (retry) retry.onclick = () => loadData();
      }
    }

    function draw() {
      if (!cachedData) return;
      const { issues, counts, summary } = cachedData;
      const userEmail = state?.user?.email || '';
      const isReviewer = (state?.user?.capabilities || []).includes('AI_REVIEW') || (state?.user?.capabilities || []).includes('EVIDENCE_REVIEW') || state?.user?.role === 'ADMIN';

      // Apply client-side filters
      const filtered = issues.filter(i => {
        if (currentTab === 'my_actions') {
          if (i.owner !== userEmail || ['RESOLVED', 'REJECTED'].includes(i.status)) return false;
        } else if (currentTab === 'awaiting_supplier') {
          if (!i.is_awaiting_supplier) return false;
        } else if (currentTab === 'pending_verification') {
          if (!['EVIDENCE_SUBMITTED', 'RECHECK_REQUIRED'].includes(i.status)) return false;
        } else if (currentTab === 'overdue') {
          if (!i.is_overdue) return false;
        } else if (currentTab === 'completed') {
          if (!['RESOLVED', 'REJECTED'].includes(i.status)) return false;
        }

        if (filters.case_id && i.case_id !== filters.case_id) return false;
        if (filters.department && i.department !== filters.department) return false;
        if (filters.priority && i.priority !== filters.priority) return false;
        if (filters.supplier_id && i.supplier_id !== filters.supplier_id) return false;
        if (filters.q) {
          const q = filters.q.toLowerCase();
          const haystack = [i.id, i.finding_id, i.order_no, i.material_name, i.supplier_name, i.required_action, i.owner, i.department].join(' ').toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      });

      const uniqueCases = [...new Map(issues.map(i => [i.case_id, { id: i.case_id, so: i.order_no }])).values()].filter(c => c.id);
      const uniqueDeps = [...new Set(issues.map(i => i.department).filter(Boolean))];
      const uniqueSups = [...new Map(issues.map(i => [i.supplier_id, { id: i.supplier_id, name: i.supplier_name }])).values()].filter(s => s.id);

      mount.innerHTML = `
        <div class="action-center-header">
          <div>
            <p class="eyebrow">${esc(tr('PURCHASING & SOURCING'))}</p>
            <h2>${esc(tr('Evidence Action Center'))}</h2>
            <p class="muted">${esc(tr('Triage findings, coordinate corrective actions with suppliers, and submit evidence for independent verification.'))}</p>
          </div>
          <div class="action-center-header-tools">
            <button type="button" class="quiet-button" id="acRefreshBtn">↻ ${esc(tr('Refresh'))}</button>
          </div>
        </div>

        <!-- KPI Summary Cards -->
        <div class="ac-kpi-grid" role="region" aria-label="${esc(tr('Action Metrics'))}">
          <div class="ac-kpi-card ${currentTab === 'my_actions' ? 'is-active' : ''}" data-ac-tab="my_actions">
            <span class="ac-kpi-label">${esc(tr('My Actions'))}</span>
            <strong class="ac-kpi-value">${counts.my_actions}</strong>
            <small class="ac-kpi-sub">${esc(tr('Assigned to you'))}</small>
          </div>
          <div class="ac-kpi-card ${currentTab === 'awaiting_supplier' ? 'is-active' : ''}" data-ac-tab="awaiting_supplier">
            <span class="ac-kpi-label">${esc(tr('Awaiting Supplier'))}</span>
            <strong class="ac-kpi-value text-amber">${counts.awaiting_supplier}</strong>
            <small class="ac-kpi-sub">${esc(tr('Request sent to supplier'))}</small>
          </div>
          <div class="ac-kpi-card ${currentTab === 'pending_verification' ? 'is-active' : ''}" data-ac-tab="pending_verification">
            <span class="ac-kpi-label">${esc(tr('Pending Verification'))}</span>
            <strong class="ac-kpi-value text-blue">${counts.pending_verification}</strong>
            <small class="ac-kpi-sub">${esc(tr('Evidence submitted'))}</small>
          </div>
          <div class="ac-kpi-card ${currentTab === 'overdue' ? 'is-active' : ''}" data-ac-tab="overdue">
            <span class="ac-kpi-label">${esc(tr('Overdue Actions'))}</span>
            <strong class="ac-kpi-value text-red">${counts.overdue}</strong>
            <small class="ac-kpi-sub">${esc(tr('Past deadline'))}</small>
          </div>
          <div class="ac-kpi-card ${currentTab === 'completed' ? 'is-active' : ''}" data-ac-tab="completed">
            <span class="ac-kpi-label">${esc(tr('Completed'))}</span>
            <strong class="ac-kpi-value text-green">${counts.completed}</strong>
            <small class="ac-kpi-sub">${esc(tr('Resolved or dismissed'))}</small>
          </div>
        </div>

        <!-- Filter & Search Bar -->
        <div class="card ac-filter-bar">
          <div class="ac-search-input">
            <input type="text" id="acSearchInput" value="${esc(filters.q)}" placeholder="${esc(tr('Search action, finding, SO, supplier…'))}" aria-label="${esc(tr('Search actions'))}">
          </div>
          <div class="ac-filter-selects">
            <label>
              <span class="sr-only">${esc(tr('Order'))}</span>
              <select id="acFilterCase">
                <option value="">${esc(tr('All Orders'))}</option>
                ${uniqueCases.map(c => `<option value="${esc(c.id)}" ${filters.case_id === c.id ? 'selected' : ''}>${esc(c.so || c.id)}</option>`).join('')}
              </select>
            </label>
            <label>
              <span class="sr-only">${esc(tr('Department'))}</span>
              <select id="acFilterDep">
                <option value="">${esc(tr('All Departments'))}</option>
                ${uniqueDeps.map(d => `<option value="${esc(d)}" ${filters.department === d ? 'selected' : ''}>${esc(d)}</option>`).join('')}
              </select>
            </label>
            <label>
              <span class="sr-only">${esc(tr('Priority'))}</span>
              <select id="acFilterPriority">
                <option value="">${esc(tr('All Priorities'))}</option>
                <option value="CRITICAL" ${filters.priority === 'CRITICAL' ? 'selected' : ''}>CRITICAL</option>
                <option value="HIGH" ${filters.priority === 'HIGH' ? 'selected' : ''}>HIGH</option>
                <option value="MEDIUM" ${filters.priority === 'MEDIUM' ? 'selected' : ''}>MEDIUM</option>
                <option value="LOW" ${filters.priority === 'LOW' ? 'selected' : ''}>LOW</option>
              </select>
            </label>
            <label>
              <span class="sr-only">${esc(tr('Supplier'))}</span>
              <select id="acFilterSup">
                <option value="">${esc(tr('All Suppliers'))}</option>
                ${uniqueSups.map(s => `<option value="${esc(s.id)}" ${filters.supplier_id === s.id ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}
              </select>
            </label>
            <button type="button" class="quiet-button" id="acClearFilters">${esc(tr('Clear'))}</button>
          </div>
        </div>

        <!-- Tabs Navigation -->
        <div class="ac-tab-nav" role="tablist">
          <button type="button" role="tab" class="ac-tab-btn ${currentTab === 'my_actions' ? 'is-active' : ''}" data-ac-tab="my_actions" aria-selected="${currentTab === 'my_actions'}">${esc(tr('My Actions'))} <span class="tab-badge">${counts.my_actions}</span></button>
          <button type="button" role="tab" class="ac-tab-btn ${currentTab === 'awaiting_supplier' ? 'is-active' : ''}" data-ac-tab="awaiting_supplier" aria-selected="${currentTab === 'awaiting_supplier'}">${esc(tr('Awaiting Supplier'))} <span class="tab-badge">${counts.awaiting_supplier}</span></button>
          <button type="button" role="tab" class="ac-tab-btn ${currentTab === 'pending_verification' ? 'is-active' : ''}" data-ac-tab="pending_verification" aria-selected="${currentTab === 'pending_verification'}">${esc(tr('Pending Re-review'))} <span class="tab-badge">${counts.pending_verification}</span></button>
          <button type="button" role="tab" class="ac-tab-btn ${currentTab === 'overdue' ? 'is-active' : ''}" data-ac-tab="overdue" aria-selected="${currentTab === 'overdue'}">${esc(tr('Overdue'))} <span class="tab-badge text-red">${counts.overdue}</span></button>
          <button type="button" role="tab" class="ac-tab-btn ${currentTab === 'completed' ? 'is-active' : ''}" data-ac-tab="completed" aria-selected="${currentTab === 'completed'}">${esc(tr('Completed'))} <span class="tab-badge">${counts.completed}</span></button>
        </div>

        <!-- Actions Table / List -->
        <div class="ac-table-container card">
          ${filtered.length === 0 ? `
            <div class="empty-state">
              <div class="empty-icon">✓</div>
              <h3>${esc(tr('No actions found'))}</h3>
              <p>${esc(tr('There are no corrective actions matching your current tab and filters.'))}</p>
            </div>
          ` : `
            <table class="ac-table" aria-label="${esc(tr('Actions List'))}">
              <thead>
                <tr>
                  <th style="width: 90px;">${esc(tr('Priority'))}</th>
                  <th>${esc(tr('Action & Scope'))}</th>
                  <th>${esc(tr('Supplier / Material'))}</th>
                  <th>${esc(tr('Owner / Dept'))}</th>
                  <th style="width: 110px;">${esc(tr('Due Date'))}</th>
                  <th style="width: 130px;">${esc(tr('Status'))}</th>
                  <th style="width: 120px; text-align: right;">${esc(tr('Action'))}</th>
                </tr>
              </thead>
              <tbody>
                ${filtered.map(i => {
                  const prioClass = i.priority === 'CRITICAL' ? 'badge-critical' : i.priority === 'HIGH' ? 'badge-high' : i.priority === 'LOW' ? 'badge-low' : 'badge-medium';
                  const statusClass = i.status === 'RESOLVED' ? 'pill-success' : i.status === 'REJECTED' ? 'pill-danger' : i.status === 'EVIDENCE_SUBMITTED' ? 'pill-info' : i.is_overdue ? 'pill-overdue' : 'pill-neutral';
                  return `
                    <tr class="ac-row ${i.is_overdue ? 'is-overdue-row' : ''}">
                      <td><span class="badge ${prioClass}">${esc(i.priority || 'MEDIUM')}</span></td>
                      <td>
                        <div class="ac-action-title"><strong>${esc(i.required_action || i.finding_id || i.id)}</strong></div>
                        <div class="ac-action-meta muted">
                          <span>${esc(i.order_no || i.case_id)}</span>
                          ${i.finding_id ? ` · <span class="mono">${esc(i.finding_id)}</span>` : ''}
                          ${i.blocking === 'YES' ? ` · <span class="badge badge-blocking">${esc(tr('Blocking Closure'))}</span>` : ''}
                        </div>
                      </td>
                      <td>
                        <div><strong>${esc(i.supplier_name || '—')}</strong></div>
                        <div class="muted">${esc(i.material_name || '—')}</div>
                      </td>
                      <td>
                        <div>${esc(i.owner ? (state?.owners?.find(o => o.email === i.owner)?.name || i.owner) : tr('Unassigned'))}</div>
                        <div class="muted">${esc(i.department || '—')}</div>
                      </td>
                      <td>
                        <span class="${i.is_overdue ? 'text-red font-bold' : ''}">${esc(i.due_date || '—')}</span>
                      </td>
                      <td>
                        <span class="status-pill ${statusClass}">${esc(tr(i.status))}</span>
                        ${i.is_awaiting_supplier ? `<div class="subline text-amber"><small>⏳ ${esc(tr('Supplier'))}</small></div>` : ''}
                      </td>
                      <td style="text-align: right;">
                        <button type="button" class="btn-sm btn-manage-issue" data-issue-id="${esc(i.id)}">${esc(tr('Manage →'))}</button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          `}
        </div>
      `;

      // Event bindings
      mount.querySelector('#acRefreshBtn')?.addEventListener('click', () => loadData());

      mount.querySelectorAll('[data-ac-tab]').forEach(btn => {
        btn.addEventListener('click', () => {
          currentTab = btn.dataset.acTab;
          draw();
        });
      });

      mount.querySelector('#acSearchInput')?.addEventListener('input', e => {
        filters.q = e.target.value.trim();
        draw();
      });

      mount.querySelector('#acFilterCase')?.addEventListener('change', e => {
        filters.case_id = e.target.value;
        draw();
      });

      mount.querySelector('#acFilterDep')?.addEventListener('change', e => {
        filters.department = e.target.value;
        draw();
      });

      mount.querySelector('#acFilterPriority')?.addEventListener('change', e => {
        filters.priority = e.target.value;
        draw();
      });

      mount.querySelector('#acFilterSup')?.addEventListener('change', e => {
        filters.supplier_id = e.target.value;
        draw();
      });

      mount.querySelector('#acClearFilters')?.addEventListener('click', () => {
        filters = { q: '', case_id: '', department: '', priority: '', supplier_id: '' };
        draw();
      });

      mount.querySelectorAll('.btn-manage-issue').forEach(btn => {
        btn.addEventListener('click', () => {
          const issue = issues.find(x => x.id === btn.dataset.issueId);
          if (issue) openDetailDrawer(issue);
        });
      });

      window.EudrI18n?.translateUI(mount);
    }

    function openDetailDrawer(issue) {
      const user = state?.user || {};
      const userEmail = user.email || '';
      const isReviewer = (user.capabilities || []).includes('AI_REVIEW') || (user.capabilities || []).includes('EVIDENCE_REVIEW') || user.role === 'ADMIN';
      const isOwner = issue.owner === userEmail;
      const canManage = isOwner || isReviewer || (user.capabilities || []).includes('AI_USE');
      const orderDocs = (state?.docs || []).filter(d => d.case_id === issue.case_id && d.active_version === 'YES');
      const citations = list(issue.document_requirements);
      const auditLog = list(issue.audit_history);
      const requests = issue.requests || [];

      // Check Separation of Duties for resolution
      const isSelfAction = (issue.owner === userEmail || issue.evidence_submitted_by === userEmail);
      const resDocs = list(issue.resolution_evidence);
      const isDocUploader = orderDocs.some(d => resDocs.includes(d.id) && (d.uploaded_by === userEmail || d.created_by === userEmail));
      const cannotResolveDueToSoD = isReviewer && (isSelfAction || isDocUploader);

      drawer(`
        <div class="ac-drawer-container">
          <header class="ac-drawer-header">
            <div>
              <span class="badge ${issue.priority === 'CRITICAL' ? 'badge-critical' : 'badge-medium'}">${esc(issue.priority || 'MEDIUM')}</span>
              ${issue.blocking === 'YES' ? `<span class="badge badge-blocking">${esc(tr('Blocking Closure'))}</span>` : ''}
              <h3>${esc(issue.required_action || issue.finding_id || issue.id)}</h3>
              <p class="muted">${esc(issue.order_no)} · ${esc(issue.material_name)} · ${esc(issue.supplier_name)}</p>
            </div>
            <div>
              <span class="status-pill pill-large">${esc(tr(issue.status))}</span>
            </div>
          </header>

          <div class="ac-drawer-body">
            <!-- Section 1: Finding Details & Citations -->
            <section class="ac-section card">
              <h4>${esc(tr('Finding Details & Origin'))}</h4>
              <div class="ac-detail-grid">
                <div><strong>${esc(tr('Finding ID'))}:</strong> <span class="mono">${esc(issue.finding_id || '—')}</span></div>
                <div><strong>${esc(tr('Finding Type'))}:</strong> ${esc(issue.finding_type || '—')}</div>
                <div><strong>${esc(tr('Review Pack ID'))}:</strong> <span class="mono">${esc(issue.review_id || '—')}</span></div>
                <div><strong>${esc(tr('Suggested Dept'))}:</strong> ${esc(issue.department || '—')}</div>
              </div>
              ${citations.length > 0 ? `
                <div class="ac-citations-box">
                  <strong>${esc(tr('Referenced Documents'))}:</strong>
                  <div class="ac-citation-pills">
                    ${citations.map(docId => `<button type="button" class="btn-sm btn-citation" data-doc-id="${esc(docId)}">📄 ${esc(docId)}</button>`).join(' ')}
                  </div>
                </div>
              ` : ''}
              ${issue.triage_decision ? `
                <div class="ac-triage-info">
                  <strong>${esc(tr('Triage Decision'))}:</strong> ${esc(issue.triage_decision)}
                  ${issue.triage_reason ? `<p class="muted"><em>${esc(issue.triage_reason)}</em></p>` : ''}
                </div>
              ` : ''}
            </section>

            <!-- Section 2: Action Assignment & Status Transition -->
            <section class="ac-section card">
              <h4>${esc(tr('Action Assignment & Progress'))}</h4>
              <form id="acUpdateIssueForm">
                <div class="row">
                  <label style="flex: 1;">
                    ${esc(tr('Assigned Owner'))}
                    <select name="owner" ${!canManage ? 'disabled' : ''}>
                      <option value="">${esc(tr('Unassigned'))}</option>
                      ${(state?.owners || []).filter(o => o.active === 'YES' && (isReviewer || ['PURCHASING', 'SOURCING'].includes(o.role))).map(o => `
                        <option value="${esc(o.email)}" ${issue.owner === o.email ? 'selected' : ''}>${esc(o.name || o.email)} (${esc(o.role)})</option>
                      `).join('')}
                    </select>
                  </label>
                  <label style="flex: 1;">
                    ${esc(tr('Department'))}
                    <input type="text" name="department" value="${esc(issue.department || '')}" ${!canManage ? 'disabled' : ''}>
                  </label>
                  <label style="flex: 1;">
                    ${esc(tr('Due Date'))}
                    <input type="date" name="due_date" value="${esc(issue.due_date || '')}" ${!canManage ? 'disabled' : ''}>
                  </label>
                </div>
                <div class="row" style="margin-top: 10px;">
                  <label style="flex: 1;">
                    ${esc(tr('Status Transition'))}
                    <select name="status" ${!canManage ? 'disabled' : ''}>
                      ${getStatusOptions(issue.status).map(st => `<option value="${esc(st)}">${esc(tr(st))}</option>`).join('')}
                    </select>
                  </label>
                  <label style="flex: 2;">
                    ${esc(tr('Transition Reason / Notes'))}
                    <input type="text" name="reason" placeholder="${esc(tr('Explanation for this status change…'))}" required maxlength="2000">
                  </label>
                </div>
                <div class="row" style="margin-top: 10px; justify-content: flex-end;">
                  <button type="submit" class="btn-primary" ${!canManage ? 'disabled' : ''}>${esc(tr('Update Action'))}</button>
                </div>
              </form>
            </section>

            <!-- Section 3: Supplier Evidence Request (M2) -->
            <section class="ac-section card">
              <div class="section-title">
                <h4>${esc(tr('Supplier Follow-up & Requests'))}</h4>
                <button type="button" class="btn-sm" id="acNewRequestToggleBtn">+ ${esc(tr('New Request to Supplier'))}</button>
              </div>

              <!-- New Request Form (collapsed by default) -->
              <div id="acNewRequestBox" hidden style="margin-top: 15px; padding: 12px; background: var(--bg-surface-alt, #f7f9f8); border-radius: 6px;">
                <h5>${esc(tr('Draft Request to Supplier'))}</h5>
                <form id="acCreateRequestForm">
                  <div class="row">
                    <label style="flex: 1;">
                      ${esc(tr('Channel'))}
                      <select name="channel">
                        <option value="EMAIL">Email</option>
                        <option value="ZALO">Zalo / Phone</option>
                        <option value="SUPPLIER_PORTAL">Supplier Portal</option>
                      </select>
                    </label>
                    <label style="flex: 1;">
                      ${esc(tr('Due Date'))}
                      <input type="date" name="due_date" value="${esc(issue.due_date || '')}">
                    </label>
                  </div>
                  <label>
                    ${esc(tr('Requested Information / Clarification'))}
                    <textarea name="requested_information" rows="3" required placeholder="${esc(tr('Specify what certificates, shipping records, or plot coordinates are missing…'))}"></textarea>
                  </label>
                  <div class="row" style="justify-content: flex-end; margin-top: 10px;">
                    <button type="button" class="quiet-button" id="acCancelRequestBtn">${esc(tr('Cancel'))}</button>
                    <button type="submit" class="btn-primary">${esc(tr('Save Request'))}</button>
                  </div>
                </form>
              </div>

              <!-- Existing Requests History -->
              <div class="ac-requests-list" style="margin-top: 15px;">
                ${requests.length === 0 ? `
                  <p class="muted">${esc(tr('No supplier requests recorded yet for this action.'))}</p>
                ` : requests.map(req => `
                  <div class="ac-request-item card">
                    <div class="ac-request-head">
                      <div>
                        <strong>${esc(tr('Request'))} · ${esc(req.channel || 'EMAIL')}</strong>
                        <span class="status-pill ${req.status === 'RESPONDED' ? 'pill-success' : req.status === 'SENT' ? 'pill-warning' : 'pill-neutral'}">${esc(req.status)}</span>
                      </div>
                      <small class="muted">${esc(req.created_at || '')}</small>
                    </div>
                    <p>${esc(req.requested_information || req.required_clarification || '—')}</p>
                    ${req.sent_at ? `<div class="subline"><small>📤 ${esc(tr('Sent on'))}: ${esc(req.sent_at)} by ${esc(req.sent_recorded_by || '')}</small></div>` : ''}
                    ${req.responded_at ? `
                      <div class="subline text-green"><small>📥 ${esc(tr('Responded on'))}: ${esc(req.responded_at)}</small></div>
                      ${req.response_note ? `<p class="ac-response-note"><em>${esc(req.response_note)}</em></p>` : ''}
                    ` : ''}
                    <div class="ac-request-actions" style="margin-top: 8px;">
                      ${req.status === 'DRAFT' ? `
                        <button type="button" class="btn-sm btn-mark-sent" data-req-id="${esc(req.id)}">📤 ${esc(tr('Mark Sent to Supplier'))}</button>
                      ` : ''}
                      ${req.status === 'SENT' ? `
                        <button type="button" class="btn-sm btn-record-response" data-req-id="${esc(req.id)}">📥 ${esc(tr('Record Supplier Response'))}</button>
                      ` : ''}
                    </div>
                  </div>
                `).join('')}
              </div>
            </section>

            <!-- Section 4: Resolution & Verification (M3) -->
            <section class="ac-section card">
              <h4>${esc(tr('Resolution & Verification'))}</h4>

              <!-- Evidence Submission -->
              <form id="acSubmitEvidenceForm" style="margin-bottom: 20px;">
                <h5>${esc(tr('Submit Resolution Evidence'))}</h5>
                <label>
                  ${esc(tr('Select Active Supporting Documents'))}
                  <select name="resolution_evidence" multiple size="4" style="width: 100%;">
                    ${orderDocs.map(d => `
                      <option value="${esc(d.id)}" ${resDocs.includes(d.id) ? 'selected' : ''}>${esc(d.name)} (${esc(d.kind)})</option>
                    `).join('')}
                  </select>
                </label>
                <label style="margin-top: 8px;">
                  ${esc(tr('Submission Notes / How this resolves the finding'))}
                  <textarea name="evidence_note" rows="2" placeholder="${esc(tr('Explain how the uploaded documents satisfy EUDR requirements…'))}"></textarea>
                </label>
                <div class="row" style="justify-content: flex-end; margin-top: 10px;">
                  <button type="submit" class="btn-primary" ${!canManage ? 'disabled' : ''}>${esc(tr('Submit for Verification'))}</button>
                </div>
              </form>

              <!-- Independent Verification (Reviewer / Admin) -->
              <div class="ac-verification-box" style="padding: 12px; background: var(--bg-surface-alt, #f7f9f8); border-radius: 6px;">
                <h5>${esc(tr('Independent Verification (Reviewer / Admin)'))}</h5>
                ${cannotResolveDueToSoD ? `
                  <div class="alert alert-warning" role="alert">
                    ⚠️ <strong>${esc(tr('Separation of Duties Required'))}:</strong> ${esc(tr('You are the action owner, evidence submitter, or uploader of the resolution files. An independent reviewer or admin must verify and resolve this action.'))}
                  </div>
                ` : isReviewer ? `
                  <div class="row" style="margin-top: 10px;">
                    <input type="text" id="acVerifyReason" placeholder="${esc(tr('Verification rationale or recheck requirement…'))}" style="flex: 2;">
                    <button type="button" class="btn-success" id="acVerifyResolveBtn">${esc(tr('Verify & Resolve'))}</button>
                    <button type="button" class="btn-danger" id="acRequestRecheckBtn">${esc(tr('Request Recheck'))}</button>
                  </div>
                ` : `
                  <p class="muted">${esc(tr('Independent verification requires EUDR Reviewer or Admin role.'))}</p>
                `}

                <div style="margin-top: 15px;">
                  <button type="button" class="quiet-button" id="acCompareReviewBtn">🔍 ${esc(tr('Compare with Latest AI Review'))}</button>
                  <div id="acCompareResult" style="margin-top: 8px;"></div>
                </div>
              </div>
            </section>

            <!-- Section 5: Audit Trail -->
            <section class="ac-section card">
              <h4>${esc(tr('Audit Trail'))}</h4>
              <div class="ac-audit-timeline">
                ${auditLog.length === 0 ? `
                  <p class="muted">${esc(tr('No audit history recorded.'))}</p>
                ` : auditLog.map(log => `
                  <div class="ac-audit-entry">
                    <span class="mono ac-audit-time">${esc(log.at || log.timestamp || '—')}</span>
                    <strong>${esc(log.actor || 'System')}</strong>:
                    <span>${esc(log.from ? `${log.from} → ${log.to}` : log.action || log.decision || 'Update')}</span>
                    ${log.reason ? `<div class="muted"><em>${esc(log.reason)}</em></div>` : ''}
                  </div>
                `).join('')}
              </div>
            </section>
          </div>
        </div>
      `);

      // Bind drawer events
      const drawerEl = document.querySelector('#drawer');
      if (!drawerEl) return;

      drawerEl.querySelectorAll('.btn-citation').forEach(b => {
        b.onclick = () => openDocument(b.dataset.docId, 1);
      });

      // Section 2 Update Issue
      const updateForm = drawerEl.querySelector('#acUpdateIssueForm');
      if (updateForm) {
        updateForm.onsubmit = async e => {
          e.preventDefault();
          const fd = new FormData(updateForm);
          const nextStatus = fd.get('status');
          const reason = fd.get('reason');
          const nextOwner = fd.get('owner');
          const nextDep = fd.get('department');
          const nextDue = fd.get('due_date');

          try {
            await call('updateKodaReviewIssue', issue.id, {
              status: nextStatus,
              reason,
              owner: nextOwner,
              department: nextDep,
              due_date: nextDue,
              confirmed: true,
              expected_updated_at: issue.updated_at
            });
            await loadData();
            const updated = cachedData?.issues?.find(x => x.id === issue.id);
            if (updated) openDetailDrawer(updated);
          } catch (err) {
            alert((err.code ? err.code + ': ' : '') + err.message);
          }
        };
      }

      // Section 3 Toggle New Request Form
      const newReqToggle = drawerEl.querySelector('#acNewRequestToggleBtn');
      const newReqBox = drawerEl.querySelector('#acNewRequestBox');
      const cancelReqBtn = drawerEl.querySelector('#acCancelRequestBtn');
      if (newReqToggle && newReqBox) {
        newReqToggle.onclick = () => { newReqBox.hidden = !newReqBox.hidden; };
      }
      if (cancelReqBtn && newReqBox) {
        cancelReqBtn.onclick = () => { newReqBox.hidden = true; };
      }

      // Section 3 Create Supplier Request
      const createReqForm = drawerEl.querySelector('#acCreateRequestForm');
      if (createReqForm) {
        createReqForm.onsubmit = async e => {
          e.preventDefault();
          const fd = new FormData(createReqForm);
          try {
            await call('saveSupplierEvidenceRequest', {
              issue_id: issue.id,
              channel: fd.get('channel'),
              due_date: fd.get('due_date'),
              requested_information: fd.get('requested_information'),
              supplier_id: issue.supplier_id
            });
            await loadData();
            const updated = cachedData?.issues?.find(x => x.id === issue.id);
            if (updated) openDetailDrawer(updated);
          } catch (err) {
            alert((err.code ? err.code + ': ' : '') + err.message);
          }
        };
      }

      // Section 3 Mark Sent
      drawerEl.querySelectorAll('.btn-mark-sent').forEach(b => {
        b.onclick = async () => {
          const channel = prompt(tr('Confirm channel (EMAIL, ZALO, SUPPLIER_PORTAL):'), 'EMAIL');
          if (!channel) return;
          try {
            await call('recordSupplierEvidenceRequestSent', b.dataset.reqId, { channel });
            await loadData();
            const updated = cachedData?.issues?.find(x => x.id === issue.id);
            if (updated) openDetailDrawer(updated);
          } catch (err) {
            alert((err.code ? err.code + ': ' : '') + err.message);
          }
        };
      });

      // Section 3 Record Response
      drawerEl.querySelectorAll('.btn-record-response').forEach(b => {
        b.onclick = async () => {
          const note = prompt(tr('Supplier response notes:'), '');
          if (note === null) return;
          try {
            await call('recordSupplierEvidenceRequestResponse', b.dataset.reqId, { response_note: note });
            await loadData();
            const updated = cachedData?.issues?.find(x => x.id === issue.id);
            if (updated) openDetailDrawer(updated);
          } catch (err) {
            alert((err.code ? err.code + ': ' : '') + err.message);
          }
        };
      });

      // Section 4 Submit Evidence
      const submitEvForm = drawerEl.querySelector('#acSubmitEvidenceForm');
      if (submitEvForm) {
        submitEvForm.onsubmit = async e => {
          e.preventDefault();
          const fd = new FormData(submitEvForm);
          const docs = fd.getAll('resolution_evidence');
          const note = fd.get('evidence_note') || 'Evidence submitted for verification';
          try {
            await call('updateKodaReviewIssue', issue.id, {
              status: 'EVIDENCE_SUBMITTED',
              reason: note,
              resolution_evidence: docs,
              confirmed: true,
              expected_updated_at: issue.updated_at
            });
            await loadData();
            const updated = cachedData?.issues?.find(x => x.id === issue.id);
            if (updated) openDetailDrawer(updated);
          } catch (err) {
            alert((err.code ? err.code + ': ' : '') + err.message);
          }
        };
      }

      // Section 4 Verify & Resolve
      const verifyBtn = drawerEl.querySelector('#acVerifyResolveBtn');
      if (verifyBtn) {
        verifyBtn.onclick = async () => {
          const reason = drawerEl.querySelector('#acVerifyReason')?.value.trim() || 'Finding verified and resolved';
          try {
            await call('updateKodaReviewIssue', issue.id, {
              status: 'RESOLVED',
              reason,
              confirmed: true,
              expected_updated_at: issue.updated_at
            });
            await loadData();
            const updated = cachedData?.issues?.find(x => x.id === issue.id);
            if (updated) openDetailDrawer(updated);
          } catch (err) {
            alert((err.code ? err.code + ': ' : '') + err.message);
          }
        };
      }

      // Section 4 Request Recheck
      const recheckBtn = drawerEl.querySelector('#acRequestRecheckBtn');
      if (recheckBtn) {
        recheckBtn.onclick = async () => {
          const reason = drawerEl.querySelector('#acVerifyReason')?.value.trim();
          if (!reason) {
            alert(tr('Please provide the recheck requirement in the reason field.'));
            return;
          }
          try {
            await call('updateKodaReviewIssue', issue.id, {
              status: 'RECHECK_REQUIRED',
              reason,
              confirmed: true,
              expected_updated_at: issue.updated_at
            });
            await loadData();
            const updated = cachedData?.issues?.find(x => x.id === issue.id);
            if (updated) openDetailDrawer(updated);
          } catch (err) {
            alert((err.code ? err.code + ': ' : '') + err.message);
          }
        };
      }

      // Section 4 Compare Review Findings
      const compareBtn = drawerEl.querySelector('#acCompareReviewBtn');
      const compareBox = drawerEl.querySelector('#acCompareResult');
      if (compareBtn && compareBox) {
        compareBtn.onclick = async () => {
          compareBox.innerHTML = '<span class="spinner spinner--inline"></span> Comparing…';
          try {
            const res = await call('compareReviewFindings', issue.id);
            if (res.status === 'RESOLVED_IN_NEW') {
              compareBox.innerHTML = `<span class="badge badge-success">✓ ${esc(res.comparison)}</span>`;
            } else if (res.status === 'STILL_OPEN') {
              compareBox.innerHTML = `<span class="badge badge-critical">⚠️ ${esc(res.comparison)}</span>`;
            } else {
              compareBox.innerHTML = `<span class="muted">${esc(res.comparison)}</span>`;
            }
          } catch (err) {
            compareBox.innerHTML = `<span class="text-red">${esc(err.message)}</span>`;
          }
        };
      }

      window.EudrI18n?.translateUI(drawerEl);
    }

    function getStatusOptions(currentStatus) {
      const transitions = {
        PROPOSED: ['PROPOSED', 'REVIEWED', 'REJECTED'],
        REVIEWED: ['REVIEWED', 'ASSIGNED', 'REJECTED'],
        ASSIGNED: ['ASSIGNED', 'IN_PROGRESS', 'REOPENED'],
        IN_PROGRESS: ['IN_PROGRESS', 'EVIDENCE_SUBMITTED', 'REOPENED'],
        EVIDENCE_SUBMITTED: ['EVIDENCE_SUBMITTED', 'RECHECK_REQUIRED', 'RESOLVED', 'REOPENED'],
        RECHECK_REQUIRED: ['RECHECK_REQUIRED', 'IN_PROGRESS', 'RESOLVED', 'REOPENED', 'REJECTED'],
        RESOLVED: ['RESOLVED', 'REOPENED'],
        REJECTED: ['REJECTED', 'REOPENED'],
        REOPENED: ['REOPENED', 'REVIEWED', 'ASSIGNED', 'IN_PROGRESS']
      };
      return transitions[currentStatus] || [currentStatus, 'REOPENED'];
    }

    await loadData();
  }

  return { render };
})();
