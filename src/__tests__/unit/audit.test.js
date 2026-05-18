import { describe, it, expect, vi, beforeEach } from "vitest";

// Use vi.hoisted so mocks are available before the vi.mock factory runs.
const { insertMock, fromMock } = vi.hoisted(() => {
  const insertMock = vi.fn().mockResolvedValue({ error: null });
  const fromMock = vi.fn().mockReturnValue({ insert: insertMock });
  return { insertMock, fromMock };
});

vi.mock("../../lib/supabase", () => ({
  supabase: { from: fromMock },
}));

import { log } from "../../lib/audit";

describe("audit.log()", () => {
  beforeEach(() => {
    fromMock.mockClear();
    insertMock.mockClear();
  });

  it("calls supabase.from('audit_log')", () => {
    log("actor1", "patient1", "entry.create", "entry", "res1");
    expect(fromMock).toHaveBeenCalledWith("audit_log");
  });

  it("calls insert with correct payload", () => {
    log("actor1", "patient1", "entry.create", "entry", "res1");
    expect(insertMock).toHaveBeenCalledWith({
      actor_id: "actor1",
      patient_id: "patient1",
      action: "entry.create",
      resource_type: "entry",
      resource_id: "res1",
    });
  });

  it("sets resource_id to null when not provided", () => {
    log("a", "p", "entries.view", "entries");
    expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({ resource_id: null }));
  });

  it("sets resource_id to null when explicitly undefined", () => {
    log("a", "p", "note.create", "note", undefined);
    expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({ resource_id: null }));
  });

  it("does not await insert (fire-and-forget — returns undefined)", () => {
    const result = log("a", "p", "entry.soft_delete", "entry", "id");
    expect(result).toBeUndefined();
  });

  it("handles all documented action types without throwing", () => {
    const actions = [
      "entry.create", "entry.soft_delete", "entry.restore",
      "entry.hard_delete", "entries.view",
      "note.create", "note.share", "note.hide", "note.delete",
    ];
    actions.forEach(action => {
      expect(() => log("a", "p", action, "entry", "id")).not.toThrow();
    });
  });

  it("passes patient_id correctly", () => {
    log("actor-x", "patient-y", "note.share", "note", "n1");
    expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({
      actor_id: "actor-x",
      patient_id: "patient-y",
    }));
  });
});
