# ANGEL FLY — Stack Técnico de Referência

## Cockpit (sistema interno)
- **Frontend:** React 18 + Vite + Tailwind CSS + shadcn/ui (Radix)
- **Backend:** PHP 8.3 (LiteSpeed) + MySQL — endpoint base `/api`
- **Hospedagem:** Hostinger (FTP deploy via GitHub Actions)
- **Domínio:** cockpit.angelfly.io
- **Auth:** JWT Bearer tokens
- **Ícones:** Lucide React
- **Animações:** Framer Motion
- **Charts:** Recharts
- **PWA:** manifest.json configurado

## Garlic'n Lemons SaaS
- **Backend:** PHP vanilla + MySQL (PDO) — Hostinger VPS
- **Frontends (3):** PHP server-rendered + JS vanilla, alguns React isolados
- **Pagamentos:** Square + Apple Pay + Gift Cards
- **Recurring orders:** custom
- **Comunicação:** OpenPhone/QUO (SMS), UAZAPI (WhatsApp)
- **Domínios:** dashboard.garliclemons.com, order.garliclemons.com, catering.garliclemons.com

## Ernesto's Pizza System
- **Lojas:** WordPress + WooCommerce com customizações pesadas
- **Backend custom:** PHP + MySQL (Hostinger VPS)
- **Integrações:** OpenPhone/QUO, UAZAPI, SRFax (fax)
- **Domínios:** dashboard.ernestospizza.com, northend.ernestospizza.com, somerville.ernestospizza.com
- **Tooling:** WP-CLI

## Infraestrutura compartilhada
- **VPS principal:** 148.230.93.235 (KVM 2, Ubuntu 24.04, 8GB RAM, 2 vCPU, 100GB disk)
  - Roda **n8n** (Docker) — automações + Jarvis
  - Roda **PostgreSQL** local (n8n)
- **Hospedagem clientes:** Hostinger Premium (PHP 8.3, MySQL 5.7+)
- **GitHub:** github.com/gabeusbra/Cockpit-Project-Manager-Assistant

## Automações
- **n8n** (`148.230.93.235:5678`) — todos os workflows
  - Jarvis Main (WhatsApp → Cockpit)
  - Jarvis Daily Briefing (8h BRT)
  - Jarvis Overdue Chase (a cada 4h)
- **OpenAI API:** GPT-4o + Assistant API v2 + Vector Store
- **UAZAPI:** WhatsApp gateway (token único por instância Angel Fly)

## Padrões de código
- **Frontend:** ESLint config moderna, JSX, hooks padrão, Zustand pra estado global
- **Backend PHP:** PDO prepared statements (nunca `mysql_*`), `Entity.php` como roteador genérico
- **Migrações:** sempre via `public/api/migrate.php` (idempotente, INFORMATION_SCHEMA-based)
- **Commits:** mensagens em português ou inglês, descritivas

## Pra mais detalhes visuais
Ver `BRAND_BOOK.md` na raiz do projeto Cockpit — define cores, tipografia, espaçamento, componentes.
