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

Go to [sheets.google.com](https://sheets.google.com) and create a new blank spreadsheet.

### Step 2 — Open the Apps Script editor

In the spreadsheet: **Extensions → Apps Script**

### Step 3 — Paste the script

1. Delete any placeholder code in the editor
2. Copy the entire contents of [`Code.gs`](./Code.gs)
3. Paste it into the editor
4. Click **Save**

### Step 4 — Enable the Drive API advanced service

1. In the left sidebar click **Services** (+)
2. Scroll to **Drive API**, select version **v2**, click **Add**

### Step 5 — Run setup()

1. Select **`setup`** in the function dropdown
2. Click **Run** and authorize when prompted
3. Check the Execution log — you should see the Sheet and folder URLs

## Using it

1. Take a photo of a business card
2. Upload it into the **"📇 Business Cards"** folder in Google Drive
3. Wait up to 5 minutes (or run `processNewCards` manually)
4. Open your Google Sheet — a new row appears with parsed contact details

## Manual controls

| Function | What it does |
|---|---|
| `setup()` | Initial setup — safe to re-run |
| `processNewCards()` | Process new images right now |
| `resetProcessed()` | Clear processed-IDs log to re-scan all images |
| `showLinks()` | Print Sheet and folder URLs to Execution log |

## Troubleshooting

**"Drive is not defined"** — Enable the Drive API advanced service (Step 4).

**No rows appearing** — Run `processNewCards()` manually and check the Execution log.
