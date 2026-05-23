// ============================================================
// Business Card Scanner — Google Apps Script
// Watches a Drive folder, OCRs card photos, logs to Sheets.
// ============================================================

var FOLDER_NAME  = '📇 Business Cards';
var SHEET_NAME   = 'Business Cards';
var PROC_KEY     = 'processedFileIds'; // PropertiesService key

var HEADERS = [
  'Name', 'Title', 'Company', 'Email', 'Phone',
  'Website', 'Address', 'LinkedIn', 'Twitter', 'Notes',
  'Image Link', 'Date Added'
];

// ── One-time setup ──────────────────────────────────────────

/**
 * Run this once from the Apps Script editor.
 * Creates the Sheet, the Drive folder, and the repeating trigger.
 */
function setup() {
  // 1. Sheet
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Open this script from a Google Sheet (Extensions → Apps Script).');
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length)
      .setFontWeight('bold')
      .setBackground('#4285f4')
      .setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }

  // 2. Drive folder
  var folders = DriveApp.getFoldersByName(FOLDER_NAME);
  var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(FOLDER_NAME);

  // 3. Persist IDs so processNewCards can find them without user input
  var props = PropertiesService.getScriptProperties();
  props.setProperty('sheetId', ss.getId());
  props.setProperty('folderId', folder.getId());
  props.setProperty(PROC_KEY, JSON.stringify({}));

  // 4. Trigger (skip if one already exists)
  var existing = ScriptApp.getProjectTriggers();
  var hasIt = existing.some(function(t) { return t.getHandlerFunction() === 'processNewCards'; });
  if (!hasIt) {
    ScriptApp.newTrigger('processNewCards')
      .timeBased()
      .everyMinutes(5)
      .create();
  }

  Logger.log('✅ Setup complete. Drop card photos into "' + FOLDER_NAME + '" in Google Drive.');
  Logger.log('📋 Sheet: ' + ss.getUrl());
  Logger.log('📁 Folder: ' + folder.getUrl());
}

// ── Main trigger ────────────────────────────────────────────

