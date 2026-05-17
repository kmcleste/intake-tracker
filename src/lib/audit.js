import { supabase } from "./supabase";

export function log(actorId, patientId, action, resourceType, resourceId) {
  supabase.from("audit_log").insert({
    actor_id: actorId,
    patient_id: patientId,
    action,
    resource_type: resourceType,
    resource_id: resourceId ?? null,
  }).then(() => {});
}
