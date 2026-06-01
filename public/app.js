// Helios Solar Solutions - Invoice & Bundler SPA Logic
import { SEED_CATEGORIES, SEED_CATALOG, SEED_BUNDLES } from './seedData.js';

// --- STATE MANAGEMENT ---
const DEFAULT_SETTINGS = {
  companyName: "Helios Solar Solutions",
  companyTagline: "Powering South Africa's Future",
  companyEmail: "installs@heliossolar.co.za",
  companyPhone: "+27 (0) 11 456 7890",
  companyAddress1: "12 Energy Hub Crescent",
  companyAddress2: "Midrand, Gauteng, 1685",
  bankName: "First National Bank (FNB)",
  bankAccName: "Helios Solar Solutions (Pty) Ltd",
  bankAccNum: "62894107532",
  bankBranch: "250655",
  adminPassword: ""
};

let state = {
  categories: [...SEED_CATEGORIES],
  catalog: [],
  bundles: [],
  invoices: [],
  currentInvoice: createNewInvoiceTemplate(),
  activeView: 'dashboard',
  globalMarkup: 20,
  settings: { ...DEFAULT_SETTINGS }
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  loadInitialState();
  initAppRouting();
  setupUIEventListeners();
});

async function loadInitialState() {
  loadLocalStorageState();
  checkAdminLock();
  
  // Try to load latest catalog and settings from server
  try {
    const res = await fetch('/catalog.json');
    if (res.ok) {
      const serverCatalog = await res.json();
      if (Array.isArray(serverCatalog) && serverCatalog.length > 0) {
        state.catalog = serverCatalog;
        localStorage.setItem('helios_catalog', JSON.stringify(state.catalog));
        console.log(`[Init] Successfully synchronized with backend catalog.json (${serverCatalog.length} items).`);
      }
    }
  } catch (err) {
    console.warn("[Init] Failed to load catalog from server, using local storage fallback:", err);
  }

  try {
    const res = await fetch('/settings.json');
    if (res.ok) {
      const serverSettings = await res.json();
      if (serverSettings && typeof serverSettings === 'object') {
        state.settings = { ...DEFAULT_SETTINGS, ...serverSettings };
        localStorage.setItem('helios_settings', JSON.stringify(state.settings));
        console.log(`[Init] Successfully synchronized with backend settings.json.`);
        checkAdminLock();
      }
    }
  } catch (err) {
    console.warn("[Init] Failed to load settings from server, using local storage fallback:", err);
  }
  
  renderAllViews();
}

// Create blank slate invoice
function createNewInvoiceTemplate() {
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0];
  const randId = 'INV-' + date.getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
  
  return {
    id: randId,
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    clientAddress: '',
    date: dateStr,
    items: [], // Array of { code, name, category, costPrice, qty, markup, unit }
    globalMarkup: 20,
    status: 'Draft'
  };
}

// Load state from local storage or fallback to seeds
function loadLocalStorageState() {
  const localCatalog = localStorage.getItem('helios_catalog');
  if (localCatalog) {
    state.catalog = JSON.parse(localCatalog);
  } else {
    state.catalog = [...SEED_CATALOG];
    localStorage.setItem('helios_catalog', JSON.stringify(state.catalog));
  }

  const localBundles = localStorage.getItem('helios_bundles');
  if (localBundles) {
    state.bundles = JSON.parse(localBundles);
  } else {
    state.bundles = [...SEED_BUNDLES];
    localStorage.setItem('helios_bundles', JSON.stringify(state.bundles));
  }

  const localInvoices = localStorage.getItem('helios_invoices');
  if (localInvoices) {
    state.invoices = JSON.parse(localInvoices);
  } else {
    state.invoices = [];
  }

  const localSettings = localStorage.getItem('helios_settings');
  if (localSettings) {
    state.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(localSettings) };
  } else {
    state.settings = { ...DEFAULT_SETTINGS };
    localStorage.setItem('helios_settings', JSON.stringify(state.settings));
  }
  
  // Track last sync date if available
  const lastSync = localStorage.getItem('helios_last_sync');
  if (lastSync) {
    const syncText = document.getElementById('distributor-last-sync');
    if (syncText) syncText.innerText = lastSync;
  }
}

function saveStateToLocalStorage() {
  localStorage.setItem('helios_catalog', JSON.stringify(state.catalog));
  localStorage.setItem('helios_bundles', JSON.stringify(state.bundles));
  localStorage.setItem('helios_invoices', JSON.stringify(state.invoices));
}

// --- SINGLE-PAGE ROUTING & HASH CONTROLLER ---
function initAppRouting() {
  // Check hash on load
  handleHashRoute();

  // Listen for hash changes
  window.addEventListener('hashchange', handleHashRoute);
}

function handleHashRoute() {
  const hash = window.location.hash;
  
  // Checking Client Share View
  if (hash.startsWith('#/invoice') || hash.startsWith('#/view')) {
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
    const payload = urlParams.get('d');
    
    if (payload) {
      try {
        const decodedInvoice = decompressInvoiceState(payload);
        renderClientInvoice(decodedInvoice);
      } catch (err) {
        console.error("Failed to decode invoice URL payload:", err);
        alert("Invalid or corrupted invoice link.");
        window.location.hash = '#dashboard';
      }
    } else {
      // Direct access without data: check if invoice exists locally by path parameter
      const parts = hash.split('/');
      const invoiceId = parts[parts.length - 1].split('?')[0];
      const localInvoice = state.invoices.find(inv => inv.id === invoiceId);
      
      if (localInvoice) {
        renderClientInvoice(localInvoice);
      } else {
        alert("Invoice not found locally. Redirecting to Dashboard.");
        window.location.hash = '#dashboard';
      }
    }
  } else {
    // Admin Views Routing
    if (checkAdminLock()) {
      // Admin is locked: force displays of shells but block interaction using the glass overlay
      document.getElementById('admin-shell').style.display = 'flex';
      document.getElementById('client-shell').style.display = 'none';
    } else {
      const adminShell = document.getElementById('admin-shell');
      const clientShell = document.getElementById('client-shell');
      
      adminShell.style.display = 'flex';
      clientShell.style.display = 'none';
      
      let view = 'dashboard';
      if (hash === '#builder') view = 'builder';
      else if (hash === '#bundles') view = 'bundles';
      else if (hash === '#catalog') view = 'catalog';
      else if (hash === '#settings') view = 'settings';
      
      switchView(view, false);
    }
  }
}

// Switch active panel view
export function switchView(viewName, updateHash = true) {
  if (checkAdminLock()) {
    if (updateHash) {
      window.location.hash = `#${viewName}`;
    }
    return;
  }

  state.activeView = viewName;
  
  // Toggle Sidebar Links
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  const navItem = document.getElementById(`nav-${viewName}`);
  if (navItem) navItem.classList.add('active');

  // Toggle View Panels
  document.querySelectorAll('.view-section').forEach(section => {
    section.classList.remove('active');
  });
  const activeSection = document.getElementById(`view-${viewName}`);
  if (activeSection) activeSection.classList.add('active');

  // Set Header Title
  const titles = {
    dashboard: 'Business Overview & Tracking',
    builder: 'Solar Installation Quote Builder',
    bundles: 'Pre-packaged Component Bundles',
    catalog: 'Stock Inventory & Dealer Pricing',
    settings: 'Application Profile & Security Settings'
  };
  document.getElementById('header-title').innerText = titles[viewName] || 'Dashboard';

  if (updateHash) {
    window.location.hash = `#${viewName}`;
  }

  renderViewData(viewName);
}
window.switchView = switchView;

