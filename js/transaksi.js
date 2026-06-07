// ============================================================
// Transaksi Page - Daftar Transaksi (Admin)
// ============================================================

const TransaksiPage = {
    async render() {
        const content = document.getElementById('contentArea');
        content.innerHTML = '<div class="text-center py-5"><i class="fas fa-spinner fa-spin fa-2x text-muted"></i></div>';

        try {
            const { data } = await supabase
                .from('transactions')
                .select('*, users(name)')
                .order('created_at', { ascending: false })
                .limit(100);
            const transactions = data || [];

            content.innerHTML = `
                <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                    <div class="d-flex gap-2 flex-wrap">
                        <select id="txFilter" class="form-select form-select-sm" style="width:auto" onchange="TransaksiPage.filter()">
                            <option value="">Semua</option>
                            <option value="today" selected>Hari Ini</option>
                            <option value="week">Minggu Ini</option>
                            <option value="month">Bulan Ini</option>
                        </select>
                        <select id="txPayFilter" class="form-select form-select-sm" style="width:auto" onchange="TransaksiPage.filter()">
                            <option value="">Semua Pembayaran</option>
                            <option value="tunai">Tunai</option>
                            <option value="qris">QRIS</option>
                            <option value="transfer">Transfer</option>
                            <option value="e-wallet">E-Wallet</option>
                        </select>
                    </div>
                    <span class="text-muted" id="txCount">${transactions.length} transaksi</span>
                </div>
                <div class="card">
                    <div class="table-responsive">
                        <table class="table table-hover mb-0" id="txTable">
                            <thead>
                                <tr><th>No. Transaksi</th><th>Kasir</th><th>Tanggal</th><th>Total</th><th>Bayar</th><th>Aksi</th></tr>
                            </thead>
                            <tbody>
                                ${transactions.length > 0 ? transactions.map(t => `
                                    <tr data-date="${t.created_at}" data-pay="${t.payment_method}">
                                        <td><strong>${t.transaction_number}</strong></td>
                                        <td>${t.users ? t.users.name : '-'}</td>
                                        <td>${App.formatDateTime(t.created_at)}</td>
                                        <td>${App.formatRp(t.total)}</td>
                                        <td><span class="badge bg-secondary">${t.payment_method.toUpperCase()}</span></td>
                                        <td><button class="btn btn-outline-primary btn-sm" onclick="TransaksiPage.showDetail('${t.id}')"><i class="fas fa-eye"></i></button></td>
                                    </tr>
                                `).join('') : '<tr><td colspan="6" class="text-center text-muted py-4">Belum ada transaksi</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div id="txDetailModal"></div>
            `;

            this.allTransactions = transactions;
            this.filter();
        } catch (err) {
            content.innerHTML = `<div class="alert alert-danger">Error: ${err.message}</div>`;
        }
    },

    filter() {
        const filter = document.getElementById('txFilter').value;
        const payFilter = document.getElementById('txPayFilter').value;
        const now = new Date();
        let count = 0;

        document.querySelectorAll('#txTable tbody tr').forEach(row => {
            if (!row.dataset.date) { row.style.display = ''; return; }

            const date = new Date(row.dataset.date);
            let matchDate = true;

            if (filter === 'today') {
                matchDate = date.toDateString() === now.toDateString();
            } else if (filter === 'week') {
                const weekAgo = new Date(now);
                weekAgo.setDate(weekAgo.getDate() - 7);
                matchDate = date >= weekAgo;
            } else if (filter === 'month') {
                matchDate = date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
            }

            const matchPay = !payFilter || row.dataset.pay === payFilter;
            const show = matchDate && matchPay;
            row.style.display = show ? '' : 'none';
            if (show) count++;
        });

        document.getElementById('txCount').textContent = count + ' transaksi';
    },

    async showDetail(txId) {
        const { data: tx } = await supabase.from('transactions').select('*, users(name)').eq('id', txId).single();
        const { data: items } = await supabase.from('transaction_items').select('*').eq('transaction_id', txId);

        if (!tx) return;

        document.getElementById('txDetailModal').innerHTML = `
            <div class="modal fade show" style="display:block; background:rgba(0,0,0,0.5)" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Detail Transaksi</h5>
                            <button type="button" class="btn-close" onclick="document.getElementById('txDetailModal').innerHTML=''"></button>
                        </div>
                        <div class="modal-body">
                            <div class="receipt" id="receiptContent">
                                <div class="receipt-header">
                                    <h3>KEDAI 99</h3>
                                    <p style="margin:5px 0;font-size:12px;">Jl. Contoh No. 99, Kota</p>
                                </div>
                                <div style="margin-bottom:10px;font-size:12px;">
                                    <div>No: ${tx.transaction_number}</div>
                                    <div>Tanggal: ${App.formatDateTime(tx.created_at)}</div>
                                    <div>Kasir: ${tx.users ? tx.users.name : '-'}</div>
                                </div>
                                <div class="receipt-items" style="border-top:1px dashed #333;padding-top:8px;">
                                    ${(items || []).map(item => `
                                        <div class="receipt-item">
                                            <span>${item.product_name}</span>
                                        </div>
                                        <div class="receipt-item" style="font-size:12px;color:#666;">
                                            <span>&nbsp;&nbsp;${item.quantity} x ${App.formatRp(item.price)}</span>
                                            <span>${App.formatRp(item.subtotal)}</span>
                                        </div>
                                    `).join('')}
                                </div>
                                <div class="receipt-total">
                                    <div class="receipt-item">
                                        <span>TOTAL</span>
                                        <span>${App.formatRp(tx.total)}</span>
                                    </div>
                                    <div class="receipt-item" style="font-size:12px;">
                                        <span>Bayar (${tx.payment_method.toUpperCase()})</span>
                                        <span>${App.formatRp(tx.nominal_paid)}</span>
                                    </div>
                                    ${tx.change_amount > 0 ? `
                                    <div class="receipt-item" style="font-size:12px;">
                                        <span>Kembalian</span>
                                        <span>${App.formatRp(tx.change_amount)}</span>
                                    </div>` : ''}
                                </div>
                                <div class="receipt-footer">
                                    <p>Terima Kasih 🙏</p>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" onclick="document.getElementById('txDetailModal').innerHTML=''">Tutup</button>
                            <button type="button" class="btn btn-primary no-print" onclick="TransaksiPage.printReceipt()"><i class="fas fa-print me-1"></i>Cetak Struk</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    printReceipt() {
        const content = document.getElementById('receiptContent');
        if (!content) return;
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html><head><title>Struk - Kedai 99</title>
            <style>
                body { font-family: 'Courier New', monospace; font-size: 12px; max-width: 300px; margin: 0 auto; padding: 10px; }
                .receipt-header { text-align: center; border-bottom: 1px dashed #333; padding-bottom: 10px; margin-bottom: 10px; }
                .receipt-header h3 { margin: 0; font-size: 16px; }
                .receipt-item { display: flex; justify-content: space-between; margin: 2px 0; }
                .receipt-total { border-top: 1px dashed #333; margin-top: 10px; padding-top: 10px; font-weight: bold; }
                .receipt-footer { text-align: center; margin-top: 15px; font-size: 11px; }
            </style></head><body>
            ${content.innerHTML}
            </body></html>
        `);
        printWindow.document.close();
        printWindow.print();
    }
};
