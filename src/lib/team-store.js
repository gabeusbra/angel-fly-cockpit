const TEAM_KEY = "angel_fly_team";

export function getTeamMembers() {
  try { return JSON.parse(localStorage.getItem(TEAM_KEY) || "[]"); } catch { return []; }
}

export function saveTeamMembers(members) {
  localStorage.setItem(TEAM_KEY, JSON.stringify(members));
}

export function getTeamMemberById(id) {
  return getTeamMembers().find(m => m.id === id) || null;
}

export function getTeamMemberByEmail(email) {
  if (!email) return null;
  return getTeamMembers().find(m =>
    m.email?.toLowerCase() === email.toLowerCase() ||
    m.user_email?.toLowerCase() === email.toLowerCase()
  ) || null;
}

export function getTeamMemberByName(name) {
  if (!name) return null;
  return getTeamMembers().find(m => m.name?.toLowerCase() === name.toLowerCase()) || null;
}

export function createTeamMember(data) {
  const members = getTeamMembers();
  const member = {
    ...data,
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    created_at: new Date().toISOString(),
    status: data.status || "active",
  };
  members.push(member);
  saveTeamMembers(members);
  return member;
}

export function updateTeamMember(id, data) {
  const members = getTeamMembers();
  const idx = members.findIndex(m => m.id === id);
  if (idx >= 0) {
    members[idx] = { ...members[idx], ...data };
    saveTeamMembers(members);
    return members[idx];
  }
  return null;
}

export function deleteTeamMember(id) {
  const members = getTeamMembers().filter(m => m.id !== id);
  saveTeamMembers(members);
}

// Get active team members for assign dropdowns
export function getAssignableMembers() {
  return getTeamMembers().filter(m => m.status === "active");
}
