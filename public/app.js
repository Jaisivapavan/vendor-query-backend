// State Management
let authToken = localStorage.getItem('vendorquery_token') || '';
let currentVendor = null;
let allMenuItems = [];
let allCategories = [];
let topDishesChart = null;
let paymentSplitChart = null;
let isDevMode = localStorage.getItem('vendorquery_dev_mode') === 'true';

// Initialize application on DOM ready
document.addEventListener('DOMContentLoaded', async () => {
  setupNavigation();
  setupAuthForms();
  setupSidebarNavigation();
  setupAiChatDrawer();
  setupMenuManagement();
  setupReports();
  setupSettings();

  // Listen for browser back / forward navigation and hash changes
  window.addEventListener('popstate', () => {
    handleRoute(window.location.pathname, false);
  });
  window.addEventListener('hashchange', () => {
    handleRoute(window.location.hash.replace(/^#/, '') || '/', false);
  });

  // Verify auth session
  if (authToken) {
    await verifySession();
  }

  // Route initial URL (checking hash first if present, otherwise pathname)
  const initialPath = window.location.hash ? window.location.hash.replace(/^#/, '') : window.location.pathname;
  handleRoute(initialPath, false);
});

// ============================================================
// 1. CLIENT-SIDE ROUTER & SCREEN SWITCHER
// ============================================================
function navigateTo(path, pushState = true) {
  if (pushState && window.location.pathname !== path) {
    window.history.pushState({ path }, '', path);
  }
  handleRoute(path, false);
}

async function handleRoute(pathname, pushState = true) {
  let cleanPath = (pathname || window.location.pathname).toLowerCase().replace(/\/$/, '') || '/';
  if (cleanPath.startsWith('#')) {
    cleanPath = cleanPath.replace(/^#/, '') || '/';
  }

  // Public Unauthenticated Routes
  if (cleanPath === '/' || cleanPath === '/landing') {
    showScreen('landing');
    return;
  }
  if (cleanPath === '/login') {
    showScreen('login');
    return;
  }
  if (cleanPath === '/signup') {
    showScreen('signup');
    return;
  }

  // Protected Dashboard Routes (Require Auth)
  if (!authToken) {
    navigateTo('/login', true);
    return;
  }

  showScreen('app');

  const sectionMap = {
    '/dashboard': 'section-overview',
    '/overview': 'section-overview',
    '/menu': 'section-menu',
    '/orders': 'section-orders',
    '/reports': 'section-reports',
    '/settings': 'section-settings',
  };

  const sectionId = sectionMap[cleanPath] || 'section-overview';
  switchDashboardSection(sectionId);
  await refreshAllDashboardData();
}

function showScreen(screen) {
  document.getElementById('view-landing').style.display = screen === 'landing' ? 'flex' : 'none';
  document.getElementById('view-login').style.display = screen === 'login' ? 'flex' : 'none';
  document.getElementById('view-signup').style.display = screen === 'signup' ? 'flex' : 'none';
  document.getElementById('view-app').style.display = screen === 'app' ? 'flex' : 'none';

  const aiFab = document.getElementById('ai-fab');
  const chatDrawer = document.getElementById('chat-drawer');
  if (screen === 'app') {
    aiFab.style.display = 'flex';
  } else {
    aiFab.style.display = 'none';
    chatDrawer.classList.remove('open');
  }
}

function switchDashboardSection(sectionId) {
  const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
  const sections = document.querySelectorAll('.app-section');
  const pageTitle = document.getElementById('page-title-display');

  const titles = {
    'section-overview': 'Restaurant Overview',
    'section-menu': 'Menu Management',
    'section-orders': 'Order History',
    'section-reports': 'Sales Analytics & Reports',
    'section-settings': 'Restaurant Profile & Settings',
  };

  navItems.forEach((i) => {
    if (i.getAttribute('data-section') === sectionId) {
      i.classList.add('active');
    } else {
      i.classList.remove('active');
    }
  });

  sections.forEach((s) => (s.style.display = 'none'));
  const target = document.getElementById(sectionId);
  if (target) {
    target.style.display = 'block';
    pageTitle.textContent = titles[sectionId] || 'Dashboard';
  }

  // Load section-specific data
  if (sectionId === 'section-orders') {
    loadOrders();
  } else if (sectionId === 'section-menu') {
    loadMenuItems();
  } else if (sectionId === 'section-reports') {
    loadReports(30);
  }
}

function setupNavigation() {
  // Landing page links & buttons
  document.getElementById('btn-goto-login').addEventListener('click', () => navigateTo('/login'));
  document.getElementById('btn-goto-signup').addEventListener('click', () => navigateTo('/signup'));
  document.getElementById('btn-landing-login').addEventListener('click', () => navigateTo('/login'));
  
  // Landing Try Demo CTA
  document.getElementById('btn-landing-try-demo').addEventListener('click', async () => {
    await loginWithCredentials('demo@restaurant.com', 'password123');
  });

  // Switch between Login and Signup screens
  document.getElementById('link-goto-signup').addEventListener('click', () => navigateTo('/signup'));
  document.getElementById('link-goto-login').addEventListener('click', () => navigateTo('/login'));
  document.getElementById('link-login-back-landing').addEventListener('click', () => navigateTo('/'));
  document.getElementById('link-signup-back-landing').addEventListener('click', () => navigateTo('/'));

  // Separate Demo Sign-in on Login screen
  document.getElementById('btn-login-fill-demo').addEventListener('click', async () => {
    await loginWithCredentials('demo@restaurant.com', 'password123');
  });

  // Logout button in sidebar
  document.getElementById('btn-logout').addEventListener('click', () => {
    localStorage.removeItem('vendorquery_token');
    authToken = '';
    currentVendor = null;
    navigateTo('/');
  });

  // Top Bar Refresh Button
  document.getElementById('btn-refresh-metrics').addEventListener('click', async () => {
    await refreshAllDashboardData();
  });
}

// ============================================================
// 2. AUTHENTICATION (LOGIN & SIGNUP)
// ============================================================
async function verifySession() {
  try {
    const res = await fetch('/api/auth/profile', {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (res.ok) {
      const data = await res.json();
      currentVendor = data.data;
      updateVendorUi();
      return true;
    }
  } catch (err) {
    console.error('Session validation error:', err);
  }
  return false;
}

async function loginWithCredentials(email, password) {
  const errorBox = document.getElementById('login-error');
  errorBox.style.display = 'none';

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (data.success && data.data?.token) {
      authToken = data.data.token;
      localStorage.setItem('vendorquery_token', authToken);
      currentVendor = data.data.vendor;
      updateVendorUi();
      showScreen('app');
      await refreshAllDashboardData();
    } else {
      errorBox.textContent = data.error || 'Invalid email or password.';
      errorBox.style.display = 'block';
    }
  } catch (err) {
    errorBox.textContent = 'Connection failed. Please verify server is running.';
    errorBox.style.display = 'block';
  }
}

function setupAuthForms() {
  // Login form submit
  document.getElementById('form-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    await loginWithCredentials(email, password);
  });

  // Signup form submit
  document.getElementById('form-signup').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorBox = document.getElementById('signup-error');
    errorBox.style.display = 'none';

    const businessName = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;

    if (password !== confirmPassword) {
      errorBox.textContent = 'Passwords do not match.';
      errorBox.style.display = 'block';
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessName, email, password }),
      });

      const data = await res.json();
      if (data.success && data.data?.token) {
        authToken = data.data.token;
        localStorage.setItem('vendorquery_token', authToken);
        currentVendor = data.data.vendor;
        updateVendorUi();
        showScreen('app');
        await refreshAllDashboardData();
      } else {
        errorBox.textContent = data.error || 'Failed to register account.';
        errorBox.style.display = 'block';
      }
    } catch (err) {
      errorBox.textContent = 'Registration request failed.';
      errorBox.style.display = 'block';
    }
  });
}

