/**
 * Charismak Supplier Price Response Workflow
 *
 * Install this in the Apps Script project attached to:
 * Charismak Supplier Price Catalogue & Response Backend
 *
 * Run installSupplierWorkflowTrigger() once.
 * After that every Google Form response sent to this spreadsheet will:
 * 1. be sent to the Charismak supplier review workflow,
 * 2. be matched to the saved supplier profile by business name / phone,
 * 3. create a private review record, and
 * 4. email Charismak a review link.
 */

const CHARISMAK_SUPPLIER_WORKFLOW = {
  endpoint: 'https://mxjtxcajzopjahzqwwvf.supabase.co/functions/v1/supplier-workflow',
  secret: 'gjZtOVxiG4sdJzFfZma69tNxHGWR5o0ZeK3-yGVoM3E',
  reviewRecipients: 'md@charismakproject.com,charismakprojectnigltd@gmail.com',
};

function installSupplierWorkflowTrigger() {
  const ss = SpreadsheetApp.getActive();

  ScriptApp.getProjectTriggers()
    .filter(trigger => trigger.getHandlerFunction() === 'onSupplierFormSubmit')
    .forEach(trigger => ScriptApp.deleteTrigger(trigger));

  ScriptApp.newTrigger('onSupplierFormSubmit')
    .forSpreadsheet(ss)
    .onFormSubmit()
    .create();

  SpreadsheetApp.getUi().alert(
    'Supplier workflow connected',
    'New supplier price submissions will now create a Charismak review and email the review link.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

function onSupplierFormSubmit(e) {
  if (!e || !e.range) {
    throw new Error('This function must run from the spreadsheet form-submit trigger.');
  }

  const sheet = e.range.getSheet();
  const row = e.range.getRow();
  const lastColumn = sheet.getLastColumn();
  const headers = sheet.getRange(1, 1, 1, lastColumn).getDisplayValues()[0];
  const values = sheet.getRange(row, 1, 1, lastColumn).getDisplayValues()[0];

  const columns = headers.map((header, index) => ({
    header: String(header || '').trim(),
    value: String(values[index] || '').trim(),
    index: index + 1,
  }));

  const findValue = (...needles) => {
    const hit = columns.find(column => {
      const header = column.header.toLowerCase();
      return needles.some(needle => header.indexOf(String(needle).toLowerCase()) !== -1);
    });
    return hit ? hit.value : '';
  };

  const supplierName =
    findValue('business / supplier name', 'business name', 'supplier name') ||
    'Supplier';
  const phone = findValue('phone / whatsapp', 'phone', 'whatsapp');
  const location = findValue('main supply location', 'supply location', 'location');
  const email = findValue('email');

  const payload = {
    action: 'form_submission',
    responseSheet: sheet.getName(),
    sourceRow: row,
    sourceSubmissionId: `${sheet.getSheetId()}:${row}:${values[0] || new Date().toISOString()}`,
    timestamp: new Date().toISOString(),
    rawTimestamp: values[0] || '',
    supplierName,
    phone,
    location,
    email,
    formTitle: inferSupplierFormTitle_(headers),
    columns,
  };

  const response = UrlFetchApp.fetch(CHARISMAK_SUPPLIER_WORKFLOW.endpoint, {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'x-supplier-workflow-secret': CHARISMAK_SUPPLIER_WORKFLOW.secret,
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });

  const status = response.getResponseCode();
  const text = response.getContentText();
  let result = {};
  try {
    result = JSON.parse(text || '{}');
  } catch (error) {
    throw new Error(`Supplier workflow returned invalid JSON (${status}): ${text}`);
  }

  if (status < 200 || status >= 300) {
    throw new Error(`Supplier workflow failed (${status}): ${result.error || text}`);
  }

  if (result.duplicate) {
    console.log(`Duplicate supplier response ignored: ${payload.sourceSubmissionId}`);
    return;
  }

  const reviewUrl = result.reviewUrl;
  if (!reviewUrl) {
    throw new Error('Supplier workflow did not return a review URL.');
  }

  sendSupplierReviewEmail_({
    supplierName,
    phone,
    location,
    formTitle: payload.formTitle,
    lineCount: Number(result.lineCount || 0),
    reviewUrl,
    responseSheet: sheet.getName(),
    row,
  });
}

function inferSupplierFormTitle_(headers) {
  const joined = headers.join(' | ').toLowerCase();
  const rules = [
    ['cement, block', 'Cement, Blocks & Concrete'],
    ['bulk-material', 'Sand, Granite & Bulk Materials'],
    ['steel prices', 'Reinforcement & Structural Steel'],
    ['plywood', 'Formwork, Timber & Boards'],
    ['roof', 'Roofing, Cladding & Rainwater'],
    ['waterproof', 'Waterproofing, Insulation & Sealants'],
    ['tile', 'Tiles, Flooring & Decorative Finishes'],
    ['ceiling', 'Ceiling, POP & Drywall'],
    ['paint', 'Paint & Coating'],
    ['door', 'Doors, Windows & Ironmongery'],
    ['glass', 'Glass, Aluminium & Handrail'],
    ['plumbing', 'Plumbing Pipe, Fitting, Pump & Tank'],
    ['sanitary', 'Sanitary Ware & Bathroom Accessory'],
    ['fire', 'Fire Protection & Fire Alarm'],
    ['hvac', 'HVAC & Mechanical'],
    ['cable', 'Electrical Cable & Containment'],
    ['switchgear', 'Electrical Switchgear & Panel'],
    ['lighting', 'Electrical Accessories & Lighting'],
    ['solar', 'Generator, Solar, Inverter & Earthing'],
    ['cctv', 'ICT, CCTV, Access Control & Security'],
    ['drainage', 'External Works, Drainage & Road Material'],
    ['landscap', 'Landscaping Material'],
    ['ppe', 'PPE & Site Consumable'],
    ['fastener', 'Fastener, Hardware & Welding Consumable'],
    ['hand tool', 'Hand Tool'],
    ['power tool', 'Power Tool'],
    ['light plant', 'Light Plant & Site Equipment'],
    ['scaffold', 'Scaffolding & Access Equipment'],
    ['earthmoving', 'Heavy Plant & Earthmoving'],
    ['crane', 'Crane, Lifting & Concrete Plant'],
    ['piling', 'Roadwork, Piling & Specialist Civil Plant'],
    ['survey', 'Surveying & Testing Equipment'],
    ['temporary works', 'Temporary Works & Site Facility'],
    ['labour', 'Labour & Specialist Trade Rate Update'],
  ];

  const match = rules.find(([needle]) => joined.indexOf(needle) !== -1);
  return match ? match[1] : 'Supplier Price Update';
}

function sendSupplierReviewEmail_(data) {
  const subject = `Supplier price review — ${data.supplierName} — ${data.formTitle}`;
  const lineText = data.lineCount
    ? `${data.lineCount} price line${data.lineCount === 1 ? '' : 's'} detected automatically.`
    : 'No price lines were parsed automatically; review the raw response before publishing.';

  const htmlBody = `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#071E33">
      <div style="background:#071E33;color:#fff;padding:22px 24px;border-radius:14px 14px 0 0">
        <div style="font-size:11px;letter-spacing:1.6px;color:#F2B544;font-weight:700;text-transform:uppercase">Charismak Supplier Prices</div>
        <h2 style="margin:8px 0 0;font-size:22px">New supplier price update</h2>
      </div>
      <div style="border:1px solid #DCE4EC;border-top:0;padding:24px;border-radius:0 0 14px 14px">
        <p style="margin:0 0 14px"><strong>${escapeHtml_(data.supplierName)}</strong> submitted prices for <strong>${escapeHtml_(data.formTitle)}</strong>.</p>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin:0 0 18px">
          <tr><td style="padding:7px 0;color:#617286">Phone</td><td style="padding:7px 0;font-weight:700">${escapeHtml_(data.phone || 'Not stated')}</td></tr>
          <tr><td style="padding:7px 0;color:#617286">Location</td><td style="padding:7px 0;font-weight:700">${escapeHtml_(data.location || 'Not stated')}</td></tr>
          <tr><td style="padding:7px 0;color:#617286">Source</td><td style="padding:7px 0;font-weight:700">${escapeHtml_(data.responseSheet)} · row ${data.row}</td></tr>
        </table>
        <p style="font-size:13px;color:#617286;line-height:1.6">${escapeHtml_(lineText)}</p>
        <a href="${data.reviewUrl}" style="display:inline-block;margin-top:10px;background:#A82B05;color:#fff;text-decoration:none;font-weight:700;padding:13px 20px;border-radius:10px">Review supplier prices</a>
        <p style="margin:18px 0 0;font-size:11px;color:#7A8B9E;line-height:1.6">Nothing is shown publicly until you approve it. Approval publishes the supplier price under the mapped material on the Charismak Prices page.</p>
      </div>
    </div>`;

  MailApp.sendEmail({
    to: CHARISMAK_SUPPLIER_WORKFLOW.reviewRecipients,
    subject,
    htmlBody,
    body: `New supplier price update from ${data.supplierName}. Review: ${data.reviewUrl}`,
    name: 'Charismak Supplier Prices',
  });
}

function escapeHtml_(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
