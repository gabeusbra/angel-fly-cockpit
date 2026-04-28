# Credentials

> ⚠️ **NUNCA COMMITAR ARQUIVOS DESTA PASTA**
>
> A pasta inteira está no `.gitignore` (exceto este README). Apenas `README.md` e `.gitkeep` são versionados.

## O que vai aqui

- `google_oauth_client.json` — credenciais do Google OAuth (Sign in with Google)
- Outros tokens/secrets que precisem ficar no servidor mas fora do código

## Setup

Em uma máquina nova (ou no VPS), copie os arquivos manualmente para esta pasta. Eles **não estão no git** por motivo de segurança.

Para enviar pro servidor de produção via SCP:
```bash
scp credentials/google_oauth_client.json root@148.230.93.235:/var/www/cockpit/credentials/
```

## Onde estão os tokens da API atualmente

| Token | Localização atual |
|---|---|
| Cockpit API Bearer | hardcoded em `n8n/JARVIS_*.json` |
| UAZAPI token | hardcoded em `n8n/JARVIS_*.json` |
| OpenAI API Key | hardcoded em `n8n/JARVIS_MAIN.json` |
| OpenAI Assistant ID | hardcoded em `n8n/JARVIS_MAIN.json` |
| Google OAuth | `credentials/google_oauth_client.json` (não commitado) |

> 💡 Se algum desses vazar, **rotacione imediatamente** no painel correspondente (OpenAI Platform, Google Cloud Console, Hostinger).
