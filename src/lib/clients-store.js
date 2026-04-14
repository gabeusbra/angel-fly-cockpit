const CLIENTS_KEY = "angel_fly_clients";

export function getClients() {
  try { return JSON.parse(localStorage.getItem(CLIENTS_KEY) || "[]"); } catch { return []; }
}

export function saveClients(clients) {
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
}

export function getClientById(id) {
  return getClients().find(c => c.id === id) || null;
}

export function getClientByEmail(email) {
  if (!email) return null;
  return getClients().find(c => c.email?.toLowerCase() === email.toLowerCase() || c.user_email?.toLowerCase() === email.toLowerCase()) || null;
}

export function createClient(data) {
  const clients = getClients();
  const client = {
    ...data,
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    created_at: new Date().toISOString(),
    status: data.status || "active",
  };
  clients.push(client);
  saveClients(clients);
  return client;
}

export function updateClient(id, data) {
  const clients = getClients();
  const idx = clients.findIndex(c => c.id === id);
  if (idx >= 0) {
    clients[idx] = { ...clients[idx], ...data };
    saveClients(clients);
    return clients[idx];
  }
  return null;
}

export function deleteClient(id) {
  const clients = getClients().filter(c => c.id !== id);
  saveClients(clients);
}
