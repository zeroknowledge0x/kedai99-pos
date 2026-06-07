// ============================================================
// POS Page - Point of Sale (Admin + Kasir)
// ============================================================

const POS = {
    cart: [],
    products: [],
    categories: [],

    async render() {
        const content = document.getElementById('contentArea');
        content.innerHTML = '<div class="text-center py-5"><i class="fas fa-spinner fa-spin fa-2x text-muted"></i></div>';

        try {
            const [prodRes, catRes] = await Promise.all([
                supabase.from('products').select('*, categories(name)').eq('status', 'tersedia').order('name'),
                supabase.from('categories').select('*').order('name')
            ]);

            this.products = prodRes.data || [];
            this.categories = catRes.data || [];
            this.cart = [];

            content.innerHTML = `
                <div class="pos-layout">
                    <!-- LEFT: Menu Grid -->
                    <div class="pos-menu">
                        <div class="mb-3">
                            <input type="text" class="form-control" id="posSearch" placeholder="🔍 Cari menu..." oninput="POS.filterMenu()">
                        </div>
                        <div class="category-pills mb-3">
                            <button class="btn btn-sm btn-primary active" onclick="POS.filterByCategory('', this)">Semua</button>
                            ${this.categories.map(c => `
                                <button class="btn btn-sm btn-outline-primary" onclick="POS.filterByCategory('${c.id}', this)">${c.name}</button>
                            `).join('')}
                        </div>
                        <div class="menu-grid" id="menuGrid">
                            ${this.renderMenuGrid(this.products)}
                        </div>
                    </div>

                    <!-- RIGHT: Cart -->
                    <div class="pos-cart">
                        <div class="cart-header">
                            <span><i class="fas fa-shopping-cart me-2"></i>Keranjang</span>
                            <button class="btn btn-sm btn-outline-danger" onclick="POS.clearCart()"><i class="fas fa-trash"></i> Kosongkan</button>
                        </div>
                        <div class="cart-items" id="cartItems">
                            <div class="empty-state">
                                <i class="fas fa-shopping-basket"></i>
                                <p>Keranjang kosong</p>
                            </div>
                        </div>
                        <div class="cart-footer">
                            <div class="d-flex justify-content-between mb-2">
                                <span>Items:</span>
                                <strong id="cartCount">0</strong>
                            </div>
                            <div class="d-flex justify-content-between mb-3">
                                <span class="fs-5">Total:</span>
                                <strong class="fs-5 text-primary-custom" id="cartTotal">Rp 0</strong>
                            </div>
                            <button class="btn btn-primary w-100 btn-lg" id="btnCheckout" onclick="POS.showPayment()" disabled>
                                <i class="fas fa-check-circle me-2"></i>Bayar
                            </button>
                        </div>
                    </div>
                </div>
                <div id="posModals"></div>
            `;
        } catch (err) {
            content.innerHTML = `<div class="alert alert-danger">Error: ${err.message}</div>`;
        }
    },

    renderMenuGrid(products) {
        if (products.length === 0) {
            return '<div class="empty-state"><i class="fas fa-search"></i><p>Menu tidak ditemukan</p></div>';
        }
        return products.map(p => `
            <div class="menu-card" data-id="${p.id}" data-cat="${p.category_id}" onclick="POS.addToCart('${p.id}')">
                <div class="menu-img">
                    ${p.image ? `<img src="${p.image}" style="width:100%;height:100%;object-fit:cover;">` : '<i class="fas fa-mug-hot"></i>'}
                </div>
                <div class="menu-info">
                    <div class="menu-name">${p.name}</div>
                    <div class="menu-price">${App.formatRp(p.price)}</div>
                </div>
            </div>
        `).join('');
    },

    filterMenu() {
        const search = document.getElementById('posSearch').value.toLowerCase();
        const filtered = this.products.filter(p => p.name.toLowerCase().includes(search));
        document.getElementById('menuGrid').innerHTML = this.renderMenuGrid(filtered);
    },

    filterByCategory(catId, btn) {
        document.querySelectorAll('.category-pills .btn').forEach(b => {
            b.classList.remove('btn-primary');
            b.classList.add('btn-outline-primary');
        });
        btn.classList.remove('btn-outline-primary');
        btn.classList.add('btn-primary');

        const filtered = catId ? this.products.filter(p => p.category_id === catId) : this.products;
        document.getElementById('menuGrid').innerHTML = this.renderMenuGrid(filtered);
    },

    addToCart(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        const existing = this.cart.find(c => c.product_id === productId);
        if (existing) {
            existing.quantity++;
            existing.subtotal = existing.quantity * existing.price;
        } else {
            this.cart.push({
                product_id: product.id,
                name: product.name,
                price: Number(product.price),
                quantity: 1,
                subtotal: Number(product.price)
            });
        }

        this.renderCart();
    },

    removeFromCart(index) {
        this.cart.splice(index, 1);
        this.renderCart();
    },

    updateQty(index, delta) {
        this.cart[index].quantity += delta;
        if (this.cart[index].quantity <= 0) {
            this.cart.splice(index, 1);
        } else {
            this.cart[index].subtotal = this.cart[index].quantity * this.cart[index].price;
        }
        this.renderCart();
    },

    clearCart() {
        this.cart = [];
        this.renderCart();
    },

    renderCart() {
        const container = document.getElementById('cartItems');
        const total = this.cart.reduce((s, c) => s + c.subtotal, 0);
        const count = this.cart.reduce((s, c) => s + c.quantity, 0);

        if (this.cart.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-shopping-basket"></i><p>Keranjang kosong</p></div>';
        } else {
            container.innerHTML = this.cart.map((item, i) => `
                <div class="cart-item">
                    <div class="item-info">
                        <div class="item-name">${item.name}</div>
                        <div class="item-price">${App.formatRp(item.price)} x ${item.quantity} = ${App.formatRp(item.subtotal)}</div>
                    </div>
                    <div class="qty-control">
                        <button onclick="POS.updateQty(${i}, -1)"><i class="fas fa-minus"></i></button>
                        <span class="qty">${item.quantity}</span>
                        <button onclick="POS.updateQty(${i}, 1)"><i class="fas fa-plus"></i></button>
                    </div>
                    <button class="btn btn-sm text-danger" onclick="POS.removeFromCart(${i})"><i class="fas fa-times"></i></button>
                </div>
            `).join('');
        }

        document.getElementById('cartCount').textContent = count;
        document.getElementById('cartTotal').textContent = App.formatRp(total);
        document.getElementById('btnCheckout').disabled = this.cart.length === 0;
    },

    showPayment() {
        const total = this.cart.reduce((s, c) => s + c.subtotal, 0);

        document.getElementById('posModals').innerHTML = `
            <div class="modal fade show" style="display:block; background:rgba(0,0,0,0.5)" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title"><i class="fas fa-credit-card me-2"></i>Pembayaran</h5>
                            <button type="button" class="btn-close" onclick="POS.closeModals()"></button>
                        </div>
                        <div class="modal-body">
                            <div class="text-center mb-4">
                                <div class="text-muted">Total Pembayaran</div>
                                <div class="fs-3 fw-bold text-primary-custom">${App.formatRp(total)}</div>
                            </div>
                            <div class="mb-3">
                                <label class="form-label fw-bold">Metode Pembayaran</label>
                                <div class="d-flex gap-2 flex-wrap">
                                    <button class="btn btn-outline-primary flex-fill active" id="pay_tunai" onclick="POS.selectPayMethod('tunai')">
                                        <i class="fas fa-money-bill-wave me-1"></i>Tunai
                                    </button>
                                    <button class="btn btn-outline-primary flex-fill" id="pay_qris" onclick="POS.selectPayMethod('qris')">
                                        <i class="fas fa-qrcode me-1"></i>QRIS
                                    </button>
                                    <button class="btn btn-outline-primary flex-fill" id="pay_transfer" onclick="POS.selectPayMethod('transfer')">
                                        <i class="fas fa-university me-1"></i>Transfer
                                    </button>
                                    <button class="btn btn-outline-primary flex-fill" id="pay_ewallet" onclick="POS.selectPayMethod('e-wallet')">
                                        <i class="fas fa-wallet me-1"></i>E-Wallet
                                    </button>
                                </div>
                            </div>
                            <div id="tunaiSection">
                                <div class="mb-3">
                                    <label class="form-label">Nominal Bayar (Rp)</label>
                                    <input type="number" class="form-control form-control-lg" id="payNominal" value="${total}" min="${total}" oninput="POS.calcChange()">
                                </div>
                                <div class="d-flex gap-2 mb-3">
                                    ${[total, 50000, 100000, 200000].filter(v => v >= total).map(v => `
                                        <button class="btn btn-outline-secondary btn-sm" onclick="document.getElementById('payNominal').value=${v};POS.calcChange()">${App.formatRp(v)}</button>
                                    `).join('')}
                                </div>
                                <div class="card bg-light">
                                    <div class="card-body d-flex justify-content-between">
                                        <span>Kembalian:</span>
                                        <strong id="changeAmount" class="text-success">Rp 0</strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" onclick="POS.closeModals()">Batal</button>
                            <button type="button" class="btn btn-success btn-lg" onclick="POS.processPayment()">
                                <i class="fas fa-check me-2"></i>Proses Pembayaran
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.selectedMethod = 'tunai';
        this.calcChange();
    },

    selectPayMethod(method) {
        this.selectedMethod = method;
        ['tunai', 'qris', 'transfer', 'ewallet'].forEach(m => {
            const btn = document.getElementById('pay_' + (m === 'ewallet' ? 'ewallet' : m));
            if (btn) {
                btn.classList.toggle('active', m === method.replace('-', ''));
                btn.classList.toggle('btn-primary', m === method.replace('-', ''));
                btn.classList.toggle('btn-outline-primary', m !== method.replace('-', ''));
            }
        });

        document.getElementById('tunaiSection').style.display = method === 'tunai' ? 'block' : 'none';
    },

    calcChange() {
        const total = this.cart.reduce((s, c) => s + c.subtotal, 0);
        const nominal = parseInt(document.getElementById('payNominal').value) || 0;
        const change = Math.max(0, nominal - total);
        document.getElementById('changeAmount').textContent = App.formatRp(change);
    },

    async processPayment() {
        const total = this.cart.reduce((s, c) => s + c.subtotal, 0);
        const nominal = this.selectedMethod === 'tunai' ? (parseInt(document.getElementById('payNominal').value) || total) : total;
        const change = this.selectedMethod === 'tunai' ? Math.max(0, nominal - total) : 0;

        if (this.selectedMethod === 'tunai' && nominal < total) {
            App.showToast('Nominal bayar kurang!', 'danger');
            return;
        }

        const trxNumber = App.genTrxNumber();

        try {
            // Insert transaction
            const { data: tx, error: txError } = await supabase.from('transactions').insert({
                transaction_number: trxNumber,
                cashier_id: Auth.getUserId(),
                total: total,
                payment_method: this.selectedMethod,
                nominal_paid: nominal,
                change_amount: change
            }).select().single();

            if (txError) throw txError;

            // Insert items
            const items = this.cart.map(c => ({
                transaction_id: tx.id,
                product_id: c.product_id,
                product_name: c.name,
                price: c.price,
                quantity: c.quantity,
                subtotal: c.subtotal
            }));

            const { error: itemError } = await supabase.from('transaction_items').insert(items);
            if (itemError) throw itemError;

            // Show receipt
            this.showReceipt(tx, items);
            this.cart = [];
            this.renderCart();

        } catch (err) {
            App.showToast('Error: ' + err.message, 'danger');
        }
    },

    showReceipt(tx, items) {
        document.getElementById('posModals').innerHTML = `
            <div class="modal fade show" style="display:block; background:rgba(0,0,0,0.5)" tabindex="-1">
                <div class="modal-dialog modal-sm">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Transaksi Berhasil!</h5>
                            <button type="button" class="btn-close" onclick="POS.closeModals()"></button>
                        </div>
                        <div class="modal-body text-center">
                            <div class="receipt" id="posReceipt">
                                <div class="receipt-header">
                                    <h3>KEDAI 99</h3>
                                    <p style="margin:5px 0;font-size:12px;">Jl. Contoh No. 99, Kota</p>
                                </div>
                                <div style="margin-bottom:10px;font-size:12px;">
                                    <div>No: ${tx.transaction_number}</div>
                                    <div>Tanggal: ${App.formatDateTime(tx.created_at)}</div>
                                    <div>Kasir: ${Auth.getUserName()}</div>
                                </div>
                                <div class="receipt-items" style="border-top:1px dashed #333;padding-top:8px;">
                                    ${items.map(item => `
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
                        <div class="modal-footer justify-content-center">
                            <button type="button" class="btn btn-outline-primary" onclick="POS.printReceipt()">
                                <i class="fas fa-print me-2"></i>Cetak Struk
                            </button>
                            <button type="button" class="btn btn-primary" onclick="POS.closeModals()">
                                <i class="fas fa-check me-2"></i>Selesai
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    printReceipt() {
        const content = document.getElementById('posReceipt');
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
    },

    closeModals() {
        document.getElementById('posModals').innerHTML = '';
    }
};
