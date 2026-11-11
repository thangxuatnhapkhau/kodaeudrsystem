// KODA EUDR Workspace — Wood-Material Evidence-Readiness Tracker (WT-1.0.0)
window.EudrWoodTracker = (() => {
  const esc = x => String(x ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const tr = x => window.EudrI18n?.t(x) || x;
  const list = x => { try { return Array.isArray(x) ? x : JSON.parse(x || '[]'); } catch { return []; } };

  // Standardized KODA Wood Botanical Taxonomy Knowledge Base
  const SPECIES_TAXONOMY = [
    {
      keywords: ['OAK', 'SỒI'],
      category: 'SOLID_WOOD',
      common_species: 'American White Oak / European Oak',
      scientific_name: 'Quercus alba',
      scientific_alternatives: ['Quercus alba', 'Quercus robur', 'Quercus petraea'],
      family: 'Fagaceae',
      default_hs: '4407.91.90',
      origins: ['US', 'FR', 'DE', 'HR']
    },
    {
      keywords: ['WALNUT', 'ÓC CHÓ'],
      category: 'SOLID_WOOD',
      common_species: 'American Black Walnut / European Walnut',
      scientific_name: 'Juglans nigra',
      scientific_alternatives: ['Juglans nigra', 'Juglans regia'],
      family: 'Juglandaceae',
      default_hs: '4407.99.90',
      origins: ['US', 'CA', 'FR', 'IT']
    },
    {
      keywords: ['ASH', 'TẦN BÌ'],
      category: 'SOLID_WOOD',
      common_species: 'American White Ash / European Ash',
      scientific_name: 'Fraxinus americana',
      scientific_alternatives: ['Fraxinus americana', 'Fraxinus excelsior'],
      family: 'Oleaceae',
      default_hs: '4407.99.90',
      origins: ['US', 'DE', 'FR', 'PL']
    },
    {
      keywords: ['BEECH', 'DẺ GAI'],
      category: 'SOLID_WOOD',
      common_species: 'European Beech',
      scientific_name: 'Fagus sylvatica',
      scientific_alternatives: ['Fagus sylvatica'],
      family: 'Fagaceae',
      default_hs: '4407.92.00',
      origins: ['DE', 'RO', 'FR', 'PL']
    },
    {
      keywords: ['ACACIA', 'TRÀM', 'KEO'],
      category: 'SOLID_WOOD',
      common_species: 'Acacia mangium / Keo tràm',
      scientific_name: 'Acacia mangium',
      scientific_alternatives: ['Acacia mangium', 'Acacia auriculiformis'],
      family: 'Fabaceae',
      default_hs: '4407.99.90',
      origins: ['VN', 'MY', 'ID']
    },
    {
      keywords: ['RUBBER', 'CAO SU'],
      category: 'SOLID_WOOD',
      common_species: 'Rubberwood / Gỗ cao su',
      scientific_name: 'Hevea brasiliensis',
      scientific_alternatives: ['Hevea brasiliensis'],
      family: 'Euphorbiaceae',
      default_hs: '4407.99.90',
      origins: ['VN', 'TH', 'MY']
    },
    {
      keywords: ['VENEER OAK', 'OAK VENEER', 'VENEER SỒI'],
      category: 'VENEER',
      common_species: 'White Oak Veneer',
      scientific_name: 'Quercus alba',
      family: 'Fagaceae',
      default_hs: '4408.90.00',
      origins: ['US', 'DE', 'IT']
    },
    {
      keywords: ['VENEER WALNUT', 'WALNUT VENEER', 'VENEER ÓC CHÓ'],
      category: 'VENEER',
      common_species: 'Black Walnut Veneer',
      scientific_name: 'Juglans nigra',
      family: 'Juglandaceae',
      default_hs: '4408.90.00',
      origins: ['US', 'IT']
    },
    {
      keywords: ['VENEER ASH', 'ASH VENEER', 'VENEER TẦN BÌ'],
      category: 'VENEER',
      common_species: 'White Ash Veneer',
      scientific_name: 'Fraxinus americana',
      family: 'Oleaceae',
      default_hs: '4408.90.00',
      origins: ['US', 'DE']
    },
    {
      keywords: ['VENEER ACACIA', 'ACACIA VENEER', 'VENEER KEO'],
      category: 'VENEER',
      common_species: 'Acacia Veneer',
      scientific_name: 'Acacia mangium',
      family: 'Fabaceae',
      default_hs: '4408.90.00',
      origins: ['VN']
    },
    {
      keywords: ['MDF', 'FIBERBOARD'],
      category: 'MDF',
      common_species: 'MDF Fiber furnish (Composite)',
      scientific_name: 'Hevea brasiliensis / Acacia mangium mix',
      family: 'Composite / Multi-species',
      default_hs: '4411.13.00',
      origins: ['VN', 'MY', 'TH'],
      isComposite: true
    },
    {
      keywords: ['PLYWOOD', 'LVL', 'VÁN ÉP'],
      category: 'PLYWOOD',
      common_species: 'Plywood core & face (Composite)',
      scientific_name: 'Acacia mangium / Betula pendula mix',
      family: 'Composite / Multi-species',
      default_hs: '4412.33.00',
      origins: ['VN', 'MY', 'CN'],
      isComposite: true
    }
  ];

  function matchTaxonomy(name, category) {
    const upper = String(name || '').toUpperCase();
    const catUpper = String(category || '').toUpperCase();
    for (const spec of SPECIES_TAXONOMY) {
      if (spec.keywords.some(k => upper.includes(k))) {
        return spec;
      }
    }
    if (['MDF'].includes(catUpper)) return SPECIES_TAXONOMY.find(s => s.category === 'MDF');
    if (['PLYWOOD', 'LVL'].includes(catUpper)) return SPECIES_TAXONOMY.find(s => s.category === 'PLYWOOD');
    if (['VENEER'].includes(catUpper)) return SPECIES_TAXONOMY.find(s => s.category === 'VENEER') || SPECIES_TAXONOMY[6];
    return null;
  }

  // State & Filter Management
  let currentFilter = {
    q: '',
    case_id: '',
    category: '',
    status: '',
    missing_type: 'ALL',
    supplier_id: ''
  };

  function evaluateMaterial(m, state) {
    const c = state.cases.find(x => x.id === m.case_id) || {};
    const sources = (state.trace?.sources || []).filter(s => s.material_id === m.id && s.active !== 'NO');
    const geos = (state.geo || []).filter(g => g.material_id === m.id);
    const tasks = (state.tasks || []).filter(t => t.material_id === m.id && t.active !== 'NO');
    const docs = (state.docs || []).filter(d => d.material_id === m.id && d.active_version === 'YES');
    const matchedTaxon = matchTaxonomy(m.material, m.category);

    // Associated products
    const usage = (state.trace?.usage || []).filter(u => u.material_id === m.id && u.active !== 'NO');
    const productIds = new Set(usage.map(u => u.product_id).concat(list(m.product_ids)));
    const products = (state.products || []).filter(p => productIds.has(p.id));

    // Direct Supplier
    let supplierName = m.supplier || '';
    if (m.supplier_id) {
      const sup = state.suppliers.find(s => s.id === m.supplier_id);
      if (sup) supplierName = sup.name;
    }
    if (!supplierName && sources.length) {
      const s0 = sources[0];
      const sup = state.suppliers.find(s => s.id === s0.supplier_id);
      if (sup) supplierName = sup.name;
    }

    // Missing fields & Blocker analysis
    const missing = [];
    const sciName = m.scientific_name || '';
    const hasValidScientific = sciName && !['NOT PROVIDED', 'UNKNOWN', 'N/A', 'VARIOUS'].includes(sciName.toUpperCase());
    if (!hasValidScientific) {
      missing.push('MISSING_SCIENTIFIC_NAME');
    }

    if (!m.hs_cn_code) {
      missing.push('MISSING_HS_CN_CODE');
    }

    const isComposite = ['MDF', 'PLYWOOD', 'LVL'].includes(m.category) || matchedTaxon?.isComposite;
    if (isComposite && !m.species_composition_json && !m.metadata_reference) {
      missing.push('MISSING_COMPOSITE_RECIPE');
    }

    if (!sources.length && !m.supplier_po) {
      missing.push('MISSING_PO_OR_LOT');
    }

    // Origin country
    let countries = list(m.production_countries);
    if (!countries.length && sources.some(s => s.production_country)) {
      countries = [...new Set(sources.map(s => s.production_country).filter(Boolean))];
    }
    if (!countries.length) {
      missing.push('MISSING_HARVEST_COUNTRY');
    }

    // Harvest range
    const hasHarvestRange = m.production_range || sources.some(s => s.harvest_start && s.harvest_end);
    if (!hasHarvestRange) {
      missing.push('MISSING_HARVEST_PERIOD');
    }

    // Geolocation
    if (!geos.length) {
      missing.push('MISSING_GEOLOCATION');
    } else {
      const lowPrec = geos.some(g => Number(g.coordinate_precision_digits || 0) < 6);
      if (lowPrec) missing.push('LOW_PRECISION_COORDINATES');
      const largeMissingPoly = geos.some(g => Number(g.area_ha || 0) >= 4.0 && g.geo_type !== 'POLYGON');
      if (largeMissingPoly) missing.push('POLYGON_REQUIRED_GT_4HA');
    }

    // Evidence tasks
    const reqTasks = tasks.filter(t => t.required !== 'NO');
    const unapprovedTasks = reqTasks.filter(t => t.status !== 'APPROVED');
    if (unapprovedTasks.length > 0) {
      missing.push('UNAPPROVED_EVIDENCE');
    }

    // Calculate Readiness Score (0-100%)
    let score = 0;
    // 1. BOM / Product (15%)
    if (products.length > 0 && usage.length > 0) score += 15;
    else if (products.length > 0) score += 10;

    // 2. Species & Classification (15%)
    if (hasValidScientific && m.hs_cn_code) score += 15;
    else if (hasValidScientific || m.hs_cn_code) score += 8;

    // 3. Supplier & Traceability (15%)
    if (sources.length > 0 && sources.every(s => s.lot_no && s.supplier_po)) score += 15;
    else if (sources.length > 0 || m.supplier_po) score += 10;

    // 4. Geolocation Evidence (20%)
    if (geos.length > 0 && geos.every(g => g.verification_status === 'VERIFIED')) score += 20;
    else if (geos.length > 0 && !missing.includes('LOW_PRECISION_COORDINATES')) score += 14;
    else if (geos.length > 0) score += 8;

    // 5. Legality Evidence (20%)
    const legalDocs = docs.filter(d => /FHP|FELLING|HARVEST|TAX|INVOICE|LEGAL|KIỂM LÂM|BẢNG KÊ/i.test(d.document_type || d.name || ''));
    if (reqTasks.length > 0 && reqTasks.every(t => t.status === 'APPROVED')) score += 20;
    else if (reqTasks.length > 0) {
      const appCount = reqTasks.filter(t => t.status === 'APPROVED').length;
      score += Math.round((appCount / reqTasks.length) * 20);
    }

    // 6. Deforestation Evidence (15%)
    const defDocs = docs.filter(d => /SATELLITE|VIỄN THÁM|DEFORESTATION|LAND|BẢN ĐỒ/i.test(d.document_type || d.name || ''));
    if (m.deforestation_evidence_ids && list(m.deforestation_evidence_ids).length > 0) score += 15;
    else if (defDocs.length > 0) score += 10;
    else if (countries.length > 0) score += 5;

    score = Math.min(100, Math.max(0, score));

    // Determine status
    let status = 'COLLECTING_EVIDENCE';
    if (score === 100 && missing.length === 0) {
      status = 'READY_FOR_DDS';
    } else if (unapprovedTasks.some(t => t.status === 'REJECTED')) {
      status = 'ACTION_REQUIRED';
    } else if (missing.includes('MISSING_GEOLOCATION') || !hasValidScientific || missing.includes('LOW_PRECISION_COORDINATES')) {
      status = 'BLOCKED';
    } else if (reqTasks.length > 0 && reqTasks.every(t => ['SUBMITTED', 'IN_REVIEW', 'APPROVED'].includes(t.status))) {
      status = 'READY_FOR_OPERATOR_REVIEW';
    }

    return {
      material: m,
      case: c,
      products,
      sources,
      geos,
      tasks,
      docs,
      supplierName,
      countries,
      matchedTaxon,
      missing,
      score,
      status
    };
  }

  function render({ call, state, mount, openOrder, openTrace, openMaterialInfo, openGeoReview, drawer }) {
    if (!state || !mount) return;

    // Filter out inactive materials
    const rawMaterials = (state.materials || []).filter(m => m.active !== 'NO');
    const rows = rawMaterials.map(m => evaluateMaterial(m, state));

    function draw() {
      // Calculate KPIs
      const total = rows.length;
      const readyDds = rows.filter(r => r.status === 'READY_FOR_DDS').length;
      const pendingReview = rows.filter(r => r.status === 'READY_FOR_OPERATOR_REVIEW').length;
      const blocked = rows.filter(r => r.status === 'BLOCKED').length;
      const actionReq = rows.filter(r => r.status === 'ACTION_REQUIRED').length;
      const avgScore = total > 0 ? Math.round(rows.reduce((sum, r) => sum + r.score, 0) / total) : 0;

      // Filter rows
      const filtered = rows.filter(r => {
        if (currentFilter.case_id && r.case.id !== currentFilter.case_id) return false;
        if (currentFilter.category && (r.material.category || r.matchedTaxon?.category) !== currentFilter.category) return false;
        if (currentFilter.status && r.status !== currentFilter.status) return false;
        if (currentFilter.supplier_id && r.material.supplier_id !== currentFilter.supplier_id && !r.sources.some(s => s.supplier_id === currentFilter.supplier_id)) return false;

        if (currentFilter.missing_type !== 'ALL') {
          if (currentFilter.missing_type === 'GEO' && !r.missing.some(m => m.includes('GEOLOCATION') || m.includes('COORDINATES') || m.includes('POLYGON'))) return false;
          if (currentFilter.missing_type === 'SPECIES' && !r.missing.includes('MISSING_SCIENTIFIC_NAME')) return false;
          if (currentFilter.missing_type === 'EVIDENCE' && !r.missing.includes('UNAPPROVED_EVIDENCE')) return false;
          if (currentFilter.missing_type === 'COMPOSITE' && !r.missing.includes('MISSING_COMPOSITE_RECIPE')) return false;
        }

        if (currentFilter.q) {
          const q = currentFilter.q.toLowerCase();
          const haystack = [
            r.material.material,
            r.material.scientific_name,
            r.material.common_species,
            r.case.so,
            r.case.customer,
            r.supplierName,
            r.products.map(p => p.sku + ' ' + p.product_name).join(' '),
            r.sources.map(s => s.lot_no + ' ' + s.supplier_po).join(' ')
          ].join(' ').toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      });

      mount.innerHTML = `
        <div class="wood-tracker-container" role="region" aria-label="${esc(tr('Wood Evidence Readiness Tracker'))}">
          <header class="wt-header">
            <div>
              <p class="eyebrow">${esc(tr('EUDR MANAGEMENT'))}</p>
              <h2>${esc(tr('Wood-Material Evidence-Readiness Tracker'))}</h2>
              <p class="wt-sub">${esc(tr('Track wood/material evidence readiness and traceability by product, species, supplier, origin, geolocation.'))}</p>
            </div>
            <div class="wt-header-actions">
              <button type="button" id="wtExportCsvBtn" class="quiet-button">📥 ${esc(tr('Export Register (CSV)'))}</button>
            </div>
          </header>

          <section class="wt-kpi-grid">
            <div class="wt-kpi-card ${currentFilter.status === '' ? 'is-active' : ''}" data-filter-status="">
              <span class="wt-kpi-label">${esc(tr('Total Wood Materials'))}</span>
              <span class="wt-kpi-value">${total}</span>
              <span class="wt-kpi-sub">${avgScore}% ${esc(tr('avg readiness'))}</span>
            </div>
            <div class="wt-kpi-card ${currentFilter.status === 'READY_FOR_DDS' ? 'is-active' : ''}" data-filter-status="READY_FOR_DDS">
              <span class="wt-kpi-label">${esc(tr('Ready for DDS (100%)'))}</span>
              <span class="wt-kpi-value text-green">${readyDds}</span>
              <span class="wt-kpi-sub">${esc(tr('Compliant for EU filing'))}</span>
            </div>
            <div class="wt-kpi-card ${currentFilter.status === 'READY_FOR_OPERATOR_REVIEW' ? 'is-active' : ''}" data-filter-status="READY_FOR_OPERATOR_REVIEW">
              <span class="wt-kpi-label">${esc(tr('Pending Review'))}</span>
              <span class="wt-kpi-value text-blue">${pendingReview}</span>
              <span class="wt-kpi-sub">${esc(tr('Awaiting reviewer sign-off'))}</span>
            </div>
            <div class="wt-kpi-card ${currentFilter.status === 'ACTION_REQUIRED' ? 'is-active' : ''}" data-filter-status="ACTION_REQUIRED">
              <span class="wt-kpi-label">${esc(tr('Action Required'))}</span>
              <span class="wt-kpi-value text-amber">${actionReq}</span>
              <span class="wt-kpi-sub">${esc(tr('Document rework/clarification'))}</span>
            </div>
            <div class="wt-kpi-card ${currentFilter.status === 'BLOCKED' ? 'is-active' : ''}" data-filter-status="BLOCKED">
              <span class="wt-kpi-label">${esc(tr('Blocked Materials'))}</span>
              <span class="wt-kpi-value text-red">${blocked}</span>
              <span class="wt-kpi-sub">${esc(tr('Missing Geo / Botanical species'))}</span>
            </div>
          </section>

          <div class="wt-filter-bar card">
            <div class="wt-search-input">
              <input type="search" id="wtSearch" placeholder="${esc(tr('Search wood material, species, SKU, PO, Lot, supplier…'))}" value="${esc(currentFilter.q)}">
            </div>
            <div class="wt-filter-selects">
              <select id="wtCategorySelect">
                <option value="">${esc(tr('All Categories'))}</option>
                <option value="SOLID_WOOD" ${currentFilter.category === 'SOLID_WOOD' ? 'selected' : ''}>Solid Wood</option>
                <option value="VENEER" ${currentFilter.category === 'VENEER' ? 'selected' : ''}>Veneer</option>
                <option value="MDF" ${currentFilter.category === 'MDF' ? 'selected' : ''}>MDF</option>
                <option value="PLYWOOD" ${currentFilter.category === 'PLYWOOD' ? 'selected' : ''}>Plywood / LVL</option>
              </select>

              <select id="wtOrderSelect">
                <option value="">${esc(tr('All Sales Orders'))}</option>
                ${[...new Set(rows.map(r => r.case.id).filter(Boolean))].map(cid => {
                  const c = state.cases.find(x => x.id === cid);
                  return `<option value="${esc(cid)}" ${currentFilter.case_id === cid ? 'selected' : ''}>${esc(c ? c.so + ' · ' + c.customer : cid)}</option>`;
                }).join('')}
              </select>

              <select id="wtSupplierSelect">
                <option value="">${esc(tr('All Suppliers'))}</option>
                ${(state.suppliers || []).filter(s => s.active === 'YES').map(s => `
                  <option value="${esc(s.id)}" ${currentFilter.supplier_id === s.id ? 'selected' : ''}>${esc(s.name)}</option>
                `).join('')}
              </select>

              <select id="wtMissingSelect">
                <option value="ALL" ${currentFilter.missing_type === 'ALL' ? 'selected' : ''}>${esc(tr('All Compliance States'))}</option>
                <option value="GEO" ${currentFilter.missing_type === 'GEO' ? 'selected' : ''}>⚠️ ${esc(tr('Missing Geolocation'))}</option>
                <option value="SPECIES" ${currentFilter.missing_type === 'SPECIES' ? 'selected' : ''}>⚠️ ${esc(tr('Missing Scientific Species'))}</option>
                <option value="COMPOSITE" ${currentFilter.missing_type === 'COMPOSITE' ? 'selected' : ''}>⚠️ ${esc(tr('Missing Composite Recipe'))}</option>
                <option value="EVIDENCE" ${currentFilter.missing_type === 'EVIDENCE' ? 'selected' : ''}>⚠️ ${esc(tr('Unapproved Evidence'))}</option>
              </select>

              ${(currentFilter.q || currentFilter.case_id || currentFilter.category || currentFilter.status || currentFilter.missing_type !== 'ALL' || currentFilter.supplier_id) ? `
                <button type="button" id="wtClearFilters" class="quiet-button">✕ ${esc(tr('Clear'))}</button>
              ` : ''}
            </div>
          </div>

          <div class="wt-table-wrap card">
            <div class="wt-table-meta">
              <span>${esc(tr('Showing'))} <strong>${filtered.length}</strong> / ${total} ${esc(tr('wood materials'))}</span>
            </div>
            <table class="wt-table">
              <thead>
                <tr>
                  <th>${esc(tr('Sales Order & Product SKU'))}</th>
                  <th>${esc(tr('Wood Material & Species'))}</th>
                  <th>${esc(tr('Supplier & Lot / PO'))}</th>
                  <th>${esc(tr('Origin & Harvest'))}</th>
                  <th>${esc(tr('Geolocation Evidence'))}</th>
                  <th>${esc(tr('Evidence Tasks'))}</th>
                  <th>${esc(tr('Readiness'))}</th>
                  <th>${esc(tr('Missing Fields'))}</th>
                  <th>${esc(tr('Actions'))}</th>
                </tr>
              </thead>
              <tbody>
                ${filtered.length === 0 ? `
                  <tr>
                    <td colspan="9" class="wt-empty-cell">
                      <p>${esc(tr('No wood materials match the selected filters.'))}</p>
                    </td>
                  </tr>
                ` : filtered.map(r => renderRow(r)).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;

      bindEvents();
    }

    function renderRow(r) {
      const m = r.material;
      const c = r.case;
      const sci = m.scientific_name || r.matchedTaxon?.scientific_name || '';
      const common = m.common_species || r.matchedTaxon?.common_species || '';
      const cat = m.category || r.matchedTaxon?.category || 'SOLID_WOOD';

      // Status pill styling
      const statusPills = {
        READY_FOR_DDS: '<span class="badge badge-success">✓ READY FOR DDS</span>',
        READY_FOR_OPERATOR_REVIEW: '<span class="badge badge-info">→ REVIEW READY</span>',
        ACTION_REQUIRED: '<span class="badge badge-high">! ACTION REQUIRED</span>',
        BLOCKED: '<span class="badge badge-critical">✕ BLOCKED</span>',
        COLLECTING_EVIDENCE: '<span class="badge badge-medium">○ COLLECTING</span>'
      };

      // Products summary
      const prodText = r.products.length > 0
        ? r.products.map(p => `${p.sku || ''} ${p.product_name || ''}`).join(', ')
        : tr('Unassigned to SKU');

      // Sources & lot summary
      const sourceLot = r.sources.length > 0
        ? r.sources.map(s => `${s.supplier_po || tr('PO?')} · Lot ${s.lot_no || '?'}`).join('<br>')
        : (m.supplier_po ? `${m.supplier_po}` : `<span class="text-amber">${esc(tr('PO / Lot pending'))}</span>`);

      // Geolocation summary
      let geoSummary = `<span class="badge badge-critical">✕ ${esc(tr('No Geo Plot'))}</span>`;
      if (r.geos.length > 0) {
        const verifiedCount = r.geos.filter(g => g.verification_status === 'VERIFIED').length;
        const totalArea = r.geos.reduce((sum, g) => sum + Number(g.area_ha || 0), 0);
        const hasPolygon = r.geos.some(g => g.geo_type === 'POLYGON');
        geoSummary = `
          <strong>${r.geos.length} ${esc(tr('plots'))}</strong> (${totalArea.toFixed(1)} ha)<br>
          <small>${hasPolygon ? 'Polygon' : 'Point'} · ${verifiedCount}/${r.geos.length} ${esc(tr('verified'))}</small>
        `;
      }

      // Evidence tasks count
      const reqTasks = r.tasks.filter(t => t.required !== 'NO');
      const approvedTasks = reqTasks.filter(t => t.status === 'APPROVED');
      const taskText = reqTasks.length > 0
        ? `${approvedTasks.length}/${reqTasks.length} ${esc(tr('approved'))}`
        : esc(tr('No tasks'));

      // Missing tags
      const missingTags = r.missing.map(tag => {
        const labels = {
          MISSING_SCIENTIFIC_NAME: tr('No Scientific Name'),
          MISSING_HS_CN_CODE: tr('No HS Code'),
          MISSING_COMPOSITE_RECIPE: tr('No Composite Recipe'),
          MISSING_PO_OR_LOT: tr('No PO / Lot'),
          MISSING_HARVEST_COUNTRY: tr('No Origin Country'),
          MISSING_HARVEST_PERIOD: tr('No Harvest Period'),
          MISSING_GEOLOCATION: tr('Missing Geo'),
          LOW_PRECISION_COORDINATES: tr('Precision < 6 dec'),
          POLYGON_REQUIRED_GT_4HA: tr('Polygon >= 4ha required'),
          UNAPPROVED_EVIDENCE: tr('Unapproved Tasks')
        };
        return `<span class="badge badge-blocking" title="${esc(tag)}">${esc(labels[tag] || tag)}</span>`;
      }).join(' ');

      return `
        <tr class="wt-row" data-material-id="${esc(m.id)}" data-case-id="${esc(c.id)}">
          <td>
            <strong><a href="#case=${esc(c.id)}" class="wt-link-order" data-order-link="${esc(c.id)}">${esc(c.so || 'Order')}</a></strong><br>
            <small class="muted">${esc(c.customer || '—')}</small><br>
            <span class="wt-sku-tag" title="${esc(prodText)}">${esc(prodText.slice(0, 35))}${prodText.length > 35 ? '…' : ''}</span>
          </td>
          <td>
            <strong>${esc(m.material)}</strong><br>
            <span class="wt-category-pill">${esc(cat)}</span>
            <em class="wt-scientific">${esc(sci || tr('Species missing'))}</em><br>
            <small class="mono text-muted">${esc(m.hs_cn_code || r.matchedTaxon?.default_hs || 'HS pending')}</small>
          </td>
          <td>
            <strong>${esc(r.supplierName || tr('Supplier pending'))}</strong><br>
            <small class="mono">${sourceLot}</small>
          </td>
          <td>
            <strong>${esc(r.countries.join(', ') || '—')}</strong><br>
            <small class="muted">${esc(m.production_range || tr('Range pending'))}</small>
          </td>
          <td>${geoSummary}</td>
          <td>
            <span>${taskText}</span>
            <progress value="${reqTasks.length ? Math.round(approvedTasks.length * 100 / reqTasks.length) : 0}" max="100" class="wt-task-progress"></progress>
          </td>
          <td>
            <div class="wt-score-wrap">
              <strong>${r.score}%</strong>
              <div class="wt-progress-bar"><div class="wt-progress-fill" style="width: ${r.score}%;"></div></div>
              ${statusPills[r.status] || ''}
            </div>
          </td>
          <td class="wt-missing-col">
            ${missingTags || `<span class="text-green font-bold">✓ ${esc(tr('Complete'))}</span>`}
          </td>
          <td class="wt-actions-cell">
            <button type="button" class="quiet-button wt-btn-detail" data-open-detail="${esc(m.id)}" title="${esc(tr('View Detail'))}">🔍</button>
            <button type="button" class="quiet-button wt-btn-trace" data-open-trace="${esc(m.id)}" data-case-id="${esc(c.id)}" title="${esc(tr('Supply Chain Trace'))}">🌲</button>
            <button type="button" class="quiet-button wt-btn-order" data-order-link="${esc(c.id)}" data-material-id="${esc(m.id)}" title="${esc(tr('Open Workspace'))}">↗</button>
          </td>
        </tr>
      `;
    }

    function bindEvents() {
      // KPI cards click
      mount.querySelectorAll('.wt-kpi-card').forEach(card => {
        card.onclick = () => {
          currentFilter.status = card.dataset.filterStatus;
          draw();
        };
      });

      // Search input
      const search = mount.querySelector('#wtSearch');
      if (search) {
        search.oninput = () => {
          currentFilter.q = search.value.trim();
          draw();
        };
      }

      // Select filters
      const catSelect = mount.querySelector('#wtCategorySelect');
      if (catSelect) catSelect.onchange = () => { currentFilter.category = catSelect.value; draw(); };

      const orderSelect = mount.querySelector('#wtOrderSelect');
      if (orderSelect) orderSelect.onchange = () => { currentFilter.case_id = orderSelect.value; draw(); };

      const supSelect = mount.querySelector('#wtSupplierSelect');
      if (supSelect) supSelect.onchange = () => { currentFilter.supplier_id = supSelect.value; draw(); };

      const missingSelect = mount.querySelector('#wtMissingSelect');
      if (missingSelect) missingSelect.onchange = () => { currentFilter.missing_type = missingSelect.value; draw(); };

      const clearBtn = mount.querySelector('#wtClearFilters');
      if (clearBtn) clearBtn.onclick = () => {
        currentFilter = { q: '', case_id: '', category: '', status: '', missing_type: 'ALL', supplier_id: '' };
        draw();
      };

      // Export CSV
      const exportBtn = mount.querySelector('#wtExportCsvBtn');
      if (exportBtn) exportBtn.onclick = () => exportRegisterCsv(rows);

      // Row actions
      mount.querySelectorAll('[data-open-detail]').forEach(b => {
        b.onclick = (e) => {
          e.stopPropagation();
          const mid = b.dataset.openDetail;
          const r = rows.find(x => x.material.id === mid);
          if (r) openDetailDrawer(r);
        };
      });

      mount.querySelectorAll('[data-open-trace]').forEach(b => {
        b.onclick = (e) => {
          e.stopPropagation();
          openTrace(b.dataset.caseId, b.dataset.openTrace);
        };
      });

      mount.querySelectorAll('[data-order-link]').forEach(b => {
        b.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          openOrder(b.dataset.orderLink, b.dataset.materialId);
        };
      });
    }

    function openDetailDrawer(r) {
      const m = r.material;
      const c = r.case;
      const sci = m.scientific_name || r.matchedTaxon?.scientific_name || tr('NOT PROVIDED');
      const common = m.common_species || r.matchedTaxon?.common_species || tr('NOT PROVIDED');
      const family = r.matchedTaxon?.family || '—';
      const hs = m.hs_cn_code || r.matchedTaxon?.default_hs || tr('NOT PROVIDED');

      const isEditable = (state?.user?.capabilities || []).includes('MATERIAL_EDIT');

      drawer(`
        <div class="wt-drawer-container">
          <div class="wt-drawer-header">
            <div>
              <p class="eyebrow">${esc(c.so)} · ${esc(c.customer)}</p>
              <h2>${esc(m.material)}</h2>
              <p class="muted">${esc(tr('Wood Material Profile & EUDR Evidence Matrix'))}</p>
            </div>
            <div class="wt-drawer-score">
              <span class="wt-score-badge">${r.score}%</span>
              <small>${esc(r.status)}</small>
            </div>
          </div>

          <div class="wt-drawer-body">
            <section class="wt-section card">
              <h3>${esc(tr('1. Botanical Taxonomy & Classification'))}</h3>
              <div class="wt-grid-2">
                <div><strong>${esc(tr('Trade Name:'))}</strong> ${esc(m.material)}</div>
                <div><strong>${esc(tr('EUDR Category:'))}</strong> ${esc(m.category || 'SOLID_WOOD')}</div>
                <div><strong>${esc(tr('Scientific Name:'))}</strong> <em class="wt-scientific">${esc(sci)}</em></div>
                <div><strong>${esc(tr('Common Species:'))}</strong> ${esc(common)}</div>
                <div><strong>${esc(tr('Botanical Family:'))}</strong> ${esc(family)}</div>
                <div><strong>${esc(tr('HS / CN Code:'))}</strong> <span class="mono">${esc(hs)}</span></div>
              </div>
              ${isEditable ? `
                <div class="wt-drawer-actions">
                  <button type="button" id="wtEditMetaBtn">${esc(tr('Edit Material Information'))}</button>
                </div>
              ` : ''}
            </section>

            <section class="wt-section card">
              <h3>${esc(tr('2. Traceability, PO & Lot Source'))}</h3>
              <div><strong>${esc(tr('Direct Supplier:'))}</strong> ${esc(r.supplierName || '—')}</div>
              <div><strong>${esc(tr('Harvest Country:'))}</strong> ${esc(r.countries.join(', ') || '—')}</div>
              <div><strong>${esc(tr('Harvest Period:'))}</strong> ${esc(m.production_range || '—')}</div>
              <div class="wt-sources-list">
                <h4>${esc(tr('Allocated PO / Lot Sources:'))} (${r.sources.length})</h4>
                ${r.sources.length === 0 ? `<p class="muted">${esc(tr('No batch source registered.'))}</p>` : `
                  <ul>
                    ${r.sources.map(s => `
                      <li>PO: <strong>${esc(s.supplier_po || '—')}</strong> (line ${esc(s.po_line || '—')}) · Lot: <strong>${esc(s.lot_no || '—')}</strong> · ${esc(s.quantity || '—')} ${esc(s.quantity_uom || '')} · ${esc(s.production_country || '')}</li>
                    `).join('')}
                  </ul>
                `}
              </div>
              <div class="wt-drawer-actions">
                <button type="button" id="wtOpenTraceBtn">${esc(tr('Open Supply Chain Graph / Lot Trace'))}</button>
              </div>
            </section>

            <section class="wt-section card">
              <h3>${esc(tr('3. Geolocation Evidence (WGS84)'))}</h3>
              <p>${r.geos.length} ${esc(tr('harvest plot(s) registered.'))}</p>
              ${r.geos.length === 0 ? `<p class="warn">${esc(tr('Missing Geolocation coordinates for this wood material.'))}</p>` : `
                <ul class="wt-geo-list">
                  ${r.geos.map(g => `
                    <li>
                      Plot ID: <strong>${esc(g.plot_id || g.id)}</strong> · Area: <strong>${esc(g.area_ha || '?')} ha</strong> (${esc(g.geo_type || 'POINT')})
                      · Precision: <strong>${esc(g.coordinate_precision_digits || '0')} decimals</strong>
                      · Status: <span class="badge ${g.verification_status === 'VERIFIED' ? 'badge-success' : 'badge-high'}">${esc(g.verification_status || 'UNVERIFIED')}</span>
                    </li>
                  `).join('')}
                </ul>
              `}
              <div class="wt-drawer-actions">
                <button type="button" id="wtOpenGeoBtn">${esc(tr('GEO Review & Map'))}</button>
              </div>
            </section>

            <section class="wt-section card">
              <h3>${esc(tr('4. Evidence Tasks & Verification'))}</h3>
              <div class="wt-tasks-list">
                ${r.tasks.length === 0 ? `<p class="muted">${esc(tr('No evidence tasks linked.'))}</p>` : `
                  <ul>
                    ${r.tasks.map(t => `
                      <li>
                        <strong>${esc(t.evidence)}</strong> (${esc(t.evidence_block || '01_Direct_Supplier')})
                        · Status: <span class="badge ${t.status === 'APPROVED' ? 'badge-success' : t.status === 'REJECTED' ? 'badge-critical' : 'badge-medium'}">${esc(t.status)}</span>
                        · Owner: ${esc(t.owner || '—')}
                      </li>
                    `).join('')}
                  </ul>
                `}
              </div>
              <div class="wt-drawer-actions">
                <button type="button" id="wtOpenOrderBtn">${esc(tr('Go to Order Workspace'))}</button>
              </div>
            </section>
          </div>
        </div>
      `);

      const editBtn = document.getElementById('wtEditMetaBtn');
      if (editBtn) editBtn.onclick = () => openMaterialInfo(m.id);

      const traceBtn = document.getElementById('wtOpenTraceBtn');
      if (traceBtn) traceBtn.onclick = () => openTrace(c.id, m.id);

      const geoBtn = document.getElementById('wtOpenGeoBtn');
      if (geoBtn) geoBtn.onclick = () => openGeoReview(m.id);

      const ordBtn = document.getElementById('wtOpenOrderBtn');
      if (ordBtn) ordBtn.onclick = () => {
        openOrder(c.id, m.id);
        const drawerEl = document.getElementById('drawer');
        if (drawerEl?.close) drawerEl.close();
      };
    }

    function exportRegisterCsv(rowsToExport) {
      const headers = [
        'Sales Order',
        'Customer',
        'Product SKU / Name',
        'Wood Material Trade Name',
        'EUDR Category',
        'Common Species',
        'Botanical Scientific Name',
        'HS / CN Code',
        'Direct Supplier',
        'Supplier PO',
        'Lot / Batch No',
        'Harvest Country',
        'Harvest Range',
        'Geo Plots Count',
        'Geo Verification Status',
        'Readiness Score %',
        'Readiness Status',
        'Missing Fields List'
      ];

      const csvRows = [headers.map(h => `"${h}"`).join(',')];

      rowsToExport.forEach(r => {
        const m = r.material;
        const c = r.case;
        const sci = m.scientific_name || r.matchedTaxon?.scientific_name || '';
        const common = m.common_species || r.matchedTaxon?.common_species || '';
        const hs = m.hs_cn_code || r.matchedTaxon?.default_hs || '';
        const pos = r.sources.map(s => s.supplier_po).filter(Boolean).join('; ') || m.supplier_po || '';
        const lots = r.sources.map(s => s.lot_no).filter(Boolean).join('; ') || '';
        const prod = r.products.map(p => `${p.sku || ''} ${p.product_name || ''}`.trim()).join('; ');

        const row = [
          c.so || '',
          c.customer || '',
          prod,
          m.material || '',
          m.category || '',
          common,
          sci,
          hs,
          r.supplierName || '',
          pos,
          lots,
          r.countries.join(', '),
          m.production_range || '',
          r.geos.length,
          r.geos.every(g => g.verification_status === 'VERIFIED') ? 'VERIFIED' : 'PENDING_OR_UNVERIFIED',
          r.score + '%',
          r.status,
          r.missing.join('; ')
        ];
        csvRows.push(row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','));
      });

      const blob = new Blob([csvRows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `KODA_EUDR_Wood_Register_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    draw();
  }

  return { render, evaluateMaterial, SPECIES_TAXONOMY, matchTaxonomy };
})();
