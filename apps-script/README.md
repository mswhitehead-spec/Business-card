# Business Card Scanner — Google Apps Script

Drop a photo into Google Drive → contacts appear in Google Sheets automatically.  
No API keys. No installs. Runs on Google's servers.

## How it works

1. You drop a card photo into a **"📇 Business Cards"** folder in Google Drive
2. A script runs every 5 minutes, picks up new images
3. Google's built-in cloud OCR reads the text (free, no key needed)
4. The script parses name, email, phone, company, etc.
5. A new row is added to your Google Sheet

## One-time setup (~5 minutes)

### Step 1 — Create a Google Sheet

Go to [sheets.google.com](https://sheets.google.com) and create a new blank spreadsheet. Name it whatever you like (e.g. *Business Cards*).

### Step 2 — Open the Apps Script editor

In the spreadsheet: **Extensions → Apps Script**

### Step 3 — Paste the script

1. Delete any placeholder code in the editor
2. Copy the entire contents of [`Code.gs`](./Code.gs)
3. Paste it into the editor
4. Click **Save** (floppy disk icon or Ctrl/Cmd+S)

### Step 4 — Enable the Drive API advanced service

The script uses Google's Drive v2 API for OCR, which must be enabled manually:

1. In the left sidebar click **Services** (the `+` button next to "Services")
2. Scroll to **Drive API** and click it
3. Make sure version is **v2**
4. Click **Add**

### Step 5 — Run setup()

1. In the function dropdown (top toolbar) select **`setup`**
2. Click **Run**
3. A permissions dialog will appear — click **Review permissions**, choose your Google account, then **Allow**
4. Check the **Execution log** at the bottom — you should see:
   ```
   ✅ Setup complete. Drop card photos into "📇 Business Cards" in Google Drive.
   📋 Sheet: https://docs.google.com/spreadsheets/d/...
   📁 Folder: https://drive.google.com/drive/folders/...
   ```

That's it. The script now runs automatically every 5 minutes.

## Using it

1. **Take a photo** of a business card (your phone camera is fine)
2. **Open Google Drive** on your phone or computer
3. **Upload or move** the photo into the **"📇 Business Cards"** folder
4. Wait up to 5 minutes (or run `processNewCards` manually from the editor)
5. **Open your Google Sheet** — a new row will appear with:

| Name | Title | Company | Email | Phone | Website | Address | LinkedIn | Twitter | Notes | Image Link | Date Added |
|------|-------|---------|-------|-------|---------|---------|----------|---------|-------|------------|------------|

> **Tip:** On iPhone, enable iCloud Drive or Google Drive auto-backup so photos sync automatically. On Android, Google Photos backup puts images in Drive already.

## Manual controls

You can run these functions any time from the Apps Script editor:

| Function | What it does |
|---|---|
| `setup()` | Initial setup — safe to re-run, won't duplicate trigger |
| `processNewCards()` | Process new images right now (don't wait 5 min) |
| `resetProcessed()` | Clear the processed-IDs log so all images get re-scanned |
| `showLinks()` | Print Sheet and folder URLs to the Execution log |

## Accuracy notes

Google's cloud OCR is very accurate for clean, well-lit photos. For best results:
- Photograph cards on a plain dark background
- Ensure the full card is in frame and in focus
- Good lighting (avoid flash glare)

The script uses the same regex-based parsing as the web app. If a field is wrong, you can always edit it directly in the Sheet.

## Troubleshooting

**"Drive is not defined"** — You skipped Step 4. Enable the Drive API advanced service.

**No rows appearing** — Run `processNewCards()` manually and check the Execution log for errors.

**Same card added twice** — Shouldn't happen (processed IDs are tracked), but run `showLinks()` to confirm you're looking at the right Sheet.

**Need to start fresh** — Run `resetProcessed()` then `processNewCards()` to re-scan everything in the folder.
