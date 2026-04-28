import csv
import json
import os
import sys

# Mapping from base44 UUIDs to new MySQL INT IDs
id_maps = {
    'projects': {},
    'tasks': {},
    'tickets': {},
    'incoming': {},
    'outgoing': {}
}

def get_int_id(table, old_id):
    if not old_id or old_id.lower() in ('null', '', 'none'):
        return "NULL"
    if old_id not in id_maps[table]:
        id_maps[table][old_id] = len(id_maps[table]) + 1
    return str(id_maps[table][old_id])

def escape_sql(value):
    if value is None or value == "":
        return "NULL"
    # Basic SQL injection escaping for strings
    escaped = str(value).replace("'", "''").replace("\\", "\\\\")
    return f"'{escaped}'"

sql_statements = []
sql_statements.append("SET FOREIGN_KEY_CHECKS = 0;\n")
sql_statements.append("DELETE FROM projects;")
sql_statements.append("DELETE FROM tasks;")
sql_statements.append("DELETE FROM tickets;")
sql_statements.append("DELETE FROM payments_incoming;")
sql_statements.append("DELETE FROM payments_outgoing;\n")

# Process Projects
try:
    with open('Dados Backup/Project_export.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            new_id = get_int_id('projects', row.get('id'))
            name = escape_sql(row.get('name'))
            # Force user IDs to null, rely on client_name
            client_id = "NULL" 
            client_name = escape_sql(row.get('client_name'))
            scope = escape_sql(row.get('scope_description'))
            status = escape_sql(row.get('status', 'active'))
            start = escape_sql(row.get('start_date'))
            end = escape_sql(row.get('end_date'))
            budget = row.get('total_budget') or 0
            ptype = escape_sql(row.get('payment_type', 'one-time'))
            recurrence = escape_sql(row.get('recurrence_interval', 'none'))
            
            created = escape_sql(row.get('created_date'))
            
            sql = f"INSERT INTO projects (id, name, client_id, client_name, scope_description, status, start_date, end_date, total_budget, payment_type, recurrence_interval, created_date) VALUES ({new_id}, {name}, {client_id}, {client_name}, {scope}, {status}, {start}, {end}, {budget}, {ptype}, {recurrence}, {created});"
            sql_statements.append(sql)
except Exception as e:
    print(f"Skipping projects: {e}")

# Process Tasks
try:
    with open('Dados Backup/Task_export.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            new_id = get_int_id('tasks', row.get('id'))
            pid = get_int_id('projects', row.get('project_id'))
            pname = escape_sql(row.get('project_name'))
            title = escape_sql(row.get('title'))
            desc = escape_sql(row.get('description'))
            assigned_id = "NULL"
            assigned_name = escape_sql(row.get('assigned_to_name'))
            client_name = escape_sql(row.get('client_name'))
            status = escape_sql(row.get('status', 'backlog'))
            priority = escape_sql(row.get('priority', 'medium'))
            deadline = escape_sql(row.get('deadline'))
            est = row.get('estimated_hours') or 0
            
            created = escape_sql(row.get('created_date'))
            
            sql = f"INSERT INTO tasks (id, project_id, project_name, title, description, assigned_to, assigned_to_name, client_name, status, priority, deadline, estimated_hours, created_date) VALUES ({new_id}, {pid}, {pname}, {title}, {desc}, {assigned_id}, {assigned_name}, {client_name}, {status}, {priority}, {deadline}, {est}, {created});"
            sql_statements.append(sql)
except Exception as e:
    print(f"Skipping tasks: {e}")

# Process Tickets
try:
    with open('Dados Backup/Ticket_export.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            new_id = get_int_id('tickets', row.get('id'))
            subj = escape_sql(row.get('subject'))
            desc = escape_sql(row.get('description'))
            cat = escape_sql(row.get('category'))
            status = escape_sql(row.get('status', 'open'))
            priority = escape_sql(row.get('priority', 'medium'))
            cid = "NULL"
            cname = escape_sql(row.get('client_name'))
            aid = "NULL"
            aname = escape_sql(row.get('assigned_to_name'))
            
            created = escape_sql(row.get('created_date'))
            
            sql = f"INSERT INTO tickets (id, subject, description, category, status, priority, client_id, client_name, assigned_to, assigned_to_name, created_date) VALUES ({new_id}, {subj}, {desc}, {cat}, {status}, {priority}, {cid}, {cname}, {aid}, {aname}, {created});"
            sql_statements.append(sql)
except Exception as e:
    print(f"Skipping tickets: {e}")

# Process PaymentIncoming
try:
    with open('Dados Backup/PaymentIncoming_export.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            new_id = get_int_id('incoming', row.get('id'))
            cid = "NULL"
            cname = escape_sql(row.get('client_name'))
            pid = get_int_id('projects', row.get('project_id'))
            pname = escape_sql(row.get('project_name'))
            amt = row.get('amount') or 0
            status = escape_sql(row.get('status', 'pending'))
            due = escape_sql(row.get('due_date'))
            desc = escape_sql(row.get('description'))
            
            created = escape_sql(row.get('created_date'))
            
            sql = f"INSERT INTO payments_incoming (id, client_id, client_name, project_id, project_name, amount, status, due_date, description, created_date) VALUES ({new_id}, {cid}, {cname}, {pid}, {pname}, {amt}, {status}, {due}, {desc}, {created});"
            sql_statements.append(sql)
except Exception as e:
    pass

# Process PaymentOutgoing
try:
    with open('Dados Backup/PaymentOutgoing_export.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            new_id = get_int_id('outgoing', row.get('id'))
            profid = "NULL"
            profname = escape_sql(row.get('professional_name'))
            tid = get_int_id('tasks', row.get('task_id'))
            tname = escape_sql(row.get('task_name'))
            amt = row.get('amount') or 0
            status = escape_sql(row.get('status', 'pending'))
            notes = escape_sql(row.get('admin_notes'))
            desc = escape_sql(row.get('description'))
            
            created = escape_sql(row.get('created_date'))
            
            sql = f"INSERT INTO payments_outgoing (id, professional_id, professional_name, task_id, task_name, amount, status, admin_notes, description, created_date) VALUES ({new_id}, {profid}, {profname}, {tid}, {tname}, {amt}, {status}, {notes}, {desc}, {created});"
            sql_statements.append(sql)
except Exception as e:
    pass

sql_statements.append("SET FOREIGN_KEY_CHECKS = 1;\n")

# Write output file
with open('import_migracao_base44.sql', 'w', encoding='utf-8') as out:
    out.write("\n".join(sql_statements))
