← Back to the map: [burorichnyi.com](https://burorichnyi.com)
Daily Staleness Detection, Rep Nudge and Manager Escalation Across HubSpot and Slack

---

The original design assumed a HubSpot field called `hs_lastactivitydate`. Pulling the real property list from the portal (`GET /crm/v3/properties/deals`) showed it does not exist. The actual field is **`notes_last_updated`**, and it is read-only, which is correct behaviour: it should reflect genuine rep activity rather than something anyone can overwrite.

That is the reason this case exists. The design existed on paper first - trigger, condition, action. I built it live in n8n against a real HubSpot portal and a real Slack workspace instead, and every point where the real API contradicted the plan is written down below.

---

## 🏢 Context

**Company:** EdTech company - online course provider<br>**Systems:** HubSpot CRM and Slack, already connected<br>**Situation:** Deals go cold in the "Proposal Sent" stage because reps are not following up consistently<br>**Process today:** The manager runs a manual check every Friday - export HubSpot to Google Sheets, colour-code by last activity date, post a Slack message tagging each rep<br>**Core problem:** ~90 minutes a week of manual work that only catches a cooling deal once a week

**Definition used:** a deal is stale when it sits in *Proposal Sent* with no logged activity (call, email, meeting, note) for 3 working days. Two custom deal properties track alert state, two more handle the parking exception.

---

## ❌ Problem

<table header-row="true">
<tr>
<td>Issue</td>
<td>Detail</td>
</tr>
<tr>
<td>Manual ritual</td>
<td>~90 min every Friday: export, colour-code, post</td>
</tr>
<tr>
<td>Frequency</td>
<td>Weekly only - a deal can cool for up to 7 days before anyone notices</td>
</tr>
<tr>
<td>Visibility</td>
<td>No automated alert system exists at all</td>
</tr>
<tr>
<td>Detection quality</td>
<td>Colour-coding by eye, so a busy Friday means a missed deal</td>
</tr>
</table>

---

## ✅ Solution

Built in **n8n**, running daily instead of the old once-a-week manual export.

```plain text
TRIGGER   Every weekday at 09:00 (scheduled, cron 0 0 9 * * 1-5)
   |
FETCH     All deals where Pipeline Stage = "Proposal Sent"
   |
CONDITION Flag a deal as STALE if ALL are true:
          - Working days since Last Activity Date >= 3
          - Deal is NOT parked (see exception below)
          - Deal has an owner and an amount
   |
GROUP     Group the stale deals by deal owner (rep)
   |
ACTION    Post ONE Slack message per rep, tagging them:
          "@rep - 1 deal stale in Proposal Sent:
             - Acme Corp, $4,000, 4 days no activity
           Please follow up today."
   |
ESCALATE  If a flagged deal is still stale on day 5,
          post it to the manager escalation channel instead of the rep.
```

- **Trigger:** time-based, daily, 9:00 AM. Catches a cooling deal in 1-2 days instead of up to 7.
- **Condition:** measures real silence since the last logged activity, not just time-in-stage.
- **Action:** one grouped message per rep to avoid spam, with amount and age so the rep can prioritize.

The full workflow: staleness evaluation, the escalation split, and the alert-level update running parallel to Slack.
![](cases/assets/stale-deals/01 - n8n canvas - full workflow.png)

The day-5 escalation as it arrives in the manager channel, with deal name, amount, days stale and the owning rep.
![](cases/assets/stale-deals/03 - slack day5 manager escalation.png)

---

## ⚙️ Build notes - what changed once the real APIs hit

**"Last Activity Date" does not exist as a standard field here.** The plan assumed a property called `hs_lastactivitydate`. The real property list showed it is not there. The actual field is `notes_last_updated`, and it is read-only - it only updates when a genuine engagement (note, call, email) is logged against the deal. That is correct behaviour for production: the field should reflect real rep activity, not something anyone can overwrite. For testing, backdated Notes were created through the HubSpot Notes API (`POST /crm/v3/objects/notes` with `hs_timestamp` set) so the staleness math had real data to work against.

**Rep lookup uses a maintained directory, not email matching.** The plan assumed HubSpot owner email = Slack user email, matched live via `users.lookupByEmail`. In testing the two did not match - different addresses for the same person. Instead of a fragile email-matching step, a small n8n Data Table (the rep directory) maps `ownerId` to `repName` to `slackUserId`. The workflow looks up the HubSpot owner ID and gets the Slack user ID directly. Same pattern as the course-to-instructor map in the enrollment build: one consistent approach across both automations, a small maintained lookup table instead of trusting two systems to agree on identity. Onboarding a new rep becomes a one-line table addition, not a code change.

**One token, two credential entries.** The HubSpot Private App token had to be attached twice in n8n as two separate credentials - `hubspotAppToken` for the dedicated HubSpot nodes, and a generic Bearer credential for the raw HTTP Request node, because n8n's HTTP Request node cannot accept the dedicated type. Both point at the same token. Rotating it means updating both.

---

## 🔁 State tracking, proven idempotent

Two custom deal properties carry the state: **`stale_alert_level`** (0 = none, 1 = rep pinged, 2 = manager escalated) and **`stale_alert_last_sent`** (datetime).

Each alerted deal gets its level updated in the same run, **in parallel with the Slack post rather than after it**. That is deliberate: the alert-level advance should not depend on Slack succeeding, otherwise a Slack hiccup would fire the same alert again the next morning. Catching a Slack failure is the job of a separate error-monitoring workflow, not of blocking the state update.

**Proven live:** re-running the workflow immediately after a successful alert produces zero output. No repeat pings.

The state as it sits on the deal record: `stale_alert_level` at 1, the timestamp of that alert, the read-only Last Activity Date driven by the backdated note, and an empty `parked_until`.
![](cases/assets/stale-deals/02 - hubspot deal record - alert state and last activity.png)

---

## 🚧 Edge cases - a deal intentionally parked

Custom deal property **`parked_until`** (date). When a rep or manager knows a deal is on hold, they set the date. The automation skips any deal whose `parked_until` is in the future. When the date passes, the deal re-enters the normal check automatically. Optional **`park_reason`** (text) keeps it auditable.

*Why a date and not a checkbox:* a checkbox gets set once and forgotten, so deals hide forever. A date auto-expires, so parking is deliberate and temporary.

<table header-row="true">
<tr>
<td>Property</td>
<td>Type</td>
<td>Purpose</td>
</tr>
<tr>
<td>`parked_until`</td>
<td>Date picker</td>
<td>Deal is skipped while this date is in the future</td>
</tr>
<tr>
<td>`park_reason`</td>
<td>Single-line text</td>
<td>Optional audit trail for why a deal was parked</td>
</tr>
<tr>
<td>`stale_alert_level`</td>
<td>Number</td>
<td>0 = none, 1 = rep pinged, 2 = manager escalated</td>
</tr>
<tr>
<td>`stale_alert_last_sent`</td>
<td>Date/time</td>
<td>Timestamp of the last alert, prevents repeat pings</td>
</tr>
</table>

---

## 📊 Test results (live, not simulated)

Three test deals created directly through the HubSpot API, each with a real backdated Note to set its activity age:

<table header-row="true">
<tr>
<td>Deal</td>
<td>Amount</td>
<td>Days stale</td>
<td>Expected result</td>
<td>Actual result</td>
</tr>
<tr>
<td>TEST - Deal A</td>
<td>$4,000</td>
<td>4 working days</td>
<td>Rep ping, level to 1</td>
<td>✅ Confirmed</td>
</tr>
<tr>
<td>TEST - Deal B</td>
<td>$6,000</td>
<td>6 working days</td>
<td>Manager escalation, level to 2</td>
<td>✅ Confirmed</td>
</tr>
<tr>
<td>TEST - Deal C</td>
<td>$3,000</td>
<td>Parked (`parked_until` next week)</td>
<td>Skipped entirely, level stays 0</td>
<td>✅ Confirmed</td>
</tr>
</table>

**Idempotency test:** re-ran the workflow immediately afterwards. Zero items out of Evaluate Staleness, no Slack messages sent, no repeat pings. The `stale_alert_level` gate works as designed.

**First run.** Three deals fetched, two evaluated as stale, both routed to escalation, one Slack message posted and two deals updated.
![](cases/assets/stale-deals/04a - first run - two deals alerted.png)

**Immediate re-run, no other changes.** The same three deals are fetched, and Evaluate Staleness emits nothing. Every node downstream stays grey: no Slack message, no property write, no repeat ping.
![](cases/assets/stale-deals/04b - immediate re-run - zero items out.png)

---

## ⏱️ Impact

- The Friday ritual (~90 min/week) is **removed entirely: ~90 min/week saved, ~75+ hours/year.**
- More valuable than the time: deals surface **5x sooner**, which recovers revenue that used to leak while a proposal went cold.
- **Recommendation:** the manager spends that recovered time *coaching on the flagged deals* - reviewing why proposals stall, helping reps with the reply - instead of building the report. The robot finds the problem, the manager adds judgement.

---

## 🛠️ Tech stack

- **n8n** - schedule trigger, working-day math, branching and state updates
- **HubSpot CRM** - deals, custom properties, Notes API, owners API, Private App token
- **Slack** - bot app built from a manifest, rep DMs and a manager escalation channel
- **n8n Data Table** - the rep directory mapping HubSpot owner IDs to Slack member IDs

---

## ✅ What works

The obvious way this design backfires is alert fatigue. If it pings reps every morning about the same deal, they start ignoring it and real stale deals slip through anyway. Three things prevent that, built rather than planned:

- **One alert per escalation level**, not per day, with state tracked on the deal itself. Proven with a live re-run.
- **Working days only**, so a Friday proposal is not "stale" on Monday.
- **Reps can park deals**, and the tone is a plain follow-up nudge rather than a public call-out.

Beyond that: rep grouping means one message per person instead of one per deal; escalation reaches the manager channel only when a deal is still cold on day 5; and the alert-level update survives a Slack outage because it does not sit behind it.

> *I've built a very similar Slack escalation system in a previous role (30-minute nudge to the rep, 1-hour escalation to the manager), so this design reflects real work, not just theory.*

---

## 🔧 Known gaps

- **Error-monitoring workflow not built.** An n8n Error Trigger posting failures to an automation-errors channel is the intended companion to the parallel state update. Until it exists, a HubSpot or Slack node failure would pass unnoticed. This should be built before going live.
- **Not yet activated.** The build is validated and tested end to end, but the schedule trigger is off pending final review.
- **The rep directory needs a human.** A rep with no row still gets their deals found and levelled correctly, but no Slack DM is sent. Adding a rep to HubSpot means adding a row here too.
- **Single pipeline stage.** The check covers Proposal Sent only. Other stages that can go cold are not watched.

---

## 🎥 Walkthrough

<video src="https://www.loom.com/share/6c1967ec2fab4c5285401e22f28b2a61"></video>
---

## 📸 Screenshots
