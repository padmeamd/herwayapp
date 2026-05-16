import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Supabase is optional — if not configured the app falls back to mock data
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export const isSupabaseEnabled = !!supabase

// ── Incidents ──────────────────────────────────────────────────────────────

export const fetchIncidents = async (centerLat, centerLng, radiusKm = 5) => {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('incidents')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) { console.warn('Supabase fetch error:', error.message); return null }
  return data
}

export const insertIncident = async ({ type, description, lat, lng, severity, userId }) => {
  if (!supabase) return null
  const { data, error } = await supabase.from('incidents').insert([
    { type, description, lat, lng, severity, user_id: userId ?? null }
  ]).select().single()
  if (error) { console.warn('Supabase insert error:', error.message); return null }
  return data
}

export const subscribeToIncidents = (onInsert) => {
  if (!supabase) return null
  const channel = supabase
    .channel('incidents-realtime')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'incidents' }, (payload) => {
      onInsert(payload.new)
    })
    .subscribe()
  return () => supabase.removeChannel(channel)
}

// ── Auth ───────────────────────────────────────────────────────────────────

export const signInWithEmail = async (email, password) => {
  if (!supabase) return { error: { message: 'Supabase not configured' } }
  return supabase.auth.signInWithPassword({ email, password })
}

export const signUpWithEmail = async (email, password) => {
  if (!supabase) return { error: { message: 'Supabase not configured' } }
  return supabase.auth.signUp({ email, password })
}

export const signOut = async () => {
  if (!supabase) return
  await supabase.auth.signOut()
}

export const onAuthStateChange = (callback) => {
  if (!supabase) return () => {}
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null)
  })
  return () => subscription.unsubscribe()
}

// ── SQL to create incidents table (copy into Supabase SQL editor) ──────────
/*
CREATE TABLE incidents (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  type        text NOT NULL,
  description text,
  lat         float8 NOT NULL,
  lng         float8 NOT NULL,
  severity    text DEFAULT 'medium',
  user_id     uuid REFERENCES auth.users(id),
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read incidents"
  ON incidents FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert"
  ON incidents FOR INSERT TO authenticated WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE incidents;
*/
