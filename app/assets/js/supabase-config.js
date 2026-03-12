// ============================================================
// CONFIGURAÇÃO CENTRAL DO SUPABASE
// ============================================================
// URL do projeto
const SUPABASE_URL = "https://@fthrnmzjskfvuiseoeln.supabase.co";
// Chave pública (anon/public)
const SUPABASE_KEY = "@eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0aHJubXpqc2tmdnVpc2VvZWxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NDQ2OTUsImV4cCI6MjA4ODUyMDY5NX0.GGL0pCJgYMqYuNSVXaNz8qLnFGhbFX--fBussEpN9kY";
// Instância única do cliente
let supabaseClient = null;
// ============================================================
// Criar / obter cliente Supabase
// ============================================================
function getClient() {
  if (!supabaseClient) {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
  }
  return supabaseClient;
}
// ============================================================
// Utilitário para obter sessão atual
// ============================================================
async function getSession() {
  const client = getClient();
  const { data } = await client.auth.getSession();
  return data.session;
}
// ============================================================
// Utilitário para obter usuário atual
// ============================================================
async function getUser() {
  const client = getClient();
  const { data } = await client.auth.getUser();
  return data.user;
}