function updateVendorUi() {
  if (!currentVendor) return;
  const name = currentVendor.businessName || 'Spice Craft Bistro';
  document.getElementById('sidebar-vendor-name').textContent = name;
  document.getElementById('sidebar-vendor-initial').textContent = name.charAt(0).toUpperCase();

  // Settings
  document.getElementById('settings-vendor-name').value = name;
  document.getElementById('settings-vendor-email').value = currentVendor.email || '';
  document.getElementById('settings-vendor-id').value = currentVendor.id || '';
}

// ============================================================
// 3. LEFT SIDEBAR NAVIGATION
// ============================================================
function setupSidebarNavigation() {
  const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
  const pathMap = {
    'section-overview': '/dashboard',
    'section-menu': '/menu',
    'section-orders': '/orders',
    'section-reports': '/reports',
    'section-settings': '/settings',
  };

  navItems.forEach((item) => {
    item.addEventListener('click', () => {
      const targetSectionId = item.getAttribute('data-section');
      const targetPath = pathMap[targetSectionId] || '/dashboard';
      navigateTo(targetPath, true);
    });
  });
}

async function refreshAllDashboardData() {
  await Promise.all([
    loadOverviewKpis(),
    loadTopDishes(),
    loadPaymentSplit(),
    loadCategories(),
    loadMenuItems(),
  ]);
}