// --- SECURITY & LOCK SCREEN CONTROLLER ---
window.checkAdminLock = () => {
  const passwordSet = state.settings && state.settings.adminPassword && state.settings.adminPassword.trim() !== "";
  const isUnlocked = sessionStorage.getItem('helios_admin_unlocked') === 'true';
  const lockEl = document.getElementById('admin-login-lock');
  const logoutBtn = document.getElementById('sidebar-logout-btn');
  
  if (logoutBtn) {
    logoutBtn.style.display = passwordSet ? 'block' : 'none';
  }
  
  if (passwordSet && !isUnlocked) {
    if (lockEl) {
      lockEl.style.display = 'flex';
      const pwInput = document.getElementById('lock-password');
      if (pwInput) pwInput.focus();
    }
    return true; // Locked
  } else {
    if (lockEl) lockEl.style.display = 'none';
    return false; // Unlocked
  }
};

window.handleAdminLoginSubmit = (e) => {
  e.preventDefault();
  const passwordInput = document.getElementById('lock-password');
  const enteredPassword = passwordInput.value;
  
  if (enteredPassword === state.settings.adminPassword) {
    sessionStorage.setItem('helios_admin_unlocked', 'true');
    const lockEl = document.getElementById('admin-login-lock');
    if (lockEl) lockEl.style.display = 'none';
    passwordInput.value = '';
    
    handleHashRoute();
    renderAllViews();
  } else {
    alert("Incorrect password. Access denied.");
    passwordInput.value = '';
    passwordInput.focus();
  }
};

window.adminLogout = () => {
  sessionStorage.removeItem('helios_admin_unlocked');
  checkAdminLock();
  window.location.hash = '#dashboard';
};

// --- STATE COMPRESSION / DECOMPRESSION (Database-Free Links) ---
function compressInvoiceState(invoiceObj) {
  const jsonStr = JSON.stringify(invoiceObj);
  // URL-safe Unicode Base64 encoding
  return btoa(encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, (match, p1) => {
    return String.fromCharCode('0x' + p1);
  }));
}

function decompressInvoiceState(base64Str) {
  const decodedStr = decodeURIComponent(atob(base64Str).split('').map(c => {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
  return JSON.parse(decodedStr);
}

// --- SETUP EVENT LISTENERS ---
function setupUIEventListeners() {
  // Global Markup slider listener
  const slider = document.getElementById('global-markup');
  if (slider) {
    slider.addEventListener('change', () => {
      state.globalMarkup = parseInt(slider.value);
    });
  }

  // Catalog item category filler
  const catSelect = document.getElementById('cat-category');
  if (catSelect) {
    catSelect.innerHTML = state.categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
  }

  // File Drag-Drop triggers
  const dragZone = document.getElementById('csv-drag-zone');
  const fileInput = document.getElementById('csv-file-input');

  if (dragZone && fileInput) {
    dragZone.addEventListener('click', () => fileInput.click());
    
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) handleCSVFile(e.target.files[0]);
    });

    dragZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dragZone.classList.add('dragover');
    });

    dragZone.addEventListener('dragleave', () => {
      dragZone.classList.remove('dragover');
    });

    dragZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dragZone.classList.remove('dragover');
      if (e.dataTransfer.files.length > 0) {
        fileInput.files = e.dataTransfer.files;
        handleCSVFile(e.dataTransfer.files[0]);
      }
    });
  }
}

// --- RENDERING VIEWS ENGINE ---
function renderAllViews() {
  renderDashboard();
  renderBuilder();
  renderBundles();
  renderCatalog();
  renderSettings();
}

function renderViewData(viewName) {
  if (viewName === 'dashboard') renderDashboard();
  else if (viewName === 'builder') renderBuilder();
  else if (viewName === 'bundles') renderBundles();
  else if (viewName === 'catalog') renderCatalog();
  else if (viewName === 'settings') renderSettings();
}

function renderSettings() {
  const settings = state.settings || DEFAULT_SETTINGS;
  document.getElementById('settings-company-name').value = settings.companyName || '';
  document.getElementById('settings-company-tagline').value = settings.companyTagline || '';
  document.getElementById('settings-company-email').value = settings.companyEmail || '';
  document.getElementById('settings-company-phone').value = settings.companyPhone || '';
  document.getElementById('settings-company-address1').value = settings.companyAddress1 || '';
  document.getElementById('settings-company-address2').value = settings.companyAddress2 || '';
  
  document.getElementById('settings-bank-name').value = settings.bankName || '';
  document.getElementById('settings-bank-accname').value = settings.bankAccName || '';
  document.getElementById('settings-bank-accnum').value = settings.bankAccNum || '';
  document.getElementById('settings-bank-branch').value = settings.bankBranch || '';
  
  document.getElementById('settings-admin-password').value = settings.adminPassword || '';
}

window.saveSettingsForm = () => {
  const updatedSettings = {
    companyName: document.getElementById('settings-company-name').value.trim(),
    companyTagline: document.getElementById('settings-company-tagline').value.trim(),
    companyEmail: document.getElementById('settings-company-email').value.trim(),
    companyPhone: document.getElementById('settings-company-phone').value.trim(),
    companyAddress1: document.getElementById('settings-company-address1').value.trim(),
    companyAddress2: document.getElementById('settings-company-address2').value.trim(),
    
    bankName: document.getElementById('settings-bank-name').value.trim(),
    bankAccName: document.getElementById('settings-bank-accname').value.trim(),
    bankAccNum: document.getElementById('settings-bank-accnum').value.trim(),
    bankBranch: document.getElementById('settings-bank-branch').value.trim(),
    
    adminPassword: document.getElementById('settings-admin-password').value.trim()
  };

  if (!updatedSettings.companyName || !updatedSettings.companyEmail || !updatedSettings.companyPhone || !updatedSettings.companyAddress1) {
    alert("Please fill in Company Name, Email, Phone, and Street Address Line 1.");
    return;
  }

  saveSettings(updatedSettings);
  checkAdminLock();
  alert("Settings saved successfully!");
  renderAllViews();
};

async function saveSettings(updatedSettings) {
  state.settings = updatedSettings;
  localStorage.setItem('helios_settings', JSON.stringify(state.settings));

  if (window.location.protocol !== 'file:') {
    try {
      const res = await fetch('/api/settings/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: updatedSettings })
      });
      if (!res.ok) {
        const data = await res.json();
        console.warn("[Save Settings] Backend save failed:", data.message);
      } else {
        console.log("[Save Settings] Persistent backend sync successful.");
      }
    } catch (err) {
      console.warn("[Save Settings] Failed to connect to server:", err);
    }
  }
}
window.saveSettings = saveSettings;

