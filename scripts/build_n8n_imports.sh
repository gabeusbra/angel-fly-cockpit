#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────
# Gera os JSONs do n8n com a OpenAI key embutida pra import.
# Output vai pra credentials/ (gitignored — não vai pro git).
#
# Como usar:
#   1. (opcional) Salva sua chave em credentials/openai_key.txt (1 linha)
#      Senão usa a default hardcoded abaixo.
#   2. Roda:
#         bash scripts/build_n8n_imports.sh
#   3. Importa os arquivos gerados em credentials/JARVIS_*.json no n8n
# ─────────────────────────────────────────────────────────

set -e
cd "$(dirname "$0")/.."

KEY_FILE="credentials/openai_key.txt"

if [ ! -f "$KEY_FILE" ]; then
  echo "ERRO: arquivo $KEY_FILE nao existe."
  echo ""
  echo "Cria o arquivo com a chave em uma linha:"
  echo "   echo 'sk-proj-...' > $KEY_FILE"
  echo ""
  echo "(esse arquivo e gitignored, nao vai pro GitHub)"
  exit 1
fi

KEY=$(tr -d '[:space:]' < "$KEY_FILE")
echo "Using key from $KEY_FILE (length: ${#KEY} chars)"

# 1) Generate JARVIS_MAIN.json with embedded key
python3 -c "
import sys
key = sys.argv[1]
with open('n8n/JARVIS_MAIN.json') as f:
    raw = f.read()
out = raw.replace('\"=Bearer {{ \$env.OPENAI_API_KEY }}\"', '\"Bearer ' + key + '\"')
with open('credentials/JARVIS_MAIN.json', 'w') as f:
    f.write(out)
" "$KEY"

# 2) Copy DAILY and OVERDUE_CHASE (no OpenAI key needed there)
cp n8n/JARVIS_DAILY.json credentials/JARVIS_DAILY.json
cp n8n/JARVIS_OVERDUE_CHASE.json credentials/JARVIS_OVERDUE_CHASE.json

echo ""
echo "Files ready in credentials/:"
ls -lh credentials/JARVIS_*.json 2>/dev/null | awk '{print "   " $9 " (" $5 ")"}'

echo ""
echo "Import these in n8n via Workflows -> Add -> Import from file"
