import { api } from "@/api/client";

/**
 * Filter entity records that belong to the current user.
 * Tries by ID first, then falls back to matching by name/email.
 */
export async function filterMyRecords(entity, idField, user, nameField) {
  // Try by ID first
  try {
    const byId = await entity.filter({ [idField]: user.id });
    if (byId.length > 0) return byId;
  } catch { /* ignore */ }

  // Fallback: get all records and match by name or email
  try {
    const all = await entity.list();
    const name = user.full_name?.toLowerCase();
    const email = user.email?.toLowerCase();
    return all.filter(r => {
      if (r[idField] === user.id) return true;
      if (nameField && name && r[nameField]?.toLowerCase() === name) return true;
      if (nameField && email && r[nameField]?.toLowerCase() === email) return true;
      return false;
    });
  } catch { return []; }
}

/**
 * Get all records from an entity (with error handling).
 */
export async function safeList(entity, sort) {
  try {
    return sort ? await entity.list(sort) : await entity.list();
  } catch { return []; }
}

/**
 * Get all records matching a filter (with error handling).
 */
export async function safeFilter(entity, filter) {
  try {
    return await entity.filter(filter);
  } catch { return []; }
}
