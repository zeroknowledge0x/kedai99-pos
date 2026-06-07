// ============================================================
// Kasir Page - CRUD Akun Kasir (Admin)
// ============================================================

const KasirPage = {
    async render() {
        const content = document.getElementById('contentArea');
        content.innerHTML = '<div class="text-center py-5"><i class="fas fa-spinner fa-spin fa-2x text-muted"></i></div>';

        try {
            const { data } = await supabase.from('users').select('*').eq('role', 'kasir').order('name');
            const kasirs = data || [];

            content.innerHTML = `
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <span class="text-muted">${kasirs.length} akun kasir</span>
                    <button class="btn btn-primary btn-sm" onclick="KasirPage.showForm()"><i class="fas fa-plus me-1"></i>Tambah Kasir</button>
                </div>
                <div class="card">
                    <div class="table-responsive">
                        <table class="table table-hover mb-0">
                            <thead><tr><th>No</th><th>Nama</th><th>Email</th><th>Status</th><th>Aksi</th></tr></thead>
                            <tbody>
                                ${kasirs.length > 0 ? kasirs.map((k, i) => `
                                    <tr>
                                        <td>${i + 1}</td>
                                        <td><strong>${k.name}</strong></td>
                                        <td>${k.email}</td>
                                        <td><span class="badge ${k.active ? 'badge-tersedia' : 'badge-habis'}">${k.active ? 'Aktif' : 'Nonaktif'}</span></td>
                                        <td>
                                            <button class="btn btn-outline-primary btn-sm me-1" onclick="KasirPage.showForm('${k.id}')" title="Edit"><i class="fas fa-edit"></i></button>
                                            <button class="btn btn-outline-warning btn-sm me-1" onclick="KasirPage.resetPassword('${k.id}')" title="Reset Password"><i class="fas fa-key"></i></button>
                                            <button class="btn btn-outline-${k.active ? 'secondary' : 'success'} btn-sm me-1" onclick="KasirPage.toggleActive('${k.id}', ${!k.active})" title="${k.active ? 'Nonaktifkan' : 'Aktifkan'}">
                                                <i class="fas fa-${k.active ? 'ban' : 'check'}"></i>
                                            </button>
                                            <button class="btn btn-outline-danger btn-sm" onclick="KasirPage.delete('${k.id}')" title="Hapus"><i class="fas fa-trash"></i></button>
                                        </td>
                                    </tr>
                                `).join('') : '<tr><td colspan="5" class="text-center text-muted py-4">Belum ada akun kasir</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div id="kasirFormModal"></div>
            `;
        } catch (err) {
            content.innerHTML = `<div class="alert alert-danger">Error: ${err.message}</div>`;
        }
    },

    async showForm(editId) {
        let kasir = { name: '', email: '', password: 'kasir123' };
        if (editId) {
            const { data } = await supabase.from('users').select('*').eq('id', editId).single();
            if (data) kasir = data;
        }

        document.getElementById('kasirFormModal').innerHTML = `
            <div class="modal fade show" style="display:block; background:rgba(0,0,0,0.5)" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${editId ? 'Edit Kasir' : 'Tambah Kasir'}</h5>
                            <button type="button" class="btn-close" onclick="KasirPage.closeForm()"></button>
                        </div>
                        <form onsubmit="KasirPage.save(event, '${editId || ''}')">
                            <div class="modal-body">
                                <div class="mb-3">
                                    <label class="form-label">Nama</label>
                                    <input type="text" class="form-control" id="kcf_name" value="${kasir.name}" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Email</label>
                                    <input type="email" class="form-control" id="kcf_email" value="${kasir.email}" required>
                                </div>
                                ${!editId ? `
                                <div class="mb-3">
                                    <label class="form-label">Password</label>
                                    <input type="text" class="form-control" id="kcf_password" value="kasir123" required>
                                    <small class="text-muted">Default: kasir123</small>
                                </div>` : ''}
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" onclick="KasirPage.closeForm()">Batal</button>
                                <button type="submit" class="btn btn-primary"><i class="fas fa-save me-1"></i>Simpan</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
    },

    closeForm() {
        document.getElementById('kasirFormModal').innerHTML = '';
    },

    async save(e, editId) {
        e.preventDefault();
        const name = document.getElementById('kcf_name').value.trim();
        const email = document.getElementById('kcf_email').value.trim();

        let result;
        if (editId) {
            result = await supabase.from('users').update({ name, email }).eq('id', editId);
        } else {
            const password = document.getElementById('kcf_password').value;
            result = await supabase.from('users').insert({ name, email, password, role: 'kasir', active: true });
        }

        if (result.error) {
            App.showToast('Error: ' + result.error.message, 'danger');
        } else {
            App.showToast(editId ? 'Kasir diupdate!' : 'Kasir ditambahkan!');
            this.closeForm();
            this.render();
        }
    },

    async resetPassword(id) {
        if (!App.confirm('Reset password ke "kasir123"?')) return;
        const { error } = await supabase.from('users').update({ password: 'kasir123' }).eq('id', id);
        if (error) {
            App.showToast('Error: ' + error.message, 'danger');
        } else {
            App.showToast('Password direset ke: kasir123');
        }
    },

    async toggleActive(id, active) {
        const { error } = await supabase.from('users').update({ active }).eq('id', id);
        if (error) {
            App.showToast('Error: ' + error.message, 'danger');
        } else {
            App.showToast(active ? 'Kasir diaktifkan!' : 'Kasir dinonaktifkan!');
            this.render();
        }
    },

    async delete(id) {
        if (!App.confirm('Yakin hapus akun kasir ini?')) return;
        const { error } = await supabase.from('users').delete().eq('id', id);
        if (error) {
            App.showToast('Error: ' + error.message, 'danger');
        } else {
            App.showToast('Akun kasir dihapus!');
            this.render();
        }
    }
};