// ============================================================
// 4. OVERVIEW SECTION (KPIS & CHARTS)
// ============================================================
async function loadOverviewKpis() {
  try {
    const res = await fetch('/api/reports/revenue', {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const result = await res.json();
    if (result.success && result.data) {
      const d = result.data;
      document.getElementById('kpi-revenue').textContent = `₹${d.totalRevenue.toLocaleString('en-IN')}`;
      document.getElementById('kpi-orders').textContent = d.totalOrders;
      document.getElementById('kpi-tax').textContent = `₹${d.totalTax.toLocaleString('en-IN')}`;
      document.getElementById('kpi-aov').textContent = `₹${d.averageOrderValue.toFixed(2)}`;
    }
  } catch (err) {
    console.error('Failed to load KPIs:', err);
  }
}

async function loadTopDishes() {
  try {
    const res = await fetch('/api/reports/top-items?limit=5', {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const result = await res.json();
    if (result.success && Array.isArray(result.data)) {
      renderTopDishesChart(result.data);
    }
  } catch (err) {
    console.error('Failed to load top dishes:', err);
  }
}

function renderTopDishesChart(items) {
  const canvas = document.getElementById('chart-top-dishes');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const labels = items.map((i) => i.name);
  const quantities = items.map((i) => i.totalQuantitySold);
  const revenues = items.map((i) => i.totalRevenue);

  if (topDishesChart) topDishesChart.destroy();

  topDishesChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Quantity Sold',
          data: quantities,
          backgroundColor: 'rgba(79, 70, 229, 0.85)',
          hoverBackgroundColor: '#4338ca',
          borderColor: '#4f46e5',
          borderWidth: 1,
          borderRadius: 6,
        },
      ],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0f172a',
          titleColor: '#ffffff',
          bodyColor: '#e2e8f0',
          padding: 10,
          cornerRadius: 8,
          callbacks: {
            afterLabel: (ctx) => `Revenue: ₹${revenues[ctx.dataIndex].toLocaleString('en-IN')}`,
          },
        },
      },
      scales: {
        x: {
          grid: { color: '#f1f5f9' },
          ticks: { color: '#64748b', font: { family: "'Inter', sans-serif" } },
        },
        y: {
          grid: { display: false },
          ticks: { color: '#0f172a', font: { weight: '600', family: "'Inter', sans-serif" } },
        },
      },
    },
  });
}

async function loadPaymentSplit() {
  try {
    const res = await fetch('/api/reports/payment-split', {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const result = await res.json();
    if (result.success && Array.isArray(result.data)) {
      renderPaymentSplitChart(result.data);
    }
  } catch (err) {
    console.error('Failed to load payment split:', err);
  }
}

function renderPaymentSplitChart(items) {
  const canvas = document.getElementById('chart-payment-split');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const labels = items.map((i) => `${i.paymentMethod} (${i.orderSharePercentage}%)`);
  const data = items.map((i) => i.totalAmount);

  if (paymentSplitChart) paymentSplitChart.destroy();

  paymentSplitChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: ['#0d9488', '#4f46e5', '#f59e0b'],
          borderColor: '#ffffff',
          borderWidth: 3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: '#334155',
            font: { size: 12, weight: '600', family: "'Inter', sans-serif" },
            padding: 12,
          },
        },
        tooltip: {
          backgroundColor: '#0f172a',
          titleColor: '#ffffff',
          bodyColor: '#e2e8f0',
          padding: 10,
          cornerRadius: 8,
          callbacks: {
            label: (ctx) => ` Sales: ₹${Number(ctx.raw).toLocaleString('en-IN')}`,
          },
        },
      },
      cutout: '72%',
    },
  });
}

