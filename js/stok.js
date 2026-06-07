// ============================================================
// Stok Page - CRUD Stok Barang (Admin)
// ============================================================

const StokPage = {
    async render() {
        const content = document.getElementById('contentArea');
        content.innerHTML = '<div class="text-center py-5"><i class="fas fa-spinner fa-spin fa-2x text-muted"></i></div>';

        try {
            const { data } = await supabase.from('stocks').select('*').order('name');
            const stocks = data || [];

            content.innerHTML = `
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <span class="text-muted">${stocks.length} item stok</span>
                    <button class="btn btn-primary btn-sm" onclick="StokPage.showForm()"><i class="fas fa-plus me-1"></i>Tambah Stok</button>
                </div>
                <div class="card">
                    <div class="table-responsive">
                        <table class="table table-hover mb-0">
                            <thead>
                                <tr><th>No</th><th>Nama Barang</th><th>Jumlah</th><th>Satuan</th><th>Min. Stok</th><th>Status</th><th>Aksi</th></tr>
                            </thead>
                            <tbody>
                                ${stocks.length > 0 ? stocks.map((s, i) => {
                                    const isLow = Number(s.quantity) <= Number(s.min_stock);
                                    return `
                                        <tr>
                                            <td>${i + 1}</td>
                                            <td><strong>${s.name}</strong></td>
                                            <td class="${isLow ? 'stock-warning' : ''}">${s.quantity}</td>
                                            <td>${s.unit}</td>
                                            <td>${s.min_stock}</td>
                                            <td>${isLow ? '<span class="badge badge-habis">Menipis</span>' : '<span class="badge badge-tersedia">Aman</span>'}</td>
                                            <td>
                                                <button class="btn btn-outline-success btn-sm me-1" onclick="StokPage.adjustStock('${s.id}', 'add')" title="Tambah Stok"><i class="fas fa-plus"></i></button>
                                                <button class="btn btn-outline-warning btn-sm me-1" onclick="StokPage.adjustStock('${s.id}', 'sub')" title="Kurangi Stok"><i class="fas fa-minus"></i></button>
                                                <button class="btn btn-outline-primary btn-sm me-1" onclick="StokPage.showForm('${s.id}')" title="Edit"><i class="fas fa-edit"></i></button>
                                                <button class="btn btn-outline-danger btn-sm" onclick="StokPage.delete('${s.id}')" title="Hapus"><i class="fas fa-trash"></i></button>
                                            </td>
                                        </tr>
                                    `;
                                }).join('') : '<tr><td colspan="7" class="text-center text-muted py-4">Belum ada stok barang</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div id="stokFormModal"></div>
            `;
        } catch (err) {
            content.innerHTML = `<div class="alert alert-danger">Error: ${err.message}</div>`;
        }
    },

    async showForm(editId) {
        let stok = { name: '', quantity: '', unit: '', min_stock: '' };
        if (editId) {
            const { data } = await supabase.from('stocks').select('*').eq('id', editId).single();
            if (data) stok = data;
        }

        document.getElementById('stokFormModal').innerHTML = `
            <div class="modal fade show" style="display:block; background:rgba(0,0,0,0.5)" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${editId ? 'Edit Stok' : 'Tambah Stok'}</h5>
                            <button type="button" class="btn-close" onclick="StokPage.closeForm()"></button>
                        </div>
                        <form onsubmit="StokPage.save(event, '${editId || ''}')">
                            <div class="modal-body">
                                <div class="mb-3">
                                    <label class="form-label">Nama Barang</label>
                                    <input type="text" class="form-control" id="sf_name" value="${stok.name}" required>
                                </div>
                                <div class="row">
                                    <div class="col-md-4 mb-3">
                                        <label class="form-label">Jumlah</label>
                                        <input type="number" class="form-control" id="sf_qty" value="${stok.quantity}" required step="0.01" min="0">
                                    </div>
                                    <div class="col-md-4 mb-3">
                                        <label class="form-label">Satuan</label>
                                        <input type="text" class="form-control" id="sf_unit" value="${stok.unit}" required placeholder="Kg, Liter, Box...">
                                    </div>
                                    <div class="col-md-4 mb-3">
                                        <label class="form-label">Minimum Stok</label>
                                        <input type="number" class="form-control" id="sf_min" value="${stok.min_stock}" required step="0.01" min="0">
                                    </div>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" onclick="StokPage.closeForm()">Batal</button>
                                <button type="submit" class="btn btn-primary"><i class="fas fa-save me-1"></i>Simpan</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
    },

    closeForm() {
        document.getElementById('stokFormModal').innerHTML = '';
    },

    async adjustStock(id, direction) {
        const amount = prompt(direction === 'add' ? 'Tambah berapa?' : 'Kurangi berapa?');
        if (!amount || isNaN(amount)) return;

        const { data } = await supabase.from('stocks').select('quantity').eq('id', id).single();
        if (!data) return;

        const newQty = direction === 'add'
            ? Number(data.quantity) + Number(amount)
            : Math.max(0, Number(data.quantity) - Number(amount));

        const { error } = await supabase.from('stocks').update({ quantity: newQty }).eq('id', id);
        if (error) {
            App.showToast('Error: ' + error.message, 'danger');
        } else {
            App.showToast('Stok diupdate!');
            this.render();
        }
    },

    async save(e, editId) {
        e.preventDefault();
        const payload = {
            name: document.getElementById('sf_name').value.trim(),
            quantity: parseFloat(document.getElementById('sf_qty').value),
            unit: document.getElementById('sf_unit').value.trim(),
            min_stock: parseFloat(document.getElementById('sf_min').value)
        };

        let result;
        if (editId) {
            result = await supabase.from('stocks').update(payload).eq('id', editId);
        } else {
            result = await supabase.from('stocks').insert(payload);
        }

        if (result.error) {
            App.showToast('Error: ' + result.error.message, 'danger');
        } else {
            App.showToast(editId ? 'Stok diupdate!' : 'Stok ditambahkan!');
            this.closeForm();
            this.render();
        }
    },

    async delete(id) {
        if (!App.confirm('Yakin hapus stok ini?')) return;
        const { error } = await supabase.from('stocks').delete().eq('id', id);
        if (error) {
            App.showToast('Error: ' + error.message, 'danger');
        } else {
            App.showToast('Stok dihapus!');
            this.render();
        }
    }
};
