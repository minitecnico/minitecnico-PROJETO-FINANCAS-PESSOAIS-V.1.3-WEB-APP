import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // eslint-disable-next-line no-console
  console.error(
    '❌ VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não definidas. ' +
      'Crie um .env com essas variáveis (veja .env.example).'
  );
}

/**
 * Cliente Supabase global.
 * --------------------------------------------------------------
 * Já cuida de:
 *  - Auth (signUp, signInWithPassword, signOut, onAuthStateChange)
 *  - REST automática a partir das tabelas (.from('table').select/insert/update/delete)
 *  - RPC (.rpc('function_name')) para funções SQL customizadas
 *  - Persistência da sessão no localStorage
 */
export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
