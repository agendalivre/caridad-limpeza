import { createClient } from "@supabase/supabase-js";

// Cliente de navegador (mantiene la sesión de Caridad en el panel).
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true },
});

export const FUNCTIONS_URL = `${url}/functions/v1`;
