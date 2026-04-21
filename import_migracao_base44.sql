SET FOREIGN_KEY_CHECKS = 0;

DELETE FROM projects;
DELETE FROM tasks;
DELETE FROM tickets;
DELETE FROM payments_incoming;
DELETE FROM payments_outgoing;

INSERT INTO projects (id, name, client_id, client_name, scope_description, status, start_date, end_date, total_budget, payment_type, recurrence_interval, created_date) VALUES (1, 'Angel Fly Cockpit', NULL, 'gabriel', NULL, 'active', '2026-04-12', '2026-04-13', 10000, 'one-time', 'none', '2026-04-12T04:08:54.567000');
INSERT INTO tasks (id, project_id, project_name, title, description, assigned_to, assigned_to_name, client_name, status, priority, deadline, estimated_hours, created_date) VALUES (1, NULL, NULL, '[Ticket] TEST', 'TEST

--- Ticket | change_request | medium priority | Client: alana.s.camara

--- Attachments ---
1. https://base44.app/api/apps/69db100d236c52d6a4de9e3a/files/mp/public/69db100d236c52d6a4de9e3a/37ab42608_Imagem1kebabswe.png
2. https://drive.google.com/file/d/1km89XaBGS19dsB3clmjZzo1sWH_nJfAf/view?usp=drive_link', NULL, 'Rodrigo ', 'alana.s.camara', 'assigned', 'medium', NULL, 0, '2026-04-15T15:12:54.642000');
INSERT INTO tasks (id, project_id, project_name, title, description, assigned_to, assigned_to_name, client_name, status, priority, deadline, estimated_hours, created_date) VALUES (2, NULL, NULL, '[Ticket] Ernesto’s Pizza Reports  (copy)', 'Take a look at these. I pulled these off the management page last week. 
The second one (financial report) does not have the meals tax included but the totals on both match. 


--- Ticket | bug | medium priority | Client: bostonpizza617

--- Attachments ---
1. https://base44.app/api/apps/69db100d236c52d6a4de9e3a/files/mp/public/69db100d236c52d6a4de9e3a/a78bdeab4_IMG_0448.png
2. https://base44.app/api/apps/69db100d236c52d6a4de9e3a/files/mp/public/69db100d236c52d6a4de9e3a/1682ba629_IMG_0449.png', NULL, 'Rodrigo ', 'bostonpizza617', 'assigned', 'medium', NULL, 0, '2026-04-14T21:54:40.111000');
INSERT INTO tasks (id, project_id, project_name, title, description, assigned_to, assigned_to_name, client_name, status, priority, deadline, estimated_hours, created_date) VALUES (3, 1, 'Angel Fly Cockpit', '[Ticket] helo', 'fix it

--- Ticket | bug | medium priority | Client: gabriel

[Note]: gdgd

[Client feedback]: i dont like it
', NULL, 'gabriellcwb', 'gabriel', 'review', 'medium', '2026-04-13', 0, '2026-04-13T00:44:18.076000');
INSERT INTO tasks (id, project_id, project_name, title, description, assigned_to, assigned_to_name, client_name, status, priority, deadline, estimated_hours, created_date) VALUES (4, 1, 'Angel Fly Cockpit', '[Ticket] Website ', 'I want the catering menu on ti 

--- Ticket | change_request | high priority | Client: gabriellcwb', NULL, 'gabriellcwb', 'gabriellcwb', 'review', 'high', '2026-04-13', 0, '2026-04-12T19:49:58.474000');
INSERT INTO tasks (id, project_id, project_name, title, description, assigned_to, assigned_to_name, client_name, status, priority, deadline, estimated_hours, created_date) VALUES (5, 1, 'Angel Fly Cockpit', 'Prototype', NULL, NULL, 'gabriellcwb', 'Angel Fly ', 'assigned', 'medium', NULL, 0, '2026-04-12T04:09:07.855000');
INSERT INTO tickets (id, subject, description, category, status, priority, client_id, client_name, assigned_to, assigned_to_name, created_date) VALUES (1, 'Rodrigo ', '{"role":"professional","specialty":"Full-Stack Developer","email":"","phone":"","avatar_url":"","hourly_rate":null,"default_delivery_days":null,"max_tasks_capacity":8,"user_email":"","notes":""}', 'team_record', 'active', 'low', NULL, 'professional', NULL, NULL, '2026-04-15T02:40:06.384000');
INSERT INTO tickets (id, subject, description, category, status, priority, client_id, client_name, assigned_to, assigned_to_name, created_date) VALUES (2, 'Ernesto''s Pizza ', '{"contact_name":"","email":"","phone":"","logo_url":"https://base44.app/api/apps/69db100d236c52d6a4de9e3a/files/mp/public/69db100d236c52d6a4de9e3a/3b01a83e7_LOGO_FUNDOBLACK.svg","address":"","notes":"","user_email":"bostonpizza617@gmail.com","created_at":"2026-04-14T21:43:31.682Z"}', 'client_record', 'active', 'low', NULL, 'Ernesto''s Pizza ', NULL, NULL, '2026-04-15T02:32:58.497000');
INSERT INTO tickets (id, subject, description, category, status, priority, client_id, client_name, assigned_to, assigned_to_name, created_date) VALUES (3, 'Garlic N Lemon', '{"contact_name":"M","email":"","phone":"","logo_url":"https://base44.app/api/apps/69db100d236c52d6a4de9e3a/files/mp/public/69db100d236c52d6a4de9e3a/9975ae64a_download1.png","address":"","notes":"","user_email":"","created_at":"2026-04-14T17:05:47.102Z"}', 'client_record', 'active', 'low', NULL, 'M', NULL, NULL, '2026-04-14T23:00:56.105000');
INSERT INTO tickets (id, subject, description, category, status, priority, client_id, client_name, assigned_to, assigned_to_name, created_date) VALUES (4, 'Ernesto’s Pizza Reports  (copy)', 'Take a look at these. I pulled these off the management page last week. 
The second one (financial report) does not have the meals tax included but the totals on both match. 
', 'bug', 'in_progress', 'medium', NULL, 'bostonpizza617', NULL, 'Rodrigo ', '2026-04-14T21:50:57.027000');
INSERT INTO tickets (id, subject, description, category, status, priority, client_id, client_name, assigned_to, assigned_to_name, created_date) VALUES (5, 'Ernesto’s Pizza Reports ', 'Take a look at these. I pulled these off the management page last week. 
The second one (financial report) does not have the meals tax included but the totals on both match. 
', 'bug', 'open', 'medium', NULL, 'bostonpizza617', NULL, NULL, '2026-04-14T20:21:32.717000');
INSERT INTO tickets (id, subject, description, category, status, priority, client_id, client_name, assigned_to, assigned_to_name, created_date) VALUES (6, 'TEST', 'TEST', 'change_request', 'in_progress', 'medium', NULL, 'alana.s.camara', NULL, 'Rodrigo ', '2026-04-14T19:31:59.041000');
INSERT INTO tickets (id, subject, description, category, status, priority, client_id, client_name, assigned_to, assigned_to_name, created_date) VALUES (7, 'Ernesto’s Somerville ', 'Our “10” gluten free pizza”  is not on our catering menu for Somerville. It should be listed right after large cheese. The topping selections are pepperoni, sausage, onion, mushroom, peppers, broccoli, olives. 

Base price for a cheese is $11.75, 
Toppings (only available on the whole pizza) 
are $3.95 each ', 'question', 'open', 'medium', NULL, 'bostonpizza617', NULL, NULL, '2026-04-14T19:27:28.460000');
INSERT INTO tickets (id, subject, description, category, status, priority, client_id, client_name, assigned_to, assigned_to_name, created_date) VALUES (8, 'helo', 'fix it', 'bug', 'in_progress', 'medium', NULL, 'gabriel', NULL, 'gabriellcwb', '2026-04-13T00:40:50.339000');
INSERT INTO tickets (id, subject, description, category, status, priority, client_id, client_name, assigned_to, assigned_to_name, created_date) VALUES (9, 'Website ', 'I want the catering menu on ti ', 'change_request', 'closed', 'high', NULL, 'gabriellcwb', NULL, 'gabriel', '2026-04-12T14:06:06.966000');
SET FOREIGN_KEY_CHECKS = 1;
