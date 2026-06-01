# 🌞 Helios Solar Solutions - Invoice & Catalog Bundler

A modern, high-fidelity, full-stack single-page application (SPA) tailored for South African solar installers. It integrates real-time trade catalog synchronization, bulk price list importing/exporting, custom EFT billing configurations, quote calculations (wholesale vs markups), and a secure glassmorphic workspace lock screen.

---

## ✨ Primary Features

### 🔐 1. Secure Admin Shell & Lock Screen
* **Glassmorphic Lock Screen**: A blurred overlay (`backdrop-filter: blur(24px)`) completely blocks interaction with inventory lists, cost prices, profit margins, and portal settings.
* **Accessible Client Invoices**: Customers opening unique quote links (e.g. `#/invoice?d=<payload>`) bypass the password challenge to view their invoices immediately.
* **Session Persistence**: Logging in sets a session flag (`sessionStorage`) to keep the dashboard unlocked during your active session.

### ⚙️ 2. Persistent Profile & Banking Settings
* **Company Profile**: Customize your Company Name, Tagline, Email, Phone, and Street Address.
* **EFT Payment Details**: Configure Bank Name, Account Name, Account Number, and Branch Code.
* **Dynamic Logo Splitting**: Dynamically splits your custom company name into a premium, two-toned title (e.g., first word white, others amber) on client invoices.
* **Backend Save Persistence**: Settings are written to `public/settings.json` on the server so they persist across machines and browser updates.

### 🔄 3. Live Distributor Portal Sync (GetOffGrid)
* **Headless Scraping**: Direct integration with [GetOffGrid.co.za](https://www.getoffgrid.co.za) dealer portal using Puppeteer to pull the latest trade prices.
* **High-Fidelity Trade Simulation Fallback**: Auto-triggered simulation fallback to keep the demo active in environments with cloud/security blocks.

### 📊 4. Interactive Quote Builder & Shareable URLs
* **Margin Control**: Adjust markup percentages globally or per-line item to calculate wholesale costs, profit value, and GP margins.
* **Database-Free URLs**: Generates url-safe, compressed Unicode base64 payloads representing your invoices, allowing instant link sharing without setting up database tables.
* **South African ZAR Formatting**: Formatted with standard South African currency displays (e.g. `R 12,500.00`) and standard VAT computations (15%).

### 📂 5. Bulk CSV Importer & Exporter
* **CSV Export**: Instantly export your entire catalog in one click.
* **CSV Import**: Drag-and-drop your custom Excel or Sheets price list with automated column mapping.

---

## 🛠️ Technology Stack

* **Frontend**: Vanilla HTML5, Modern CSS3 variables (Glassmorphic dark design theme), ES6 JavaScript.
* **Backend**: Node.js, Express (15MB JSON payload support), Puppeteer (Headless Web Crawling).
* **Storage**: Persistent JSON database files (`public/catalog.json` and `public/settings.json`).

---

## 🚀 Getting Started

### Prerequisites
* **Node.js** (v18 or higher recommended)
* **npm**

### Installation
1. Clone your repository:
   ```bash
   git clone https://github.com/saecurrry/solar-invoice.git
   cd solar-invoice
   ```
2. Install the node package dependencies:
   ```bash
   npm install
   ```

### Running Locally
1. Start the Node backend server:
   ```bash
   npm start
   ```
2. Open your web browser and navigate to:
   **[http://localhost:3000](http://localhost:3000)**

---

## 🌎 Publishing and Hosting

### 1. Platforms (Render.com / Railway.app)
* **Build Command**: `npm install`
* **Start Command**: `npm start`
* **Environment Variable**: Add `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = true`.
* **Buildpack**: Add `https://github.com/jontewks/puppeteer-heroku-buildpack.git` to install Puppeteer system libraries.

### 2. Docker Container Deployment
Use the included standard `Dockerfile` to deploy your container to platforms like **Railway.app** or **Fly.io** with pre-configured chromium dependencies.

---

## 📂 Project Structure

```text
├── server.js               # Node.js server with sync & scraping endpoints
├── package.json            # NPM packages and configurations
├── .gitignore              # Staged ignores (node_modules, local captures, etc.)
└── public/                 # Static SPA assets served by Express
    ├── index.html          # Shell layouts, settings, and lock screens
    ├── app.js              # SPA router, quote builder, and bindings
    ├── style.css           # Modern outfit/amber glassmorphic styling
    ├── seedData.js         # Default wholesale catalogs and bundles
    ├── catalog.json        # Persistent wholesale catalog database file
    └── settings.json       # Persistent company settings profile file
```
