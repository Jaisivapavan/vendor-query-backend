// State management
let authToken = localStorage.getItem('vendorquery_token') || '';
let currentVendor = null;
let allMenuItems = [];
let topDishesChart = null;
let paymentSplitChart = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  setupTabs();
  setupChat();
  setupApiConsole();
  setupMenuFilters();
  
  // Auto login demo vendor if no token exists
  await ensureAuthenticated();
  
  // Load dashboard data
  await refreshDashboard();

  document.getElementById('btn-login-demo').addEventListener('click', async () => {
    localStorage.removeItem('vendorquery_token');
    authToken = '';
    await ensureAuthenticated(true);
    await refreshDashboard();
  });

  document.getElementById('btn-refresh-data').addEventListener('click', async () => {
    await refreshDashboard();
  });
});

// 1. Authentication Engine
async function ensureAuthenticated(force = false) {
  if (authToken && !force) {
    try {
      const res = await fetch('/api/auth/profile', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        currentVendor = data.data;
        updateVendorDisplay('Spice Craft Bistro');
        return;
      }
    } catch {
      // Fall through to login
    }
  }

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'demo@restaurant.com',
        password: 'password123',
      }),
    });

    const data = await res.json();
    if (data.success && data.data?.token) {
      authToken = data.data.token;
      localStorage.setItem('vendorquery_token', authToken);
      currentVendor = data.data.vendor;
      updateVendorDisplay(currentVendor.businessName || 'Spice Craft Bistro');
      console.log('✅ Authenticated as demo vendor successfully');
    }
  } catch (err) {
    console.error('Failed to authenticate demo vendor:', err);
  }
}

function updateVendorDisplay(name) {
  const el = document.getElementById('vendor-name-display');
  if (el) el.textContent = name;
}

// 2. Fetch and render KPIs & Charts
async function refreshDashboard() {
  await Promise.all([loadRevenueKpi(), loadTopDishes(), loadPaymentSplit(), loadMenuItems()]);
}

async function loadRevenueKpi() {
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
    console.error('Failed to load revenue KPI:', err);
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
  const ctx = document.getElementById('chart-top-dishes').getContext('2d');
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
          backgroundColor: 'rgba(99, 102, 241, 0.75)',
          borderColor: '#6366f1',
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
          callbacks: {
            afterLabel: (ctx) => `Revenue: ₹${revenues[ctx.dataIndex].toLocaleString('en-IN')}`,
          },
        },
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#94a3b8' },
        },
        y: {
          grid: { display: false },
          ticks: { color: '#f8fafc', font: { weight: '600' } },
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
  const ctx = document.getElementById('chart-payment-split').getContext('2d');
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
          backgroundColor: ['#06b6d4', '#6366f1', '#10b981'],
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: { color: '#94a3b8', font: { size: 12 } },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => ` Sales: ₹${Number(ctx.raw).toLocaleString('en-IN')}`,
          },
        },
      },
      cutout: '72%',
    },
  });
}

// 3. POS Menu Management
async function loadMenuItems() {
  try {
    const res = await fetch('/api/menu/items', {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const result = await res.json();
    if (result.success && Array.isArray(result.data)) {
      allMenuItems = result.data;
      renderMenuItems(allMenuItems);
    }
  } catch (err) {
    console.error('Failed to load menu items:', err);
  }
}

function renderMenuItems(items) {
  const container = document.getElementById('dishes-container');
  if (!items || items.length === 0) {
    container.innerHTML = '<div style="color: var(--text-muted); padding: 1.5rem;">No dishes match your filter.</div>';
    return;
  }

  container.innerHTML = items
    .map(
      (item) => `
      <div class="dish-card">
        <div>
          <div class="dish-name">${item.name}</div>
          <div class="dish-cat">${item.category?.name || 'Category'}</div>
        </div>
        <div class="dish-price">₹${item.price}</div>
      </div>
    `
    )
    .join('');
}

function setupMenuFilters() {
  const searchInput = document.getElementById('menu-search');
  const filterButtons = document.querySelectorAll('#category-filters button');

  let activeCat = 'all';

  filterButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterButtons.forEach((b) => {
        b.style.background = 'var(--bg-secondary)';
        b.style.color = 'var(--text-secondary)';
      });
      btn.style.background = 'var(--accent-gradient)';
      btn.style.color = '#fff';

      activeCat = btn.getAttribute('data-cat');
      filterDishes();
    });
  });

  searchInput.addEventListener('input', () => {
    filterDishes();
  });

  function filterDishes() {
    const query = searchInput.value.toLowerCase().trim();
    const filtered = allMenuItems.filter((dish) => {
      const matchCat = activeCat === 'all' || dish.category?.name === activeCat;
      const matchName = dish.name.toLowerCase().includes(query);
      return matchCat && matchName;
    });
    renderMenuItems(filtered);
  }
}

// 4. Conversational AI Chat with SSE Streaming
function setupChat() {
  const form = document.getElementById('chat-form');
  const input = document.getElementById('chat-input');
  const messagesContainer = document.getElementById('chat-messages');
  const statusContainer = document.getElementById('chat-status');
  const statusText = document.getElementById('chat-status-text');
  const clearBtn = document.getElementById('btn-clear-chat');
  const chips = document.querySelectorAll('.chat-chips .chip');

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const prompt = chip.getAttribute('data-prompt');
      input.value = prompt;
      form.dispatchEvent(new Event('submit'));
    });
  });

  clearBtn.addEventListener('click', () => {
    messagesContainer.innerHTML = `
      <div class="message ai">
        <div class="msg-avatar ai">🤖</div>
        <div class="msg-content">Chat history cleared. How can I assist you with restaurant analytics?</div>
      </div>
    `;
  });

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

    // Create placeholder for streaming AI message
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
              // ignore parse errors on partial frames
            }
          }
        }
      }
    } catch (err) {
      console.error('Chat stream failed:', err);
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

// 5. Tabs Switcher
function setupTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      tabButtons.forEach((b) => b.classList.remove('active'));
      tabContents.forEach((c) => (c.style.display = 'none'));

      btn.classList.add('active');
      const targetId = btn.getAttribute('data-tab');
      const targetContent = document.getElementById(targetId);
      if (targetContent) targetContent.style.display = 'block';
    });
  });
}

// 6. Interactive REST API Console
function setupApiConsole() {
  const buttons = document.querySelectorAll('.api-btn');
  const urlDisplay = document.getElementById('api-console-url');
  const outputPre = document.getElementById('api-console-output');

  buttons.forEach((btn) => {
    btn.addEventListener('click', async () => {
      const endpoint = btn.getAttribute('data-url');
      urlDisplay.textContent = `Executing: ${endpoint}...`;
      outputPre.textContent = 'Loading response...';

      try {
        const res = await fetch(endpoint, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const data = await res.json();
        urlDisplay.textContent = `Status: ${res.status} ${res.statusText} | URL: ${endpoint}`;
        outputPre.textContent = JSON.stringify(data, null, 2);
      } catch (err) {
        urlDisplay.textContent = `Failed: ${endpoint}`;
        outputPre.textContent = err.message || 'Request failed';
      }
    });
  });
}
