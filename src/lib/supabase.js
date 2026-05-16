import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase;

if (url && key) {
  supabase = createClient(url, key);
} else {
  // ---------------------------------------------------------------------------
  // Mock client — localStorage-backed, active when env vars are absent
  // ---------------------------------------------------------------------------
  const ENTRIES_KEY = "intake_mock_entries";
  const SESSION_KEY = "intake_mock_session";
  const listeners = new Set();

  const readEntries = () => {
    try { return JSON.parse(localStorage.getItem(ENTRIES_KEY) || "[]"); }
    catch { return []; }
  };
  const writeEntries = (rows) => localStorage.setItem(ENTRIES_KEY, JSON.stringify(rows));

  const readSession = () => {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); }
    catch { return null; }
  };
  const writeSession = (s) => s
    ? localStorage.setItem(SESSION_KEY, JSON.stringify(s))
    : localStorage.removeItem(SESSION_KEY);

  const notify = (event, session) => listeners.forEach(fn => fn(event, session));

  // Chainable select builder — thenable so it can be awaited at any point
  const makeSelect = (rows) => ({
    order: (col, opts = {}) => {
      const asc = opts.ascending !== false;
      const sorted = [...rows].sort((a, b) =>
        asc ? (a[col] < b[col] ? -1 : 1) : (a[col] > b[col] ? -1 : 1)
      );
      return makeSelect(sorted);
    },
    eq: (col, val) => makeSelect(rows.filter(r => r[col] === val)),
    then: (res, rej) => Promise.resolve({ data: rows, error: null }).then(res, rej),
  });

  supabase = {
    auth: {
      getSession: async () => ({ data: { session: readSession() }, error: null }),

      onAuthStateChange: (cb) => {
        listeners.add(cb);
        return { data: { subscription: { unsubscribe: () => listeners.delete(cb) } } };
      },

      signInWithPassword: async ({ email, password }) => {
        if (!password) return { error: { message: "Password required" } };
        const user = { id: `mock::${email}`, email };
        const session = { user, access_token: "mock" };
        writeSession(session);
        notify("SIGNED_IN", session);
        return { data: { session }, error: null };
      },

      signUp: async () => ({ data: {}, error: null }),

      signOut: async () => {
        writeSession(null);
        notify("SIGNED_OUT", null);
        return { error: null };
      },
    },

    from: (_table) => ({
      select: () => makeSelect(readEntries()),

      insert: (payload) => ({
        select: () => ({
          single: async () => {
            const entry = { ...payload, id: crypto.randomUUID(), created_at: new Date().toISOString() };
            writeEntries([entry, ...readEntries()]);
            return { data: entry, error: null };
          },
        }),
      }),

      delete: () => ({
        eq: async (col, val) => {
          writeEntries(readEntries().filter(r => r[col] !== val));
          return { error: null };
        },
      }),
    }),
  };
}

export { supabase };
