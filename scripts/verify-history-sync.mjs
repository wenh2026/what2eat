import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';

const loadDotEnv = () => {
  try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (!fs.existsSync(envPath)) return;
    const text = fs.readFileSync(envPath, 'utf8');
    text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .forEach((line) => {
        const idx = line.indexOf('=');
        if (idx <= 0) return;
        const key = line.slice(0, idx).trim();
        const value = line.slice(idx + 1).trim();
        if (!process.env[key]) process.env[key] = value;
      });
  } catch {
    return;
  }
};

loadDotEnv();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in env');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const now = Date.now();
const email = process.env.TEST_EMAIL || `what2eat.test+${now}@example.com`;
const password = process.env.TEST_PASSWORD || `Pw!${now}Aa`;
const clientId = `verify-${now}`;

const signInOrSignUp = async () => {
  const signInFirst = await supabase.auth.signInWithPassword({ email, password });
  if (!signInFirst.error && signInFirst.data?.user) return signInFirst.data.user;

  const signUp = await supabase.auth.signUp({ email, password });
  if (signUp.error) {
    const signIn = await supabase.auth.signInWithPassword({ email, password });
    if (signIn.error) throw signIn.error;
    return signIn.data.user;
  }
  if (signUp.data?.user) return signUp.data.user;
  const signIn = await supabase.auth.signInWithPassword({ email, password });
  if (signIn.error) throw signIn.error;
  return signIn.data.user;
};

const run = async () => {
  const user = await signInOrSignUp();
  if (!user?.id) throw new Error('No user id after auth');

  const ensureProfile = await supabase.from('profiles').upsert({ id: user.id }, { onConflict: 'id' }).select('id').single();
  if (ensureProfile.error) throw ensureProfile.error;

  const insert = await supabase
    .from('meal_history')
    .insert({
      user_id: user.id,
      dish_id: null,
      meal_type: 'Lunch',
      calories: 123,
      name: 'Verify Meal',
      protein: 10,
      nutrients: { calcium: 0, iron: 0, folate: 0, vitaminD: 0 },
      recipe: {},
      client_id: clientId,
      eaten_at: new Date().toISOString(),
    })
    .select('id,user_id,client_id,eaten_at,calories')
    .single();

  if (insert.error) throw insert.error;

  const list = await supabase
    .from('meal_history')
    .select('id,client_id,calories')
    .eq('user_id', user.id)
    .order('eaten_at', { ascending: false })
    .limit(5);

  if (list.error) throw list.error;

  console.log(JSON.stringify({ ok: true, userId: user.id, inserted: insert.data, latest: list.data }, null, 2));
  await supabase.auth.signOut();
};

run().catch((err) => {
  if (err?.code === 'invalid_credentials' && !process.env.TEST_EMAIL) {
    console.error(
      JSON.stringify(
        {
          ok: false,
          message:
            'Sign-in failed after sign-up. This usually means email confirmation is enabled in Supabase. Use an existing confirmed test account by setting TEST_EMAIL and TEST_PASSWORD.',
          code: err.code,
        },
        null,
        2,
      ),
    );
    process.exit(1);
  }
  console.error(JSON.stringify({ ok: false, message: err?.message, code: err?.code, details: err }, null, 2));
  process.exit(1);
});
