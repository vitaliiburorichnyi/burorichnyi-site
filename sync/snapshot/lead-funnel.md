← Back to the map: [burorichnyi.com](https://burorichnyi.com)
> Wix custom form → n8n → Google Sheets + Telegram + Zoho CRM + AI scoring → Klaviyo segmentation. Zero manual work, <10 sec end-to-end.
> 

---

## 🏢 Context

**Business:** AIIAAsyst — an AI automation agency helping SMBs automate lead generation and client communication.

**Website:** aiiaasyst.wixsite.com/webhook

**Situation before:** Leads from the website contact form were processed manually. A manager had to copy data from email to spreadsheet, judge intent by hand, and route the contact to the right follow-up. Response time: 2–4 hours. No CRM. No segmentation.

---

## 🔴 Problem

Two problems had to be solved.

**Business problem:** Every new lead required 15–20 minutes of manual work across copy-paste, CRM entry, and email list routing — unscalable and error-prone.

**Technical blocker:** The native Wix Form sent data to the n8n webhook with delays of up to **1.5 hours**, and extracting individual field values from the Wix payload was inconsistent. This made the automation unreliable before it even started.

---

## 🟢 Solution

Replaced the native Wix Form with a custom frontend built from individual `input` fields. Form submission logic was moved to a Wix backend function that fires a `POST` request directly to the n8n webhook — eliminating the delay entirely and giving full control over the payload structure.

The n8n workflow then fans out in parallel: logs the lead to Google Sheets, sends a Telegram notification to the manager, creates a Zoho CRM lead via OAuth 2.0, and simultaneously runs AI qualification using **nvidia/nemotron-3-super-120b (free tier via OpenRouter)**. The AI returns a structured JSON score (hot / warm / cold), which routes the lead into the correct Klaviyo email list via the Klaviyo Profiles API.

> ⚡ **Engineering insight:** Added an `If` guard node before the `Switch State` to handle edge cases where the AI returns an unexpected value — defaulting to *warm* to avoid losing leads. Structured Output Parser enforces strict JSON schema from the LLM response.
> 

---

## ⚙️ Process

1. **Wix custom form (frontend + backend)** — Replaced native Wix Form with custom HTML inputs. Wix backend sends a `POST` with `{name, phone, email, comment}` directly to the n8n webhook URL. No delay.
2. **Webhook Wix (n8n trigger)** — Receives POST payload. `Body Wix` Set node extracts `$json.body.*` fields into clean variables for downstream nodes.
3. **Parallel branch A — Google Sheets** — `Add Row (Leads)` appends a timestamped row (Europe/Kyiv timezone) to the “Webhook Wix Leads” spreadsheet. Columns: Date, Name, Phone, Email, Comment.
4. **Parallel branch B — Telegram** — `Edit Fields` formats a structured message with emoji labels. `Send a text message` pushes it to the manager’s bot instantly.
5. **Parallel branch C — Zoho CRM** — `Create a lead` node creates a Lead record via OAuth 2.0, mapping name → First_Name, email, phone, comment → Description.
6. **Parallel branch D — AI qualification** — `Basic LLM Chain` sends the comment field to **nvidia/nemotron-3-super-120b-a12b:free** via OpenRouter with a role-based prompt. `Structured Output Parser` enforces `{"state":"hot|warm|cold"}` JSON schema.
7. **If + Switch routing** — `If` node validates the AI output; unknown values default to *warm*. `Switch State` routes to one of three Set nodes (Hot / Warm / Cold List ID), then merges into a single `List ID` node.
8. **Klaviyo — Create Profile + Add to List** — `Create Profile` calls `POST /api/profile-import/`. `Parse Profile ID` extracts the returned ID. `Add Profile to List` calls `POST /api/lists/{listId}/relationships/profiles/` — placing the lead in exactly one of three email sequences.

---

## 📊 Results

<table header-row="true">
<tr>
<td>Metric</td>
<td>Before</td>
<td>After</td>
</tr>
<tr>
<td>Manual work per lead</td>
<td>15–20 min</td>
<td>0 min</td>
</tr>
<tr>
<td>Pipeline execution time</td>
<td>2–4 hours</td>
<td>< 10 seconds</td>
</tr>
<tr>
<td>Systems updated per lead</td>
<td>1 (email inbox)</td>
<td>4 simultaneously</td>
</tr>
<tr>
<td>Webhook delivery delay</td>
<td>Up to 1.5 hours</td>
<td>Instant</td>
</tr>
<tr>
<td>Lead segmentation</td>
<td>None</td>
<td>3 tiers: hot / warm / cold</td>
</tr>
<tr>
<td>System availability</td>
<td>Business hours only</td>
<td>24/7 autonomous</td>
</tr>
</table>

---

## 🛠 Tech Stack

- **Wix** — Landing page + custom lead form
- **Wix Velo** — Backend function sending POST to n8n webhook
- **n8n** — Core automation engine (webhook, parallel branches, Switch routing)
- **OpenRouter** — LLM API gateway (free tier)
- **nvidia/nemotron-3-super-120b-a12b** — AI model for lead qualification
- **Google Sheets** — Lead log with timestamped rows
- **Telegram Bot** — Instant manager notifications
- **Zoho CRM** — Lead records via OAuth 2.0
- **Klaviyo API** — Profile creation + list routing (hot / warm / cold)

---

## 🤖 AI Qualification Prompt (key logic)

```
ROLE: Lead qualification assistant
INPUT: Lead comment from website form
OUTPUT: { "state": "hot" | "warm" | "cold" }

hot  → ready to buy, asks pricing / call / start now
warm → interested, exploring, moderate intent
cold → vague, unclear, empty, spam

Enforced via: Structured Output Parser (strict JSON schema)
```

---

## 🎥 Loom Screencast

<video src="https://www.loom.com/share/233819523c2e4670b2c18b61dbe12f8c"></video>
---

## 📸 Screenshots

![](cases/assets/lead-funnel/n8n_workflow_canvas_(full_view).png)
n8n workflow canvas (full view)

![](cases/assets/lead-funnel/Zoho_CRM__new_lead_record.png)
Zoho CRM — new lead record

![](cases/assets/lead-funnel/Klaviyo__hot__warm__cold_lists.png)
Klaviyo — hot / warm / cold lists

![](cases/assets/lead-funnel/Telegram_bot__notification_message.png)
Telegram bot — notification message

![](cases/assets/lead-funnel/Google_Sheets__leads_table_with_data_rows.png)
Google Sheets — leads table with data rows

![](cases/assets/lead-funnel/Wix_landing_page_with_form_visible.png)
Wix landing page with form visible

---