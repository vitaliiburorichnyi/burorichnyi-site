← Back to the map: [burorichnyi.com](https://burorichnyi.com)
# Customer Signal AI:

Automated Call Scoring, Agent Coaching & Client Retention for a Premium Bag Brand

---

## 🏢 Context

**Company:** HUSH - B2C premium bag e-commerce
**Industry:** Online Retail (Fashion Accessories)
**Target clients:** End consumers purchasing premium bags online
**Support volume:** Inbound customer service calls (daily)
**Team:** Customer service agents + 1 manager
**Core problem:** Zero visibility into call quality - no QA, no coaching, no retention follow-up

---

## ❌ Problem

<table header-row="true">
<tr>
<td>Metric</td>
<td>Value</td>
<td>Issue</td>
</tr>
<tr>
<td>Call QA coverage</td>
<td>0%</td>
<td>No calls reviewed systematically</td>
</tr>
<tr>
<td>Agent feedback</td>
<td>None</td>
<td>Coaching was ad-hoc and reactive</td>
</tr>
<tr>
<td>Bad call detection</td>
<td>Never</td>
<td>Poor calls went completely unnoticed</td>
</tr>
<tr>
<td>Client retention</td>
<td>None</td>
<td>At-risk customers never followed up</td>
</tr>
<tr>
<td>Manager time on QA</td>
<td>0 (not done)</td>
<td>Too time-consuming to do manually</td>
</tr>
</table>

The customer service team handled inbound calls daily with no quality control in place. Managers had no way to know which calls went badly, which agents needed coaching, or which customers were at risk of churning. Every poor call was a silent loss — no detection, no recovery.

---

## ✅ Solution

Built a **4-workflow AI automation system** that transcribes, scores, alerts, and recovers:

```
Call recording → Google Drive
                      ↓
            WF01: Transcribe & Score
                      ↓
         Filter: Audio → Whisper → GPT QA Score
                      ↓
              Log to Google Sheets
                      ↓
                 Score < 3.0?
                      ↓
        ┌─────────────┴─────────────┐
     YES                           NO
Slack Alert                       End
+ Call WF03
        ↓
WF03: Draft Retention Email
        ↓
  AI analyzes call → drafts email
        ↓
  Save to Sheets → Telegram to Manager
        ↓
WF04: Manager Decision (Telegram buttons)
        ↓
   ┌────┴────┐
 Send      Refuse
   ↓          ↓
WF02:      Mark as
Get email  Rejected
+ Send
```

### WF01 — Call QA: Transcribe & Score

Picks up every new call recording automatically. Transcribes using Whisper, scores the agent across 8 QA criteria (1–5 scale) using GPT-5-mini, logs full results to Google Sheets, and fires a Slack alert for any call scoring below 3.0.

### WF02 — Call Recording URL to Email

Sub-workflow triggered on manager approval. Extracts the Google Drive file ID from the recording URL and retrieves the client email for sending the retention email.

### WF03 — On Bad Call: Notify Manager

Triggered automatically when score < 3.0. Reads the call transcription, runs a second AI agent to draft a personalized retention email and write a 2–3 sentence call summary for the manager. Sends everything to the manager via Telegram with Send/Refuse buttons.

### WF04 — On Manager Decision: Send Email

Handles the manager’s Telegram button press. Checks if the record is still pending (duplicate protection), routes to approve or reject, updates status in Google Sheets, and confirms the decision back to the manager.

---

## ⚙️ Process

### 1. QA Scoring Framework

- 8 criteria scored 1–5 by GPT-5-mini
- Score = average of all 8 criteria (1.0–5.0)
- Structured Output Parser enforces strict JSON — auto-retry on malformed output
- Voicemail and silent recordings filtered automatically (score=0, skipped)
- Calls in Ukrainian, English, or mixed language fully supported

### 2. Scoring Criteria

<table header-row="true">
<tr>
<td>Criterion</td>
<td>What’s Evaluated</td>
</tr>
<tr>
<td>Greetings</td>
<td>Professional opening, self-identification</td>
</tr>
<tr>
<td>Active Listening</td>
<td>Let customer speak, paraphrasing</td>
</tr>
<tr>
<td>Needs Discovery</td>
<td>Clarifying questions before solution</td>
</tr>
<tr>
<td>Empathy</td>
<td>Acknowledging emotions and frustration</td>
</tr>
<tr>
<td>Expertise</td>
<td>Product/process knowledge demonstrated</td>
</tr>
<tr>
<td>Clear Solution</td>
<td>Concrete resolution or next step given</td>
</tr>
<tr>
<td>Next Steps</td>
<td>Timeline and ownership confirmed</td>
</tr>
<tr>
<td>Closing</td>
<td>Professional, positive call ending</td>
</tr>
</table>

### 3. Alert & Retention Flow

<table header-row="true">
<tr>
<td>Score</td>
<td>Trigger</td>
<td>Action</td>
</tr>
<tr>
<td>≥ 3.0</td>
<td>Good/Fair call</td>
<td>Log to Sheets only</td>
</tr>
<tr>
<td>< 3.0</td>
<td>Poor call</td>
<td>Slack alert + AI retention email draft + Telegram to manager</td>
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
<td>WF01 — Call QA: Transcribe & Score</td>
<td>Google Drive (new file)</td>
<td>Transcribe → Score → Log → Alert</td>
</tr>
<tr>
<td>WF02 — Recording URL to Email</td>
<td>Sub-workflow call</td>
<td>Extract file ID → Get client email</td>
</tr>
<tr>
<td>WF03 — On Bad Call: Notify Manager</td>
<td>Sub-workflow call</td>
<td>Draft email → Save → Telegram</td>
</tr>
<tr>
<td>WF04 — On Manager Decision</td>
<td>Telegram button press</td>
<td>Approve/Reject → Update Sheets → Confirm</td>
</tr>
</table>

### 5. Manager Approval Flow

<table header-row="true">
<tr>
<td>Action</td>
<td>Trigger</td>
<td>Result</td>
</tr>
<tr>
<td>Send</td>
<td>Manager taps ✅ Send Email</td>
<td>Email sent, status = sent, timestamp logged</td>
</tr>
<tr>
<td>Refuse</td>
<td>Manager taps ❌ Don’t Send</td>
<td>Status = rejected, manager notified</td>
</tr>
<tr>
<td>Double tap</td>
<td>Button pressed again</td>
<td>“Already processed” message, no action</td>
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
<td>Call QA coverage</td>
<td>0%</td>
<td>100%</td>
<td>**↑ Full coverage**</td>
</tr>
<tr>
<td>Time to detect bad call</td>
<td>Never</td>
<td>< 1 hour</td>
<td>**New**</td>
</tr>
<tr>
<td>Manager response to bad call</td>
<td>Never</td>
<td>< 5 minutes</td>
<td>**New**</td>
</tr>
<tr>
<td>Retention email draft time</td>
<td>N/A (not done)</td>
<td>Automatic</td>
<td>**New**</td>
</tr>
<tr>
<td>Agent feedback quality</td>
<td>Ad-hoc</td>
<td>Structured, per-criterion</td>
<td>**↑ Systematic**</td>
</tr>
<tr>
<td>Coaching data available</td>
<td>None</td>
<td>Every call logged</td>
<td>**New**</td>
</tr>
</table>

---

## 🛠️ Tech Stack

- **n8n** (self-hosted, Docker + ngrok) — workflow automation engine
- **OpenAI Whisper** — call transcription
- **GPT-5-mini** — QA scoring + retention email drafting
- **Google Drive** — call recording storage and trigger (Phase 1)
- **Google Sheets** — central data store for scores, drafts, and decisions
- **Slack** — real-time bad CX alerts to team channel
- **Telegram Bot API** — manager approval interface with inline buttons

---

## ✅ What Works

- Full end-to-end automation: recording uploaded → transcribed → scored → alerted → email drafted → manager approves → sent
- 100% call QA coverage with zero manual effort
- Voicemail filtering — silent recordings never pollute the QA log
- Structured JSON output enforced — AI retries automatically on malformed responses
- Duplicate-click protection — manager can’t accidentally send the same email twice
- Mixed language support — Ukrainian, English, or mixed calls all handled correctly
- Full audit trail — every score, draft, decision, and timestamp logged to Sheets

---

## 🔧 What Can Be Improved

- **Call trigger** — Google Drive upload is manual; Zadarma webhook will automate this completely
- **Client email** — currently retrieved from recording URL; HubSpot lookup by phone will make it fully dynamic
- **Agent dashboard** — Sheets log is functional but a Looker/Data Studio dashboard would give better coaching visibility
- **Score threshold** — 3.0 is conservative; can be raised to 3.5 for stricter QA standards

---

## 🗺️ Phase 2 — Production Architecture (Planned)

Pending client approval:

1. **Zadarma SIP webhook** → replaces Google Drive trigger, fires automatically when call ends
2. **HubSpot CRM** → contact lookup by phone number, call activity logging per agent
3. **Agent performance dashboard** → weekly coaching report per agent from Sheets data

---

## 📸 Screenshots

WF01 — Call QA: Transcribe & Score canvas

![](cases/assets/call-qa/01.png)

WF03 — On Bad Call: Notify Manager canvas

![](cases/assets/call-qa/03.png)

WF04 — On Manager Decision canvas

![](cases/assets/call-qa/04.png)

Slack — Bad CX Alert

![](cases/assets/call-qa/Slack.png)

Telegram — Manager Retention Alert with buttons

![](cases/assets/call-qa/tg.png)

Google Sheets — Email Draft + Status

![](cases/assets/call-qa/Screenshot_2026-06-04_at_17.54.20.png)

---

## 📁 GitHub Repository

🔗 [https://github.com/vitaliiburorichnyi/customer-signal-ai](https://github.com/vitaliiburorichnyi/customer-signal-ai)