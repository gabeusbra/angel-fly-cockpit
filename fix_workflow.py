#!/usr/bin/env python3
"""
Restructure JARVIS workflow to eliminate Switch node routing issues.
Makes Parse AI Response a multi-output Code node that routes directly.
"""
import json

with open('JARVIS_N8N_WORKFLOW.json', 'r') as f:
    w = json.load(f)

# ---- 1. Remove "Has Action Intent?" and "Route by Intent" nodes ----
remove_names = {"Has Action Intent?", "Route by Intent"}
w['nodes'] = [n for n in w['nodes'] if n['name'] not in remove_names]

# ---- 2. Update Parse AI Response to use multiple outputs ----
for n in w['nodes']:
    if n['name'] == 'Parse AI Response':
        # Read current jsCode
        old_code = n['parameters']['jsCode']
        
        # Replace the return statement at the end with multi-output routing
        # The old return is: return [{ json: { ... } }];
        # New return uses array-of-arrays for multi-output
        
        # Find and replace the return block
        old_return = """return [{ json: {
  intent: finalIntent,
  entity,
  title: entity.title || entity.subject || '',
  description: entity.description || '',
  priority: entity.priority || 'medium',
  project_id: entity.project_id || null,
  project_name: entity.project_name || '',
  subject: entity.subject || entity.title || '',
  category: entity.category || 'question',
  client_name: clientName,
  amount: entity.amount || 0,
  reply: parsed.reply || 'Entendido!',
  senderName: pm.senderName,
  chatId: pm.chatId,
  waChatId: replyTarget,
  groupContext: pm.groupContext,
  groupLabel: pm.groupLabel
}}];"""
        
        new_return = """const outputData = { json: {
  intent: finalIntent,
  entity,
  title: entity.title || entity.subject || '',
  description: entity.description || '',
  priority: entity.priority || 'medium',
  project_id: entity.project_id || null,
  project_name: entity.project_name || '',
  subject: entity.subject || entity.title || '',
  category: entity.category || 'question',
  client_name: clientName,
  amount: entity.amount || 0,
  reply: parsed.reply || 'Entendido!',
  senderName: pm.senderName,
  chatId: pm.chatId,
  waChatId: replyTarget,
  groupContext: pm.groupContext,
  groupLabel: pm.groupLabel
}};

// Multi-output routing: [task, ticket, project, pay_in, pay_out, report, none_or_reply]
const outputs = [[], [], [], [], [], [], []];
const intentToOutput = {
  'create_task': 0,
  'create_ticket': 1,
  'create_project': 2,
  'create_payment_incoming': 3,
  'create_payment_outgoing': 4,
  'fetch_report': 5,
};
const idx = intentToOutput[finalIntent] ?? 6;
outputs[idx].push(outputData);
return outputs;"""
        
        new_code = old_code.replace(old_return, new_return)
        
        if new_code == old_code:
            # Try replacing with escaped newlines (as stored in JSON)
            # The code is stored as a single-line string with \n
            old_ret_oneline = old_return.replace('\n', '\\n')
            new_ret_oneline = new_return.replace('\n', '\\n')
            new_code = old_code.replace(old_ret_oneline, new_ret_oneline)
        
        if new_code == old_code:
            print("WARNING: Could not find return block to replace!")
            print("Searching for 'return [{ json' in code...")
            idx = old_code.find('return [{ json')
            if idx >= 0:
                print(f"  Found at position {idx}")
                print(f"  Context: ...{old_code[idx:idx+100]}...")
            else:
                print("  NOT FOUND")
                # Try to find any return statement
                idx2 = old_code.rfind('return ')
                if idx2 >= 0:
                    print(f"  Found 'return ' at position {idx2}")
                    print(f"  Context: ...{old_code[idx2:idx2+100]}...")
        else:
            n['parameters']['jsCode'] = new_code
            # Set number of outputs
            n['parameters']['mode'] = 'runOnceForAllItems'
            print("SUCCESS: Parse AI Response updated with multi-output routing")

# ---- 3. Rewire connections ----
conns = w['connections']

# Remove old connections from deleted nodes
conns.pop('Has Action Intent?', None)
conns.pop('Route by Intent', None)

# Parse AI Response now outputs to 7 outputs:
# 0: create_task -> Create Task in Cockpit
# 1: create_ticket -> Create Ticket in Cockpit
# 2: create_project -> Create Project in Cockpit
# 3: create_payment_incoming -> Create Payment Incoming
# 4: create_payment_outgoing -> Create Payment Outgoing
# 5: fetch_report -> Fetch Tasks in Cockpit
# 6: none/reply -> Reply on WhatsApp (Uzapi)
conns['Parse AI Response'] = {
    "main": [
        [{"node": "Create Task in Cockpit", "type": "main", "index": 0}],
        [{"node": "Create Ticket in Cockpit", "type": "main", "index": 0}],
        [{"node": "Create Project in Cockpit", "type": "main", "index": 0}],
        [{"node": "Create Payment Incoming", "type": "main", "index": 0}],
        [{"node": "Create Payment Outgoing", "type": "main", "index": 0}],
        [{"node": "Fetch Tasks in Cockpit", "type": "main", "index": 0}],
        [{"node": "Reply on WhatsApp (Uzapi)", "type": "main", "index": 0}],
    ]
}

# Everything else stays the same:
# Create Task -> Reply on WhatsApp (success) + Notify Error (error)
# Create Ticket -> Reply on WhatsApp (success) + Notify Error (error)  
# etc.
# Fetch Tasks -> Fetch Tickets -> Build Report -> Send Report on WhatsApp -> Respond

print("\nFinal connection map:")
for src, conn in conns.items():
    targets = []
    for i, outputs in enumerate(conn.get('main', [])):
        for t in outputs:
            targets.append(f"  output {i} -> {t['node']}")
    if targets:
        print(f"{src}:")
        for t in targets:
            print(t)

with open('JARVIS_N8N_WORKFLOW.json', 'w') as f:
    json.dump(w, f, indent=2, ensure_ascii=False)

print("\nDone! JSON saved.")