function processNewCards() {
  var props  = PropertiesService.getScriptProperties();
  var folderId = props.getProperty('folderId');
  var sheetId  = props.getProperty('sheetId');
  if (!folderId || !sheetId) {
    Logger.log('Run setup() first.');
    return;
  }

  var processed = JSON.parse(props.getProperty(PROC_KEY) || '{}');
  var folder = DriveApp.getFolderById(folderId);
  var sheet  = SpreadsheetApp.openById(sheetId).getSheetByName(SHEET_NAME);

  var files = folder.getFiles();
  var count = 0;
  while (files.hasNext()) {
    var file = files.next();
    var id   = file.getId();
    var mime = file.getMimeType();

    // Only images, skip already-processed
    if (processed[id]) continue;
    if (!mime.match(/^image\//)) continue;

    try {
      Logger.log('Processing: ' + file.getName());
      var contact = extractContact(file);
      addToSheet(sheet, contact, file.getUrl());
      processed[id] = new Date().toISOString();
      count++;
    } catch (e) {
      Logger.log('Error processing ' + file.getName() + ': ' + e.message);
    }
  }

  props.setProperty(PROC_KEY, JSON.stringify(processed));
  if (count > 0) Logger.log('Added ' + count + ' contact(s) to Sheet.');
}

// ── OCR via Google Docs ─────────────────────────────────────

function extractContact(file) {
  // Convert image → Google Doc (Google's cloud OCR runs automatically)
  var blob     = file.getBlob();
  var resource = { title: 'ocr_tmp_' + file.getId(), mimeType: MimeType.GOOGLE_DOCS };
  var ocrFile  = Drive.Files.insert(resource, blob, { ocr: true, ocrLanguage: 'en' });

  var text = '';
  try {
    text = DocumentApp.openById(ocrFile.id).getBody().getText();
  } finally {
    Drive.Files.trash(ocrFile.id);
  }

  return parseContact(text);
}

// ── Contact field parsing ───────────────────────────────────

function parseContact(text) {
  var lines = text.split('\n').map(function(l) { return l.trim(); }).filter(Boolean);

  var email = (text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/) || [''])[0];

  var phone = (text.match(
    /(?:\+?[\d]{1,3}[\s.\-]?)?\(?[\d]{3}\)?[\s.\-]?[\d]{3}[\s.\-]?[\d]{4}(?:\s?(?:x|ext)\.?\s?[\d]{1,5})?/
  ) || [''])[0].trim();

  var linkedInMatch = text.match(/linkedin\.com\/in\/([\w\-]+)/i);
  var linkedIn = linkedInMatch ? 'https://linkedin.com/in/' + linkedInMatch[1] : '';

  var twitterMatch = text.match(/(?:twitter\.com|x\.com)\/([\w]+)/i);
  var twitterHandle = (text.match(/(?<!\w)@([\w]+)/) || [null, ''])[1];
  var twitter = twitterMatch ? '@' + twitterMatch[1] : (twitterHandle ? '@' + twitterHandle : '');

  var urlMatch   = (text.match(/https?:\/\/[^\s,]+/i) || [''])[0];
  var wwwMatch   = (text.match(/www\.[a-z0-9\-]+\.[a-z]{2,}(?:\/[^\s,]*)?/i) || [''])[0];
  var emailDomain = email ? email.split('@')[1] : '';
  var bareDomain = (text.match(/(?<!\S)([a-z0-9\-]+\.(?:com|io|co|net|org|app|dev|ai))(?!\S)/i) || [''])[0];
  var bareWebsite = (bareDomain && bareDomain !== emailDomain) ? 'https://' + bareDomain : '';
  var website = urlMatch || (wwwMatch ? 'https://' + wwwMatch : '') || bareWebsite;

  // Address: line with a street number + street keyword + optionally next line
  var addrLine = '';
  var addrIdx  = -1;
  for (var i = 0; i < lines.length; i++) {
    if (/\d+\s+\w/.test(lines[i]) &&
        /(?:st|ave|blvd|rd|dr|ln|way|court|pl|suite|ste|floor)/i.test(lines[i])) {
      addrLine = lines[i];
      addrIdx  = i;
      break;
    }
  }
  var address = addrLine
    ? addrLine + (addrIdx >= 0 && lines[addrIdx + 1] ? ', ' + lines[addrIdx + 1] : '')
    : '';

  // Filter out data lines to find name/title/company
  var dataPatterns = [email, phone, linkedIn, twitter, website].filter(Boolean);
  var textLines = lines.filter(function(l) {
    if (l.length <= 1 || l.length >= 80) return false;
    if (/^\d/.test(l)) return false;
    return !dataPatterns.some(function(p) {
      return l.toLowerCase().indexOf(p.replace('https://', '').replace('@', '').toLowerCase()) !== -1;
    });
  });

  // Prefer lines that look like a proper name (2–5 capitalised words)
  function looksLikeName(line) {
    var words = line.trim().split(/\s+/);
    return words.length >= 2 && words.length <= 5 &&
      words.every(function(w) { return /^[A-Z][a-zA-Z'\-]{0,}$/.test(w); });
  }

  var TITLE_RE   = /\b(director|manager|engineer|developer|designer|analyst|consultant|president|vice|vp|ceo|cto|cfo|coo|founder|partner|associate|specialist|coordinator|executive|head|lead|senior|principal|architect|scientist|researcher|advisor|owner|sales|marketing|product|operations|officer)\b/i;
  var COMPANY_RE = /\b(inc|llc|ltd|corp|co|company|group|solutions|services|consulting|technologies|tech|systems|agency|associates|partners|ventures|holdings|international|global)\b\.?/i;

  var nameLine = '';
  for (var j = 0; j < textLines.length; j++) {
    if (looksLikeName(textLines[j])) { nameLine = textLines[j]; break; }
  }
  if (!nameLine && textLines.length > 0) nameLine = textLines[0];

  var rest = textLines.filter(function(l) { return l !== nameLine; });

  var titleLine = '';
  for (var k = 0; k < rest.length; k++) {
    if (TITLE_RE.test(rest[k])) { titleLine = rest[k]; break; }
  }
  if (!titleLine && rest.length > 0) titleLine = rest[0];

  var rest2 = rest.filter(function(l) { return l !== titleLine; });
  var companyLine = '';
  for (var m = 0; m < rest2.length; m++) {
    if (COMPANY_RE.test(rest2[m])) { companyLine = rest2[m]; break; }
  }
  if (!companyLine && rest2.length > 0) companyLine = rest2[0];

  return {
    name:    nameLine,
    title:   titleLine,
    company: companyLine,
    email:   email,
    phone:   phone,
    website: website,
    address: address,
    linkedIn: linkedIn,
    twitter:  twitter,
    notes:   ''
  };
}

// ── Sheet writing ───────────────────────────────────────────

function addToSheet(sheet, contact, imageUrl) {
  sheet.appendRow([
    contact.name,
    contact.title,
    contact.company,
    contact.email,
    contact.phone,
    contact.website,
    contact.address,
    contact.linkedIn,
    contact.twitter,
    contact.notes,
    imageUrl,
    new Date().toLocaleString()
  ]);
}

// ── Manual helpers ──────────────────────────────────────────

/**
 * Run this from the editor to reprocess all images (clears the processed-IDs log).
 */
function resetProcessed() {
  PropertiesService.getScriptProperties().setProperty(PROC_KEY, JSON.stringify({}));
  Logger.log('Processed-IDs log cleared. All images will be re-read on next run.');
}

/**
 * Shows URLs for the Sheet and Drive folder in the Execution Log.
 */
function showLinks() {
  var props    = PropertiesService.getScriptProperties();
  var sheetId  = props.getProperty('sheetId');
  var folderId = props.getProperty('folderId');
  if (sheetId)  Logger.log('Sheet:  https://docs.google.com/spreadsheets/d/' + sheetId);
  if (folderId) Logger.log('Folder: https://drive.google.com/drive/folders/' + folderId);
}
