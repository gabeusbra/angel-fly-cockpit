import { base44 } from "@/api/base44Client";

const CLIENTS_KEY = "angel_fly_clients";

function getLocalClients() {
  try { return JSON.parse(localStorage.getItem(CLIENTS_KEY) || "[]"); } catch { return []; }
}

function saveLocal(clients) {
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
}

// Sync localStorage clients to Base44 entity (one-time migration)
async function syncLocalToEntity() {
  const local = getLocalClients();
  if (local.length === 0) return;
  try {
    const remote = await base44.entities.Client.list();
    const remoteEmails = new Set(remote.map(r => r.email?.toLowerCase()).filter(Boolean));
    const remoteNames = new Set(remote.map(r => r.name?.toLowerCase()).filter(Boolean));
    for (const c of local) {
      const emailMatch = c.email && remoteEmails.has(c.email.toLowerCase());
      const nameMatch = c.name && remoteNames.has(c.name.toLowerCase());
      if (!emailMatch && !nameMatch) {
        const { id, created_at, ...payload } = c;
        try { await base44.entities.Client.create(payload); } catch { /* ignore */ }
      }
    }
    localStorage.removeItem(CLIENTS_KEY + "_synced");
  } catch { /* ignore */ }
}

export async function getClients() {
  try {
    // One-time sync of localStorage data to entity
    if (!localStorage.getItem(CLIENTS_KEY + "_synced") && getLocalClients().length > 0) {
      localStorage.setItem(CLIENTS_KEY + "_synced", "1");
      await syncLocalToEntity();
    }
    const data = await base44.entities.Client.list();
    saveLocal(data);
    return data;
  } catch {
    return getLocalClients();
  }
}

export function getClientsSync() {
  return getLocalClients();
}

export async function getClientById(id) {
  const clients = await getClients();
  return clients.find(c => c.id === id) || null;
}

export async function getClientByEmail(email) {
  if (!email) return null;
  const clients = await getClients();
  return clients.find(c => c.email?.toLowerCase() === email.toLowerCase() || c.user_email?.toLowerCase() === email.toLowerCase()) || null;
}

export async function createClient(data) {
  const payload = { ...data, status: data.status || "active" };
  try {
    const result = await base44.entities.Client.create(payload);
    const all = await getClients();
    return result;
  } catch {
    // Fallback to localStorage
    const clients = getLocalClients();
    const client = { ...payload, id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), created_at: new Date().toISOString() };
    clients.push(client);
    saveLocal(clients);
    return client;
  }
}

export async function updateClient(id, data) {
  try {
    await base44.entities.Client.update(id, data);
    await getClients(); // refresh cache
  } catch {
    const clients = getLocalClients();
    const idx = clients.findIndex(c => c.id === id);
    if (idx >= 0) { clients[idx] = { ...clients[idx], ...data }; saveLocal(clients); }
  }
}

export async function deleteClient(id) {
  try {
    await base44.entities.Client.delete(id);
    await getClients();
  } catch {
    const clients = getLocalClients().filter(c => c.id !== id);
    saveLocal(clients);
  }
}
