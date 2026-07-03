/***********************************************************************
 * CHARLIE BLAZE — LIVE DATA ENDPOINT  (add to your existing script)
 * ---------------------------------------------------------------------
 * Serves the Purchases tab as JSON so the app can read it live.
 * Same pattern as your Maintenance Portal backend.
 *
 * SETUP:
 *  1. Extensions ▸ Apps Script (same project as the receipt logger)
 *  2. Paste this BELOW your existing v2 code (don't delete anything)
 *  3. Deploy ▸ New deployment ▸ type: Web app
 *       - Execute as: Me
 *       - Who has access: Anyone with the link
 *  4. Copy the /exec URL → paste into APPS_SCRIPT_URL in the app code
 *
 * NOTE: re-deploy ("New deployment") after any future script edits —
 * Apps Script serves the OLD version until you do. (Same gotcha as
 * the Maintenance Portal.)
 ***********************************************************************/

function doGet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName('Purchases');
  if (!sheet) return json_({ error: 'Purchases tab not found' });

  const vals = sheet.getDataRange().getValues();
  if (vals.length < 2) return json_({ orders: [] });

  const H = vals[0].map(h => String(h).trim());
  const col = name => H.indexOf(name);
  const c = {
    order: col('order_no'), date: col('date'), disp: col('dispensary'),
    brand: col('brand'), strain: col('strain'), type: col('type'),
    weight: col('weight'), price: col('price'), total: col('order_total'),
    status: col('parse_status')
  };

  const byOrder = {};
  for (let i = 1; i < vals.length; i++) {
    const r = vals[i];
    const no = String(r[c.order] || '').trim();
    if (!no) continue;

    if (!byOrder[no]) {
      let d = r[c.date];
      if (d instanceof Date) {
        d = Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      }
      byOrder[no] = {
        order_no: no,
        date: String(d || ''),
        dispensary: String(r[c.disp] || ''),
        total: parseFloat(r[c.total]) || 0,
        products: []
      };
    }
    // skip empty REVIEW placeholder rows (no strain, no brand)
    const strain = String(r[c.strain] || '').trim();
    const brand  = String(r[c.brand]  || '').trim();
    if (!strain && !brand) continue;

    byOrder[no].products.push({
      brand: brand,
      strain: strain,
      type: String(r[c.type] || ''),
      weight: String(r[c.weight] || ''),
      price: parseFloat(r[c.price]) || 0
    });
  }

  const orders = Object.values(byOrder)
    .sort((a, b) => (a.date < b.date ? 1 : -1)); // newest first

  return json_({
    generated: new Date().toISOString(),
    order_count: orders.length,
    orders: orders
  });
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
