/* BizFlow AI — Made by Sodisetti Sai Krishna | Copyrights Reserved 2026 */
(function () {
  'use strict';

  // ---------- State ----------
  let transactions = [];
  let toastTimer = null;
  let currentUser = null;

  const STORAGE_USERS = 'bizflow_users';
  const STORAGE_SESSION = 'bizflow_session';

  // ---------- Helpers ----------
  const $ = (id) => document.getElementById(id);

  function money(n) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(Number(n) || 0);
  }

  function cleanNum(v) {
    if (v == null) return 0;
    const s = String(v).replace(/[₹,\s]/g, '');
    const n = parseFloat(s);
    return isNaN(n) ? 0 : n;
  }

  function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, (m) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m])
    );
  }

  function slug(s) {
    return String(s)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  function toast(msg) {
    const el = $('toast');
    if (!el) return;
    el.textContent = msg;
    el.style.display = 'block';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.style.display = 'none';
    }, 2800);
  }

  // ---------- Validation ----------
  function isValidEmail(email) {
    // Must contain @ and a domain with a dot (e.g. name@gmail.com)
    const e = String(email || '').trim().toLowerCase();
    return /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(e);
  }

  function isValidPhone(phone) {
    // Exactly 10 digits
    return /^[0-9]{10}$/.test(String(phone || '').trim());
  }

  function normalizePhone(phone) {
    return String(phone || '').replace(/\D/g, '').slice(0, 10);
  }

  // ---------- Auth storage ----------
  function getUsers() {
    try {
      const raw = localStorage.getItem(STORAGE_USERS);
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  }

  function saveUsers(users) {
    localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
  }

  function findUserByEmail(email) {
    const e = String(email || '').trim().toLowerCase();
    return getUsers().find((u) => u.email === e) || null;
  }

  function findUserByPhone(phone) {
    const p = normalizePhone(phone);
    return getUsers().find((u) => u.phone === p) || null;
  }

  function saveSession(user) {
    localStorage.setItem(
      STORAGE_SESSION,
      JSON.stringify({
        email: user.email,
        phone: user.phone,
        name: user.name,
        loggedInAt: Date.now()
      })
    );
  }

  function clearSession() {
    localStorage.removeItem(STORAGE_SESSION);
  }

  function getSession() {
    try {
      const raw = localStorage.getItem(STORAGE_SESSION);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  // ---------- Auth UI ----------
  function showAuthError(form, msg) {
    const id = form === 'login' ? 'loginError' : 'signupError';
    const el = $(id);
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    if (form === 'signup') {
      const ok = $('signupSuccess');
      if (ok) ok.hidden = true;
    }
  }

  function clearAuthMessages() {
    ['loginError', 'signupError', 'signupSuccess'].forEach((id) => {
      const el = $(id);
      if (el) {
        el.hidden = true;
        el.textContent = '';
      }
    });
  }

  function switchAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach((b) => {
      b.classList.toggle('active', b.dataset.auth === tab);
    });
    $('loginForm').classList.toggle('active', tab === 'login');
    $('signupForm').classList.toggle('active', tab === 'signup');
    clearAuthMessages();
  }

  function showApp(user) {
    currentUser = user;
    $('authScreen').hidden = true;
    $('mainApp').hidden = false;

    const name = user.name || 'User';
    const initial = name.charAt(0).toUpperCase();
    if ($('userAvatar')) $('userAvatar').textContent = initial;
    if ($('userNameLabel')) $('userNameLabel').textContent = name;
    if ($('userEmailLabel')) $('userEmailLabel').textContent = user.email;

    // Restore sheet for this session if any
    const saved = localStorage.getItem('bizflow_sheet_url');
    if (saved && $('sheetUrl')) {
      $('sheetUrl').value = saved;
      connectSheet();
    }
  }

  function showAuthScreen() {
    currentUser = null;
    $('mainApp').hidden = true;
    $('authScreen').hidden = false;
    switchAuthTab('login');
    clearAuthMessages();
    if ($('loginForm')) $('loginForm').reset();
    if ($('signupForm')) $('signupForm').reset();
  }

  // ---------- Signup (NO OTP) ----------
  function handleSignup(e) {
    e.preventDefault();
    clearAuthMessages();

    const name = ($('signupName').value || '').trim();
    const email = ($('signupEmail').value || '').trim().toLowerCase();
    const phone = normalizePhone($('signupPhone').value);
    const password = $('signupPassword').value || '';
    const password2 = $('signupPassword2').value || '';

    if (!name) {
      showAuthError('signup', 'Please enter your full name.');
      return;
    }
    if (!isValidEmail(email)) {
      showAuthError('signup', 'Enter a valid email with @ (e.g. you@gmail.com).');
      return;
    }
    if (!isValidPhone(phone)) {
      showAuthError('signup', 'Mobile number must be exactly 10 digits.');
      return;
    }
    if (password.length < 6) {
      showAuthError('signup', 'Password must be at least 6 characters.');
      return;
    }
    if (password !== password2) {
      showAuthError('signup', 'Passwords do not match.');
      return;
    }

    // Check duplicates — verified before account is created
    if (findUserByEmail(email)) {
      showAuthError('signup', 'This email is already registered. Please login.');
      return;
    }
    if (findUserByPhone(phone)) {
      showAuthError('signup', 'This mobile number is already registered. Please login.');
      return;
    }

    const users = getUsers();
    users.push({
      name,
      email,
      phone,
      password, // client-side only demo storage
      createdAt: Date.now()
    });
    saveUsers(users);

    const ok = $('signupSuccess');
    if (ok) {
      ok.textContent = 'Account created successfully! You can login now.';
      ok.hidden = false;
    }

    // Prefill login and switch tab
    $('loginEmail').value = email;
    $('loginPhone').value = phone;
    setTimeout(() => switchAuthTab('login'), 900);
  }

  // ---------- Login (verify before access) ----------
  function handleLogin(e) {
    e.preventDefault();
    clearAuthMessages();

    const email = ($('loginEmail').value || '').trim().toLowerCase();
    const phone = normalizePhone($('loginPhone').value);
    const password = $('loginPassword').value || '';

    if (!isValidEmail(email)) {
      showAuthError('login', 'Enter a valid email with @ (e.g. you@gmail.com).');
      return;
    }
    if (!isValidPhone(phone)) {
      showAuthError('login', 'Mobile number must be exactly 10 digits.');
      return;
    }
    if (!password) {
      showAuthError('login', 'Please enter your password.');
      return;
    }

    // Verify account exists and credentials match BEFORE allowing login
    const user = findUserByEmail(email);
    if (!user) {
      showAuthError('login', 'No account found with this email. Please create an account.');
      return;
    }
    if (user.phone !== phone) {
      showAuthError('login', 'Email and mobile number do not match our records.');
      return;
    }
    if (user.password !== password) {
      showAuthError('login', 'Incorrect password. Please try again.');
      return;
    }

    // Verified — allow access
    saveSession(user);
    showApp(user);
    toast('Welcome back, ' + (user.name || 'User') + '!');
  }

  function handleLogout() {
    clearSession();
    transactions = [];
    showAuthScreen();
    toast('Logged out successfully.');
  }

  // ---------- Navigation ----------
  const titles = {
    dashboard: ['Business Dashboard', 'Manage content, SEO and business numbers from one place.'],
    content: ['Content Studio', 'Create social copy for your products and brand.'],
    seo: ['SEO Builder', 'Create search-friendly product content.'],
    analytics: ['Analytics', 'Understand your income, expenditure and business balance.'],
    sheet: ['Google Sheet', 'Connect your business spreadsheet.']
  };

  function showView(id) {
    if (!titles[id]) return;

    document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
    const view = $(id);
    if (view) view.classList.add('active');

    document.querySelectorAll('.nav button').forEach((b) => {
      b.classList.toggle('active', b.dataset.view === id);
    });

    if ($('pageTitle')) $('pageTitle').textContent = titles[id][0];
    if ($('pageSubtitle')) $('pageSubtitle').textContent = titles[id][1];

    if (id === 'analytics') renderAnalytics();
    closeMobileSidebar();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ---------- Mobile sidebar ----------
  function openMobileSidebar() {
    const sidebar = $('sidebar');
    if (!sidebar) return;
    sidebar.classList.add('open');
    sidebar.style.display = 'flex';
    let overlay = document.querySelector('.sidebar-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'sidebar-overlay';
      overlay.addEventListener('click', closeMobileSidebar);
      document.body.appendChild(overlay);
    }
    overlay.classList.add('show');
  }

  function closeMobileSidebar() {
    const sidebar = $('sidebar');
    if (sidebar) {
      sidebar.classList.remove('open');
      if (window.innerWidth <= 720) sidebar.style.display = 'none';
    }
    const overlay = document.querySelector('.sidebar-overlay');
    if (overlay) overlay.classList.remove('show');
  }

  // ---------- Modal ----------
  function openSheetModal() {
    $('modal').classList.add('show');
    $('modalSheetUrl').value =
      $('sheetUrl').value || localStorage.getItem('bizflow_sheet_url') || '';
    setTimeout(() => $('modalSheetUrl').focus(), 50);
  }

  function closeModal() {
    $('modal').classList.remove('show');
  }

  function connectFromModal() {
    const url = $('modalSheetUrl').value.trim();
    $('sheetUrl').value = url;
    closeModal();
    showView('sheet');
    if (url) connectSheet();
  }

  // ---------- CSV / Sheet parsing ----------
  function parseCSV(text) {
    const rows = [];
    let row = [];
    let cell = '';
    let quote = false;

    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === '"') {
        if (quote && text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          quote = !quote;
        }
      } else if (c === ',' && !quote) {
        row.push(cell);
        cell = '';
      } else if ((c === '\n' || c === '\r') && !quote) {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(cell);
        if (row.some((x) => x.trim() !== '')) rows.push(row);
        row = [];
        cell = '';
      } else {
        cell += c;
      }
    }
    if (cell !== '' || row.length) {
      row.push(cell);
      if (row.some((x) => x.trim() !== '')) rows.push(row);
    }
    return rows;
  }

  function extractSheet(url) {
    const m = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!m) throw new Error('Invalid Google Sheet URL.');
    const id = m[1];
    const g =
      (url.match(/[#&?]gid=([0-9]+)/) || [])[1] ||
      (url.match(/gid=([0-9]+)/) || [])[1] ||
      '0';
    return { id, gid: g };
  }

  function normalizeType(raw) {
    const t = String(raw || '').trim().toLowerCase();
    if (
      t.includes('exp') ||
      t.includes('out') ||
      t.includes('debit') ||
      t.includes('cost') ||
      t.includes('expense') ||
      t.includes('spend')
    ) {
      return 'expenditure';
    }
    return 'income';
  }

  async function connectSheet() {
    const url = $('sheetUrl').value.trim();
    if (!url) {
      toast('Paste a Google Sheet URL first.');
      return;
    }

    const msg = $('sheetMessage');
    const btn = $('connectSheetBtn');
    if (msg) msg.textContent = 'Loading sheet data...';
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Loading...';
    }

    try {
      const { id, gid } = extractSheet(url);
      const csvUrl = `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
      const res = await fetch(csvUrl, { cache: 'no-store' });

      if (!res.ok) {
        throw new Error('Google Sheet could not be read. Check sharing permissions.');
      }

      const text = await res.text();
      if (/<!doctype html|<html/i.test(text)) {
        throw new Error(
          'Google returned a web page instead of CSV. Make the sheet accessible to anyone with the link.'
        );
      }

      const rows = parseCSV(text);
      if (rows.length < 2) throw new Error('The sheet has no transaction rows.');

      const headers = rows[0].map((x) => x.trim().toLowerCase());
      const idx = (...names) => {
        for (const n of names) {
          const i = headers.indexOf(n);
          if (i >= 0) return i;
        }
        return -1;
      };

      const dateI = idx('date', 'transaction date');
      const descI = idx('description', 'details', 'particulars', 'name');
      const typeI = idx('type', 'transaction type');
      const amountI = idx('amount', 'value');
      const incomeI = idx('income', 'credit', 'sales');
      const expI = idx('expenditure', 'expense', 'expenses', 'debit');
      const catI = idx('category', 'categories');

      if (typeI < 0 && amountI < 0 && incomeI < 0 && expI < 0) {
        throw new Error('Missing money columns. Use Type + Amount OR Income + Expenditure.');
      }

      transactions = rows
        .slice(1)
        .map((r) => {
          let type = '';
          let amount = 0;

          if (typeI >= 0 && amountI >= 0) {
            type = normalizeType(r[typeI]);
            amount = cleanNum(r[amountI]);
          } else {
            const inc = cleanNum(r[incomeI]);
            const exp = cleanNum(r[expI]);
            if (inc > 0) {
              type = 'income';
              amount = inc;
            } else {
              type = 'expenditure';
              amount = exp;
            }
          }

          return {
            date: r[dateI >= 0 ? dateI : 0] || '',
            desc: r[descI >= 0 ? descI : 1] || '',
            type,
            amount,
            category: r[catI >= 0 ? catI : 2] || 'Other'
          };
        })
        .filter((x) => x.amount > 0);

      localStorage.setItem('bizflow_sheet_url', url);
      if (msg) msg.textContent = `Connected successfully. ${transactions.length} transaction(s) loaded.`;
      if ($('statusDot')) $('statusDot').classList.add('on');
      if ($('statusText')) $('statusText').textContent = `Connected · ${transactions.length} rows`;
      updateStats();
      renderAnalytics();
      toast('Google Sheet connected.');
    } catch (err) {
      if (msg) msg.textContent = err.message || 'Connection failed.';
      if ($('statusDot')) $('statusDot').classList.remove('on');
      if ($('statusText')) $('statusText').textContent = 'Google Sheet not connected';
      toast(err.message || 'Connection failed.');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Connect & Load Data';
      }
    }
  }

  function disconnectSheet() {
    transactions = [];
    localStorage.removeItem('bizflow_sheet_url');
    if ($('sheetUrl')) $('sheetUrl').value = '';
    if ($('sheetMessage')) $('sheetMessage').textContent = 'Disconnected.';
    if ($('statusDot')) $('statusDot').classList.remove('on');
    if ($('statusText')) $('statusText').textContent = 'Google Sheet not connected';
    updateStats();
    renderAnalytics();
    toast('Sheet disconnected.');
  }

  // ---------- Stats & tables ----------
  function updateStats() {
    const income = transactions
      .filter((x) => x.type === 'income')
      .reduce((a, x) => a + x.amount, 0);
    const exp = transactions
      .filter((x) => x.type === 'expenditure')
      .reduce((a, x) => a + x.amount, 0);
    const net = income - exp;

    if ($('sIncome')) $('sIncome').textContent = money(income);
    if ($('sExpense')) $('sExpense').textContent = money(exp);
    if ($('sNet')) {
      $('sNet').textContent = money(net);
      $('sNet').style.color = net >= 0 ? 'var(--green)' : 'var(--red)';
    }
    if ($('sCount')) $('sCount').textContent = String(transactions.length);

    if ($('aIncome')) $('aIncome').textContent = money(income);
    if ($('aExpense')) $('aExpense').textContent = money(exp);
    if ($('aNet')) {
      $('aNet').textContent = money(net);
      $('aNet').style.color = net >= 0 ? 'var(--green)' : 'var(--red)';
    }
    if ($('aMargin')) {
      $('aMargin').textContent = income ? ((net / income) * 100).toFixed(1) + '%' : '0%';
    }
  }

  function renderTable(targetId, list) {
    const el = $(targetId);
    if (!el) return;

    if (!list.length) {
      el.innerHTML = '<div class="help">No transaction data loaded.</div>';
      return;
    }

    el.innerHTML =
      '<div class="table-wrap"><table><thead><tr>' +
      '<th>Date</th><th>Description</th><th>Type</th><th>Amount</th><th>Category</th>' +
      '</tr></thead><tbody>' +
      list
        .map(
          (x) =>
            `<tr>
              <td>${escapeHtml(x.date)}</td>
              <td>${escapeHtml(x.desc)}</td>
              <td>${escapeHtml(x.type)}</td>
              <td class="${x.type === 'income' ? 'income-text' : 'expense-text'}">
                ${x.type === 'income' ? '+' : '-'}${money(x.amount)}
              </td>
              <td>${escapeHtml(x.category)}</td>
            </tr>`
        )
        .join('') +
      '</tbody></table></div>';
  }

  function renderAnalytics() {
    updateStats();
    renderTable('allTable', transactions);
    renderTable('recentTable', transactions.slice(-8).reverse());

    const months = {};
    transactions.forEach((x) => {
      const d = new Date(x.date);
      const key = isNaN(d)
        ? String(x.date).slice(0, 7)
        : d.toLocaleString('en-IN', { month: 'short', year: '2-digit' });
      if (!months[key]) months[key] = { i: 0, e: 0 };
      if (x.type === 'income') months[key].i += x.amount;
      else months[key].e += x.amount;
    });

    const keys = Object.keys(months).slice(-8);
    const max = Math.max(1, ...keys.flatMap((k) => [months[k].i, months[k].e]));
    const chart = $('chart');
    if (!chart) return;

    if (!keys.length) {
      chart.innerHTML = '<div class="help" style="width:100%">No chart data.</div>';
    } else {
      chart.innerHTML = keys
        .map(
          (k) =>
            `<div class="bar-wrap">
              <div title="Income: ${money(months[k].i)}" class="bar" style="height:${Math.max(
                3,
                (months[k].i / max) * 190
              )}px"></div>
              <div title="Expense: ${money(months[k].e)}" class="bar exp" style="height:${Math.max(
                3,
                (months[k].e / max) * 190
              )}px"></div>
              <div class="bar-label">${escapeHtml(k)}</div>
            </div>`
        )
        .join('');
    }

    const cats = {};
    transactions
      .filter((x) => x.type === 'expenditure')
      .forEach((x) => {
        cats[x.category] = (cats[x.category] || 0) + x.amount;
      });

    const sorted = Object.entries(cats).sort((a, b) => b[1] - a[1]);
    const catList = $('categoryList');
    if (!catList) return;

    if (!sorted.length) {
      catList.innerHTML = '<div class="help">No expenditure categories found.</div>';
    } else {
      const top = sorted[0][1] || 1;
      catList.innerHTML = sorted
        .map(
          ([k, v]) =>
            `<div style="margin:12px 0">
              <div style="display:flex;justify-content:space-between;font-size:13px">
                <b>${escapeHtml(k)}</b><span>${money(v)}</span>
              </div>
              <div style="height:8px;background:#eeeef5;border-radius:99px;margin-top:6px">
                <div style="height:100%;width:${Math.min(
                  100,
                  (v / top) * 100
                )}%;background:linear-gradient(90deg,#6c4df6,#13b8c8);border-radius:99px"></div>
              </div>
            </div>`
        )
        .join('');
    }
  }

  // ---------- Content / SEO ----------
  function generateContent() {
    const n = $('cName').value.trim() || 'Your Product';
    const d = $('cDetails').value.trim() || 'quality, useful features and great value';
    const t = $('cTone').value;
    const a = $('cAudience').value.trim() || 'online shoppers';
    const type = $('cType').value;
    const firstSentence = d.split(/[.!?]/)[0].trim() || d;
    const tag = slug(n).replace(/-/g, '') || 'product';

    let out = '';
    if (type === 'Instagram Bio') {
      out = `${n} ✦\n${firstSentence}\nMade for ${a}.\nDM to order • Shop now ↓\n#${tag}`;
    } else if (type === 'WhatsApp Promo') {
      out = `🔥 ${n}\n\n${d}\n\nPerfect for ${a}.\n📩 DM us for orders & details.\n✨ Limited availability — check it out today!`;
    } else if (type === 'Instagram Product Description') {
      out = `${n}\n\n${d}\n\nWhy you'll love it:\n• Designed for ${a}\n• Practical, premium and easy to use\n• Made to add value to your everyday experience\n\nDM us to order.`;
    } else if (type === 'Short Reel Caption') {
      out = `POV: You just found your new favourite ${n}. 👀✨\n\n${d}\n\nSave this • Share it • DM to order\n#${tag} #SmallBusiness #ShopNow`;
    } else if (type === 'Call-to-Action') {
      out = `Ready to upgrade with ${n}? ✨\n${d}\n\n👉 DM “ORDER” to get started.\n👉 Save this post for later.\n👉 Share with someone who needs it.`;
    } else {
      out = `✨ ${n}\n\n${d}\n\nBuilt for ${a}. ${t} style, clear value, and made to stand out.\n\n📩 DM us for orders / details.\n🔖 Save this post for later.\n\n#${tag} #SmallBusiness #OnlineShopping #ShopNow`;
    }
    $('contentOutput').textContent = out;
  }

  function generateSEO() {
    const n = $('pName').value.trim() || 'Your Product';
    const cat = $('pCategory').value.trim() || 'product';
    const d = $('pDetails').value.trim() || 'quality product with useful features';
    const market = $('pMarket').value.trim() || 'India';
    const kw = $('pKeyword').value.trim() || n.toLowerCase();

    const title = `${n} | ${kw} in ${market}`;
    const desc = `Shop ${n}, a ${cat} designed for ${market} customers. ${d.slice(
      0,
      150
    )}. Explore product details, features and ordering options today.`;
    const keys = [
      kw,
      n,
      cat,
      `${kw} online`,
      `${n} ${market}`,
      `buy ${kw}`,
      `${cat} ${market}`
    ];

    $('seoOutput').textContent =
      `SEO TITLE\n${title}\n\n` +
      `META DESCRIPTION\n${desc}\n\n` +
      `PRIMARY KEYWORD\n${kw}\n\n` +
      `KEYWORDS\n${keys.join(', ')}\n\n` +
      `URL SLUG\n/${slug(n)}\n\n` +
      `SOCIAL TAGS\n#${slug(n).replace(/-/g, '')} #${slug(cat).replace(/-/g, '')} #OnlineShopping #${market.replace(/\s/g, '')}`;
  }

  async function copyText(id) {
    const text = $(id)?.textContent || '';
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        toast('Copied to clipboard.');
      } else {
        throw new Error('Clipboard API unavailable');
      }
    } catch {
      toast('Select and copy the text manually.');
    }
  }

  // ---------- Phone input: digits only ----------
  function bindPhoneInputs() {
    ['loginPhone', 'signupPhone'].forEach((id) => {
      const el = $(id);
      if (!el) return;
      el.addEventListener('input', () => {
        el.value = normalizePhone(el.value);
      });
    });
  }

  // ---------- Events ----------
  function bindEvents() {
    // Auth tabs
    document.querySelectorAll('.auth-tab').forEach((btn) => {
      btn.addEventListener('click', () => switchAuthTab(btn.dataset.auth));
    });

    $('loginForm')?.addEventListener('submit', handleLogin);
    $('signupForm')?.addEventListener('submit', handleSignup);
    $('logoutBtn')?.addEventListener('click', handleLogout);

    bindPhoneInputs();

    // Nav
    document.querySelectorAll('.nav button').forEach((btn) => {
      btn.addEventListener('click', () => showView(btn.dataset.view));
    });

    document.querySelectorAll('[data-goto]').forEach((btn) => {
      btn.addEventListener('click', () => showView(btn.dataset.goto));
    });

    $('topConnectBtn')?.addEventListener('click', openSheetModal);
    $('topCreateBtn')?.addEventListener('click', () => showView('content'));
    $('heroConnectBtn')?.addEventListener('click', openSheetModal);
    $('mobileMenuBtn')?.addEventListener('click', openMobileSidebar);

    $('closeModalBtn')?.addEventListener('click', closeModal);
    $('connectFromModalBtn')?.addEventListener('click', connectFromModal);
    $('modal')?.addEventListener('click', (e) => {
      if (e.target === $('modal')) closeModal();
    });

    $('connectSheetBtn')?.addEventListener('click', connectSheet);
    $('disconnectSheetBtn')?.addEventListener('click', disconnectSheet);

    $('generateContentBtn')?.addEventListener('click', generateContent);
    $('copyContentBtn')?.addEventListener('click', () => copyText('contentOutput'));
    $('generateSeoBtn')?.addEventListener('click', generateSEO);
    $('copySeoBtn')?.addEventListener('click', () => copyText('seoOutput'));

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 720) {
        const sidebar = $('sidebar');
        if (sidebar) {
          sidebar.style.display = '';
          sidebar.classList.remove('open');
        }
        const overlay = document.querySelector('.sidebar-overlay');
        if (overlay) overlay.classList.remove('show');
      }
    });
  }

  // ---------- Init ----------
  function init() {
    bindEvents();

    // Restore session if valid user still exists
    const session = getSession();
    if (session && session.email) {
      const user = findUserByEmail(session.email);
      if (user && user.phone === session.phone) {
        showApp(user);
        return;
      }
      clearSession();
    }

    showAuthScreen();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
