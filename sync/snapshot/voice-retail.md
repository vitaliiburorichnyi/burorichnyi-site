← Back to the map: [burorichnyi.com](https://burorichnyi.com)
> **Autonomous voice assistant that handles inbound customer calls - identifies callers, checks orders, updates addresses, logs every call automatically.**
> 

---

## 📌 Project Summary

<table header-row="true">
<tr>
<td>**Client**</td>
<td>Clothing retail store (Boutique)</td>
</tr>
<tr>
<td>**Type**</td>
<td>Voice AI Automation</td>
</tr>
<tr>
<td>**Stack**</td>
<td>Happ.tools · n8n · Google Sheets · SIP</td>
</tr>
<tr>
<td>**Status**</td>
<td>✅ Live and tested</td>
</tr>
<tr>
<td>**GitHub**</td>
<td>[Voice-AI-Agent-for-Retail-Boutique](https://github.com/vitaliiburorichnyi/Voice-AI-Agent-for-Retail-Boutique)</td>
</tr>
</table>

---

## 🧩 The Problem

The store receives dozens of calls daily:
- “What’s my order status?”
- “Can I change my delivery address?”
- “How much does shipping cost?”

One manager can’t handle all calls in time. Customers wait on hold or don’t get answers. The team spends hours on repetitive questions instead of complex tasks.

---

## 💡 The Solution

A Voice AI Agent named **Anika** that:

→ Picks up every inbound call instantly

→ Identifies the customer by phone number

→ Greets them by name with their order details

→ Answers typical questions autonomously

→ Updates delivery address in real time

→ Logs a full call summary after every conversation

---

## 🏗️ Architecture

```
📞 Incoming Call (SIP/Zadarma)
        ↓
🎙️ Happ.tools - Voice Agent "Anika"
        ↓
⚡ n8n - Workflow Automation (3 webhooks)
        ↓
📊 Google Sheets - Orders + Call Log
```

### 3 Automated Integrations

**Before the call - Init Tool**
- Receives caller phone number
- Looks up customer in Google Sheets
- Returns: name, order ID, status, delivery address
- Agent greets customer by name within seconds

**During the call - Change Address**
- Customer says new address
- n8n updates the row in Google Sheets instantly
- Agent confirms the change

**After the call - Postcall**
- Happ.tools sends full call data to n8n
- Code node extracts customer name and order ID
- New row appended to Call Log automatically

---

## 🛠️ Tech Stack

<table header-row="true">
<tr>
<td>Tool</td>
<td>Role</td>
</tr>
<tr>
<td>**Happ.tools**</td>
<td>Voice AI platform, SIP integration</td>
</tr>
<tr>
<td>**n8n**</td>
<td>Webhook automation, data processing</td>
</tr>
<tr>
<td>**Google Sheets**</td>
<td>Customer database + call log</td>
</tr>
<tr>
<td>**Zadarma**</td>
<td>SIP telephony</td>
</tr>
<tr>
<td>**ngrok**</td>
<td>Webhook tunneling (development)</td>
</tr>
</table>

---

## 🧪 Test Results - 10 Scenarios

<table header-row="true">
<tr>
<td>#</td>
<td>Scenario</td>
<td>Result</td>
</tr>
<tr>
<td>1</td>
<td>Known customer asks order status</td>
<td>✅ Greeted by name, correct status given</td>
</tr>
<tr>
<td>2</td>
<td>Known customer changes address</td>
<td>✅ Old address confirmed, new address saved</td>
</tr>
<tr>
<td>3</td>
<td>Unknown number calls</td>
<td>✅ Generic greeting, no crash</td>
</tr>
<tr>
<td>4</td>
<td>Customer asks delivery cost</td>
<td>✅ Correct answer from Knowledge Base</td>
</tr>
<tr>
<td>5</td>
<td>Customer asks return policy</td>
<td>✅ Correct answer from Knowledge Base</td>
</tr>
<tr>
<td>6</td>
<td>Angry customer</td>
<td>✅ Calm response, human handoff offered</td>
</tr>
<tr>
<td>7</td>
<td>Out-of-scope question</td>
<td>✅ Redirected to manager</td>
</tr>
<tr>
<td>8</td>
<td>Order not found</td>
<td>✅ Informed customer, offered manager</td>
</tr>
<tr>
<td>9</td>
<td>Customer asks about sizes</td>
<td>✅ Correct answer from Knowledge Base</td>
</tr>
<tr>
<td>10</td>
<td>Normal call ends</td>
<td>✅ Postcall fired, Call Log updated</td>
</tr>
</table>

---

## 📈 Metrics

<table header-row="true">
<tr>
<td>Metric</td>
<td>Value</td>
</tr>
<tr>
<td>Call Success Rate</td>
<td>**100%**</td>
</tr>
<tr>
<td>Human Handoff Rate</td>
<td>**30%** (edge cases only)</td>
</tr>
<tr>
<td>Knowledge Base Accuracy</td>
<td>**100%**</td>
</tr>
<tr>
<td>Postcall Logging Rate</td>
<td>**100%**</td>
</tr>
<tr>
<td>Avg Call Duration</td>
<td>**~60 sec**</td>
</tr>
<tr>
<td>Time saved per call</td>
<td>**~3-5 min**</td>
</tr>
</table>

---

## 🔑 Key Challenges & Solutions

### 1. Phone number format mismatch

**Problem:** Google Sheets drops `+` from phone numbers stored as numbers.

**Solution:** Strip `+` in n8n filter expression before lookup. Store phones as plain text.

### 2. Unknown caller crashing the agent

**Problem:** When phone not in sheet, Google Sheets returns empty → n8n stops → agent freezes.

**Solution:** `Always Output Data` setting + IF node returns empty JSON fallback so agent always gets a valid response.

### 3. Variable injection syntax

**Problem:** Initial `[customer_name]` syntax was read literally by the agent.

**Solution:** Happ.tools uses `{{variable}}` syntax. Updated all prompt references.

### 4. Init Tool loading delay

**Problem:** 3-4 second silence at call start while webhook loads.

**Solution:** Added First Message “Один момент…” + increased silence timeout to 15 seconds.

### 5. Postcall field extraction

**Problem:** Happ.tools sends call data in deeply nested JSON. LLM-generated fields were unreliable.

**Solution:** Built Code node in n8n using regex to extract order_id and customer_name from transcript summary.

---

## 💬 Prompt Engineering — Before vs After

### Before

```
"Вітаємо в Boutique! Мене звати Аніка.
Я бачу, що вам телефонує [customer_name]. Чим можу допомогти?"
```

❌ Wrong variable syntax — agent said “[customer_name]” literally

❌ No fallback for unknown callers

❌ No postcall instructions

### After

```
If {{customer_name}} is available:
"Вітаємо в Boutique! Мене звати Аніка.
З вами говорить {{customer_name}}? Ваше замовлення {{order_id}}
має статус {{order_status}}. Чим можу допомогти?"

If {{customer_name}} is NOT available:
"Вітаємо в Boutique! Мене звати Аніка. Чим можу допомогти?"
```

✅ Correct variable syntax

✅ Fallback for unknown callers

✅ Postcall instructions added

✅ Language rules added

---

## 🚀 Business Impact

**Before automation:**
- 1 manager handles all calls
- Average wait time: 2-5 minutes
- Missed calls during peak hours
- No call logging

**After automation:**
- Agent picks up instantly, 24/7
- 70% of calls resolved without human
- Every call logged automatically
- Manager handles complex cases only

---

## 🔮 Next Steps

- [ ]  Replace Google Sheets with KeyCRM API
- [ ]  Add SMS confirmation after address change
- [ ]  Outbound calls for order confirmations
- [ ]  Multilingual support (UA / EN)
- [ ]  Reduce Init Tool latency to under 1 second
- [ ]  Analytics dashboard on call outcomes

---

## 📸 Screenshots

![](cases/assets/voice-retail/Screenshot_2026-05-21_at_10.21.51.png)

![](cases/assets/voice-retail/Screenshot_2026-05-21_at_10.22.12.png)

![](cases/assets/voice-retail/Screenshot_2026-05-21_at_10.23.58.png)

![](cases/assets/voice-retail/Screenshot_2026-05-21_at_10.24.07.png)

![](cases/assets/voice-retail/Screenshot_2026-05-21_at_10.24.14.png)