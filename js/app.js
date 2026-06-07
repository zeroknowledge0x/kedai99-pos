// ============================================================
// App Controller - Main routing and UI management
// ============================================================

const App = {
    currentView: 'dashboard',
    sidebarOpen: false,

    init() {
        if (!Auth.init()) {
            this.showLogin();
            return;
        }
        this.showApp();
    },

    showLogin() {
        document.getElementById('loginPage').style.display = 'flex';
        document.getElementById('appLayout').style.display = 'none';
        this.setupLoginForm();
    },

    showApp() {
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('appLayout').style.display = 'flex';
        this.buildSidebar();
        this.setupTopBar();
        this.setupSidebarToggle();

        // Default view based on role
        if (Auth.isKasir()) {
            this.navigate('pos');
        } else {
            this.navigate('dashboard');
        }
    },

    setupLoginForm() {
        const form = document.getElementById('loginForm');
        form.onsubmit = async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;
            const btn = form.querySelector('button[type="submit"]');
            const errDiv = document.getElementById('loginError');

            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Masuk...';
            errDiv.style.display = 'none';

            const result = await Auth.login(email, password);

            if (result.success) {
                this.showApp();
            } else {
                errDiv.textContent = result.message;
                errDiv.style.display = 'block';
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Masuk';
            }
        };
    },

    buildSidebar() {
        const user = Auth.getUser();
        const sidebar = document.getElementById('sidebarNav');

        const adminNav = [
            { section: 'Menu Utama' },
            { id: 'dashboard', icon: 'fa-tachometer-alt', label: 'Dashboard' },
            { id: 'pos', icon: 'fa-cash-register', label: 'Kasir (POS)' },
            { section: 'Kelola' },
            { id: 'menu', icon: 'fa-utensils', label: 'Kelola Menu' },
            { id: 'kategori', icon: 'fa-tags', label: 'Kelola Kategori' },
            { id: 'kasir', icon: 'fa-users', label: 'Kelola Kasir' },
            { id: 'stok', icon: 'fa-boxes-stacked', label: 'Kelola Stok' },
            { section: 'Laporan' },
            { id: 'transaksi', icon: 'fa-receipt', label: 'Transaksi' },
            { id: 'laporan', icon: 'fa-chart-bar', label: 'Laporan' },
        ];

        const kasirNav = [
            { section: 'Menu' },
            { id: 'kasir-dashboard', icon: 'fa-tachometer-alt', label: 'Dashboard' },
            { id: 'pos', icon: 'fa-cash-register', label: 'Kasir (POS)' },
        ];

        const nav = Auth.isAdmin() ? adminNav : kasirNav;

        let html = '';
        nav.forEach(item => {
            if (item.section) {
                html += `<div class="nav-section">${item.section}</div>`;
            } else {
                html += `<a class="nav-item" data-view="${item.id}" onclick="App.navigate('${item.id}')">
                    <i class="fas ${item.icon}"></i>${item.label}
                </a>`;
            }
        });

        sidebar.innerHTML = html;

        // User info
        document.getElementById('sidebarUserName').textContent = user.name;
        document.getElementById('sidebarUserRole').textContent = user.role === 'admin' ? 'Administrator' : 'Kasir';

        // Logout button
        document.getElementById('btnLogout').onclick = () => {
            Auth.logout();
            this.showLogin();
        };
    },

    setupTopBar() {
        document.getElementById('hamburgerBtn').onclick = () => {
            this.toggleSidebar();
        };
    },

    setupSidebarToggle() {
        const overlay = document.getElementById('sidebarOverlay');
        overlay.onclick = () => this.closeSidebar();
    },

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        this.sidebarOpen = !this.sidebarOpen;
        sidebar.classList.toggle('show', this.sidebarOpen);
        overlay.classList.toggle('show', this.sidebarOpen);
    },

    closeSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        this.sidebarOpen = false;
        sidebar.classList.remove('show');
        overlay.classList.remove('show');
    },

    navigate(viewId) {
        this.currentView = viewId;
        this.closeSidebar();

        // Update active nav
        document.querySelectorAll('.sidebar-nav .nav-item').forEach(el => {
            el.classList.toggle('active', el.dataset.view === viewId);
        });

        // Update title
        const titles = {
            'dashboard': 'Dashboard Admin',
            'kasir-dashboard': 'Dashboard Kasir',
            'pos': 'Kasir (POS)',
            'menu': 'Kelola Menu',
            'kategori': 'Kelola Kategori',
            'kasir': 'Kelola Akun Kasir',
            'stok': 'Kelola Stok Barang',
            'transaksi': 'Daftar Transaksi',
            'laporan': 'Laporan Penjualan'
        };
        document.getElementById('pageTitle').textContent = titles[viewId] || viewId;

        // Render view
        const content = document.getElementById('contentArea');
        content.innerHTML = '<div class="text-center py-5"><i class="fas fa-spinner fa-spin fa-2x text-muted"></i></div>';

        switch (viewId) {
            case 'dashboard': Dashboard.render(); break;
            case 'kasir-dashboard': KasirDashboard.render(); break;
            case 'pos': POS.render(); break;
            case 'menu': MenuPage.render(); break;
            case 'kategori': KategoriPage.render(); break;
            case 'kasir': KasirPage.render(); break;
            case 'stok': StokPage.render(); break;
            case 'transaksi': TransaksiPage.render(); break;
            case 'laporan': LaporanPage.render(); break;
            default: content.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>Halaman tidak ditemukan</p></div>';
        }
    },

    // Utility: Format currency
    formatRp(num) {
        return 'Rp ' + Number(num).toLocaleString('id-ID');
    },

    // Utility: Format date
    formatDate(dateStr) {
        const d = new Date(dateStr);
        return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    },

    // Utility: Format datetime
    formatDateTime(dateStr) {
        const d = new Date(dateStr);
        return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    },

    // Utility: Generate transaction number
    genTrxNumber() {
        const now = new Date();
        const date = now.getFullYear().toString() +
            String(now.getMonth() + 1).padStart(2, '0') +
            String(now.getDate()).padStart(2, '0');
        const rand = Math.floor(1000 + Math.random() * 9000);
        return `TRX-${date}-${rand}`;
    },

    // Utility: Show toast notification
    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `alert alert-${type} position-fixed`;
        toast.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 250px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);';
        toast.innerHTML = `${message} <button type="button" class="btn-close btn-close-sm" onclick="this.parentElement.remove()"></button>`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    },

    // Utility: Show confirm dialog
    confirm(message) {
        return window.confirm(message);
    }
};

// Initialize app when DOM ready
document.addEventListener('DOMContentLoaded', () => App.init());
