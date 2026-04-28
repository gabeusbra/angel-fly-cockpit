# GRUPO — Garlic N Lemon | Branding

## Identificação
- **WhatsApp Chat ID:** `120363420996892188@g.us`
- **Context key:** `garlic`
- **Default project:** Garlic'n Lemons SaaS
- **Default client:** Garlic'n Lemons

## Aliases / Termos do projeto
- GNL, Garlic, Garlic n Lemons, GarlicNLemons, Garlic'n Lemons
- gnl-backend, gnl-pickup, gnl-catering
- "dashboard Garlic", "order Garlic", "catering Garlic"

## Sobre o cliente Garlic'n Lemons
- Restaurante boutique em **Boston/Allston**
- Focado em catering corporativo + pickup/delivery
- Cliente premium da Angel Fly desde 2024

## Sistema construído (3 frontends + 1 backend)
| Subsistema | URL | Função |
|---|---|---|
| **Backend / Dashboard Admin** | `dashboard.garliclemons.com` | Gestão de pedidos, menu, prep, kitchen display, relatórios |
| **Pickup Ordering** | `order.garliclemons.com` | Cliente final faz pedido para retirada |
| **Catering Storefront** | `catering.garliclemons.com` | Cliente faz pedido grande de catering corporativo |

## Stack técnica do Garlic
- **Backend:** PHP vanilla + MySQL (PDO) — Hostinger VPS
- **Frontends:** mistura de PHP server-rendered + JS vanilla (alguns componentes em React)
- **Pagamentos:** Square (cartão), Apple Pay, gift cards
- **Recurring orders:** sistema próprio
- **Prep engine:** prep board + labels + kitchen display system
- **Delivery zones:** validação por CEP / raio
- **Menu manager:** com modifiers e regras de combinação
- **Integrações:** OpenPhone/QUO (SMS), WhatsApp/UAZAPI, Square API

## Regras operacionais para o Jarvis
1. Se a mensagem vier deste grupo e **não mencionar projeto** → assume `Garlic'n Lemons SaaS`.
2. Bug/quebrou/erro → **ticket** com `client_name="Garlic'n Lemons"`, `project_name="Garlic'n Lemons SaaS"`.
3. Implementar/ajustar/feature → **task** no projeto Garlic'n Lemons SaaS.
4. Pagamento de mensalidade do Garlic → `create_payment_incoming` com `client_name="Garlic'n Lemons"`.
5. Mensagens da equipe do **próprio cliente** (Garlic) chegam aqui — sempre tratar com profissionalismo.

## Histórico recente / contexto vivo
- Sistema em produção desde 2024
- Última feature grande: prep engine + labels (2026 Q1)
- Próximo roadmap (em discussão): integração com TikTok Shop / Instagram
- Bugs recorrentes que conhecemos:
  - Apple Pay às vezes falha em Safari iOS antigo
  - Recurring orders ocasionalmente duplicam (investigar timer cron)

## Pessoas-chave do cliente (se mencionarem)
- (Adicionar quando aplicável — manter privacidade)

## Estilo de conversa neste grupo
- Profissional mas não engessado.
- Mais cuidado com humor — cliente pode estar lendo.
- Confirmações sempre explícitas.
- Em português OU inglês — adapta ao idioma da mensagem.
