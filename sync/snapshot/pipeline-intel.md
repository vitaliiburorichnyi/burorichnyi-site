← Back to the map: [burorichnyi.com](https://burorichnyi.com)
---

A 3-workflow AI automation system that analyzes a B2B sales pipeline daily, scores each deal’s health weekly, and delivers a strategic CEO forecast - all automatically via Telegram.

---

## 📌 Context

An AI automation agency runs an active sales pipeline with 10-15 deals at any given time. Sales managers track deals manually, and leadership has no real-time visibility into risks, stalled deals, or weekly revenue forecasts. Every insight requires manual CRM digging.

## 📌 Project Summary

<table header-row="true">
<tr>
<td>**Type**</td>
<td>AI Sales Intelligence System</td>
</tr>
<tr>
<td>**Stack**</td>
<td>n8n · HubSpot CRM · GPT-5 mini · Google Sheets · Telegram</td>
</tr>
<tr>
<td>**Workflows**</td>
<td>3 (Daily Report · Deal Health Alerts · CEO Forecast)</td>
</tr>
<tr>
<td>**Status**</td>
<td>✅ Built and tested</td>
</tr>
<tr>
<td>**GitHub**</td>
<td>[Sales-Intelligence-System](https://github.com/vitaliiburorichnyi/sales-intelligence-system)</td>
</tr>
</table>

---

## ❗ Problem

- Managers spend 30-60 min/day manually checking deal status
- Leadership has no automated risk alerts for stalled or overdue deals
- No weekly strategic forecast exists — decisions made on gut feeling
- Critical deals slip through the cracks without timely follow-up

---

## ✅ Solution

Three interconnected n8n workflows that run automatically:

1. **Daily Sales Report** — AI agent analyzes the pipeline and sends a prioritized Telegram report every morning
2. **Deal Health Alerts** — Every deal is scored 1-10 weekly, stored in Google Sheets, and critical/medium alerts fire instantly to Telegram
3. **CEO Forecast** — Friday evening strategic briefing with revenue projections, top risks, and weekly recommendations

---

## ⚙️ Process

### Part 1 — Daily Sales Report

- Schedule Trigger fires at 9:10 AM daily
- HubSpot API pulls all active deals with key properties
- Code Node aggregates data: stage counts, amounts, identifies stuck deals
- AI Agent (GPT-5 mini) receives summary, calls Get Deal tool for each at-risk deal individually
- Structured Output Parser returns clean JSON with priorities and recommendations
- Code Node splits message to respect Telegram’s 4096 character limit
- Telegram delivers formatted HTML report

### Part 2 — Deal Health Alerts

- Schedule Trigger fires Monday 10:00 AM
- Loop Over Items processes each deal individually
- If Node filters only stuck stages: Presentation Scheduled, Decision Maker Bought-In, Contract Sent
- Sub-workflow fetches all engagements (notes, calls, tasks) via HubSpot Engagements API
- AI Agent scores each deal 1-10 with full JSON analysis
- Google Sheets stores results with Append or Update (no duplicates by Deal ID)
- Switch routes Critical (≤4) and Medium (≤7) deals to Telegram alerts
- Normal deals return to loop silently

### Part 3 — CEO Forecast

- Schedule Trigger fires Friday 19:00
- Google Sheets pulls all accumulated Deal Health data
- Aggregate node collects all rows into single array
- AI Agent produces executive briefing: pipeline health, revenue at risk, top 3 risks, weekly recommendations
- Telegram delivers formatted CEO report

---

## 📊 Results

- 100% automated pipeline visibility — zero manual CRM checking
- Critical deals flagged within minutes of weekly analysis
- 9 deals analyzed, scored, and stored in single workflow run
- Two-tier reporting: operational alerts for managers + strategic forecast for CEO
- Full audit trail in Google Sheets with historical scoring trends

---

## 🛠 Tech Stack

<table header-row="true">
<tr>
<td>Tool</td>
<td>Role</td>
</tr>
<tr>
<td>n8n</td>
<td>Workflow automation engine</td>
</tr>
<tr>
<td>HubSpot CRM</td>
<td>Deal data source + engagements</td>
</tr>
<tr>
<td>GPT-5 mini</td>
<td>AI analysis and scoring</td>
</tr>
<tr>
<td>Google Sheets</td>
<td>Analytics storage</td>
</tr>
<tr>
<td>Telegram Bot</td>
<td>Delivery channel</td>
</tr>
</table>

---

## 🧠 Key Logic

**AI Agent as investigator**
In Part 1 the agent receives only deal IDs and calls the Get Deal tool itself for each problematic deal. It decides what to investigate — not the workflow.

**Sub-workflow isolation**
Engagement fetching is a separate workflow for clean debugging and reusability. If it breaks, it doesn’t take down the main workflow.

**Switch node order**
Critical → Medium → Normal. Order is critical: first match wins. Reversed order would route all deals to Normal regardless of score.

**Append or Update**
Google Sheets updates existing rows by Deal ID, never duplicates. Essential for accurate historical tracking across weekly runs.

**JSON.stringify for AI input**
All deal and engagement data passed to AI agents as stringified JSON, not raw objects. Prevents serialization issues and keeps token usage predictable.

---

---

## 🖼 Screenshots

Part 1 workflow canvas

![](cases/assets/pipeline-intel/Part_1_workflow_canvas.png)

Part 2 main workflow canvas

![](cases/assets/pipeline-intel/Part_2_main_workflow_canvas.png)

Part 2 sub-workflow canvas

![](cases/assets/pipeline-intel/Part_2_sub-workflow_canvas.png)

Google Sheets with deal health data

![](cases/assets/pipeline-intel/Google_Sheets_with_deal_health_data.png)

Telegram — daily report

![](cases/assets/pipeline-intel/Telegram__CEO_forecast.png)

Telegram — Critical alert

![](cases/assets/pipeline-intel/Telegram__Critical_alert.png)

Telegram — Medium alert

![](cases/assets/pipeline-intel/Telegram__Medium_alert.png)

Telegram — CEO forecast

![](cases/assets/pipeline-intel/Screenshot_2026-05-22_at_16.01.40.png)