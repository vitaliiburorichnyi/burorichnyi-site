← Back to the map: [burorichnyi.com](https://burorichnyi.com)
# AI Supplier Order Management:

Automated Order Collection, Parsing & Dispatch for a Restaurant & Bar

---

## 🏢 Context

**Company:** Kitchen & Bar - full-service restaurant and bar venue
**Industry:** HoReCa (Restaurants, Bars, Cafes)
**Target clients:** Venue staff (bar, kitchen) + operations manager
**Order volume:** Daily supplier orders across 2 departments, 4 suppliers
**Team:** Bar staff + kitchen staff + 1 manager
**Core problem:** Orders collected via WhatsApp and paper notes - no consolidation, no control, no audit trail

---

## ❌ Problem

<table header-row="true">
<tr>
<td>Metric</td>
<td>Value</td>
<td>Issue</td>
</tr>
<tr>
<td>Order collection</td>
<td>100% manual</td>
<td>WhatsApp messages, paper notes, verbal requests</td>
</tr>
<tr>
<td>Duplicate detection</td>
<td>None</td>
<td>Same item ordered twice from different departments</td>
</tr>
<tr>
<td>Supplier consolidation</td>
<td>Manual</td>
<td>Manager merged orders by hand before sending</td>
</tr>
<tr>
<td>Order confirmation</td>
<td>None</td>
<td>No visibility into what was sent and when</td>
</tr>
<tr>
<td>Audit trail</td>
<td>None</td>
<td>No log of what was ordered, by whom, for which supplier</td>
</tr>
</table>

The manager received orders from bar and kitchen staff through different channels with no structure. Consolidating orders per supplier before sending was done manually, took time, and regularly caused duplicates or missed items.

---

## ✅ Solution

Built a **2-workflow AI order automation system** that collects, parses, consolidates, and dispatches:

```
[bar.html / restaurant.html]
        │
        │  POST { venue: "bar"|"restaurant", items: "raw text" }
        ▼
[WF-A: Parse & Store]  ←── Webhook: /webhook/smartorder-demo
        │
        ├─ Read Products Master (Supabase)
        ├─ AI Parse (Claude Haiku) — item matching + typo handling
        ├─ Map to Rows (Code node)
        └─ Insert → orders_parsed (status: pending)
                        │
[WF-B: Manager Bot]  ←── Telegram Trigger (manager messages bot)
        │
        ├─ /digest or text  →  digest by supplier + inline buttons
        ├─ view_*           →  supplier detail view
        ├─ send_*           →  send to supplier → status: sent
        ├─ send_all         →  dispatch to all suppliers at once
        └─ keep_open        →  stay pending, allow more additions
```

### WF-A - Order Intake: Parse & Store

Triggered by staff submitting free-text orders via web terminal (bar.html or restaurant.html). Claude Haiku reads the raw input, matches each item to the products master table in Supabase, identifies the correct supplier, and saves each line item as a separate row with `status: pending`. Typos and informal naming (e.g. “hendrix” → Hendricks Gin) handled automatically.

### WF-B - Manager Bot: Review & Dispatch

Telegram bot interface for the manager. On any message or `/digest`, returns a consolidated view of all pending items grouped by supplier - Bar and Restaurant orders automatically merged. If both departments ordered the same item, it is flagged with 🔀. Manager taps a supplier to see the full item list, then approves and dispatches with one button.

---

## ⚙️ Process

### 1. AI Parsing Logic

- Staff enter orders in plain Ukrainian or Russian - no formatting required
- Claude Haiku matches each item to the Supabase products master (name, unit, supplier)
- Typo handling and informal product names resolved at parse time
- Duplicate detection: if item already exists in active order, staff sees a warning with two options - cancel or add quantity

### 2. Order Consolidation

<table header-row="true">
<tr>
<td>Source</td>
<td>Behaviour</td>
</tr>
<tr>
<td>Same item, same department</td>
<td>Flagged as duplicate at intake</td>
</tr>
<tr>
<td>Same item, different departments</td>
<td>Merged in digest, flagged with 🔀</td>
</tr>
<tr>
<td>Different items, same supplier</td>
<td>Consolidated under one supplier in digest</td>
</tr>
<tr>
<td>All suppliers</td>
<td>“Send to ALL” button dispatches in one action</td>
</tr>
</table>

### 3. n8n Workflow Architecture

<table header-row="true">
<tr>
<td>Workflow</td>
<td>Trigger</td>
<td>Function</td>
</tr>
<tr>
<td>WF-A - Parse & Store</td>
<td>Webhook (POST from web terminal)</td>
<td>AI parse → supplier match → insert to Supabase</td>
</tr>
<tr>
<td>WF-B - Manager Bot</td>
<td>Telegram message</td>
<td>Digest → supplier view → dispatch → status update</td>
</tr>
</table>

### 4. Dispatch Flow

<table header-row="true">
<tr>
<td>Action</td>
<td>Trigger</td>
<td>Result</td>
</tr>
<tr>
<td>Send to supplier</td>
<td>Manager taps 📤</td>
<td>Message sent to supplier Telegram, status → sent</td>
</tr>
<tr>
<td>Keep open</td>
<td>Manager taps 🔓</td>
<td>Items stay pending, staff can add more</td>
</tr>
<tr>
<td>Send to ALL</td>
<td>Manager taps 📤 Send to ALL</td>
<td>All 4 suppliers receive orders simultaneously</td>
</tr>
</table>

**4 Suppliers:** Alkotreid · Solodka Vodychka LLC · Svizhy Smak · Prom Tov

---

## 📊 Results

<table header-row="true">
<tr>
<td>Metric</td>
<td>Before</td>
<td>After</td>
<td>Change</td>
</tr>
<tr>
<td>Order collection</td>
<td>Manual, multi-channel</td>
<td>Unified web terminal</td>
<td>**↑ Structured**</td>
</tr>
<tr>
<td>Duplicate detection</td>
<td>None</td>
<td>Automatic at intake</td>
<td>**New**</td>
</tr>
<tr>
<td>Consolidation time</td>
<td>10–20 min/day manual</td>
<td>Instant, automated</td>
<td>**↓ 100%**</td>
</tr>
<tr>
<td>Supplier dispatch</td>
<td>Manual copy-paste</td>
<td>One tap per supplier</td>
<td>**New**</td>
</tr>
<tr>
<td>Audit trail</td>
<td>None</td>
<td>Full log in Supabase</td>
<td>**New**</td>
</tr>
<tr>
<td>Multi-supplier dispatch</td>
<td>Sequential manual</td>
<td>One-click send to all</td>
<td>**New**</td>
</tr>
</table>

---

## 🛠️ Tech Stack

- **n8n** (cloud) - workflow automation engine
- **Anthropic Claude Haiku** (via n8n LangChain nodes) — order parsing and item matching
- **Supabase (PostgreSQL)** - products master table and orders database
- **Telegram Bot API** - manager approval and dispatch interface
- **Vanilla HTML/CSS/JS** - staff order terminals (bar + restaurant)
- **Vercel** - frontend hosting

---

## ✅ What Works

- Full end-to-end automation: staff submits text → AI parses → manager reviews → dispatch in one tap
- Free-text input — staff don’t need to follow any format or structure
- Duplicate detection at intake — prevents double orders within a department
- Cross-department consolidation — bar and restaurant orders merged automatically per supplier
- One-click send to all suppliers simultaneously
- Full order log in Supabase - every item, status, and timestamp recorded
- Demo-ready: live bot [@orderchef_kb_bot](https://t.me/orderchef_kb_bot), public order channel [@smartorderstest22](https://t.me/smartorderstest22)

---

## 🔧 What Can Be Improved

- **Staff authentication** - terminals are currently open; adding venue PIN would prevent unauthorized access
- **Order history view** - manager can see current pending orders but no historical log in the bot
- **Supplier contacts** - currently hardcoded; a Supabase supplier table would make it dynamic
- **Delivery confirmation** - no feedback loop when supplier confirms receipt
- **Analytics** - no reporting on order frequency, top items, or supplier reliability

---

## 🗺️ Development Plan

1. Add supplier table to Supabase → dynamic supplier contacts, no hardcoding
2. Build order history view in Telegram bot → manager can review sent orders by date
3. Add staff PIN authentication to web terminals
4. Integrate supplier confirmation webhook → close the loop after dispatch
5. Build weekly analytics report → top items, order volume by department, sent to manager via Telegram

---

## 📁 GitHub Repository

🔗 [https://github.com/vitaliiburorichnyi/smart-order-management](https://github.com/vitaliiburorichnyi/smart-order-management)

**Live demo:** [smartorder-demo-kohl.vercel.app](https://smartorder-demo-kohl.vercel.app/)
**Telegram bot:** [@orderchef_kb_bot](https://t.me/orderchef_kb_bot)