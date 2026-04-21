import { api } from "@/api/client";

const CLIENTS_KEY = "angel_fly_clients";
const CATEGORY = "client_record";

function getLocalClients() {
  try { return JSON.parse(localStorage.getItem(CLIENTS_KEY) || "[]"); } catch { return []; }
}
function saveLocal(clients) {
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
}

function ticketToClient(t) {
  let extra = {};
  try { extra = JSON.parse(t.description || "{}"); } catch { /* ignore */ }
  return { id: t.id, name: t.subject, ...extra, status: t.status || "active" };
}

function clientToTicket(data) {
  const { name, id, status, ...rest } = data;
  return {
    subject: name || "",
    description: JSON.stringify(rest),
    category: CATEGORY,
    status: status || "active",
    priority: "low",
    client_name: rest.contact_name || name || "",
  };
}

export async function getClients() {
  try {
    const all = await api.entities.Ticket.list();
    const clients = all.filter(t => t.category === CATEGORY).map(ticketToClient);
    saveLocal(clients);
    return clients;
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
  return clients.find(c =>
    c.email?.toLowerCase() === email.toLowerCase() ||
    c.user_email?.toLowerCase() === email.toLowerCase()
  ) || null;
}

export async function createClient(data) {
  try {
    const ticket = clientToTicket(data);
    await api.entities.Ticket.create(ticket);
    return await getClients();
  } catch {
    const clients = getLocalClients();
    const client = { ...data, id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), status: data.status || "active" };
    clients.push(client);
    saveLocal(clients);
    return client;
  }
}

export async function updateClient(id, data) {
  try {
    const { name, status, ...rest } = data;
    const update = {};
    if (name !== undefined) update.subject = name;
    if (status !== undefined) update.status = status;
    update.description = JSON.stringify(rest);
    update.client_name = rest.contact_name || name || "";
    await api.entities.Ticket.update(id, update);
    await getClients();
  } catch {
    const clients = getLocalClients();
    const idx = clients.findIndex(c => c.id === id);
    if (idx >= 0) { clients[idx] = { ...clients[idx], ...data }; saveLocal(clients); }
  }
}

export async function deleteClient(id) {
  try {
    await api.entities.Ticket.delete(id);
    await getClients();
  } catch {
    const clients = getLocalClients().filter(c => c.id !== id);
    saveLocal(clients);
  }
}

// One-time sync: push localStorage clients to Ticket entity, then clear local
export async function syncLocalClients() {
  if (localStorage.getItem(CLIENTS_KEY + "_v2_synced")) return;
  const local = getLocalClients();
  if (local.length === 0) { localStorage.setItem(CLIENTS_KEY + "_v2_synced", "1"); return; }
  try {
    const all = await api.entities.Ticket.list();
    const existing = all.filter(t => t.category === CATEGORY);
    const existingNames = new Set(existing.map(t => t.subject?.toLowerCase()));
    for (const c of local) {
      if (c.name && !existingNames.has(c.name.toLowerCase())) {
        try { await api.entities.Ticket.create(clientToTicket(c)); } catch { /* ignore */ }
      }
    }
    // Clear localStorage after successful sync — entity is now source of truth
    localStorage.removeItem(CLIENTS_KEY);
    localStorage.setItem(CLIENTS_KEY + "_v2_synced", "1");
  } catch { /* ignore — will retry next time */ }
}
