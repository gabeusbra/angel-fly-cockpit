import { base44 } from "@/api/base44Client";

const TEAM_KEY = "angel_fly_team";

function getLocalMembers() {
  try { return JSON.parse(localStorage.getItem(TEAM_KEY) || "[]"); } catch { return []; }
}

function saveLocal(members) {
  localStorage.setItem(TEAM_KEY, JSON.stringify(members));
}

export async function getTeamMembers() {
  try {
    const data = await base44.entities.TeamMember.list();
    saveLocal(data);
    return data;
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
  return members.find(m => m.email?.toLowerCase() === email.toLowerCase() || m.user_email?.toLowerCase() === email.toLowerCase()) || null;
}

export async function getTeamMemberByName(name) {
  if (!name) return null;
  const members = await getTeamMembers();
  return members.find(m => m.name?.toLowerCase() === name.toLowerCase()) || null;
}

export async function createTeamMember(data) {
  const payload = { ...data, status: data.status || "active" };
  try {
    const result = await base44.entities.TeamMember.create(payload);
    await getTeamMembers();
    return result;
  } catch {
    const members = getLocalMembers();
    const member = { ...payload, id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), created_at: new Date().toISOString() };
    members.push(member);
    saveLocal(members);
    return member;
  }
}

export async function updateTeamMember(id, data) {
  try {
    await base44.entities.TeamMember.update(id, data);
    await getTeamMembers();
  } catch {
    const members = getLocalMembers();
    const idx = members.findIndex(m => m.id === id);
    if (idx >= 0) { members[idx] = { ...members[idx], ...data }; saveLocal(members); }
  }
}

export async function deleteTeamMember(id) {
  try {
    await base44.entities.TeamMember.delete(id);
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