// --- 1. DASHBOARD VIEW RENDERING ---
function renderDashboard() {
  // Calculations: Running totals of outstanding vs paid
  let totalOutstanding = 0;
  let totalPaid = 0;
  let activeSentCount = 0;
  let lateCount = 0;

  state.invoices.forEach(inv => {
    const total = calculateInvoiceTotal(inv).total;
    if (inv.status === 'Sent') {
      totalOutstanding += total;
      activeSentCount++;
    } else if (inv.status === 'Late') {
      totalOutstanding += total;
      lateCount++;
    } else if (inv.status === 'Paid') {
      totalPaid += total;
    }
  });

  // Update Counters
  document.getElementById('stat-outstanding').innerText = formatZAR(totalOutstanding);
  document.getElementById('stat-paid').innerText = formatZAR(totalPaid);
  document.getElementById('stat-sent-count').innerText = activeSentCount;
  document.getElementById('stat-late-count').innerText = lateCount;

  // Invoices list summary count
  document.getElementById('invoice-count-summary').innerText = `${state.invoices.length} Invoices Total`;

  // Render recent invoices table
  const tbody = document.getElementById('invoice-table-body');
  if (tbody) {
    if (state.invoices.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2rem;">No invoices created yet. Go to 'Create Invoice' tab to start!</td></tr>`;
    } else {
      tbody.innerHTML = state.invoices.map(inv => {
        const total = calculateInvoiceTotal(inv).total;
        const systemSpec = getInvoiceSystemSummary(inv);
        
        let statusBadge = '';
        if (inv.status === 'Draft') statusBadge = '<span class="badge badge-draft">Draft</span>';
        else if (inv.status === 'Sent') statusBadge = '<span class="badge badge-sent">Sent</span>';
        else if (inv.status === 'Paid') statusBadge = '<span class="badge badge-paid">Paid</span>';
        else if (inv.status === 'Late') statusBadge = '<span class="badge badge-late">Late</span>';

        return `
          <tr>
            <td style="font-weight: 700; color: var(--accent);">${inv.id}</td>
            <td><strong>${escapeHTML(inv.clientName || 'N/A')}</strong><div style="font-size: 0.75rem; color: var(--text-muted);">${escapeHTML(inv.clientEmail)}</div></td>
            <td style="font-size: 0.85rem; color: var(--text-secondary); max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${systemSpec}</td>
            <td><strong>${formatZAR(total)}</strong></td>
            <td style="font-size: 0.85rem;">${inv.date}</td>
            <td>
              <select onchange="updateInvoiceStatus('${inv.id}', this.value)" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; width: auto; background: none; border: 1px solid var(--border-color); color: inherit; border-radius: 4px;">
                <option value="Draft" ${inv.status === 'Draft' ? 'selected' : ''}>Draft</option>
                <option value="Sent" ${inv.status === 'Sent' ? 'selected' : ''}>Sent</option>
                <option value="Paid" ${inv.status === 'Paid' ? 'selected' : ''}>Paid</option>
                <option value="Late" ${inv.status === 'Late' ? 'selected' : ''}>Late</option>
              </select>
            </td>
            <td style="text-align: right;">
              <div style="display: flex; gap: 0.35rem; justify-content: flex-end;">
                <button class="btn btn-secondary btn-sm" onclick="editInvoice('${inv.id}')" title="Edit"><i class="fa-solid fa-edit"></i></button>
                <button class="btn btn-secondary btn-sm" onclick="viewClientInvoiceLocal('${inv.id}')" title="View PDF Link"><i class="fa-solid fa-external-link"></i></button>
                <button class="btn btn-danger btn-sm" onclick="deleteInvoice('${inv.id}')" title="Delete"><i class="fa-solid fa-trash"></i></button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }
  }

  // Render recent bundles list in dashboard
  const bundleContainer = document.getElementById('dashboard-bundle-list');
  if (bundleContainer) {
    bundleContainer.innerHTML = state.bundles.slice(0, 3).map(bundle => {
      const pricing = calculateBundlePricing(bundle);
      return `
        <div class="quick-item" onclick="loadBundleInBuilder('${bundle.id}')">
          <div class="quick-icon"><i class="fa-solid fa-boxes-packing"></i></div>
          <div class="quick-details">
            <div class="quick-title">${escapeHTML(bundle.name)}</div>
            <div class="quick-desc">${bundle.items.length} items • Client: ${formatZAR(pricing.clientTotal)}</div>
          </div>
          <div><i class="fa-solid fa-chevron-right" style="font-size: 0.8rem; color: var(--text-muted);"></i></div>
        </div>
      `;
    }).join('');
  }
}

// Generate simple string representing system size (e.g. 5kW Inverter + 6x Panels)
function getInvoiceSystemSummary(invoice) {
  if (invoice.items.length === 0) return 'No solar components added';
  const inverters = invoice.items.filter(i => i.category === 'Inverters');
  const panels = invoice.items.filter(i => i.category === 'Solar Panels');
  const batteries = invoice.items.filter(i => i.category === 'Lithium Batteries');
  
  let parts = [];
  if (inverters.length > 0) {
    const name = inverters[0].name;
    const kwMatch = name.match(/(\d+kW)/i);
    parts.push(kwMatch ? kwMatch[0] : 'Inverter');
  }
  if (batteries.length > 0) {
    const qty = batteries.reduce((acc, i) => acc + i.qty, 0);
    parts.push(`${qty}x Battery`);
  }
  if (panels.length > 0) {
    const qty = panels.reduce((acc, i) => acc + i.qty, 0);
    parts.push(`${qty}x Panels`);
  }

  return parts.length > 0 ? parts.join(' + ') : 'Accessories Install';
}

// --- 2. INVOICE BUILDER VIEW RENDERING ---
function renderBuilder() {
  const inv = state.currentInvoice;
  
  // Fill forms
  document.getElementById('client-name').value = inv.clientName || '';
  document.getElementById('client-email').value = inv.clientEmail || '';
  document.getElementById('client-phone').value = inv.clientPhone || '';
  document.getElementById('client-address').value = inv.clientAddress || '';
  document.getElementById('invoice-status-select').value = inv.status;
  document.getElementById('global-markup').value = state.globalMarkup;
  document.getElementById('global-markup-val').innerText = `${state.globalMarkup}%`;

  // Prepopulate client form bindings
  document.getElementById('client-name').oninput = (e) => { state.currentInvoice.clientName = e.target.value; triggerInvoiceRecalculation(); };
  document.getElementById('client-email').oninput = (e) => { state.currentInvoice.clientEmail = e.target.value; triggerInvoiceRecalculation(); };
  document.getElementById('client-phone').oninput = (e) => { state.currentInvoice.clientPhone = e.target.value; triggerInvoiceRecalculation(); };
  document.getElementById('client-address').oninput = (e) => { state.currentInvoice.clientAddress = e.target.value; triggerInvoiceRecalculation(); };
  document.getElementById('invoice-status-select').onchange = (e) => { state.currentInvoice.status = e.target.value; triggerInvoiceRecalculation(); };

  // Fill bundles dropdown picker
  const bundleSelect = document.getElementById('builder-bundle-select');
  if (bundleSelect) {
    bundleSelect.innerHTML = `<option value="">-- Apply Bundle --</option>` + 
      state.bundles.map(b => `<option value="${b.id}">${escapeHTML(b.name)}</option>`).join('');
    
    bundleSelect.onchange = (e) => {
      if (e.target.value) {
        loadBundleInBuilder(e.target.value);
        e.target.value = ''; // Reset select
      }
    };
  }

  // Render current invoice item list
  const listContainer = document.getElementById('invoice-items-list');
  if (listContainer) {
    if (inv.items.length === 0) {
      listContainer.innerHTML = `<div style="text-align: center; border: 2px dashed var(--border-color); border-radius: var(--radius-sm); padding: 2rem; color: var(--text-muted); font-size: 0.9rem;">
        No items in this invoice. Search catalog on the right side to add components!
      </div>`;
    } else {
      listContainer.innerHTML = inv.items.map((item, index) => {
        const clientPrice = item.costPrice * (1 + item.markup / 100);
        const rowTotal = clientPrice * item.qty;
        
        return `
          <div class="item-row">
            <div>
              <label style="font-size: 0.65rem; margin-bottom: 2px;">Item Description (SKU: ${item.code})</label>
              <input type="text" value="${escapeHTML(item.name)}" style="padding: 0.35rem 0.5rem; font-size: 0.8rem; font-weight: 500;" onchange="updateItemRow(${index}, 'name', this.value)">
            </div>
            <div>
              <label style="font-size: 0.65rem; margin-bottom: 2px;">Cost (ZAR)</label>
              <input type="number" value="${item.costPrice}" min="0" step="0.01" style="padding: 0.35rem 0.5rem; font-size: 0.8rem;" onchange="updateItemRow(${index}, 'costPrice', parseFloat(this.value))">
            </div>
            <div>
              <label style="font-size: 0.65rem; margin-bottom: 2px;">Qty</label>
              <input type="number" value="${item.qty}" min="1" step="1" style="padding: 0.35rem 0.5rem; font-size: 0.8rem;" onchange="updateItemRow(${index}, 'qty', parseInt(this.value))">
            </div>
            <div>
              <label style="font-size: 0.65rem; margin-bottom: 2px;">Markup %</label>
              <input type="number" value="${item.markup}" min="-100" max="500" step="1" style="padding: 0.35rem 0.5rem; font-size: 0.8rem;" onchange="updateItemRow(${index}, 'markup', parseFloat(this.value))">
            </div>
            <div>
              <label style="font-size: 0.65rem; margin-bottom: 2px;">Customer Owed</label>
              <div style="font-weight: 700; font-size: 0.85rem; padding: 0.35rem 0; color: #fff;">${formatZAR(rowTotal)}</div>
            </div>
            <div style="margin-top: 18px;">
              <button class="btn btn-danger btn-sm" onclick="removeInvoiceItem(${index})" style="padding: 0.35rem; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;"><i class="fa-solid fa-trash"></i></button>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // Render quick catalog list selector (Right Panel)
  renderBuilderCatalogPicker();

  // Run dynamic calculation updates
  triggerInvoiceRecalculation();
}

function renderBuilderCatalogPicker(filterText = '') {
  const container = document.getElementById('builder-catalog-picker');
  if (container) {
    const filtered = state.catalog.filter(item => {
      return item.name.toLowerCase().includes(filterText.toLowerCase()) || 
             (item.brand && item.brand.toLowerCase().includes(filterText.toLowerCase())) ||
             item.code.toLowerCase().includes(filterText.toLowerCase());
    });

    if (filtered.length === 0) {
      container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.8rem; padding: 1.5rem 0;">No matching items found.</div>`;
    } else {
      container.innerHTML = filtered.slice(0, 10).map(item => {
        const clientPrice = item.costPrice * (1 + state.globalMarkup / 100);
        return `
          <div class="picker-item" onclick="addItemToInvoice('${item.id}')">
            <div class="picker-header">
              <span class="picker-name">${escapeHTML(item.name)}</span>
              <span class="picker-price">${formatZAR(clientPrice)}</span>
            </div>
            <div class="picker-desc">${escapeHTML(item.description || 'No description')}</div>
            <div class="picker-meta">
              <span>Code: <strong>${item.code}</strong></span>
              <span>Distributor Cost: <strong>${formatZAR(item.costPrice)}</strong></span>
            </div>
          </div>
        `;
      }).join('');
    }
  }
}

// Search bar filters builder products list
window.filterBuilderCatalog = (text) => {
  renderBuilderCatalogPicker(text);
};

// Add item from catalog picker into quote
window.addItemToInvoice = (catalogId) => {
  const originalItem = state.catalog.find(i => i.id === catalogId);
  if (originalItem) {
    // Add to state
    state.currentInvoice.items.push({
      id: originalItem.id,
      code: originalItem.code,
      name: originalItem.name,
      category: originalItem.category,
      costPrice: originalItem.costPrice,
      qty: 1,
      markup: state.globalMarkup,
      unit: originalItem.unit
    });
    
    // Rerender builder panel
    renderBuilder();
  }
};

window.addBlankInvoiceRow = () => {
  state.currentInvoice.items.push({
    id: 'custom-' + Date.now(),
    code: 'CUSTOM-SRV',
    name: 'Labour',
    category: 'Labor & Professional Services',
    costPrice: 1000,
    qty: 1,
    markup: state.globalMarkup,
    unit: 'Job'
  });
  renderBuilder();
};

window.updateItemRow = (index, field, value) => {
  if (isNaN(value) || value < 0 && field !== 'markup') return;
  state.currentInvoice.items[index][field] = value;
  triggerInvoiceRecalculation();
};

window.removeInvoiceItem = (index) => {
  state.currentInvoice.items.splice(index, 1);
  renderBuilder();
};

window.updateGlobalMarkupLabel = (value) => {
  document.getElementById('global-markup-val').innerText = `${value}%`;
};

window.applyGlobalMarkup = () => {
  const value = parseInt(document.getElementById('global-markup').value);
  state.globalMarkup = value;
  state.currentInvoice.items.forEach(item => {
    item.markup = value;
  });
  renderBuilder();
};

function triggerInvoiceRecalculation() {
  const stats = calculateInvoiceTotal(state.currentInvoice);
  
  document.getElementById('calc-wholesale-cost').innerText = formatZAR(stats.wholesale);
  document.getElementById('calc-markup-value').innerText = formatZAR(stats.markupValue);
  
  const gpPct = stats.wholesale > 0 ? ((stats.markupValue / stats.wholesale) * 100).toFixed(2) : '0.00';
  document.getElementById('calc-profit-percentage').innerText = `${gpPct}% (R ${formatZAR(stats.markupValue).replace('R ', '')})`;
  document.getElementById('calc-client-total').innerText = formatZAR(stats.total);

  // Enable/disable link button only if invoice is saved & valid
  const saveBtn = document.getElementById('btn-generate-link');
  if (saveBtn) {
    const isSaved = state.invoices.some(inv => inv.id === state.currentInvoice.id);
    saveBtn.disabled = !isSaved || state.currentInvoice.items.length === 0;
  }
}

// Calculate totals
function calculateInvoiceTotal(invoice) {
  let wholesale = 0;
  let markupValue = 0;
  let total = 0;

  invoice.items.forEach(item => {
    const itemWholesale = item.costPrice * item.qty;
    const clientPrice = item.costPrice * (1 + item.markup / 100);
    const itemTotal = clientPrice * item.qty;
    
    wholesale += itemWholesale;
    markupValue += (itemTotal - itemWholesale);
    total += itemTotal;
  });

  return { wholesale, markupValue, total };
}

window.saveInvoice = () => {
  const inv = state.currentInvoice;
  if (!inv.clientName || !inv.clientEmail) {
    alert("Please fill in Customer Name and Customer Email.");
    return;
  }

  const existingIdx = state.invoices.findIndex(item => item.id === inv.id);
  if (existingIdx !== -1) {
    state.invoices[existingIdx] = JSON.parse(JSON.stringify(inv));
  } else {
    state.invoices.unshift(JSON.parse(JSON.stringify(inv)));
  }

  saveStateToLocalStorage();
  alert(`Invoice ${inv.id} saved successfully!`);
  
  // Refresh layout
  renderBuilder();
  renderDashboard();
};

window.editInvoice = (invoiceId) => {
  const inv = state.invoices.find(item => item.id === invoiceId);
  if (inv) {
    state.currentInvoice = JSON.parse(JSON.stringify(inv));
    switchView('builder');
  }
};

window.deleteInvoice = (invoiceId) => {
  if (confirm(`Are you sure you want to delete invoice ${invoiceId}?`)) {
    state.invoices = state.invoices.filter(item => item.id !== invoiceId);
    saveStateToLocalStorage();
    
    if (state.currentInvoice.id === invoiceId) {
      state.currentInvoice = createNewInvoiceTemplate();
    }
    
    renderDashboard();
    renderBuilder();
  }
};

window.updateInvoiceStatus = (invoiceId, newStatus) => {
  const inv = state.invoices.find(item => item.id === invoiceId);
  if (inv) {
    inv.status = newStatus;
    if (state.currentInvoice.id === invoiceId) {
      state.currentInvoice.status = newStatus;
      const statusSelect = document.getElementById('invoice-status-select');
      if (statusSelect) statusSelect.value = newStatus;
    }
    saveStateToLocalStorage();
    renderDashboard();
  }
};

// Generate encrypted shareable customer reference link
window.generateShareLink = () => {
  const payload = compressInvoiceState(state.currentInvoice);
  const rootUrl = window.location.origin + window.location.pathname;
  const fullUrl = `${rootUrl}#/invoice?d=${payload}`;
  
  document.getElementById('share-url-input').value = fullUrl;
  document.getElementById('share-card-container').style.display = 'block';
};

window.copyShareUrl = () => {
  const input = document.getElementById('share-url-input');
  input.select();
  input.setSelectionRange(0, 99999);
  navigator.clipboard.writeText(input.value);
  alert("Share link copied to clipboard!");
};

// View client view locally in app
window.viewClientInvoiceLocal = (invoiceId) => {
  const inv = state.invoices.find(item => item.id === invoiceId);
  if (inv) {
    const payload = compressInvoiceState(inv);
    window.location.hash = `#/invoice?d=${payload}`;
  }
};

// --- 3. BUNDLE MANAGER RENDERING ---
function renderBundles() {
  const tbody = document.getElementById('bundles-table-body');
  if (tbody) {
    tbody.innerHTML = state.bundles.map(bundle => {
      const pricing = calculateBundlePricing(bundle);
      const itemsBreakdown = getBundleItemsBreakdownText(bundle);

      return `
        <tr>
          <td><strong>${escapeHTML(bundle.name)}</strong><div style="font-size: 0.75rem; color: var(--text-secondary); max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHTML(bundle.description || '')}</div></td>
          <td style="font-size: 0.85rem; color: var(--text-secondary); max-width: 400px; white-space: normal;">${itemsBreakdown}</td>
          <td><strong>${formatZAR(pricing.costTotal)}</strong></td>
          <td style="color: var(--accent); font-weight: 700;">${formatZAR(pricing.clientTotal)}</td>
          <td style="text-align: right;">
            <div style="display: flex; gap: 0.35rem; justify-content: flex-end;">
              <button class="btn btn-secondary btn-sm" onclick="loadBundleInBuilder('${bundle.id}')" title="Load into Builder"><i class="fa-solid fa-file-invoice-dollar"></i> Use</button>
              <button class="btn btn-secondary btn-sm" onclick="editBundle('${bundle.id}')" title="Edit Template"><i class="fa-solid fa-edit"></i></button>
              <button class="btn btn-danger btn-sm" onclick="deleteBundle('${bundle.id}')" title="Delete"><i class="fa-solid fa-trash"></i></button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }
}

function calculateBundlePricing(bundle) {
  let costTotal = 0;
  let clientTotal = 0;
  
  bundle.items.forEach(bItem => {
    const catItem = state.catalog.find(c => c.id === bItem.id);
    if (catItem) {
      const itemCost = catItem.costPrice * bItem.qty;
      costTotal += itemCost;
      clientTotal += (catItem.costPrice * 1.2) * bItem.qty; // Bundle client estimate + 20%
    }
  });

  return { costTotal, clientTotal };
}

function getBundleItemsBreakdownText(bundle) {
  return bundle.items.map(bItem => {
    const catItem = state.catalog.find(c => c.id === bItem.id);
    return catItem ? `${bItem.qty}x ${catItem.name}` : `${bItem.qty}x [Deleted Product]`;
  }).join(', ');
}

window.loadBundleInBuilder = (bundleId) => {
  const bundle = state.bundles.find(b => b.id === bundleId);
  if (bundle) {
    // Overwrite quote items, preserve client details if filled
    state.currentInvoice.items = bundle.items.map(bItem => {
      const catItem = state.catalog.find(c => c.id === bItem.id);
      if (catItem) {
        return {
          id: catItem.id,
          code: catItem.code,
          name: catItem.name,
          category: catItem.category,
          costPrice: catItem.costPrice,
          qty: bItem.qty,
          markup: state.globalMarkup,
          unit: catItem.unit
        };
      }
      return null;
    }).filter(i => i !== null);

    switchView('builder');
  }
};

// Edit bundle trigger
window.editBundle = (bundleId) => {
  const bundle = state.bundles.find(b => b.id === bundleId);
  if (bundle) {
    document.getElementById('bundle-modal-name').value = bundle.name;
    document.getElementById('bundle-modal-desc').value = bundle.description || '';
    
    // Clear list
    const itemsList = document.getElementById('bundle-modal-items-list');
    itemsList.innerHTML = '';
    
    // Populate items rows
    bundle.items.forEach(bItem => {
      addBundleModalSelectorRow(bItem.id, bItem.qty);
    });

    openModal('bundle', bundle.id);
  }
};

window.deleteBundle = (bundleId) => {
  if (confirm("Are you sure you want to delete this bundle template?")) {
    state.bundles = state.bundles.filter(b => b.id !== bundleId);
    saveStateToLocalStorage();
    renderBundles();
    renderDashboard();
  }
};

// Dynamic rows inside creation/editing bundle modal
window.addBundleModalSelectorRow = (selectedId = '', qty = 1) => {
  const container = document.getElementById('bundle-modal-items-list');
  const index = container.children.length;
  
  const options = state.catalog.map(item => {
    return `<option value="${item.id}" ${item.id === selectedId ? 'selected' : ''}>[${item.category}] ${escapeHTML(item.name)} (R ${item.costPrice})</option>`;
  }).join('');

  const row = document.createElement('div');
  row.className = 'form-row';
  row.style.alignItems = 'center';
  row.style.marginBottom = '0.5rem';
  row.innerHTML = `
    <div style="flex-grow: 1;">
      <select class="bundle-item-select" style="font-size: 0.85rem;">
        <option value="">-- Choose Equipment --</option>
        ${options}
      </select>
    </div>
    <div style="width: 80px;">
      <input type="number" class="bundle-item-qty" value="${qty}" min="1" step="1" style="font-size: 0.85rem; padding: 0.5rem;">
    </div>
    <div style="width: 40px; text-align: right;">
      <button class="btn btn-danger btn-sm" onclick="this.parentElement.parentElement.remove()" style="padding: 0.4rem;"><i class="fa-solid fa-trash"></i></button>
    </div>
  `;
  container.appendChild(row);
};

window.submitNewBundle = () => {
  const name = document.getElementById('bundle-modal-name').value;
  const desc = document.getElementById('bundle-modal-desc').value;
  
  if (!name) {
    alert("Bundle Name is required.");
    return;
  }

  // Get items
  const items = [];
  const rows = document.querySelectorAll('#bundle-modal-items-list .form-row');
  rows.forEach(row => {
    const select = row.querySelector('.bundle-item-select');
    const qtyInput = row.querySelector('.bundle-item-qty');
    
    if (select.value) {
      items.push({
        id: select.value,
        qty: parseInt(qtyInput.value) || 1
      });
    }
  });

  if (items.length === 0) {
    alert("Please add at least one component to the bundle.");
    return;
  }

  const bundleId = document.getElementById('modal-bundle').dataset.activeId;
  
  if (bundleId) {
    // Editing
    const idx = state.bundles.findIndex(b => b.id === bundleId);
    if (idx !== -1) {
      state.bundles[idx].name = name;
      state.bundles[idx].description = desc;
      state.bundles[idx].items = items;
    }
  } else {
    // New
    const newBundle = {
      id: 'bundle-' + Date.now(),
      name,
      description: desc,
      items
    };
    state.bundles.push(newBundle);
  }

  saveStateToLocalStorage();
  closeModal('bundle');
  renderBundles();
  renderDashboard();
};

window.openBundleModal = () => {
  document.getElementById('bundle-modal-name').value = '';
  document.getElementById('bundle-modal-desc').value = '';
  document.getElementById('bundle-modal-items-list').innerHTML = '';
  // Add initial row
  addBundleModalSelectorRow();
  openModal('bundle');
};

// --- 4. CATALOG INVENTORY VIEW RENDERING ---
function renderCatalog(filterText = '') {
  const countSpan = document.getElementById('distributor-items-count');
  if (countSpan) countSpan.innerText = state.catalog.length;

  const tbody = document.getElementById('catalog-table-body');
  if (tbody) {
    const filtered = state.catalog.filter(item => {
      return item.name.toLowerCase().includes(filterText.toLowerCase()) || 
             (item.brand && item.brand.toLowerCase().includes(filterText.toLowerCase())) ||
             item.code.toLowerCase().includes(filterText.toLowerCase()) ||
             item.category.toLowerCase().includes(filterText.toLowerCase());
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">No inventory matches.</td></tr>`;
    } else {
      tbody.innerHTML = filtered.map(item => {
        const clientPrice = item.costPrice * 1.2;
        return `
          <tr>
            <td style="font-family: monospace; font-size: 0.85rem; font-weight: 600;">${item.code}</td>
            <td><strong>${escapeHTML(item.name)}</strong><div style="font-size: 0.75rem; color: var(--text-secondary);">${escapeHTML(item.description || '')}</div></td>
            <td><span class="badge" style="background-color: rgba(255,255,255,0.05); color: var(--text-secondary);">${item.category}</span></td>
            <td><strong>${formatZAR(item.costPrice)}</strong></td>
            <td style="color: var(--accent); font-weight: 700;">${formatZAR(clientPrice)}</td>
            <td style="text-align: right;">
              <div style="display: flex; gap: 0.35rem; justify-content: flex-end;">
                <button class="btn btn-secondary btn-sm" onclick="editCatalogItem('${item.id}')" title="Edit Item"><i class="fa-solid fa-edit"></i></button>
                <button class="btn btn-danger btn-sm" onclick="deleteCatalogItem('${item.id}')" title="Remove"><i class="fa-solid fa-trash"></i></button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }
  }
}

window.filterInventoryCatalog = (text) => {
  renderCatalog(text);
};

// Edit catalog item details
window.editCatalogItem = (itemId) => {
  const item = state.catalog.find(i => i.id === itemId);
  if (item) {
    document.getElementById('cat-name').value = item.name;
    document.getElementById('cat-code').value = item.code;
    document.getElementById('cat-brand').value = item.brand || '';
    document.getElementById('cat-category').value = item.category;
    document.getElementById('cat-cost').value = item.costPrice;
    document.getElementById('cat-unit').value = item.unit || 'Unit';
    document.getElementById('cat-description').value = item.description || '';
    
    openModal('add-item', itemId);
  }
};

window.deleteCatalogItem = (itemId) => {
  if (confirm("Are you sure you want to remove this item from the catalog? This might break quotes or bundles using it.")) {
    const updatedCatalog = state.catalog.filter(i => i.id !== itemId);
    saveCatalog(updatedCatalog);
    renderCatalog();
    renderBuilder();
  }
};

window.purgeCatalog = () => {
  if (confirm("Are you sure you want to purge the entire stock catalog? This will persistently delete all items from the database file on the server. Make sure you have exported a backup if needed!")) {
    saveCatalog([]);
    renderCatalog();
    renderBuilder();
    alert("The stock catalog has been cleared successfully.");
  }
};

window.openAddCatalogItemModal = () => {
  document.getElementById('cat-name').value = '';
  document.getElementById('cat-code').value = '';
  document.getElementById('cat-brand').value = '';
  document.getElementById('cat-cost').value = '';
  document.getElementById('cat-unit').value = 'Unit';
  document.getElementById('cat-description').value = '';
  
  openModal('add-item');
};

window.submitNewCatalogItem = () => {
  const name = document.getElementById('cat-name').value;
  const code = document.getElementById('cat-code').value;
  const brand = document.getElementById('cat-brand').value;
  const category = document.getElementById('cat-category').value;
  const costPrice = parseFloat(document.getElementById('cat-cost').value);
  const unit = document.getElementById('cat-unit').value;
  const description = document.getElementById('cat-description').value;

  if (!name || !code || isNaN(costPrice)) {
    alert("Please fill in Name, Code, and valid Cost Price.");
    return;
  }

  const itemId = document.getElementById('modal-add-item').dataset.activeId;
  
  if (itemId) {
    // Edit
    const idx = state.catalog.findIndex(i => i.id === itemId);
    if (idx !== -1) {
      state.catalog[idx] = { ...state.catalog[idx], name, code, brand, category, costPrice, unit, description };
    }
  } else {
    // Add
    const newItem = {
      id: 'item-' + Date.now(),
      code,
      name,
      brand,
      category,
      costPrice,
      unit,
      description
    };
    state.catalog.push(newItem);
  }

  saveCatalog(state.catalog);
  closeModal('add-item');
  renderCatalog();
  renderBuilder();
};

// --- 5. CLIENT-FACING DYNAMIC VIEW (PDF RECEIPT INLIGHT MODE) ---
function renderClientInvoice(invoice) {
  const adminShell = document.getElementById('admin-shell');
  const clientShell = document.getElementById('client-shell');
  
  adminShell.style.display = 'none';
  clientShell.style.display = 'block';

  // Toggle internal admin link helper if we have invoices in active session
  const adminBtn = document.getElementById('client-admin-button');
  if (adminBtn) {
    adminBtn.style.display = 'block'; // Let user go back to their workspace easily
  }

  // Bind settings details to client invoice
  const settings = state.settings || DEFAULT_SETTINGS;

  // Company Brand / Logo Name dynamic splitting
  const logoEl = document.getElementById('client-view-invoice-logo');
  if (logoEl) {
    const compName = settings.companyName || DEFAULT_SETTINGS.companyName;
    const words = compName.toUpperCase().split(/\s+/);
    const firstWord = words[0] || '';
    const rest = words.slice(1).join(' ');
    logoEl.innerHTML = `${firstWord} <span>${rest}</span>`;
  }

  // Tagline
  const taglineEl = document.getElementById('client-view-invoice-tagline');
  if (taglineEl) {
    taglineEl.innerText = (settings.companyTagline || '').toUpperCase();
  }

  // Prepared By Address Details
  document.getElementById('client-view-prepared-name').innerText = settings.companyName || DEFAULT_SETTINGS.companyName;
  document.getElementById('client-view-prepared-address1').innerText = settings.companyAddress1 || '';
  document.getElementById('client-view-prepared-address2').innerText = settings.companyAddress2 || '';
  document.getElementById('client-view-prepared-phone').innerText = settings.companyPhone || '';
  document.getElementById('client-view-prepared-email').innerText = settings.companyEmail || '';

  // Bank Info & POP Email
  document.getElementById('client-view-bank-pop').innerText = settings.companyEmail || '';
  document.getElementById('client-view-bank-name').innerText = settings.bankName || '';
  document.getElementById('client-view-bank-accname').innerText = settings.bankAccName || '';
  document.getElementById('client-view-bank-accnum').innerText = settings.bankAccNum || '';
  document.getElementById('client-view-bank-branch').innerText = settings.bankBranch || '';

  // Header Details
  document.getElementById('client-view-ref').innerText = invoice.id;
  document.getElementById('client-view-date').innerText = invoice.date;

  // Address
  document.getElementById('client-view-customer-name').innerText = invoice.clientName || 'N/A';
  document.getElementById('client-view-customer-email').innerText = invoice.clientEmail || 'N/A';
  document.getElementById('client-view-customer-phone').innerText = invoice.clientPhone || '';
  document.getElementById('client-view-customer-address').innerText = invoice.clientAddress || '';

  // Render items body
  const tbody = document.getElementById('client-view-items-tbody');
  tbody.innerHTML = '';
  
  let subtotal = 0;
  invoice.items.forEach(item => {
    const clientPrice = item.costPrice * (1 + item.markup / 100);
    const rowTotal = clientPrice * item.qty;
    subtotal += rowTotal;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <strong style="color: #111827; font-size: 0.95rem;">${escapeHTML(item.name)}</strong>
        <div style="font-size: 0.75rem; color: #6b7280;">Code: ${item.code}</div>
      </td>
      <td style="text-align: right;">${item.qty}</td>
      <td style="text-align: right;">${formatZAR(clientPrice)}</td>
      <td style="text-align: right; font-weight: 600; color: #111827;">${formatZAR(rowTotal)}</td>
    `;
    tbody.appendChild(tr);
  });

  // South African VAT calculations (15% included or extra. Standard solar quotes represent totals + VAT)
  const vat = subtotal * 0.15;
  const totalWithVat = subtotal + vat;

  document.getElementById('client-view-subtotal').innerText = formatZAR(subtotal);
  document.getElementById('client-view-vat').innerText = formatZAR(vat);
  document.getElementById('client-view-total').innerText = formatZAR(totalWithVat);
}

window.loadAdminFromClient = () => {
  window.location.hash = '#dashboard';
};

// --- 6. DRAG AND DROP CSV IMPORTER ENGINE ---
let parsedCSVData = null;
let csvHeaders = [];

function handleCSVFile(file) {
  // Update drag zone UI with selected filename
  const dragZone = document.getElementById('csv-drag-zone');
  if (dragZone) {
    dragZone.innerHTML = `
      <div class="drag-icon" style="color: var(--success); font-size: 2rem; margin-bottom: 0.5rem;"><i class="fa-solid fa-file-circle-check"></i></div>
      <p style="font-weight: 600; margin-bottom: 0.25rem; color: var(--success);">File Selected: ${escapeHTML(file.name)}</p>
      <p style="font-size: 0.75rem; color: var(--text-secondary);">Size: ${(file.size / 1024).toFixed(1)} KB (Click to change file)</p>
    `;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const text = e.target.result;
    parseCSV(text);
  };
  reader.readAsText(file);
}

function parseCSV(text) {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  if (lines.length === 0) {
    alert("CSV file is empty.");
    return;
  }

  // Deduce delimiter
  const firstLine = lines[0];
  let delimiter = ',';
  if (firstLine.includes(';')) delimiter = ';';
  else if (firstLine.includes('\t')) delimiter = '\t';

  // Read headers
  csvHeaders = firstLine.split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, ''));
  
  // Parse rows
  parsedCSVData = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(delimiter).map(v => v.trim().replace(/^["']|["']$/g, ''));
    if (values.length === csvHeaders.length) {
      const row = {};
      csvHeaders.forEach((header, index) => {
        row[header] = values[index];
      });
      parsedCSVData.push(row);
    }
  }

  // Display column mapping select options
  const selectors = ['csv-col-code', 'csv-col-name', 'csv-col-cost', 'csv-col-category'];
  selectors.forEach(id => {
    const el = document.getElementById(id);
    el.innerHTML = `<option value="">-- Select Column --</option>` +
      csvHeaders.map(h => `<option value="${h}">${h}</option>`).join('');
  });

  // Attempt auto-matching common headers
  autoMatchCSVHeaders();

  document.getElementById('import-mapping-container').style.display = 'block';
  document.getElementById('btn-do-import').disabled = false;
}

function autoMatchCSVHeaders() {
  const matches = {
    'csv-col-code': ['code', 'sku', 'product code', 'id', 'item number'],
    'csv-col-name': ['name', 'description', 'product name', 'title'],
    'csv-col-cost': ['cost', 'cost price', 'trade price', 'price', 'dealer price', 'buy'],
    'csv-col-category': ['category', 'group', 'type']
  };

  for (const [selectId, aliases] of Object.entries(matches)) {
    const select = document.getElementById(selectId);
    for (const option of select.options) {
      const optVal = option.value.toLowerCase();
      if (aliases.includes(optVal)) {
        select.value = option.value;
        break;
      }
    }
  }
}

window.processCSVImport = () => {
  const codeCol = document.getElementById('csv-col-code').value;
  const nameCol = document.getElementById('csv-col-name').value;
  const costCol = document.getElementById('csv-col-cost').value;
  const categoryCol = document.getElementById('csv-col-category').value;

  if (!codeCol || !nameCol || !costCol) {
    alert("Product Code, Product Name, and Cost Price column mappings are mandatory.");
    return;
  }

  let importCount = 0;
  parsedCSVData.forEach(row => {
    const rawCost = parseFloat(row[costCol].replace(/[^\d.]/g, ''));
    if (!isNaN(rawCost)) {
      const code = row[codeCol];
      const name = row[nameCol];
      const category = categoryCol && row[categoryCol] ? row[categoryCol] : 'Inverters'; // default fallback
      
      // Check if duplicate code exists
      const existingIdx = state.catalog.findIndex(item => item.code === code);
      const importedItem = {
        id: existingIdx !== -1 ? state.catalog[existingIdx].id : 'imported-' + Date.now() + Math.random().toString(36).substr(2, 5),
        code,
        name,
        brand: 'Imported',
        category: state.categories.includes(category) ? category : 'Inverters',
        costPrice: rawCost,
        unit: 'Unit',
        description: 'Imported via CSV'
      };

      if (existingIdx !== -1) {
        state.catalog[existingIdx] = importedItem;
      } else {
        state.catalog.push(importedItem);
      }
      importCount++;
    }
  });

  saveCatalog(state.catalog);
  closeModal('import');
  renderCatalog();
  renderBuilder();
  alert(`Imported ${importCount} products successfully!`);
};

// --- CENTRALIZED CATALOG SAVING HELPER ---
export async function saveCatalog(updatedCatalog) {
  state.catalog = updatedCatalog;
  localStorage.setItem('helios_catalog', JSON.stringify(state.catalog));

  if (window.location.protocol !== 'file:') {
    try {
      const res = await fetch('/api/catalog/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ catalog: updatedCatalog })
      });
      if (!res.ok) {
        const data = await res.json();
        console.warn("[Save Catalog] Backend save failed:", data.message);
      } else {
        console.log("[Save Catalog] Persistent backend sync successful.");
      }
    } catch (err) {
      console.warn("[Save Catalog] Failed to connect to server:", err);
    }
  }
}
window.saveCatalog = saveCatalog;

// --- EXPORT CATALOG TO CSV ---
window.exportCatalogToCSV = () => {
  if (state.catalog.length === 0) {
    alert("The catalog is empty. Nothing to export.");
    return;
  }

  const headers = ["Product Code", "Product Name", "Category", "Cost Price (ZAR)", "Brand", "Unit", "Description"];
  const rows = state.catalog.map(item => {
    return [
      item.code || '',
      item.name || '',
      item.category || '',
      item.costPrice || 0,
      item.brand || '',
      item.unit || 'Unit',
      item.description || ''
    ].map(val => {
      let valStr = String(val);
      if (valStr.includes(',') || valStr.includes('"') || valStr.includes('\n') || valStr.includes('\r')) {
        valStr = '"' + valStr.replace(/"/g, '""') + '"';
      }
      return valStr;
    }).join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `helios_catalog_export_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// --- 7. AUTOMATED CRATE SCAPE GETOFFGRID API ---
window.triggerScraper = async () => {
  const userEl = document.getElementById('gog-username');
  const passEl = document.getElementById('gog-password');
  const statusMsg = document.getElementById('scrape-status-message');
  const runBtn = document.getElementById('btn-do-scrape');

  const username = userEl.value;
  const password = passEl.value;

  if (!username || !password) {
    alert("Distributor portal credentials are required.");
    return;
  }

  // Update Status UI
  statusMsg.style.display = 'block';
  statusMsg.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
  statusMsg.style.border = '1px solid var(--border-color)';
  statusMsg.style.color = 'var(--text-secondary)';
  statusMsg.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Triggering backend scraping engine...`;
  runBtn.disabled = true;

  // Protocol Check Guard
  if (window.location.protocol === 'file:') {
    statusMsg.style.backgroundColor = 'var(--danger-glow)';
    statusMsg.style.border = '1px solid var(--danger)';
    statusMsg.style.color = 'var(--danger)';
    statusMsg.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> <strong>Offline Mode (Local File):</strong> The scraper API requires a running backend server. Please open <a href="http://localhost:3000" target="_blank" style="color: #ef4444; text-decoration: underline; font-weight: bold;">http://localhost:3000</a> in your browser to sync prices!`;
    runBtn.disabled = false;
    return;
  }

  try {
    const res = await fetch('/api/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    
    if (res.ok && data.success) {
      statusMsg.style.backgroundColor = 'var(--success-glow)';
      statusMsg.style.border = '1px solid var(--success)';
      statusMsg.style.color = 'var(--success)';
      statusMsg.innerHTML = `<i class="fa-solid fa-check-double"></i> <strong>Success!</strong> Catalog updated. Scraped <strong>${data.itemsScraped} items</strong> from GetOffGrid portal.`;
      
      // Update local storage state
      state.catalog = data.catalog;
      saveStateToLocalStorage();
      
      // Update Sync date indicator
      const syncDate = new Date().toLocaleString('en-ZA');
      localStorage.setItem('helios_last_sync', syncDate);
      document.getElementById('distributor-last-sync').innerText = syncDate;
      
      setTimeout(() => {
        closeModal('scrape');
        renderCatalog();
        renderBuilder();
      }, 2000);
    } else {
      throw new Error(data.message || 'Verification failed. Please check credentials.');
    }
  } catch (err) {
    console.error("Scraper Endpoint error:", err);
    statusMsg.style.backgroundColor = 'var(--danger-glow)';
    statusMsg.style.border = '1px solid var(--danger)';
    statusMsg.style.color = 'var(--danger)';
    statusMsg.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> <strong>Sync Failed:</strong> ${err.message}`;
  } finally {
    runBtn.disabled = false;
  }
};

// --- MODAL UTILS ---
export function openModal(modalName, activeId = '') {
  const modalOverlay = document.getElementById(`modal-${modalName}`);
  if (modalOverlay) {
    modalOverlay.classList.add('active');
    if (activeId) {
      modalOverlay.dataset.activeId = activeId;
    } else {
      delete modalOverlay.dataset.activeId;
    }
  }
}
window.openModal = openModal;
window.openScrapeModal = () => openModal('scrape');
window.openImportModal = () => openModal('import');

export function closeModal(modalName) {
  const modalOverlay = document.getElementById(`modal-${modalName}`);
  if (modalOverlay) {
    modalOverlay.classList.remove('active');
    delete modalOverlay.dataset.activeId;
    
    // Reset specific forms inside modals
    if (modalName === 'scrape') {
      document.getElementById('gog-password').value = '';
      document.getElementById('scrape-status-message').style.display = 'none';
    } else if (modalName === 'import') {
      document.getElementById('import-mapping-container').style.display = 'none';
      document.getElementById('btn-do-import').disabled = true;
      
      // Reset drag-drop zone text
      const dragZone = document.getElementById('csv-drag-zone');
      if (dragZone) {
        dragZone.innerHTML = `
          <div class="drag-icon"><i class="fa-solid fa-cloud-arrow-up"></i></div>
          <p style="font-weight: 600; margin-bottom: 0.25rem;">Click to browse or drag & drop CSV file</p>
          <p style="font-size: 0.75rem; color: var(--text-muted);">Only .csv files supported</p>
        `;
      }
      
      // Reset file input element
      const fileInput = document.getElementById('csv-file-input');
      if (fileInput) fileInput.value = '';
    }
  }
}
window.closeModal = closeModal;

// --- FORMATTING UTILS ---
function formatZAR(val) {
  return 'R ' + val.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
