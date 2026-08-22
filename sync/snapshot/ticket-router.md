← Back to the map: [burorichnyi.com](https://burorichnyi.com)
# Automatic Classification, SLA Control & Escalation for a Bag Store

---

## 🏢 Context

**Company:** HUSH - B2C premium bag e-commerce
**Industry:** Online Retail (Fashion Accessories)
**Target clients:** End consumers purchasing premium bags online
**Support volume:** 50-80 tickets/day (up to 120+ during sales and ad campaigns)
**Team:** 3 operators, flexible scheduling, 09:00-22:00 shift, 1-2 on duty daily
**Core problem:** Tickets sorted manually, urgent requests lost in queue, zero SLA visibility, no escalation mechanism

---

## ❌ Problem

<table header-row="true">
<tr>
<td>Metric</td>
<td>Value</td>
<td>Issue</td>
</tr>
<tr>
<td>Ticket triage</td>
<td>100% manual</td>
<td>No consistent prioritization</td>
</tr>
<tr>
<td>P1 identification</td>
<td>Inconsistent</td>
<td>Depended on which operator saw it first</td>
</tr>
<tr>
<td>SLA visibility</td>
<td>None</td>
<td>No one knew how long clients were waiting</td>
</tr>
<tr>
<td>Escalation on breach</td>
<td>Never</td>
<td>Missed tickets stayed missed</td>
</tr>
<tr>
<td>Operator triage time</td>
<td>60-90 min/day</td>
<td>Reading and sorting every message manually</td>
</tr>
<tr>
<td>Shift handover</td>
<td>Error-prone</td>
<td>Duplicate responses and missed tickets</td>
</tr>
</table>

Operators were manually reading every message and deciding priority on the fly - from “does this bag fit a laptop?” to legal threats - with no system to separate urgent from routine. P1 tickets (payment failures, active purchase decisions) were sitting in the same queue as influencer gifting requests.

---

## ✅ Solution

Built a **2-track AI ticket routing system** that classifies, logs, notifies, and escalates automatically:

```
Gmail (unread) >> Collect Context >> AI Classifier (Chain of Thought)
                                              ↓
                                      Parse AI Output
                                              ↓
                                       Flatten Result
                                    (working hours SLA)
                                              ↓
                                        Not spam?
                                              ↓
                          ┌───────────────────────────────┐
                   Google Sheets Log              Slack: Notify Owner
                   (15 fields)                    (#cx-tickets)

─── SLA WATCHER (every 5 min) ──────────────────────────────────────

Cron >> Working Hours Guard (09:00-22:00)
                    ↓
         Read Open Tickets (Sheets)
                    ↓
           SLA Breached? (deadline < now)
                    ↓
      Compute Escalation Level (minutes_overdue)
                    ↓
            Switch by Level
                    ↓
    ┌───────────────┬───────────────┬───────────────┐
    L0 (0-30 min)   L1 (30-60 min)  L2 (60+ min)
  Slack DM owner  #cx-escalations  Email to owner
```

### Track 1 - Ticket Ingestion and Classification

Processes every incoming email automatically. AI classifies category, priority, owner, and SLA deadline using Chain of Thought reasoning. Logs to Google Sheets and notifies the right owner in Slack within seconds.

### Track 2 - SLA Watcher

Runs every 5 minutes during working hours. Checks all open tickets for SLA breach. Fires a 3-level escalation chain based on how long the ticket has been overdue.

---

## ⚙️ Process

### 1. Prompt Design

- Full system prompt written for HUSH with 5 mandatory blocks: role, context, instructions, Chain of Thought, output format
- 5 ticket categories specific to premium bag e-commerce
- Priority matrix P1-P4 with SLA minutes (10 / 30 / 120 / 1440)
- OVERRIDE rules: legal keywords >> always P2; influencer + “urgent” >> always P4; explicit human request >> requires_human: true
- Language auto-detection: AI responds in client’s language
- Temperature 0.2 for consistent JSON output

### 2. Priority System

<table header-row="true">
<tr>
<td>Priority</td>
<td>SLA</td>
<td>Category</td>
<td>Action</td>
</tr>
<tr>
<td>P1</td>
<td>10 min</td>
<td>product-info, payment-billing</td>
<td>Slack alert to #cx-tickets</td>
</tr>
<tr>
<td>P2</td>
<td>30 min</td>
<td>complaint-legal</td>
<td>Slack alert, routed to owner</td>
</tr>
<tr>
<td>P3</td>
<td>2 hours</td>
<td>order-shipping-returns</td>
<td>Slack alert to #cx-tickets</td>
</tr>
<tr>
<td>P4</td>
<td>24 hours</td>
<td>influencer, other</td>
<td>Slack alert, low urgency</td>
</tr>
<tr>
<td>Spam</td>
<td>-</td>
<td>spam</td>
<td>Filtered out, not logged</td>
</tr>
</table>

### 3. Escalation Rules

<table header-row="true">
<tr>
<td>Level</td>
<td>When</td>
<td>To whom</td>
<td>Channel</td>
</tr>
<tr>
<td>L0 - reminder</td>
<td>+5 min after SLA breach</td>
<td>On-duty operator</td>
<td>Slack DM</td>
</tr>
<tr>
<td>L1 - team alert</td>
<td>+30 min after breach</td>
<td>Whole team</td>
<td>#cx-escalations channel</td>
</tr>
<tr>
<td>L2 - owner escalation</td>
<td>+60 min after breach</td>
<td>Owner</td>
<td>Email + subject line with ticket details</td>
</tr>
</table>

### 4. n8n Workflow Architecture

<table header-row="true">
<tr>
<td>Workflow</td>
<td>Trigger</td>
<td>Function</td>
</tr>
<tr>
<td>Track 1 - Ticket Routing</td>
<td>Gmail Trigger (every 1 min)</td>
<td>Collect >> Classify >> Log >> Notify</td>
</tr>
<tr>
<td>Track 2 - SLA Watcher</td>
<td>Schedule Trigger (every 5 min)</td>
<td>Read >> Check >> Escalate</td>
</tr>
</table>

### 5. Working Hours Logic

Two implementation points:

**SLA deadline calculation (at ticket creation):**
Ticket at 22:30 >> deadline starts at 09:00 next day + SLA minutes. Ticket at 07:00 >> starts at 09:00 same day. Ticket at 14:00 >> normal calculation.

**SLA Watcher guard:**
First node after cron checks `$now.hour >= 9 && $now.hour < 22`. Outside working hours >> execution stops. No false breach alerts overnight.

### 6. Key Technical Decisions

<table header-row="true">
<tr>
<td>Problem</td>
<td>Cause</td>
<td>Fix</td>
</tr>
<tr>
<td>Flatten Result empty</td>
<td>Agent node returns AI output as plain string</td>
<td>Added Code node: `JSON.parse($input.item.json.output)`</td>
</tr>
<tr>
<td>escalation_level always 0</td>
<td>Field referenced itself before being set</td>
<td>Duplicated the minutes calculation inline</td>
</tr>
<tr>
<td>DateTime.fromFormat() NaN</td>
<td>Millisecond format mismatch with Sheets ISO string</td>
<td>Switched to native `new Date().getTime()`</td>
</tr>
<tr>
<td>Structured Output Parser conflict</td>
<td>Incompatible with Agent node type</td>
<td>Removed parser, replaced with Code node</td>
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
<td>Ticket triage</td>
<td>100% manual</td>
<td>100% automated</td>
<td>**↓ 0 min/ticket**</td>
</tr>
<tr>
<td>Operator triage time</td>
<td>60-90 min/day</td>
<td>~10 min/day (review only)</td>
<td>**↓ 85%**</td>
</tr>
<tr>
<td>Time to classification</td>
<td>5-15 min (manual)</td>
<td>~8 seconds</td>
<td>**↓ 99%**</td>
</tr>
<tr>
<td>P1 identification</td>
<td>Inconsistent</td>
<td>100% in testing</td>
<td>**New**</td>
</tr>
<tr>
<td>SLA visibility</td>
<td>None</td>
<td>Real-time in Sheets</td>
<td>**New**</td>
</tr>
<tr>
<td>Escalation on breach</td>
<td>Never</td>
<td>Automatic 3-level</td>
<td>**New**</td>
</tr>
<tr>
<td>Misclassifications</td>
<td>N/A</td>
<td>0 out of 10 test tickets</td>
<td>**0%**</td>
</tr>
<tr>
<td>Multilingual support</td>
<td>Manual decision</td>
<td>Automatic detection</td>
<td>**New**</td>
</tr>
<tr>
<td>Special rule accuracy</td>
<td>N/A</td>
<td>100% (URGENT influencer >> P4 ✅)</td>
<td>**New**</td>
</tr>
</table>

**Estimated time saved:** 60-90 min/day >> ~400 hours/year per operator
**Scalability:** system handles 50 or 500 tickets/day with zero additional classification effort

---

## 🛠️ Tech Stack

- **n8n** (self-hosted via Docker) - workflow automation, both tracks
- **OpenAI GPT-4o-mini** - ticket classification with Chain of Thought reasoning
- **Gmail API** - ticket ingestion trigger + L2 escalation email
- **Google Sheets** - ticket log, SLA tracking, status management
- **Slack** - new ticket notifications + 3-level escalation alerts
- **JavaScript / Luxon** - working hours SLA deadline calculation

---

## ✅ What Works

- Full end-to-end automation: email arrives >> classified >> logged >> notified in Slack
- Working hours SLA - no false escalations outside 09:00-22:00
- 3-level escalation chain fires correctly based on minutes overdue
- Spam filtered before logging - keeps Sheets clean and saves OpenAI budget
- Chain of Thought reasoning visible in every Slack notification - operators understand why priority was assigned
- Multilingual - Ukrainian test ticket classified and summarized correctly
- Special rules hold - influencer “URGENT deadline today” stayed P4

---

## 🔧 What Can Be Improved

- **Manual status update** - operator must change `status` to `closed` in Sheets manually; a Slack button triggering automatic close would eliminate this
- **Single channel input** - prototype uses Gmail only; Phase 2 adds Instagram Direct, Telegram, Facebook, website form
- **No duplicate guard** - if same email is processed twice, it creates a duplicate Sheets row; add Gmail label `Ticketed` + filter `label:Ticketed` to prevent
- **L1/L2 repeat alerts** - SLA Watcher fires every 5 min; a breached ticket at L2 will send owner emails every 5 min until closed; add `escalation_sent` flag to Sheets to prevent repeat sends

---

## 🗺️ Development Plan

1. Add Slack button on escalation message >> operator clicks to mark ticket closed >> n8n webhook updates Sheets `status` to `closed`
2. Add Gmail label `Ticketed` + trigger filter to prevent duplicate processing
3. Add `escalation_sent` column to Sheets >> prevent repeat L2 emails on same ticket
4. Phase 2 channels: Instagram Direct, Telegram, Facebook, website form >> each gets a webhook trigger feeding the same classifier
5. Weekly SLA breach report >> cron every Monday >> reads Sheets >> AI finds patterns by category/hour >> posts to Slack

---

## 🎥 Loom Screencast

<video src="https://www.loom.com/share/2d4deb45550a4597a0e93debd733debd"></video>
---

## 📸 Screenshots

1. n8n canvas - Track 1 

![](cases/assets/ticket-router/Screenshot_2026-06-09_at_20.29.58.png)

2. n8n canvas - Track 2 

![](cases/assets/ticket-router/Screenshot_2026-06-09_at_20.32.33.png)

3. Slack #cx-tickets - P1 new ticket notification

![](cases/assets/ticket-router/Screenshot_2026-06-09_at_20.38.56.png)

4. Slack - L1 escalation message

![](cases/assets/ticket-router/Screenshot_2026-06-09_at_20.39.55.png)

5. Slack - L2 escalation triggered + Email sent

![](cases/assets/ticket-router/Screenshot_2026-06-09_at_20.28.41.png)

6. Google Sheets - rows with all 15 fields

![](cases/assets/ticket-router/Screenshot_2026-06-09_at_20.31.20.png)

7. AI Classifier output - reasoning field example

![](cases/assets/ticket-router/Screenshot_2026-06-09_at_20.34.34.png)

---

## 📁 GitHub Repository

🔗 [https://github.com/vitaliiburorichnyi/hush-ticket-routing-sla](https://github.com/vitaliiburorichnyi/hush-ticket-routing-sla)