// ============================================================
// Laporan Page - Reports (Admin)
// ============================================================

const LaporanPage = {
    async render() {
        const content = document.getElementById('contentArea');
        content.innerHTML = '<div class="text-center py-5"><i class="fas fa-spinner fa-spin fa-2x text-muted"></i></div>';

        try {
            const now = new Date();
            const startOfDay = new Date(now); startOfDay.setHours(0,0,0,0);
            const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay()); startOfWeek.setHours(0,0,0,0);
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            const [allTx, allItems] = await Promise.all([
                supabase.from('transactions').select('*, users(name)').order('created_at', { ascending: false }),
                supabase.from('transaction_items').select('*')
            ]);

            const txns = allTx.data || [];
            const items = allItems.data || [];

            // Aggregate by period
            const todayTx = txns.filter(t => new Date(t.created_at) >= startOfDay);
            const weekTx = txns.filter(t => new Date(t.created_at) >= startOfWeek);
            const monthTx = txns.filter(t => new Date(t.created_at) >= startOfMonth);

            const sum = (arr) => arr.reduce((s, t) => s + Number(t.total), 0);

            // Top products this month
            const monthTxIds = new Set(monthTx.map(t => t.id));
            const monthItems = items.filter(i => monthTxIds.has(i.transaction_id));
            const prodSales = {};
            monthItems.forEach(i => {
                if (!prodSales[i.product_name]) prodSales[i.product_name] = { qty: 0, revenue: 0 };
                prodSales[i.product_name].qty += i.quantity;
                prodSales[i.product_name].revenue += Number(i.subtotal);
            });
            const topProducts = Object.entries(prodSales).sort((a, b) => b[1].qty - a[1].qty).slice(0, 5);

            // Payment method breakdown
            const payMethods = {};
            monthTx.forEach(t => {
                if (!payMethods[t.payment_method]) payMethods[t.payment_method] = { count: 0, total: 0 };
                payMethods[t.payment_method].count++;
                payMethods[t.payment_method].total += Number(t.total);
            });

            content.innerHTML = `
                <div class="mb-4">
                    <ul class="nav nav-tabs" id="reportTabs">
                        <li class="nav-item"><a class="nav-link active" href="#" onclick="LaporanPage.showTab('harian', this)">Harian</a></li>
                        <li class="nav-item"><a class="nav-link" href="#" onclick="LaporanPage.showTab('mingguan', this)">Mingguan</a></li>
                        <li class="nav-item"><a class="nav-link" href="#" onclick="LaporanPage.showTab('bulanan', this)">Bulanan</a></li>
                    </ul>
                </div>

                <div id="reportContent">
                    ${this.renderReport('Hari Ini', todayTx, monthTx, topProducts, payMethods)}
                </div>

                <div id="reportDetailModal"></div>
            `;

            this._data = { todayTx, weekTx, monthTx, topProducts, payMethods };
        } catch (err) {
            content.innerHTML = `<div class="alert alert-danger">Error: ${err.message}</div>`;
        }
    },

    showTab(tab, el) {
        document.querySelectorAll('#reportTabs .nav-link').forEach(a => a.classList.remove('active'));
        el.classList.add('active');

        const d = this._data;
        if (!d) return;

        const periodMap = {
            'harian': { label: 'Hari Ini', tx: d.todayTx },
            'mingguan': { label: 'Minggu Ini', tx: d.weekTx },
            'bulanan': { label: 'Bulan Ini', tx: d.monthTx }
        };
        const p = periodMap[tab];
        document.getElementById('reportContent').innerHTML =
            this.renderReport(p.label, p.tx, d.monthTx, d.topProducts, d.payMethods);
    },

    renderReport(label, txns, monthTx, topProducts, payMethods) {
        const totalRevenue = txns.reduce((s, t) => s + Number(t.total), 0);
        const avgTx = txns.length > 0 ? Math.round(totalRevenue / txns.length) : 0;

        return `
            <div class="row g-3 mb-4 report-summary">
                <div class="col-md-3 col-6">
                    <div class="stat-card">
                        <div class="summary-value">${txns.length}</div>
                        <div class="summary-label">Total Transaksi ${label}</div>
                    </div>
                </div>
                <div class="col-md-3 col-6">
                    <div class="stat-card">
                        <div class="summary-value">${App.formatRp(totalRevenue)}</div>
                        <div class="summary-label">Total Pendapatan ${label}</div>
                    </div>
                </div>
                <div class="col-md-3 col-6">
                    <div class="stat-card">
                        <div class="summary-value">${App.formatRp(avgTx)}</div>
                        <div class="summary-label">Rata-rata per Transaksi</div>
                    </div>
                </div>
                <div class="col-md-3 col-6">
                    <div class="stat-card">
                        <div class="summary-value">${Object.keys(payMethods).length}</div>
                        <div class="summary-label">Metode Pembayaran</div>
                    </div>
                </div>
            </div>

            <div class="row g-3">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header"><i class="fas fa-trophy me-2"></i>Produk Terlaris (Bulan Ini)</div>
                        <div class="card-body">
                            ${topProducts.length > 0 ? `
                                <table class="table table-sm mb-0">
                                    <thead><tr><th>#</th><th>Produk</th><th>Qty</th><th>Revenue</th></tr></thead>
                                    <tbody>
                                        ${topProducts.map((p, i) => `
                                            <tr><td>${i + 1}</td><td>${p[0]}</td><td>${p[1].qty}</td><td>${App.formatRp(p[1].revenue)}</td></tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            ` : '<p class="text-muted text-center mb-0">Belum ada data</p>'}
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header"><i class="fas fa-credit-card me-2"></i>Metode Pembayaran (Bulan Ini)</div>
                        <div class="card-body">
                            ${Object.keys(payMethods).length > 0 ? `
                                <table class="table table-sm mb-0">
                                    <thead><tr><th>Metode</th><th>Jumlah</th><th>Total</th></tr></thead>
                                    <tbody>
                                        ${Object.entries(payMethods).map(([k, v]) => `
                                            <tr>
                                                <td><span class="badge bg-secondary">${k.toUpperCase()}</span></td>
                                                <td>${v.count} transaksi</td>
                                                <td>${App.formatRp(v.total)}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            ` : '<p class="text-muted text-center mb-0">Belum ada data</p>'}
                        </div>
                    </div>
                </div>
            </div>

            <div class="card mt-3">
                <div class="card-header"><i class="fas fa-list me-2"></i>Detail Transaksi ${label}</div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-sm table-hover mb-0">
                            <thead><tr><th>No</th><th>Kasir</th><th>Tanggal</th><th>Total</th><th>Bayar</th></tr></thead>
                            <tbody>
                                ${txns.length > 0 ? txns.slice(0, 20).map((t, i) => `
                                    <tr>
                                        <td>${i + 1}</td>
                                        <td>${t.users ? t.users.name : '-'}</td>
                                        <td>${App.formatDateTime(t.created_at)}</td>
                                        <td>${App.formatRp(t.total)}</td>
                                        <td><span class="badge bg-secondary">${t.payment_method.toUpperCase()}</span></td>
                                    </tr>
                                `).join('') : '<tr><td colspan="5" class="text-center text-muted py-3">Tidak ada transaksi</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }
};