// ============================================================
// 5. MENU MANAGEMENT (ADD, EDIT, TOGGLE AVAILABILITY)
// ============================================================
async function loadCategories() {
  try {
    const res = await fetch('/api/menu/categories', {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const data = await res.json();
    if (data.success && Array.isArray(data.data)) {
      allCategories = data.data;
      const select = document.getElementById('dish-category');
      select.innerHTML = allCategories
        .map((cat) => `<option value="${cat.id}">${cat.name}</option>`)
        .join('');
    }
  } catch (err) {
    console.error('Failed to load categories:', err);
  }
}

async function loadMenuItems() {
  const tbody = document.getElementById('menu-table-body');
  try {
    const res = await fetch('/api/menu/items', {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const data = await res.json();
    if (data.success && Array.isArray(data.data)) {
      allMenuItems = data.data;
      filterAndRenderMenu();
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--danger); padding: 1.5rem;">Failed to load dishes.</td></tr>`;
  }
}

function filterAndRenderMenu() {
  const searchInput = document.getElementById('menu-search-input');
  const query = (searchInput?.value || '').toLowerCase().trim();
  const activeBtn = document.querySelector('#menu-category-chips .category-chip.active');
  const activeCat = activeBtn?.getAttribute('data-cat') || 'all';

  const filtered = allMenuItems.filter((dish) => {
    const matchCat = activeCat === 'all' || dish.category?.name === activeCat;
    const matchName = dish.name.toLowerCase().includes(query);
    return matchCat && matchName;
  });

  const tbody = document.getElementById('menu-table-body');
  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 2rem;">No matching dishes found.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered
    .map(
      (item) => `
      <tr>
        <td>
          <div style="font-weight: 600; color: var(--text-heading);">${item.name}</div>
          <div style="font-size: 0.78rem; color: var(--text-secondary);">${item.description || 'No description provided'}</div>
        </td>
        <td>
          <span class="badge badge-secondary">${item.category?.name || 'Uncategorized'}</span>
        </td>
        <td style="font-weight: 700; color: var(--primary);">₹${Number(item.price).toFixed(2)}</td>
        <td>
          <label class="switch">
            <input type="checkbox" class="toggle-availability" data-id="${item.id}" ${item.isAvailable ? 'checked' : ''}>
            <span class="slider"></span>
          </label>
          <span style="font-size: 0.8rem; margin-left: 0.5rem; color: ${item.isAvailable ? 'var(--success)' : 'var(--text-muted)'}; font-weight: 600;">
            ${item.isAvailable ? 'In Stock' : 'Unavailable'}
          </span>
        </td>
        <td>
          <span style="font-size: 0.8rem; color: var(--text-secondary);">Active</span>
        </td>
      </tr>
    `
    )
    .join('');

  // Attach toggle listeners
  tbody.querySelectorAll('.toggle-availability').forEach((checkbox) => {
    checkbox.addEventListener('change', async (e) => {
      const id = e.target.getAttribute('data-id');
      const isAvailable = e.target.checked;
      await toggleDishAvailability(id, isAvailable);
    });
  });
}

async function toggleDishAvailability(id, isAvailable) {
  try {
    const res = await fetch(`/api/menu/items/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ isAvailable }),
    });
    if (res.ok) {
      const item = allMenuItems.find((i) => i.id === id);
      if (item) item.isAvailable = isAvailable;
      filterAndRenderMenu();
    }
  } catch (err) {
    console.error('Failed to toggle availability:', err);
  }
}

function setupMenuManagement() {
  // Category filter chips
  const chips = document.querySelectorAll('#menu-category-chips .category-chip');
  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      chips.forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      filterAndRenderMenu();
    });
  });

  // Search input
  const searchInput = document.getElementById('menu-search-input');
  searchInput.addEventListener('input', () => filterAndRenderMenu());

  // Modal handlers
  const modal = document.getElementById('modal-add-dish');
  document.getElementById('btn-modal-add-dish').addEventListener('click', () => {
    modal.style.display = 'flex';
  });
  document.getElementById('btn-close-modal').addEventListener('click', () => {
    modal.style.display = 'none';
  });
  document.getElementById('btn-cancel-modal').addEventListener('click', () => {
    modal.style.display = 'none';
  });

  // Form submit: Add Dish
  document.getElementById('form-add-dish').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('dish-name').value.trim();
    const categoryId = document.getElementById('dish-category').value;
    const price = parseFloat(document.getElementById('dish-price').value);
    const description = document.getElementById('dish-desc').value.trim();

    try {
      const res = await fetch('/api/menu/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ name, categoryId, price, description }),
      });

      const result = await res.json();
      if (result.success) {
        modal.style.display = 'none';
        document.getElementById('form-add-dish').reset();
        await loadMenuItems();
      } else {
        alert(result.error || 'Failed to create dish');
      }
    } catch (err) {
      alert('Network error while adding dish');
    }
  });
}

// ============================================================
// 6. ORDERS SECTION
// ============================================================
async function loadOrders() {
  const tbody = document.getElementById('orders-table-body');
  try {
    const res = await fetch('/api/orders?limit=25', {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const result = await res.json();
    if (result.success && Array.isArray(result.data)) {
      if (result.data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">No orders found.</td></tr>`;
        return;
      }

      tbody.innerHTML = result.data
        .map((order) => {
          const dateStr = new Date(order.createdAt).toLocaleString('en-IN', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });
          const itemCount = order.orderItems ? order.orderItems.length : (order._count?.orderItems || 'Items');
          const statusClass = order.status === 'COMPLETED' ? 'badge-success' : 'badge-warning';

          return `
          <tr>
            <td style="font-family: monospace; font-size: 0.8rem; font-weight: 600;">#${order.id.slice(0, 8)}</td>
            <td style="color: var(--text-secondary);">${dateStr}</td>
            <td><strong>${itemCount}</strong> items</td>
            <td><span class="badge badge-secondary">${order.paymentMethod}</span></td>
            <td style="font-weight: 700; color: var(--text-heading);">₹${Number(order.totalAmount).toLocaleString('en-IN')}</td>
            <td><span class="badge ${statusClass}">${order.status}</span></td>
          </tr>
        `;
        })
        .join('');
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--danger); padding: 1.5rem;">Failed to load orders.</td></tr>`;
  }
}

// ============================================================
// 7. REPORTS SECTION
// ============================================================
function setupReports() {
  const buttons = document.querySelectorAll('.report-filter-btn');
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      buttons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const days = parseInt(btn.getAttribute('data-days'), 10);
      loadReports(days);
    });
  });
}

