// ============================================================
// Dashboard Module - Admin Dashboard
// ============================================================

const Dashboard = {
    async render() {
        const content = document.getElementById('contentArea');
        content.innerHTML = '<div class="text-center py-5"><i class="fas fa-spinner fa-spin fa-2x text-muted"></i></div>';

        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

            const [txToday, txMonth, menuCount, kasirCount, lowStock, topProducts] = await Promise.all([
                supabase.from('transactions').select('total').gte('created_at', today.toISOString()),
                supabase.from('transactions').select('total').gte('created_at', startOfMonth.toISOString()),
                supabase.from('products').select('id', { count: 'exact', head: true }),
                supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'kasir').eq('active', true),
                supabase.from('stocks').select('*'),
                supabase.from('transaction_items').select('product_name, quantity').order('quantity', { ascending: false }).limit(5)
            ]);

            const totalToday = (txToday.data || []).reduce((s, t) => s + Number(t.total), 0);
            const totalMonth = (txMonth.data || []).reduce((s, t) => s + Number(t.total), 0);
            const lowStockItems = (lowStock.data || []).filter(s => Number(s.quantity) <= Number(s.min_stock));

            // Top products aggregation
            const prodMap = {};
            (topProducts.data || []).forEach(item => {
                if (!prodMap[item.product_name]) prodMap[item.product_name] = 0;
                prodMap[item.product_name] += item.quantity;
            });
            const topProdList = Object.entries(prodMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

            content.innerHTML = `
                <div class="row g-3 mb-4">
                    <div class="col-md-4 col-sm-6">
                        <div class="stat-card">
                            <div class="stat-icon" style="background:var(--primary)"><i class="fas fa-receipt"></i></div>
                            <div class="stat-value">${txToday.data ? txToday.data.length : 0}</div>
                            <div class="stat-label">Transaksi Hari Ini</div>
                        </div>
                    </div>
                    <div class="col-md-4 col-sm-6">
                        <div class="stat-card">
                            <div class="stat-icon" style="background:var(--success)"><i class="fas fa-shopping-cart"></i></div>
                            <div class="stat-value">${txMonth.data ? txMonth.data.length : 0}</div>
                            <div class="stat-label">Transaksi Bulan Ini</div>
                        </div>
                    </div>
                    <div class="col-md-4 col-sm-6">
                        <div class="stat-card">
                            <div class="stat-icon" style="background:var(--accent)"><i class="fas fa-money-bill-wave"></i></div>
                            <div class="stat-value">${App.formatRp(totalMonth)}</div>
                            <div class="stat-label">Pendapatan Bulan Ini</div>
                        </div>
                    </div>
                    <div class="col-md-4 col-sm-6">
                        <div class="stat-card">
                            <div class="stat-icon" style="background:#6f42c1"><i class="fas fa-utensils"></i></div>
                            <div class="stat-value">${menuCount.count || 0}</div>
                            <div class="stat-label">Jumlah Menu</div>
                        </div>
                    </div>
                    <div class="col-md-4 col-sm-6">
                        <div class="stat-card">
                            <div class="stat-icon" style="background:#17a2b8"><i class="fas fa-users"></i></div>
                            <div class="stat-value">${kasirCount.count || 0}</div>
                            <div class="stat-label">Jumlah Kasir Aktif</div>
                        </div>
                    </div>
                    <div class="col-md-4 col-sm-6">
                        <div class="stat-card">
                            <div class="stat-icon" style="background:${lowStockItems.length > 0 ? 'var(--danger)' : 'var(--success)'}"><i class="fas fa-exclamation-triangle"></i></div>
                            <div class="stat-value">${lowStockItems.length}</div>
                            <div class="stat-label">Stok Menipis</div>
                        </div>
                    </div>
                </div>

                <div class="row g-3">
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header"><i class="fas fa-trophy me-2"></i>Produk Terlaris</div>
                            <div class="card-body">
                                ${topProdList.length > 0 ? `
                                    <table class="table table-sm mb-0">
                                        <thead><tr><th>#</th><th>Produk</th><th>Qty Terjual</th></tr></thead>
                                        <tbody>
                                            ${topProdList.map((p, i) => `<tr><td>${i + 1}</td><td>${p[0]}</td><td>${p[1]}</td></tr>`).join('')}
                                        </tbody>
                                    </table>
                                ` : '<div class="empty-state"><p>Belum ada data penjualan</p></div>'}
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header"><i class="fas fa-exclamation-triangle me-2 text-danger"></i>Stok Menipis</div>
                            <div class="card-body">
                                ${lowStockItems.length > 0 ? `
                                    <table class="table table-sm mb-0">
                                        <thead><tr><th>Barang</th><th>Stok</th><th>Minimum</th></tr></thead>
                                        <tbody>
                                            ${lowStockItems.map(s => `
                                                <tr>
                                                    <td>${s.name}</td>
                                                    <td class="stock-warning">${s.quantity} ${s.unit}</td>
                                                    <td>${s.min_stock} ${s.unit}</td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                ` : '<p class="text-muted text-center mb-0">Semua stok aman ✓</p>'}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } catch (err) {
            content.innerHTML = `<div class="alert alert-danger">Error loading dashboard: ${err.message}</div>`;
        }
    }
};
