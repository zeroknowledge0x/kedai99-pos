// ============================================================
// Kategori Page - CRUD Kategori (Admin)
// ============================================================

const KategoriPage = {
    async render() {
        const content = document.getElementById('contentArea');
        content.innerHTML = '<div class="text-center py-5"><i class="fas fa-spinner fa-spin fa-2x text-muted"></i></div>';

        try {
            const { data, error } = await supabase.from('categories').select('*').order('name');
            const categories = data || [];

            content.innerHTML = `
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <span class="text-muted">${categories.length} kategori</span>
                    <button class="btn btn-primary btn-sm" onclick="KategoriPage.showForm()"><i class="fas fa-plus me-1"></i>Tambah Kategori</button>
                </div>
                <div class="card">
                    <div class="table-responsive">
                        <table class="table table-hover mb-0">
                            <thead><tr><th>No</th><th>Nama Kategori</th><th>Aksi</th></tr></thead>
                            <tbody>
                                ${categories.length > 0 ? categories.map((c, i) => `
                                    <tr>
                                        <td>${i + 1}</td>
                                        <td><strong>${c.name}</strong></td>
                                        <td>
                                            <button class="btn btn-outline-primary btn-sm me-1" onclick="KategoriPage.showForm('${c.id}', '${c.name}')"><i class="fas fa-edit"></i></button>
                                            <button class="btn btn-outline-danger btn-sm" onclick="KategoriPage.delete('${c.id}')"><i class="fas fa-trash"></i></button>
                                        </td>
                                    </tr>
                                `).join('') : '<tr><td colspan="3" class="text-center text-muted py-4">Belum ada kategori</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div id="kategoriFormModal"></div>
            `;
        } catch (err) {
            content.innerHTML = `<div class="alert alert-danger">Error: ${err.message}</div>`;
        }
    },

    showForm(editId, editName) {
        document.getElementById('kategoriFormModal').innerHTML = `
            <div class="modal fade show" style="display:block; background:rgba(0,0,0,0.5)" tabindex="-1">
                <div class="modal-dialog modal-sm">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${editId ? 'Edit Kategori' : 'Tambah Kategori'}</h5>
                            <button type="button" class="btn-close" onclick="KategoriPage.closeForm()"></button>
                        </div>
                        <form onsubmit="KategoriPage.save(event, '${editId || ''}')">
                            <div class="modal-body">
                                <label class="form-label">Nama Kategori</label>
                                <input type="text" class="form-control" id="kf_name" value="${editName || ''}" required autofocus>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" onclick="KategoriPage.closeForm()">Batal</button>
                                <button type="submit" class="btn btn-primary"><i class="fas fa-save me-1"></i>Simpan</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        setTimeout(() => document.getElementById('kf_name')?.focus(), 100);
    },

    closeForm() {
        document.getElementById('kategoriFormModal').innerHTML = '';
    },

    async save(e, editId) {
        e.preventDefault();
        const name = document.getElementById('kf_name').value.trim();
        if (!name) return;

        let result;
        if (editId) {
            result = await supabase.from('categories').update({ name }).eq('id', editId);
        } else {
            result = await supabase.from('categories').insert({ name });
        }

        if (result.error) {
            App.showToast('Error: ' + result.error.message, 'danger');
        } else {
            App.showToast(editId ? 'Kategori diupdate!' : 'Kategori ditambahkan!');
            this.closeForm();
            this.render();
        }
    },

    async delete(id) {
        if (!App.confirm('Yakin hapus kategori ini? Menu di kategori ini tidak akan terhapus.')) return;
        const { error } = await supabase.from('categories').delete().eq('id', id);
        if (error) {
            App.showToast('Error: ' + error.message, 'danger');
        } else {
            App.showToast('Kategori dihapus!');
            this.render();
        }
    }
};
