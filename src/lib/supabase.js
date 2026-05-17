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
  const KEY = (t) => `intake_${t}`;
  const SESSION_KEY = "intake_session";
  const listeners = new Set();

  const read = (t) => { try { return JSON.parse(localStorage.getItem(KEY(t)) || "[]"); } catch { return []; } };
  const write = (t, rows) => localStorage.setItem(KEY(t), JSON.stringify(rows));
  const readSession = () => { try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); } catch { return null; } };
  const writeSession = (s) => s ? localStorage.setItem(SESSION_KEY, JSON.stringify(s)) : localStorage.removeItem(SESSION_KEY);
  const notify = (ev, s) => listeners.forEach(fn => fn(ev, s));

  // Fluent, thenable query builder
  class Q {
    constructor(table) {
      this._t = table; this._op = null; this._payload = null;
      this._where = []; this._orderCol = null; this._orderAsc = true;
      this._single = false; this._returnData = false;
    }
    select()           { if (!this._op) this._op = "select"; this._returnData = true; return this; }
    insert(p)          { this._op = "insert"; this._payload = p; return this; }
    update(p)          { this._op = "update"; this._payload = p; return this; }
    delete()           { this._op = "delete"; return this; }
    eq(col, val)       { this._where.push([col, val]); return this; }
    order(col, o = {}) { this._orderCol = col; this._orderAsc = o.ascending !== false; return this; }
    single()           { this._single = true; return this; }
    then(res, rej)     { return Promise.resolve(this._run()).then(res, rej); }

    _match(r) { return this._where.every(([c, v]) => r[c] === v); }

    _run() {
      const rows = read(this._t);
      if (this._op === "select") {
        let result = rows.filter(r => this._match(r));
        if (this._orderCol) {
          const { _orderCol: col, _orderAsc: asc } = this;
          result = [...result].sort((a, b) => asc ? (a[col] < b[col] ? -1 : 1) : (a[col] > b[col] ? -1 : 1));
        }
        return { data: this._single ? (result[0] ?? null) : result, error: null };
      }
      if (this._op === "insert") {
        const entry = { ...this._payload, id: crypto.randomUUID(), created_at: new Date().toISOString() };
        write(this._t, [...rows, entry]);
        return { data: this._returnData ? (this._single ? entry : [entry]) : null, error: null };
      }
      if (this._op === "update") {
        let updated = null;
        write(this._t, rows.map(r => { if (this._match(r)) { updated = { ...r, ...this._payload }; return updated; } return r; }));
        return { data: this._returnData ? (this._single ? updated : [updated].filter(Boolean)) : null, error: null };
      }
      if (this._op === "delete") {
        write(this._t, rows.filter(r => !this._match(r)));
        return { error: null };
      }
      return { data: null, error: null };
    }
  }

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
        writeSession(session); notify("SIGNED_IN", session);
        return { data: { session }, error: null };
      },
      signUp: async () => ({ data: {}, error: null }),
      signOut: async () => { writeSession(null); notify("SIGNED_OUT", null); return { error: null }; },
    },
    from: (table) => new Q(table),
    rpc: async () => ({ data: null, error: null }),
  };
}

export { supabase };
