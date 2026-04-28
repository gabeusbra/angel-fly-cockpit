-- ─────────────────────────────────────────────────────
-- Jarvis Memory Persistence — v2.0
-- Tabela que sobrevive a restarts do n8n e mantém:
--   - Thread da OpenAI Assistant por grupo WhatsApp
--   - Nível de humor por grupo
--   - Estado de quotes/tasks pendentes (multi-turno)
--   - Backlog auditável de mensagens processadas
-- Aplicar via /api/migrate ou direto no MySQL do Cockpit.
-- ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `jarvis_conversations` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `wa_chat_id` VARCHAR(64) NOT NULL COMMENT 'WhatsApp group/chat JID, ex: 120363426390515923@g.us',
  `group_context` ENUM('angelfly','garlic','ernesto','unknown') NOT NULL DEFAULT 'unknown',
  `openai_thread_id` VARCHAR(64) DEFAULT NULL COMMENT 'OpenAI Assistant thread, ex: thread_xxx',
  `humor_level` TINYINT UNSIGNED NOT NULL DEFAULT 50 COMMENT '0-100, default 50',
  `last_project_id` INT UNSIGNED DEFAULT NULL,
  `last_project_name` VARCHAR(255) DEFAULT NULL,
  `last_intent` VARCHAR(64) DEFAULT NULL,
  `pending_state_json` JSON DEFAULT NULL COMMENT 'Multi-turn state (e.g. partial quote)',
  `last_message_id` VARCHAR(128) DEFAULT NULL COMMENT 'Last UAZAPI message id processed (dedup)',
  `last_processed_at` DATETIME DEFAULT NULL,
  `total_actions` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Counter of successful tool calls',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_wa_chat_id` (`wa_chat_id`),
  KEY `idx_group_context` (`group_context`),
  KEY `idx_last_processed` (`last_processed_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────
-- Backlog de mensagens (auditoria + debug)
-- Append-only, leve. Truncar via cron mensal se ficar grande.
-- ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `jarvis_message_log` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `wa_chat_id` VARCHAR(64) NOT NULL,
  `wa_message_id` VARCHAR(128) DEFAULT NULL,
  `sender_name` VARCHAR(128) DEFAULT NULL,
  `sender_phone` VARCHAR(32) DEFAULT NULL,
  `direction` ENUM('inbound','outbound') NOT NULL,
  `message_text` TEXT,
  `was_mentioned` TINYINT(1) NOT NULL DEFAULT 0,
  `intent_detected` VARCHAR(64) DEFAULT NULL,
  `tool_called` VARCHAR(64) DEFAULT NULL,
  `tool_success` TINYINT(1) DEFAULT NULL,
  `error_message` TEXT,
  `openai_run_id` VARCHAR(64) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_wa_chat` (`wa_chat_id`, `created_at`),
  KEY `idx_message_id` (`wa_message_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────
-- Mapeamento Grupo → Contexto (caso prefira em tabela vs hardcoded)
-- Opcional. O n8n já tem isso em código, mas ter em tabela facilita
-- adicionar novos grupos sem editar workflow.
-- ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `jarvis_groups` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `wa_chat_id` VARCHAR(64) NOT NULL,
  `label` VARCHAR(128) NOT NULL,
  `context_key` VARCHAR(32) NOT NULL COMMENT 'angelfly | garlic | ernesto | <new>',
  `default_project_name` VARCHAR(255) DEFAULT NULL,
  `default_client_name` VARCHAR(255) DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_wa_chat` (`wa_chat_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed dos 3 grupos atuais
INSERT IGNORE INTO `jarvis_groups`
  (wa_chat_id, label, context_key, default_project_name, default_client_name)
VALUES
  ('120363426390515923@g.us', 'Angel Fly Marketing Geral', 'angelfly', 'Angel Fly Cockpit', 'Angel Fly Digital Solutions'),
  ('120363420996892188@g.us', 'Garlic N Lemon | Branding', 'garlic', 'Garlic''n Lemons SaaS', 'Garlic''n Lemons'),
  ('120363422948599063@g.us', 'Ernesto | Site & Identidade Visual', 'ernesto', 'Ernestos Pizza System', 'Ernesto''s Pizza');
