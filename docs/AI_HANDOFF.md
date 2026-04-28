# Angel Fly - Cockpit: AI Handoff Document

This document provides a comprehensive overview of the **Angel Fly Cockpit** project to facilitate handoff to another AI or Developer.

## 1. Project Overview
**Angel Fly Cockpit** is a project management and ticketing dashboard built for the Angel Fly Digital Solutions team. It allows admins and project managers to manage clients, projects, tasks, tickets, and payments. Additionally, it integrates heavily with *Jarvis*, an AI assistant operating over WhatsApp (via n8n) that can dynamically create tasks and tickets directly in the Cockpit platform.

- **Frontend:** React + Vite + Tailwind CSS + Lucide React + Shadcn/UI inspired components.
- **Backend:** PHP API (Custom router `index.php`, generic CRUD via `Entity.php`, PDO MySQL via `Database.php`).
- **Database:** Relational MySQL database (clients, projects, users, tasks, tickets, etc.). 
- **Hosting/Deployment:** GitHub Actions -> Hostinger via FTP/SFTP. Backend runs on LiteSpeed PHP (8.3).
- **Automation / AI:** n8n workflow (`JARVIS_N8N_WORKFLOW.json`) processing WhatsApp Webhooks (via UzAPI), interpreting intents using OpenAI, and interacting with the PHP Cockpit API.

## 2. Directory Structure & Key Files
- `src/` - React Frontend
  - `src/pages/` - UI Pages (`AdminProjects.jsx`, `AdminTickets.jsx`, `PMProjects.jsx`, etc.)
  - `src/components/` - UI components (Sidebar, ui elements)
  - `src/api/client.js` - Frontend API wrapper (`api.entities.Project.list()`, etc.)
- `public/api/` - PHP Backend
  - `public/api/index.php` - Main Request Router.
  - `public/api/Entity.php` - **Core Logic**: Dynamically handles CRUD for any table via naming convention (`/api/{table}`). Checks permissions based on role. Contains logic to sanitize empty relation IDs (`_id`) to `NULL` to prevent foreign key errors.
  - `public/api/Database.php` - PDO Wrapper.
  - `public/api/config.php` - Environment secrets and Database credentials.
  - `public/api/Auth.php` - JWT based authentication logic.
  - `public/api/migrate.php` - Safe schema migration file using `INFORMATION_SCHEMA` checks (compatible with MySQL 5.7+). Run via `GET /api/migrate` with `Authorization: Bearer <JARVIS_BOT_TOKEN>`.
- `JARVIS_N8N_WORKFLOW.json` - The entire n8n automation pipeline logic.
- `.github/workflows/deploy.yml` - Deployment pipeline.

## 3. Database Constraints & Architecture
The system uses strict Foreign Key constraints in MySQL.
- `tickets` -> requires valid `project_id`, `client_name`.
- `tasks` -> requires valid `project_id`, `client_name`.
- `projects` -> requires valid `client_id` (this refers to a `users` table ID where role is client). 

*Important Note:* Due to foreign key constraints, `public/api/Entity.php` automatically nullifies frontend form payloads where relationship keys (e.g., `project_id: ""`) are submitted as empty strings.

## 4. Jarvis n8n Integration (WhatsApp AI Assistant)
Jarvis listens to incoming WhatsApp messages from 3 specific groups:
1. Angel Fly Marketing Geral (`angelfly`)
2. Garlic N Lemon | Branding (`garlic`)
3. Ernesto | Site & Identidade Visual (`ernesto`)

### Workflow Logic (`JARVIS_N8N_WORKFLOW.json`):
1. **Webhook via Uzapi** -> Receives message.
2. **Parse Message** -> Extracts `cleanMessage`, `waChatId`, group context mappings.
3. **Check Personality Command** -> Detects if user modifies Jarvis humor (e.g., "Aumente humor em 20%").
4. **Get Chat History** -> Fetches the last 50 group messages from Uzapi `/message/find`.
5. **Debug History** -> Standardizes the array of messages received from different potential Uzapi API response structures (`raw`, `raw.messages`, `raw.data.messages`).
6. **Fetch Projects** -> Calls the Cockpit `/api/projects` to know the currently active projects (for fuzzy matching).
7. **Build Context** -> Aggregates previous history into a chronological string (`historyText`), formats active projects, and sets current humor.
8. **OpenAI — Interpret Intent** -> Sends the aggregated prompt to GPT-4o. The AI must return a JSON choosing an intent (`create_task`, `create_ticket`, `create_project`, `create_payment_incoming`, or `none`).
9. **Parse AI Response** -> Fallbacks, strict JSON parsing, fuzzy matching `project_name` to actual Cockpit `project_id` values. Checks if project is missing and halts creation safely if so.
10. **Cockpit API Requests** -> Dedicated HTTP Request nodes push the event into Cockpit if the intent implies an action.
11. **Reply on WhatsApp** -> Answers the user indicating success or conversing smoothly without actions.
12. **Error Notification** -> If the Cockpit API fails, Jarvis sends a direct message to WhatsApp explaining the failure explicitly.

## 5. Recent Fixes & Current State
The previous development session implemented several critical bugfixes:
- **Foreign Key violations when creating Projects/Tickets:** Form payloads sending `project_id: ""` or `client_id` (from external local store) were rejecting the inserts. Fixed both the UI payloads and `Entity.php` to clean empty relational values.
- **Missing Columns:** A migration mechanism (`public/api/migrate.php`) was introduced and executed. It appended missing fields to the production DB: `tickets.project_id`, `tickets.project_name`, `tickets.satisfaction_rating`, and project info.
- **Delete Mechanism Built:** The Cockpit UI now supports complete deletion (Trash2 Icons + `window.confirm`) via `api.entities.X.delete()`.
- **Jarvis Double Answering and Amnesia:** 
  - We transitioned parallel node execution triggering `Build Context` twice into a serial trigger chain. 
  - GPT was missing conversational memory; we increased the chat fetch limit to 50, fixed the extraction of messages, and explicitly concatenated the chat context into the system prompt parameter `{{ $json.historyText }}`.
  - Changed target message field from `pm.messageText` to `pm.cleanMessage`.
- **Fuzzy matching Projects:** The AI parse script now natively handles typos from GPT or missing IDs by safely locating target projects by name via `includes()` searches.

## 6. Guidelines For Next AI Agent
If debugging any further Cockpit or Jarvis bugs:
1. **Always trust the Cockpit backend over n8n data:** If tasks fail to create via n8n, check `Entity.php` error output or schema constraints.
2. **When modifying the database:** Never run direct SQL for structural changes if possible. Extend `$columns` in `public/api/migrate.php` because Hostinger deployment expects to run idempotent updates with `/api/migrate`.
3. **If touching Jarvis AI Prompt:** Keep the output format strictly JSON (`intent`, `entity`, `reply`). If you change intent names, you MUST update the `Has Action Intent?` switch node inside n8n.
4. **Environment Variables:** `public/api/config.php` has secrets. `JARVIS_BOT_TOKEN` acts as a static Bearer token bypassing human JWT logic for the n8n bot requests.

**Good luck, AI! You have everything you need to proceed.**
