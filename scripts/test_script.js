const tasksRaw = [{ "error": "Internal Server Error", "message": "Failed" }];
const ticketsRaw = [{ "error": "Internal Server Error", "message": "Failed" }];

const flatten = (rows) => {
  const out = [];
  for (const r of rows || []) {
    if (!r) continue;
    if (Array.isArray(r)) out.push(...r);
    else if (Array.isArray(r.data)) out.push(...r.data);
    else if (Array.isArray(r.items)) out.push(...r.items);
    else out.push(r);
  }
  return out;
};

const tasks = flatten(tasksRaw);
const tickets = flatten(ticketsRaw);

const scope = 'today';
const target = 'both';
const projectId = null;
const projectName = '';
const groupContext = 'garlic';
const today = new Date().toISOString().slice(0,10);

const isOpen = (s) => !['closed','completed','cancelled','resolved','done'].includes(String(s || '').toLowerCase());
const dateOf = (obj) => {
  const d = obj?.due_date || obj?.date || obj?.created_at || obj?.updated_at || '';
  return String(d).slice(0,10);
};
const projectMatch = (obj) => {
  if (projectId && String(obj?.project_id) === String(projectId)) return true;
  if (projectName && String(obj?.project_name || '').toLowerCase().includes(projectName)) return true;
  if (groupContext === 'garlic') return /garlic|gnl/.test(String(obj?.project_name || obj?.client_name || '').toLowerCase());
  if (groupContext === 'ernesto') return /ernesto/.test(String(obj?.project_name || obj?.client_name || '').toLowerCase());
  if (groupContext === 'angelfly') return /angel\s*fly|cockpit/.test(String(obj?.project_name || obj?.client_name || '').toLowerCase());
  return true;
};

const scoped = (arr, kind) => arr.filter(x => {
  if (!projectMatch(x)) return false;
  if (scope === 'today') return dateOf(x) === today;
  if (scope === 'open') return isOpen(kind === 'ticket' ? (x.status || 'open') : (x.status || 'assigned'));
  return true;
});

const fTasks = scoped(tasks, 'task');
const fTickets = scoped(tickets, 'ticket');

console.log("Success", fTasks.length, fTickets.length);
