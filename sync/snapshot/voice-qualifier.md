← Back to the map: [burorichnyi.com](https://burorichnyi.com)
# AI Voice Sales Ecosystem: 
Automated Lead Qualification to CEO Report

---

## 🏢 Context

**Company:** GrowthLab — performance marketing agency
**Industry:** B2B Marketing Services
**Target clients:** E-commerce businesses with monthly revenue $50K–$500K
**Average contract:** $2,500/month for 6+ months
**Team:** 4 sales managers
**Website traffic:** 3,000 visitors/month → 100 leads/month

---

## ❌ Problem

<table header-row="true">
<tr>
<td>Metric</td>
<td>Value</td>
<td>Issue</td>
</tr>
<tr>
<td>Qualification time</td>
<td>20 min/lead</td>
<td>75% were non-target clients</td>
</tr>
<tr>
<td>Lead response time</td>
<td>Hours/days</td>
<td>Leads go cold waiting for callback</td>
</tr>
<tr>
<td>Lead → Deal conversion</td>
<td>5%</td>
<td>Too many unqualified leads in pipeline</td>
</tr>
<tr>
<td>Dialog analysis</td>
<td>None</td>
<td>No data on what works or fails</td>
</tr>
<tr>
<td>CEO reporting</td>
<td>Manual, monthly</td>
<td>Inaccurate and always delayed</td>
</tr>
</table>

Sales managers were spending most of their time on leads that were never going to convert. No system existed to filter, score, or learn from conversations.

---

## ✅ Solution

Built a **3-part AI voice sales ecosystem** that works as a closed loop:

```
New Lead → Voice Agent Call → BANT Score → CRM
                                    ↓
                            Daily Dialog Analysis → Google Sheets
                                    ↓
                            Weekly CEO Report → Telegram
```

### WF1 — Voice Agent System (3 sub-workflows)

Automatically calls new leads within **2 minutes** of form submission. AI agent Arabella qualifies leads using BANT framework, calculates score 0–100, and updates Zoho CRM with `AI_Context` + `AI_Score` + `Session_ID`.

### WF2 — Dialog Analysis

Runs **daily at 9:00**. Analyzes every qualified call — identifies agent errors, client pain points, and successful patterns. Writes structured analysis to Google Sheets.

### WF3 — CEO Report

Runs **every Friday at 17:00**. Combines CRM funnel metrics with dialog quality data. AI generates actionable weekly report sent directly to CEO via Telegram.

---

## ⚙️ Process

### 1. Prompt Design

- BANT qualification prompt for voice format
- Scoring rules: Budget / Authority / Need / Timeline (0–25 each = 100 max)
- Dialog analysis prompt for quality review (English)
- CEO report prompt with Structured Output Parser

### 2. API Integration

- **Happ.tools** — Voice assistant + INIT + postcall webhooks
- **Zoho CRM** — Custom fields: `AI_Score`, `AI_Context`, `Session_ID`
- **Anthropic Claude Sonnet** — AI scoring and analysis
- **Google Sheets** — Dialog analysis database
- **Telegram Bot** — CEO notification channel

### 3. n8n Workflow Architecture

<table header-row="true">
<tr>
<td>Workflow</td>
<td>Trigger</td>
<td>Function</td>
</tr>
<tr>
<td>WF1a — Call Trigger</td>
<td>Zoho CRM Webhook</td>
<td>Cleans phone → triggers Happ.tools call</td>
</tr>
<tr>
<td>WF1b — Postcall Handler</td>
<td>Happ.tools Webhook</td>
<td>Scores call → updates CRM lead</td>
</tr>
<tr>
<td>WF1c — Lead Lookup</td>
<td>Happ.tools INIT</td>
<td>Returns lead name to voice agent</td>
</tr>
<tr>
<td>WF2 — Dialog Analysis</td>
<td>Schedule (daily 9:00)</td>
<td>Analyzes calls → writes to Google Sheets</td>
</tr>
<tr>
<td>WF3 — CEO Report</td>
<td>Schedule (Friday 17:00)</td>
<td>CRM + Sheets → AI report → Telegram</td>
</tr>
</table>

### 4. BANT Scoring Rules

<table header-row="true">
<tr>
<td>Category</td>
<td>25 pts</td>
<td>20 pts</td>
<td>15 pts</td>
<td>10 pts</td>
<td>0 pts</td>
</tr>
<tr>
<td>Budget</td>
<td>$3K+/mo</td>
<td>$2.5K</td>
<td>$1.5–2.5K</td>
<td>Below $1.5K</td>
<td>Not stated</td>
</tr>
<tr>
<td>Authority</td>
<td>Owner/CEO</td>
<td>CMO/Head</td>
<td>Influences</td>
<td>Gathers info</td>
<td>Unknown</td>
</tr>
<tr>
<td>Need</td>
<td>Urgent problem</td>
<td>Clear problem</td>
<td>Mild need</td>
<td>Vague desire</td>
<td>Not stated</td>
</tr>
<tr>
<td>Timeline</td>
<td>This week</td>
<td>This month</td>
<td>Next month</td>
<td>2–3 months</td>
<td>Just looking</td>
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
<td>Qualification time</td>
<td>20 min/lead</td>
<td>2 min/lead</td>
<td>**↓ 90%**</td>
</tr>
<tr>
<td>Lead response time</td>
<td>Hours</td>
<td>2 minutes</td>
<td>**↓ 98%**</td>
</tr>
<tr>
<td>AI Score per lead</td>
<td>None</td>
<td>0–100 automatic</td>
<td>**New**</td>
</tr>
<tr>
<td>CEO report frequency</td>
<td>Monthly manual</td>
<td>Weekly automated</td>
<td>**4x faster**</td>
</tr>
<tr>
<td>Dialog analysis</td>
<td>None</td>
<td>Daily automatic</td>
<td>**New**</td>
</tr>
<tr>
<td>Scalability</td>
<td>100 leads/4 managers</td>
<td>1,000+ leads/same team</td>
<td>**10x**</td>
</tr>
</table>

---

## 🛠️ Tech Stack

- **n8n** (self-hosted) — workflow automation engine
- **Happ.tools** — AI voice agent (GPT-4o, English voice Arabella)
- **Anthropic Claude Sonnet** — AI analysis, scoring, report generation
- **Zoho CRM** — lead management and custom fields
- **Google Sheets** — dialog analysis database
- **Telegram Bot API** — CEO weekly reporting
- **ngrok** — webhook tunneling

---

## ✅ What Works

- Full end-to-end automation: lead form → voice call → CRM → analysis → CEO report
- Real BANT scoring based on actual conversation content
- Instant lead update after every call (AI_Score + AI_Context + Session_ID)
- Weekly CEO report with specific bottleneck identification and recommendations
- Loop-based dialog analysis processes all leads automatically

---

## 🔧 What Can Be Improved

- **INIT personalization** — lead name lookup before call (partially built, needs fix)
- **WhatsApp integration** — alternative notification channel for CEO
- **Multi-language support** — for non-English speaking leads
- **A/B script testing** — compare different qualification approaches
- **Deduplication** — handle Happ.tools double postcall webhook

---

## 🗺️ Development Plan

1. Fix WF1c INIT lead lookup → personalized greeting by name
2. Add scoring threshold → auto-assign hot leads (score > 70) to senior managers
3. Build re-qualification flow for cold leads (score < 40) with different script
4. Integrate Google Calendar → automatic meeting booking for hot leads
5. Add WhatsApp Business API notification as CEO report channel

---

## 🎥 Loom Screencast

<video src="https://www.loom.com/share/17fc126570b344af96e1a261446f1b01"></video>
---

## 📸 Screenshots

WF1a canvas

![](cases/assets/voice-qualifier/WF1a_canvas.png)

WF1b canvas

![](cases/assets/voice-qualifier/WF1b_canvas.png)

WF2 canvas

![](cases/assets/voice-qualifier/WF2_canvas.png)

WF3 canvas

![](cases/assets/voice-qualifier/WF3_canvas.png)

Zoho CRM lead with AI Score

![](cases/assets/voice-qualifier/Zoho_CRM_lead_with_AI_Score.png)

Google Sheets analysis

![](cases/assets/voice-qualifier/Google_Sheets_analysis.png)

Telegram CEO report

![](cases/assets/voice-qualifier/Telegram_CEO_report.png)

Call transcript example with BANT score

![](cases/assets/voice-qualifier/Call_transcript_example_with_BANT_score.png)

---

## 📁 GitHub Repository

🔗 [https://github.com/vitaliiburorichnyi/growthlab-ai-sales-ecosystem](https://github.com/vitaliiburorichnyi/growthlab-ai-sales-ecosystem)