← Back to the map: [burorichnyi.com](https://burorichnyi.com)
Automated Classification, Routing & Analytics for a Bag Store

---

## 🏢 Context

**Company:** Hush - B2C premium bag e-commerce
**Industry:** Online Retail (Fashion Accessories)
**Target clients:** End consumers purchasing bags online
**Support volume:** 15 -30 emails/day
**Team:** 1 owner managing support manually
**Core problem:** Every email handled manually - no triage, no prioritization, no analytics

---

## ❌ Problem

<table header-row="true">
<tr>
<td>Metric</td>
<td>Value</td>
<td>Issue</td>
</tr>
<tr>
<td>Email handling</td>
<td>100% manual</td>
<td>No triage or prioritization</td>
</tr>
<tr>
<td>Response time</td>
<td>Hours to days</td>
<td>Urgent cases missed in queue</td>
</tr>
<tr>
<td>Escalation detection</td>
<td>None</td>
<td>Legal threats not flagged immediately</td>
</tr>
<tr>
<td>Support analytics</td>
<td>None</td>
<td>No data on categories, sentiment, volume</td>
</tr>
<tr>
<td>Human time wasted</td>
<td>2–4 hrs/day</td>
<td>Standard FAQs answered manually every time</td>
</tr>
</table>

The owner was answering every email manually — from “what’s the zipper material?” to legal threats — with no system to separate urgent from routine. At 15–30 emails per day, this consumed a significant part of the working day with no prioritization or visibility into patterns.

---

## ✅ Solution

Built a **4-workflow AI email support system** that classifies, routes, responds, and analyzes:

```
Gmail (unread) → Filter → AI Classifier → Parser
                                              ↓
                                        Switch Router
                                              ↓
              ┌───────────┬───────────┬───────────┬───────────┐
              P1          P2          P3          P4        Default
         Draft+Telegram  Draft     Auto-Reply   Tag       Needs-Human
              └───────────┴───────────┴───────────┴───────────┘
                                              ↓
                                     Google Sheets Log
                                              ↓
                                  Analytics Agent (Chat UI)
```

### WF1 — Email Support Automation

Processes every incoming email automatically. AI classifies priority (P1–P4), category, sentiment, and generates a suggested response. Routes to correct action based on priority and requires_human flag.

### WF2 — Report for Period

On-demand analytics tool. Accepts a date range and returns 4 metrics: total emails, % negative sentiment, % requiring human intervention, top 3 categories.

### WF3 — Comparison of Two Periods

Compares two date ranges side by side. Returns % change for each metric with plain-language conclusions: improvement, deterioration, growth, decline, or stable.

### WF4 — Customer Support Analyst (AI Agent)

Natural language chat interface. The owner asks questions in plain text — the agent detects dates in any format, selects the right tool, and returns a readable summary.

---

## ⚙️ Process

### 1. Prompt Design

- Full system prompt rewritten for Hush (adapted from course template)
- 6 email categories specific to bag e-commerce
- OVERRIDE rules for human requests and influencer inquiries
- Language auto-detection: responds in customer’s language
- Temperature 0.2 for consistent JSON output

### 2. Priority System

<table header-row="true">
<tr>
<td>Priority</td>
<td>Trigger</td>
<td>Action</td>
</tr>
<tr>
<td>P1</td>
<td>Legal threat, fraud, authenticity dispute, media threat</td>
<td>Gmail draft + Telegram alert</td>
</tr>
<tr>
<td>P2</td>
<td>Damaged item, delay 7d+, defective product, angry tone</td>
<td>Gmail draft only</td>
</tr>
<tr>
<td>P3</td>
<td>Standard inquiry — order status, product info, returns</td>
<td>Auto-reply after 30s</td>
</tr>
<tr>
<td>P4</td>
<td>Thank you, positive feedback, low-urgency</td>
<td>Tag only, no reply</td>
</tr>
<tr>
<td>Default</td>
<td>requires_human=true, explicit human request</td>
<td>Needs-Human label</td>
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
<td>WF1 — Email Automation</td>
<td>Gmail Trigger (poll)</td>
<td>Filter → AI → Route → Act → Log</td>
</tr>
<tr>
<td>WF2 — Period Report</td>
<td>Sub-workflow call</td>
<td>Read Sheets → Filter → 4 metrics</td>
</tr>
<tr>
<td>WF3 — Period Comparison</td>
<td>Sub-workflow call</td>
<td>Calls WF2 twice → merge → % change</td>
</tr>
<tr>
<td>WF4 — Analyst Agent</td>
<td>Chat Trigger</td>
<td>NL query → tool selection → readable answer</td>
</tr>
</table>

### 4. Escalation Rules

<table header-row="true">
<tr>
<td>Rule</td>
<td>Trigger</td>
<td>Result</td>
</tr>
<tr>
<td>Legal threat</td>
<td>Lawyer, lawsuit, chargeback, consumer authority</td>
<td>P1 + Telegram</td>
</tr>
<tr>
<td>Authenticity dispute</td>
<td>Fake, counterfeit, not as described</td>
<td>P1 + Telegram</td>
</tr>
<tr>
<td>Media threat</td>
<td>Press, social media, going public</td>
<td>P1 + Telegram</td>
</tr>
<tr>
<td>Human request</td>
<td>“connect me with a real person”</td>
<td>Default branch</td>
</tr>
<tr>
<td>Influencer inquiry</td>
<td>Collaboration, gifting, followers, sponsorship</td>
<td>Default branch</td>
</tr>
<tr>
<td>Aggressive tone</td>
<td>Threatening or abusive language</td>
<td>P2 minimum</td>
</tr>
</table>

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
<td>Email triage</td>
<td>100% manual</td>
<td>100% automated</td>
<td>**↓ 0 min/email**</td>
</tr>
<tr>
<td>Time spent on support</td>
<td>2–4 hrs/day</td>
<td>~20 min/day (review only)</td>
<td>**↓ 85%**</td>
</tr>
<tr>
<td>P1 alert speed</td>
<td>Never</td>
<td>Instant Telegram</td>
<td>**New**</td>
</tr>
<tr>
<td>P3 response time</td>
<td>Hours</td>
<td>30 seconds</td>
<td>**↓ 99%**</td>
</tr>
<tr>
<td>Support analytics</td>
<td>None</td>
<td>On-demand via chat</td>
<td>**New**</td>
</tr>
<tr>
<td>Period comparison</td>
<td>None</td>
<td>Automated % change</td>
<td>**New**</td>
</tr>
<tr>
<td>Duplicate processing</td>
<td>Risk</td>
<td>Eliminated</td>
<td>**Fixed**</td>
</tr>
</table>

---

## 🛠️ Tech Stack

- **n8n** (self-hosted) — workflow automation engine
- **OpenAI GPT-4o-mini** — email classification and response generation
- **Gmail API** — trigger, drafts, labels, auto-replies
- **Google Sheets** — support log and analytics data source
- **Telegram Bot API** — P1 escalation alerts to owner
- **OpenRouter** — LLM provider for AI Agent chat interface

---

## ✅ What Works

- Full end-to-end automation: email arrives → classified → routed → responded → logged
- P1 legal/fraud alerts fire instantly to owner via Telegram
- P3 standard inquiries answered automatically in 30 seconds
- Duplicate processing eliminated — every email marked as read after processing
- Analytics agent answers plain-language questions about support performance
- Language auto-detection — responds in customer’s language
- Empty period handling — analytics workflows return clean zeros, never crash

---

## 🔧 What Can Be Improved

- **Timestamp format** — custom format (HH:MM DD-MM-YYYY) complicates date filtering; switch to ISO 8601 in future
- **P2 Telegram alert** — currently draft-only; add optional alert for high-volume periods
- **Sentiment trends** — track sentiment per category over time, not just overall
- **Auto-reply for P4** — optionally send a short thank-you reply to positive feedback

---

## 🗺️ Development Plan

1. Switch timestamp to ISO format → simplifies analytics queries
2. Add P2 Telegram alert with configurable threshold
3. Build category trend chart — weekly breakdown by category
4. Connect dedicated e-mail inbox instead of Gmail
5. Add weekly automated report → schedule WF2 every Monday to Telegram

---

## 🎥 Loom Screencast

<video src="https://www.loom.com/share/33ae8ffb552b42b09008fbf57e51ca31"></video>
## 📸 Screenshots

WF1 — Email Support Automation canvas

![](cases/assets/email-support/Screenshot_2026-06-02_at_15.09.11.png)

WF2 — Report for Period canvas

![](cases/assets/email-support/Screenshot_2026-06-02_at_12.55.38.png)

WF3 — Comparison of Two Periods canvas

![](cases/assets/email-support/Screenshot_2026-06-02_at_12.55.46.png)

WF4 — Customer Support Analyst canvas

![](cases/assets/email-support/Screenshot_2026-06-02_at_12.55.58.png)

Google Sheets log

![](cases/assets/email-support/Sheets_screenshot.png)

Execution History — P1 test

![](cases/assets/email-support/execution-history_-_5.png)

Telegram P1 alert

![](cases/assets/email-support/Screenshot_2026-06-02_at_15.12.34.png)

AI Agent chat response

![](cases/assets/email-support/Screenshot_2026-06-02_at_12.48.41.png)

---

## 📁 GitHub Repository

🔗 [https://github.com/vitaliiburorichnyi/hush-email-automation](https://github.com/vitaliiburorichnyi/hush-email-automation)