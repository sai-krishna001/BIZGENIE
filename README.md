================================================================================
  BizFlow AI — Business Management Hub
================================================================================

Turn your business data into action.
Generate social content, build product SEO, and understand income vs expenditure
— in one simple dashboard.

BizFlow AI is a lightweight, browser-based business tool for small business
owners, online sellers, and founders. No complicated setup. No paid software.
Your data stays on your device.


--------------------------------------------------------------------------------
FEATURES
--------------------------------------------------------------------------------

1. AUTHENTICATION (LOCAL)
   - Create Account: Name, email (must include @), 10-digit mobile, password
   - No OTP — signup and login work without SMS or email codes
   - Strict verification — login only when email + phone + password match
   - Session remembered on the same device; logout anytime

2. BUSINESS DASHBOARD
   - Live KPIs: Total Income, Expenditure, Net Balance, Transaction count
   - Recent transactions list
   - Quick shortcuts to Content, SEO, and Analytics

3. CONTENT STUDIO
   Generate ready-to-edit social copy:
   - Instagram Caption
   - Instagram Bio
   - Instagram Product Description
   - WhatsApp Promo
   - Short Reel Caption
   - Call-to-Action
   Supports tone and audience. One-click copy.

4. SEO BUILDER
   Generates:
   - SEO Title
   - Meta Description
   - Primary Keyword and keyword list
   - URL Slug
   - Social Tags

5. ANALYTICS
   - Income vs Expenditure monthly bar chart
   - Expense category breakdown
   - Full transaction table
   - Profit margin calculation

6. GOOGLE SHEET INTEGRATION
   - Connect a public Google Sheet (Anyone with the link → Viewer)
   - Supported columns:
     Date | Description | Type | Amount | Category
     OR
     Date | Description | Income | Expenditure | Category
   - Auto-loads rows into stats, charts, and tables
   - Connect / Disconnect with live status


--------------------------------------------------------------------------------
TECH STACK
--------------------------------------------------------------------------------

  Structure   : HTML5
  Styling     : CSS3 (responsive, modern UI)
  Logic       : Vanilla JavaScript (no frameworks)
  Storage     : Browser localStorage
  Data source : Google Sheets CSV export
  Backend     : None (fully client-side)


--------------------------------------------------------------------------------
PROJECT STRUCTURE
--------------------------------------------------------------------------------

  artifacts/
  ├── index.html    Main app structure + auth screens
  ├── styles.css    All styles (auth + dashboard)
  ├── app.js        Auth, navigation, sheet, content, SEO, analytics
  ├── README.md     Markdown documentation
  └── README.txt    Plain text documentation

  IMPORTANT: index.html, styles.css, and app.js must stay in the SAME folder.


--------------------------------------------------------------------------------
HOW TO RUN
--------------------------------------------------------------------------------

  1. Put these files in one folder:
       - index.html
       - styles.css
       - app.js

  2. Open index.html in a modern browser (Chrome, Edge, Firefox, Safari).

  3. Optional — local server (if styles/scripts fail under file://):

       cd path/to/folder
       python3 -m http.server 8000

     Then open: http://localhost:8000


--------------------------------------------------------------------------------
USAGE GUIDE
--------------------------------------------------------------------------------

  CREATE ACCOUNT
  - Open app → Create Account tab
  - Enter name, valid email (e.g. you@gmail.com), exactly 10-digit mobile,
    and password (min. 6 characters)
  - No OTP is sent
  - Duplicate email or phone is rejected

  LOGIN
  - Enter the same email, 10-digit phone, and password
  - Credentials are verified before access is granted
  - On success, the dashboard opens

  CONNECT GOOGLE SHEET (OPTIONAL)
  1. Open your Google Sheet
  2. Share → General access → Anyone with the link → Viewer
  3. Copy the sheet URL
  4. In BizFlow → Google Sheet → paste URL → Connect & Load Data

  If connection fails:
  - Confirm sharing is "Anyone with the link"
  - Use the full URL from the browser address bar
  - Ensure the sheet has supported column headers and data rows

  GENERATE CONTENT & SEO
  - Go to Content Studio or SEO Builder
  - Fill product details → Generate → Copy

  VIEW ANALYTICS
  - Open Analytics after connecting a sheet
  - See charts, categories, and full transaction list


--------------------------------------------------------------------------------
VALIDATION RULES
--------------------------------------------------------------------------------

  Email    : Must contain @ and a valid domain (e.g. name@gmail.com)
  Phone    : Exactly 10 digits (no spaces or symbols)
  Password : Minimum 6 characters
  Login    : Email + phone + password must all match registered account


--------------------------------------------------------------------------------
PRIVACY & SECURITY NOTES
--------------------------------------------------------------------------------

  - Everything runs in the browser on your device
  - User accounts and session are stored in localStorage
  - No server, no cloud database, no OTP service
  - Suitable for demos, personal use, and local tools
  - NOT intended as production-grade authentication for public multi-user systems


--------------------------------------------------------------------------------
BROWSER SUPPORT
--------------------------------------------------------------------------------

  Works on latest versions of:
  - Google Chrome
  - Microsoft Edge
  - Mozilla Firefox
  - Safari


--------------------------------------------------------------------------------
TAGLINE
--------------------------------------------------------------------------------

  BizFlow AI — Manage content, SEO, and business numbers from one place.


--------------------------------------------------------------------------------
LICENSE
--------------------------------------------------------------------------------

  This project is provided for educational and personal use.
  You may modify and extend it as needed.

================================================================================
