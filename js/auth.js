// ============================================================
// Auth Module - Login/Logout & Session Management
// ============================================================

const Auth = {
    currentUser: null,

    init() {
        const saved = localStorage.getItem('kedai99_user');
        if (saved) {
            try {
                this.currentUser = JSON.parse(saved);
                return true;
            } catch (e) {
                localStorage.removeItem('kedai99_user');
            }
        }
        return false;
    },

    async login(email, password) {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .eq('password', password)
            .eq('active', true)
            .single();

        if (error || !data) {
            return { success: false, message: 'Email atau password salah, atau akun tidak aktif.' };
        }

        this.currentUser = data;
        localStorage.setItem('kedai99_user', JSON.stringify(data));
        return { success: true, user: data };
    },

    logout() {
        this.currentUser = null;
        localStorage.removeItem('kedai99_user');
    },

    isAdmin() {
        return this.currentUser && this.currentUser.role === 'admin';
    },

    isKasir() {
        return this.currentUser && this.currentUser.role === 'kasir';
    },

    getUser() {
        return this.currentUser;
    },

    getUserId() {
        return this.currentUser ? this.currentUser.id : null;
    },

    getUserName() {
        return this.currentUser ? this.currentUser.name : '';
    }
};
