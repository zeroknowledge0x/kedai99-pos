// ============================================================
// Kasir Dashboard - Simple dashboard for cashier role
// ============================================================

const KasirDashboard = {
    async render() {
        const content = document.getElementById('contentArea');
        content.innerHTML = '<div class="text-center py-5"><i class="fas fa-spinner fa-spin fa-2x text-muted"></i></div>';

        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const { data: txToday } = await supabase
                .from('transactions')
                .select('total')
                .eq('cashier_id', Auth.getUserId())
                .gte('created_at', today.toISOString());

            const totalToday = (txToday || []).reduce((s, t) => s + Number(t.total), 0);

            content.innerHTML = `
                <div class="row g-3 mb-4">
                    <div class="col-md-6">
                        <div class="stat-card">
                            <div class="stat-icon" style="background:var(--primary)"><i class="fas fa-receipt"></i></div>
                            <div class="stat-value">${txToday ? txToday.length : 0}</div>
                            <div class="stat-label">Transaksi Hari Ini</div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="stat-card">
                            <div class="stat-icon" style="background:var(--success)"><i class="fas fa-money-bill-wave"></i></div>
                            <div class="stat-value">${App.formatRp(totalToday)}</div>
                            <div class="stat-label">Pendapatan Hari Ini</div>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-body text-center py-5">
                        <i class="fas fa-cash-register fa-3x text-muted mb-3"></i>
                        <h5>Selamat Bekerja, ${Auth.getUserName()}!</h5>
                        <p class="text-muted">Klik menu <strong>Kasir (POS)</strong> untuk memulai transaksi.</p>
                        <button class="btn btn-primary" onclick="App.navigate('pos')">
                            <i class="fas fa-cash-register me-2"></i>Buka Kasir
                        </button>
                    </div>
                </div>
            `;
        } catch (err) {
            content.innerHTML = `<div class="alert alert-danger">Error: ${err.message}</div>`;
        }
    }
};
