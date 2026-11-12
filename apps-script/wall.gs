// Signature wall database: one Google Sheet, one row per visitor card.
// Used by index.html (clothesline) and wall.html through assets/wall-config.js.
// Setup: script.google.com → New project → paste this → Deploy → Web app
//        (Execute as: Me, Who has access: Anyone) → copy the /exec URL into assets/wall-config.js.

const SHEET_ID = '10IWrmjdYKr6H3Ld_bbbsFzFtGyvOMtXDiTuV3I1zjGI';   // the "signature wall" sheet

const HEAD = ['id', 'name', 'note', 'color', 'sig', 'likes', 'time'];

function sheet_() {
  const sh = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];
  if (sh.getLastRow() === 0) sh.appendRow(HEAD);
  return sh;
}

const json_ = o => ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);

function doGet() {
  const rows = sheet_().getDataRange().getValues().slice(1);
  const items = rows.map(r => Object.fromEntries(HEAD.map((k, i) => [k, k === 'likes' ? Number(r[i]) || 0 : String(r[i])])));
  return json_({ items });
}

function doPost(e) {
  let b;
  try { b = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false }); }
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    const sh = sheet_();
    if (b.action === 'add') {
      // trust boundary: everything below comes from anonymous visitors
      const id = /^local-\d{10,16}$/.test(b.id) ? b.id : 'local-' + Date.now();
      const sig = String(b.sig || '');
      if (sig && (!sig.startsWith('data:image/png;base64,') || sig.length > 40000)) return json_({ ok: false });
      const color = /^#[0-9A-Fa-f]{6}$/.test(b.color) ? b.color : '#B9A7F2';
      // leading ' stops Sheets from treating visitor text as a formula
      const txt = (s, n) => "'" + String(s || '').slice(0, n);
      sh.appendRow([id, txt(b.name, 20), txt(b.note, 60), color, sig, 0, "'" + new Date().toISOString().slice(0, 10)]);
      return json_({ ok: true, id });
    }
    if (b.action === 'like') {
      const ids = sh.getRange(2, 1, Math.max(sh.getLastRow() - 1, 1), 1).getValues();
      const i = ids.findIndex(r => r[0] === b.id);
      if (i >= 0) { const c = sh.getRange(i + 2, 6); c.setValue((Number(c.getValue()) || 0) + 1); }
      return json_({ ok: true });
    }
    return json_({ ok: false });
  } finally { lock.releaseLock(); }
}
