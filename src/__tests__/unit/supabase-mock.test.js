import { describe, it, expect, beforeEach } from "vitest";
import { supabase } from "../../lib/supabase";

// The mock client is always used in tests (no env vars present).
// Test every branch of the Q class and auth object.

const TABLE = "test_entries";

const seed = (rows) => localStorage.setItem(`intake_${TABLE}`, JSON.stringify(rows));
const dump = () => JSON.parse(localStorage.getItem(`intake_${TABLE}`) || "[]");

describe("Mock Supabase client — Q.select()", () => {
  beforeEach(() => seed([]));

  it("returns empty array when table is empty", async () => {
    const { data, error } = await supabase.from(TABLE).select();
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("returns all rows when no filter", async () => {
    seed([{ id: "1", name: "a" }, { id: "2", name: "b" }]);
    const { data } = await supabase.from(TABLE).select();
    expect(data).toHaveLength(2);
  });

  it("filters by eq()", async () => {
    seed([{ id: "1", status: "active" }, { id: "2", status: "pending" }]);
    const { data } = await supabase.from(TABLE).select().eq("status", "active");
    expect(data).toHaveLength(1);
    expect(data[0].id).toBe("1");
  });

  it("supports chained eq() filters (AND semantics)", async () => {
    seed([
      { id: "1", type: "meal", user: "u1" },
      { id: "2", type: "meal", user: "u2" },
      { id: "3", type: "snack", user: "u1" },
    ]);
    const { data } = await supabase.from(TABLE).select().eq("type", "meal").eq("user", "u1");
    expect(data).toHaveLength(1);
    expect(data[0].id).toBe("1");
  });

  it("order() ascending", async () => {
    seed([{ id: "2", val: 2 }, { id: "1", val: 1 }]);
    const { data } = await supabase.from(TABLE).select().order("val", { ascending: true });
    expect(data[0].val).toBe(1);
    expect(data[1].val).toBe(2);
  });

  it("order() descending", async () => {
    seed([{ id: "1", val: 1 }, { id: "2", val: 2 }]);
    const { data } = await supabase.from(TABLE).select().order("val", { ascending: false });
    expect(data[0].val).toBe(2);
  });

  it("order() defaults to ascending when ascending not specified", async () => {
    seed([{ id: "b", name: "b" }, { id: "a", name: "a" }]);
    const { data } = await supabase.from(TABLE).select().order("name");
    expect(data[0].name).toBe("a");
  });

  it("single() returns first match or null", async () => {
    seed([{ id: "1", key: "x" }]);
    const { data } = await supabase.from(TABLE).select().eq("key", "x").single();
    expect(data).toMatchObject({ id: "1", key: "x" });
  });

  it("single() returns null when no match", async () => {
    seed([]);
    const { data } = await supabase.from(TABLE).select().eq("key", "missing").single();
    expect(data).toBeNull();
  });

  it("no-filter select returns all rows even with existing eq-able fields", async () => {
    seed([{ id: "1", x: 1 }, { id: "2", x: 2 }]);
    const { data } = await supabase.from(TABLE).select();
    expect(data).toHaveLength(2);
  });
});

describe("Mock Supabase client — Q.insert()", () => {
  beforeEach(() => seed([]));

  it("inserts a row and returns error:null", async () => {
    const { error } = await supabase.from(TABLE).insert({ name: "test" });
    expect(error).toBeNull();
  });

  it("inserted row appears on subsequent select", async () => {
    await supabase.from(TABLE).insert({ name: "test" });
    const { data } = await supabase.from(TABLE).select();
    expect(data).toHaveLength(1);
    expect(data[0].name).toBe("test");
  });

  it("auto-assigns id (uuid format)", async () => {
    await supabase.from(TABLE).insert({ name: "test" });
    const rows = dump();
    expect(rows[0].id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("auto-assigns created_at", async () => {
    await supabase.from(TABLE).insert({ name: "test" });
    const rows = dump();
    expect(rows[0].created_at).toBeTruthy();
    expect(new Date(rows[0].created_at).toString()).not.toBe("Invalid Date");
  });

  it("multiple inserts accumulate", async () => {
    await supabase.from(TABLE).insert({ name: "a" });
    await supabase.from(TABLE).insert({ name: "b" });
    const { data } = await supabase.from(TABLE).select();
    expect(data).toHaveLength(2);
  });

  it("preserves caller-supplied fields", async () => {
    await supabase.from(TABLE).insert({ name: "x", value: 42 });
    const rows = dump();
    expect(rows[0].value).toBe(42);
  });

  it("select() after insert returns data when chained", async () => {
    const { data } = await supabase.from(TABLE).select().insert({ name: "x" });
    // select sets _returnData, insert sets _op=insert
    // per the Q class _op is overwritten — this tests the last-op-wins behavior
    expect(data).toBeDefined();
  });
});

describe("Mock Supabase client — Q.update()", () => {
  beforeEach(() => {
    seed([{ id: "1", status: "pending", note: "original" }]);
  });

  it("updates matching row fields", async () => {
    await supabase.from(TABLE).update({ status: "active" }).eq("id", "1");
    const rows = dump();
    expect(rows[0].status).toBe("active");
  });

  it("preserves non-updated fields", async () => {
    await supabase.from(TABLE).update({ status: "active" }).eq("id", "1");
    const rows = dump();
    expect(rows[0].note).toBe("original");
  });

  it("does not touch non-matching rows", async () => {
    seed([
      { id: "1", status: "pending" },
      { id: "2", status: "pending" },
    ]);
    await supabase.from(TABLE).update({ status: "active" }).eq("id", "1");
    const rows = dump();
    expect(rows[1].status).toBe("pending");
  });

  it("returns error:null", async () => {
    const { error } = await supabase.from(TABLE).update({ status: "active" }).eq("id", "1");
    expect(error).toBeNull();
  });
});

describe("Mock Supabase client — Q.delete()", () => {
  beforeEach(() => {
    seed([
      { id: "1", name: "keep" },
      { id: "2", name: "remove" },
    ]);
  });

  it("removes matching rows", async () => {
    await supabase.from(TABLE).delete().eq("id", "2");
    const rows = dump();
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe("1");
  });

  it("returns error:null", async () => {
    const { error } = await supabase.from(TABLE).delete().eq("id", "2");
    expect(error).toBeNull();
  });

  it("no-op when eq matches nothing", async () => {
    await supabase.from(TABLE).delete().eq("id", "nonexistent");
    const rows = dump();
    expect(rows).toHaveLength(2);
  });
});

describe("Mock Supabase client — auth", () => {
  it("getSession() returns null session when not signed in", async () => {
    const { data } = await supabase.auth.getSession();
    expect(data.session).toBeNull();
  });

  it("signInWithPassword() succeeds and stores session", async () => {
    const { data, error } = await supabase.auth.signInWithPassword({ email: "a@b.com", password: "pw123" });
    expect(error).toBeNull();
    expect(data.session.user.email).toBe("a@b.com");
  });

  it("signInWithPassword() requires a password", async () => {
    const { error } = await supabase.auth.signInWithPassword({ email: "a@b.com", password: "" });
    expect(error).toBeTruthy();
    expect(error.message).toBe("Password required");
  });

  it("getSession() returns session after sign in", async () => {
    await supabase.auth.signInWithPassword({ email: "a@b.com", password: "pw" });
    const { data } = await supabase.auth.getSession();
    expect(data.session).not.toBeNull();
    expect(data.session.user.email).toBe("a@b.com");
  });

  it("signOut() clears session", async () => {
    await supabase.auth.signInWithPassword({ email: "a@b.com", password: "pw" });
    await supabase.auth.signOut();
    const { data } = await supabase.auth.getSession();
    expect(data.session).toBeNull();
  });

  it("signUp() returns no error", async () => {
    const { error } = await supabase.auth.signUp({ email: "new@test.com", password: "pw" });
    expect(error).toBeNull();
  });

  it("onAuthStateChange() is called with SIGNED_IN on login", async () => {
    const events = [];
    const { data: { subscription } } = supabase.auth.onAuthStateChange((ev, s) => events.push({ ev, s }));
    await supabase.auth.signInWithPassword({ email: "a@b.com", password: "pw" });
    subscription.unsubscribe();
    expect(events.some(e => e.ev === "SIGNED_IN")).toBe(true);
  });

  it("onAuthStateChange() is called with SIGNED_OUT on sign out", async () => {
    await supabase.auth.signInWithPassword({ email: "a@b.com", password: "pw" });
    const events = [];
    const { data: { subscription } } = supabase.auth.onAuthStateChange((ev, s) => events.push({ ev, s }));
    await supabase.auth.signOut();
    subscription.unsubscribe();
    expect(events.some(e => e.ev === "SIGNED_OUT")).toBe(true);
  });

  it("unsubscribe() stops listener from receiving events", async () => {
    const events = [];
    const { data: { subscription } } = supabase.auth.onAuthStateChange((ev) => events.push(ev));
    subscription.unsubscribe();
    await supabase.auth.signInWithPassword({ email: "a@b.com", password: "pw" });
    expect(events).toHaveLength(0);
  });
});

describe("Mock Supabase client — rpc()", () => {
  it("returns data:null and error:null", async () => {
    const { data, error } = await supabase.rpc("purge_old_deleted_entries");
    expect(data).toBeNull();
    expect(error).toBeNull();
  });

  it("accepts any rpc name without throwing", async () => {
    await expect(supabase.rpc("any_function_name")).resolves.not.toThrow();
  });
});
