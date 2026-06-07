// ============================================================
// Menu Page - CRUD Menu (Admin)
// ============================================================

const MenuPage = {
    categories: [],

    async render() {
        const content = document.getElementById('contentArea');
        content.innerHTML = '<div class="text-center py-5"><i class="fas fa-spinner fa-spin fa-2x text-muted"></i></div>';

        try {
            const [menuRes, catRes] = await Promise.all([
                supabase.from('products').select('*, categories(name)').order('created_at', { ascending: false }),
                supabase.from('categories').select('*').order('name')
            ]);

            this.categories = catRes.data || [];
            const menus = menuRes.data || [];

            content.innerHTML = `
                <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                    <div class="d-flex gap-2 flex-wrap">
                        <select id="menuFilterKategori" class="form-select form-select-sm" style="width:auto" onchange="MenuPage.filterMenu()">
                            <option value="">Semua Kategori</option>
                            ${this.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                        </select>
                        <input type="text" id="menuSearch" class="form-control form-control-sm" placeholder="Cari menu..." style="width:200px" oninput="MenuPage.filterMenu()">
                    </div>
                    <button class="btn btn-primary btn-sm" onclick="MenuPage.showForm()"><i class="fas fa-plus me-1"></i>Tambah Menu</button>
                </div>
                <div class="card">
                    <div class="table-responsive">
                        <table class="table table-hover mb-0" id="menuTable">
                            <thead>
                                <tr>
                                    <th>Gambar</th>
                                    <th>Nama Menu</th>
                                    <th>Harga</th>
                                    <th>Kategori</th>
                                    <th>Status</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${menus.length > 0 ? menus.map(m => `
                                    <tr data-id="${m.id}" data-cat="${m.category_id}" data-name="${(m.name || '').toLowerCase()}">
                                        <td>
                                            ${m.image ? `<img src="${m.image}" class="img-preview">` : '<div class="img-placeholder"><i class="fas fa-image"></i></div>'}
                                        </td>
                                        <td>
                                            <strong>${m.name}</strong>
                                            ${m.description ? `<br><small class="text-muted">${m.description}</small>` : ''}
                                        </td>
                                        <td>${App.formatRp(m.price)}</td>
                                        <td>${m.categories ? m.categories.name : '-'}</td>
                                        <td><span class="badge ${m.status === 'tersedia' ? 'badge-tersedia' : 'badge-habis'}">${m.status}</span></td>
                                        <td>
                                            <button class="btn btn-outline-primary btn-sm me-1" onclick="MenuPage.showForm('${m.id}')"><i class="fas fa-edit"></i></button>
                                            <button class="btn btn-outline-danger btn-sm" onclick="MenuPage.delete('${m.id}')"><i class="fas fa-trash"></i></button>
                                        </td>
                                    </tr>
                                `).join('') : '<tr><td colspan="6" class="text-center text-muted py-4">Belum ada menu</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div id="menuFormModal"></div>
            `;
        } catch (err) {
            content.innerHTML = `<div class="alert alert-danger">Error: ${err.message}</div>`;
        }
    },

    filterMenu() {
        const cat = document.getElementById('menuFilterKategori').value;
        const search = document.getElementById('menuSearch').value.toLowerCase();
        document.querySelectorAll('#menuTable tbody tr').forEach(row => {
            const matchCat = !cat || row.dataset.cat === cat;
            const matchSearch = !search || row.dataset.name.includes(search);
            row.style.display = matchCat && matchSearch ? '' : 'none';
        });
    },

    async showForm(editId) {
        let menu = { name: '', price: '', description: '', category_id: '', image: '', status: 'tersedia' };
        if (editId) {
            const { data } = await supabase.from('products').select('*').eq('id', editId).single();
            if (data) menu = data;
        }

        document.getElementById('menuFormModal').innerHTML = `
            <div class="modal fade show" style="display:block; background:rgba(0,0,0,0.5)" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${editId ? 'Edit Menu' : 'Tambah Menu'}</h5>
                            <button type="button" class="btn-close" onclick="MenuPage.closeForm()"></button>
                        </div>
                        <form onsubmit="MenuPage.save(event, '${editId || ''}')">
                            <div class="modal-body">
                                <div class="mb-3">
                                    <label class="form-label">Nama Menu</label>
                                    <input type="text" class="form-control" id="mf_name" value="${menu.name}" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Harga (Rp)</label>
                                    <input type="number" class="form-control" id="mf_price" value="${menu.price}" required min="0">
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Deskripsi</label>
                                    <textarea class="form-control" id="mf_desc" rows="2">${menu.description || ''}</textarea>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Kategori</label>
                                    <select class="form-select" id="mf_cat">
                                        <option value="">Pilih Kategori</option>
                                        ${this.categories.map(c => `<option value="${c.id}" ${c.id === menu.category_id ? 'selected' : ''}>${c.name}</option>`).join('')}
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Gambar</label>
                                    <input type="file" class="form-control" id="mf_image" accept="image/*" onchange="MenuPage.previewImage(event)">
                                    ${menu.image ? `<img src="${menu.image}" class="img-preview mt-2" id="mf_preview">` : '<div id="mf_preview"></div>'}
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Status</label>
                                    <select class="form-select" id="mf_status">
                                        <option value="tersedia" ${menu.status === 'tersedia' ? 'selected' : ''}>Tersedia</option>
                                        <option value="habis" ${menu.status === 'habis' ? 'selected' : ''}>Habis</option>
                                    </select>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" onclick="MenuPage.closeForm()">Batal</button>
                                <button type="submit" class="btn btn-primary"><i class="fas fa-save me-1"></i>Simpan</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
    },

    previewImage(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const preview = document.getElementById('mf_preview');
            preview.innerHTML = `<img src="${ev.target.result}" class="img-preview mt-2">`;
        };
        reader.readAsDataURL(file);
    },

    closeForm() {
        document.getElementById('menuFormModal').innerHTML = '';
    },

    async save(e, editId) {
        e.preventDefault();
        const name = document.getElementById('mf_name').value.trim();
        const price = parseInt(document.getElementById('mf_price').value);
        const description = document.getElementById('mf_desc').value.trim();
        const category_id = document.getElementById('mf_cat').value || null;
        const status = document.getElementById('mf_status').value;

        let image = '';
        const fileInput = document.getElementById('mf_image');
        if (fileInput.files.length > 0) {
            const reader = new FileReader();
            image = await new Promise(resolve => {
                reader.onload = ev => resolve(ev.target.result);
                reader.readAsDataURL(fileInput.files[0]);
            });
        } else if (editId) {
            const existing = document.getElementById('mf_preview');
            if (existing && existing.querySelector('img')) {
                image = existing.querySelector('img').src;
            }
        }

        const payload = { name, price, description, category_id, status };
        if (image) payload.image = image;

        let result;
        if (editId) {
            result = await supabase.from('products').update(payload).eq('id', editId);
        } else {
            result = await supabase.from('products').insert(payload);
        }

        if (result.error) {
            App.showToast('Error: ' + result.error.message, 'danger');
        } else {
            App.showToast(editId ? 'Menu berhasil diupdate!' : 'Menu berhasil ditambahkan!');
            this.closeForm();
            this.render();
        }
    },

    async delete(id) {
        if (!App.confirm('Yakin hapus menu ini?')) return;
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) {
            App.showToast('Error: ' + error.message, 'danger');
        } else {
            App.showToast('Menu berhasil dihapus!');
            this.render();
        }
    }
};
