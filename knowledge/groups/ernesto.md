# GRUPO — Ernesto | Site & Identidade Visual

## Identificação
- **WhatsApp Chat ID:** `120363422948599063@g.us`
- **Context key:** `ernesto`
- **Default project:** Ernestos Pizza System
- **Default client:** Ernesto's Pizza

## Aliases / Termos do projeto
- Ernestos, Ernesto's Pizza, Ernesto's Pizza OS
- North End, Somerville (são as 2 lojas)
- dashboard.ernestospizza.com, northend.ernestospizza.com, somerville.ernestospizza.com
- "Fax Bridge" (sistema de envio de pedidos por fax)

## Sobre o cliente Ernesto's Pizza
- Pizzaria com **2 lojas em Boston**: North End e Somerville
- E-commerce + catering + integrações
- Cliente desde 2023

## Sistema construído
| Subsistema | URL | Função |
|---|---|---|
| **Dashboard Admin** | `dashboard.ernestospizza.com` | Gestão central de pedidos, menu, relatórios |
| **Loja North End** | `northend.ernestospizza.com` | E-commerce loja 1 |
| **Loja Somerville** | `somerville.ernestospizza.com` | E-commerce loja 2 |
| **Ernestos Fax Bridge** | (interno) | Envia pedidos via fax pra cozinha (legado) |
| **Catering Wizard** | em dashboard | Pedidos grandes de catering |
| **Pizza Builder** | em loja | Cliente monta pizza custom |

## Stack técnica do Ernesto
- **Frontend Lojas:** WordPress + WooCommerce + customizações
- **Backend customizado:** PHP + MySQL (Hostinger VPS)
- **Integrações:**
  - **OpenPhone / QUO API** — telefonia + SMS notifications
  - **UAZAPI** — WhatsApp notifications
  - **SRFax** — envio de pedidos via fax (legado, ainda usado pela cozinha)
- **WP-CLI** — gestão server-side
- **Recovery carts / abandoned checkout** — sistema próprio
- **Hours and holidays** — controle de horário de funcionamento
- **Reports:** weekly + monthly automáticos
- **PDF de pedido** com origin address (catering)

## Regras operacionais para o Jarvis
1. Mensagens deste grupo sem projeto explícito → assume `Ernestos Pizza System`.
2. Bug/quebrou/erro → **ticket** com `client_name="Ernesto's Pizza"`, `project_name="Ernestos Pizza System"`.
3. Diferenciação **North End vs Somerville**: se a mensagem citar a loja, inclui no `description` do ticket/task.
4. Implementar/feature → **task** no projeto Ernestos Pizza System.
5. Pagamentos → `create_payment_incoming` com `client_name="Ernesto's Pizza"`.

## Bugs/issues recorrentes conhecidos
- **Checkout intermitente** em horário de pico (investigar conexão com banco)
- **Fax Bridge** ocasionalmente duplica envio
- **Recovery carts** podem disparar pra emails antigos (filtro precisa revisão)
- **WhatsApp notifications** dependem do UAZAPI estar online

## Estilo de conversa neste grupo
- Mais formal que Garlic — cliente é família tradicional.
- Inglês predominante (cliente fala EN, time AF responde em PT entre si).
- Quando o **cliente direto** mandar mensagem → resposta em inglês profissional.
- Quando for só time AF → português normal.

## Termos sensíveis
- "production incident" → sempre prioridade `high` + ticket imediato
- "customer complaint" → ticket categoria `support`
- "menu update" → task com prazo apertado (cliente paga por agilidade)