async function loadReports(days = 30) {
  const container = document.getElementById('report-stats-grid');
  const title = document.getElementById('report-period-title');
  title.textContent = `Sales Analytics (Past ${days} Days)`;

  const endDate = new Date().toISOString();
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  try {
    const res = await fetch(`/api/reports/revenue?startDate=${startDate}&endDate=${endDate}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const result = await res.json();
    if (result.success && result.data) {
      const d = result.data;
      container.innerHTML = `
        <div style="background: #ffffff; padding: 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
          <div style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 600;">GROSS REVENUE</div>
          <div style="font-size: 1.6rem; font-weight: 700; color: var(--primary);">₹${d.totalRevenue.toLocaleString('en-IN')}</div>
        </div>
        <div style="background: #ffffff; padding: 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
          <div style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 600;">NET REVENUE</div>
          <div style="font-size: 1.6rem; font-weight: 700; color: var(--text-heading);">₹${d.netRevenue.toLocaleString('en-IN')}</div>
        </div>
        <div style="background: #ffffff; padding: 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
          <div style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 600;">COMPLETED ORDERS</div>
          <div style="font-size: 1.6rem; font-weight: 700; color: var(--text-heading);">${d.totalOrders}</div>
        </div>
        <div style="background: #ffffff; padding: 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
          <div style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 600;">TAX COLLECTED</div>
          <div style="font-size: 1.6rem; font-weight: 700; color: var(--warning);">₹${d.totalTax.toLocaleString('en-IN')}</div>
        </div>
      `;
    }
  } catch (err) {
    container.innerHTML = `<div style="color: var(--danger);">Failed to calculate reports.</div>`;
  }
}

// ============================================================
// 8. SETTINGS & PROFILE (WITH DEV MODE TOGGLE)
// ============================================================
function setupSettings() {
  const toggle = document.getElementById('toggle-dev-mode');
  toggle.checked = isDevMode;
  applyDevMode(isDevMode);

  toggle.addEventListener('change', (e) => {
    isDevMode = e.target.checked;
    localStorage.setItem('vendorquery_dev_mode', isDevMode);
    applyDevMode(isDevMode);
  });
}

function applyDevMode(enabled) {
  const devChip = document.getElementById('chip-dev-injection');
  if (devChip) {
    devChip.style.display = enabled ? 'inline-block' : 'none';
  }
}

// ============================================================
// 9. FEATURE 5: FLOATING AI CHAT DRAWER & SSE STREAMING
// ============================================================
function setupAiChatDrawer() {
  const fab = document.getElementById('ai-fab');
  const drawer = document.getElementById('chat-drawer');
  const closeBtn = document.getElementById('btn-close-drawer');
  const openChatTopBtn = document.getElementById('btn-open-ai-chat');

  const toggleDrawer = () => drawer.classList.toggle('open');
  fab.addEventListener('click', toggleDrawer);
  closeBtn.addEventListener('click', () => drawer.classList.remove('open'));
  if (openChatTopBtn) {
    openChatTopBtn.addEventListener('click', () => drawer.classList.add('open'));
  }

  // Suggestion chips
  const chips = document.querySelectorAll('.chat-chips .chip');
  const input = document.getElementById('chat-input');
  const form = document.getElementById('chat-form');
  const messagesContainer = document.getElementById('chat-messages');
  const statusContainer = document.getElementById('chat-status');
  const statusText = document.getElementById('chat-status-text');

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      input.value = chip.getAttribute('data-prompt');
      form.dispatchEvent(new Event('submit'));
    });
  });

  // Chat submit form
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = input.value.trim();
    if (!message) return;

    input.value = '';

    // Append user message
    appendMessage('user', message);

    // Show status indicator
    statusContainer.style.display = 'block';
    statusText.textContent = 'Analyzing question and determining required analytics...';

    // Create placeholder for AI response
    const aiMessageEl = appendMessage('ai', '');
    const contentEl = aiMessageEl.querySelector('.msg-content');

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        statusContainer.style.display = 'none';
        contentEl.textContent = 'Error: Could not connect to AI service.';
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6);
            try {
              const event = JSON.parse(jsonStr);

              if (event.type === 'status') {
                statusText.textContent = event.message;
              } else if (event.type === 'chunk') {
                statusContainer.style.display = 'none';
                contentEl.textContent += event.text;
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
              } else if (event.type === 'error') {
                statusContainer.style.display = 'none';
                contentEl.textContent += `\n[Error: ${event.error}]`;
              } else if (event.type === 'done') {
                statusContainer.style.display = 'none';
              }
            } catch {
              // ignore partial json
            }
          }
        }
      }
    } catch (err) {
      statusContainer.style.display = 'none';
      contentEl.textContent = 'Network error while streaming AI response.';
    } finally {
      statusContainer.style.display = 'none';
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  });

  function appendMessage(sender, text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender}`;

    const avatarDiv = document.createElement('div');
    avatarDiv.className = `msg-avatar ${sender}`;
    avatarDiv.textContent = sender === 'ai' ? '🤖' : '👤';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'msg-content';
    contentDiv.textContent = text;

    msgDiv.appendChild(avatarDiv);
    msgDiv.appendChild(contentDiv);
    messagesContainer.appendChild(msgDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    return msgDiv;
  }
}
