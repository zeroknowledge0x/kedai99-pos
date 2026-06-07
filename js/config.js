// ============================================================
// Supabase Configuration
// ============================================================

const SUPABASE_URL = 'https://knmanesujxpfpomwabyb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtubWFuZXN1anhwZnBvbXdhYnliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4MjE1MTMsImV4cCI6MjA5NjM5NzUxM30.szbaW_kXIbeM6Pe5_5dtrFUg0HasVisloxg8IAbsJG8';

// Initialize Supabase client
let supabase;
try {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('Supabase client initialized OK');
} catch (e) {
    console.error('Supabase init error:', e);
    alert('Gagal koneksi ke database. Coba refresh halaman.');
}
