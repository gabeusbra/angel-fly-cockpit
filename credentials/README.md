# Credentials

> ⚠️ **NUNCA COMMITAR ARQUIVOS DESTA PASTA**
>
> A pasta inteira está no `.gitignore` (exceto este README). O git não vê nada aqui.

## O que vai aqui

| Arquivo | Conteúdo |
|---|---|
| `JARVIS_MAIN.json` | Workflow principal com a OpenAI key embutida — pronto pra importar no n8n |
| `JARVIS_DAILY.json` | Workflow do briefing matinal |
| `JARVIS_OVERDUE_CHASE.json` | Workflow de cobrança de atrasados |
| `google_oauth_client.json` | Credenciais do Google OAuth (Login Google) |
| `openai_key.txt` *(opcional)* | A chave OpenAI atual (usada pelo script de regen) |

## Importar no n8n

1. Abre o n8n: https://n8n.srv942429.hstgr.cloud
2. Workflows → **+ Add → Import from file**
3. Seleciona um dos JSONs de `credentials/`
4. Repete pros 3 (MAIN, DAILY, OVERDUE_CHASE)
5. Ativa cada um (toggle no topo direito)

## Regerar os JSONs (se mudar a chave OpenAI ou se eu atualizar a base)

```bash
# Opção A: Usa a chave default hardcoded no script
bash scripts/build_n8n_imports.sh

# Opção B: Pra usar uma chave diferente, salva em arquivo:
echo "sk-proj-NOVA-CHAVE-AQUI" > credentials/openai_key.txt
bash scripts/build_n8n_imports.sh
```

O script lê `n8n/JARVIS_MAIN.json` (versão limpa, com `$env.OPENAI_API_KEY`), substitui pela chave real, e salva em `credentials/JARVIS_MAIN.json`.

## Fluxo recomendado de update

Quando eu (ou outra IA) atualizar os workflows na branch:

```bash
git pull origin main          # ou a branch correspondente
bash scripts/build_n8n_imports.sh   # regera os JSONs com a chave
# Re-importa em n8n.srv942429.hstgr.cloud
```

## Onde estão os tokens em uso

| Token | Localização |
|---|---|
| Cockpit API Bearer | hardcoded em `n8n/JARVIS_*.json` (público OK) |
| UAZAPI token | hardcoded em `n8n/JARVIS_*.json` (público OK) |
| OpenAI Assistant ID | hardcoded em `n8n/JARVIS_MAIN.json` (não é secret) |
| **OpenAI API Key** | **somente em `credentials/JARVIS_MAIN.json` (gitignored)** |
| Google OAuth | `credentials/google_oauth_client.json` (gitignored) |

> 💡 Se a OpenAI key vazar, **rotaciona em platform.openai.com/api-keys**, edita o `DEFAULT_KEY` em `scripts/build_n8n_imports.sh`, e roda o script de novo.
