import { base44 } from "@/api/base44Client";

const TEAM_KEY = "angel_fly_team";
const CATEGORY = "team_record";

function getLocalMembers() {
  try { return JSON.parse(localStorage.getItem(TEAM_KEY) || "[]"); } catch { return []; }
}
function saveLocal(members) {
  localStorage.setItem(TEAM_KEY, JSON.stringify(members));
}

function ticketToMember(t) {
  let extra = {};
  try { extra = JSON.parse(t.description || "{}"); } catch { /* ignore */ }
  return { id: t.id, name: t.subject, ...extra, status: t.status || "active" };
}

function memberToTicket(data) {
  const { name, id, status, ...rest } = data;
  return {
    subject: name || "",
    description: JSON.stringify(rest),
    category: CATEGORY,
    status: status || "active",
    priority: "low",
    client_name: rest.role || "professional",
  };
}

export async function getTeamMembers() {
  try {
    const all = await base44.entities.Ticket.list();
    const members = all.filter(t => t.category === CATEGORY).map(ticketToMember);
    saveLocal(members);
    return members;
  } catch {
    return getLocalMembers();
  }
}

export function getTeamMembersSync() {
  return getLocalMembers();
}

export async function getTeamMemberById(id) {
  const members = await getTeamMembers();
  return members.find(m => m.id === id) || null;
}

export async function getTeamMemberByEmail(email) {
  if (!email) return null;
  const members = await getTeamMembers();
  return members.find(m =>
    m.email?.toLowerCase() === email.toLowerCase() ||
    m.user_email?.toLowerCase() === email.toLowerCase()
  ) || null;
}

export async function getTeamMemberByName(name) {
  if (!name) return null;
  const members = await getTeamMembers();
  return members.find(m => m.name?.toLowerCase() === name.toLowerCase()) || null;
}

export async function createTeamMember(data) {
  try {
    const ticket = memberToTicket(data);
    await base44.entities.Ticket.create(ticket);
    return await getTeamMembers();
  } catch {
    const members = getLocalMembers();
    const member = { ...data, id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), status: data.status || "active" };
    members.push(member);
    saveLocal(members);
    return member;
  }
}

export async function updateTeamMember(id, data) {
  try {
    const { name, status, ...rest } = data;
    const update = {};
    if (name !== undefined) update.subject = name;
    if (status !== undefined) update.status = status;
    update.description = JSON.stringify(rest);
    update.client_name = rest.role || "professional";
    await base44.entities.Ticket.update(id, update);
    await getTeamMembers();
  } catch {
    const members = getLocalMembers();
    const idx = members.findIndex(m => m.id === id);
    if (idx >= 0) { members[idx] = { ...members[idx], ...data }; saveLocal(members); }
  }
}

export async function deleteTeamMember(id) {
  try {
    await base44.entities.Ticket.delete(id);
    await getTeamMembers();
  } catch {
    const members = getLocalMembers().filter(m => m.id !== id);
    saveLocal(members);
  }
}

export async function getAssignableMembers() {
  const members = await getTeamMembers();
  return members.filter(m => m.status === "active");
}

// One-time sync: push localStorage members to Ticket entity
export async function syncLocalTeamMembers() {
  const local = getLocalMembers();
  if (local.length === 0) return;
  try {
    const all = await base44.entities.Ticket.list();
    const existing = all.filter(t => t.category === CATEGORY);
    const existingNames = new Set(existing.map(t => t.subject?.toLowerCase()));
    for (const m of local) {
      if (m.name && !existingNames.has(m.name.toLowerCase())) {
        try { await base44.entities.Ticket.create(memberToTicket(m)); } catch { /* ignore */ }
      }
    }
  } catch { /* ignore */ }
}
