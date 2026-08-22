← Back to the map: [burorichnyi.com](https://burorichnyi.com)
Stripe Checkout to CRM, Welcome Email, Instructor and Ops Log, With Dedup and Explicit Failure Checks

---

Five things happen when a student pays, and one of them fails quietly. The deal gets created, the instructor gets their Slack message, the ops sheet gets its row - everything looks done - but the welcome-list add silently failed, so the student never gets access and nobody finds out until they email support.

That is not a hypothetical. During the build this exact step failed three separate times for three different real reasons, and each time the rest of the run looked healthy. The fix is not a retry: it is refusing to treat "no exception was thrown" as success, and reading the actual response body instead.

This started as a paper design. I built it live in n8n against a real Stripe sandbox, HubSpot portal, Slack workspace and Google Sheet, and every place the real API contradicted the plan is written down below.

---

## 🏢 Context

**Company:** EdTech company - online course provider<br>**Systems:** Stripe, HubSpot, Slack, Google Sheets<br>**Situation:** When a student buys a course through Stripe, five things have to happen: the HubSpot deal is updated, the contact is tagged with the course, the welcome email sequence is triggered, the instructor is notified in Slack, and a row is added to the ops sheet<br>**Process today:** A team member does all five by hand<br>**Core problem:** 10 to 15 minutes per enrollment, with 20+ enrollments on a busy day

---

## ❌ Problem

<table header-row="true">
<tr>
<td>Issue</td>
<td>Detail</td>
</tr>
<tr>
<td>Manual handling</td>
<td>10-15 min per enrollment, every enrollment</td>
</tr>
<tr>
<td>Volume</td>
<td>Up to 20+ enrollments a day, so up to 3-5 hours of copying</td>
</tr>
<tr>
<td>Five systems</td>
<td>Stripe, HubSpot contact, HubSpot deal, Slack, Sheets - all updated by hand</td>
</tr>
<tr>
<td>Error surface</td>
<td>A missed step means a paying student has no course access</td>
</tr>
<tr>
<td>No dedup</td>
<td>A retried or resent payment event would be processed twice</td>
</tr>
</table>

---

## ✅ Solution

```plain text
TRIGGER   Stripe webhook: checkout.session.completed
   |
READ      email, name, price ID -> find the course + instructor
          via the Course Config table; amount, Stripe event ID
   |
CHECK     Has this Stripe event ID been processed before? (dedup)
          -> if yes, stop here, zero output
   |
ACTIONS (in order):
  1. Upsert the HubSpot contact by email (create if missing, update
     if found) - tags course + sets "Enrollment date", returns isNew
  2. If isNew: flag the contact "needs review" + post an ops Slack warning
  3. Create the enrollment deal (stage: Closed Won), associated to the contact
  4. Add the contact to the course's welcome list (this is what triggers
     HubSpot's welcome email sequence on its side)
  5. Slack the instructor: "New enrollment: Jane Doe - Course X, $150"
  6. Append a row to the ops Google Sheet:
     date, student, email, course, amount, Stripe ID, HubSpot ID, status
  7. Log the Stripe event ID (dedup record for next time)
```

**Idempotency:** the processed Stripe event ID goes into a small dedup log. If the same event arrives twice (Stripe retries, or a manual resend), the workflow stops right after the check with zero output. Proven live: resending an already-processed event produces no new contact, deal, Slack message or Sheet row.

The full flow: dedup check, the `isNew` branch, and the welcome-list success/error split.
![](cases/assets/enrollment/01 - n8n canvas - full flow.png)

---

## ⚠️ The step most likely to break silently

**Adding the contact to the welcome list.** The deal gets created, the Slack message fires, the Sheet row appears - everything *looks* done - but if this one step quietly fails (a renamed list, a permissions change, a HubSpot API change), the student gets no welcome email and nobody notices until they email support asking where their course access is.

This isn't theoretical - it's exactly what happened during the real build: this step failed silently-looking (a plain error object) three separate times for three different real reasons (missing write scope, wrong API version for the list type, missing read scope), and each time the rest of the workflow would have looked fine to a casual glance at Slack and the Sheet.

**How to catch it:**

1. **Check the actual response, not just "did it throw."** The workflow reads the HTTP response body from the welcome-list call and checks for `status: "error"` explicitly, rather than trusting that no exception means success. This caught all three real failures above, each with a different error shape.
2. **Route failures to a visible channel.** Any non-success response sends the email, session ID and a pointer to the exact config row to check into an ops Slack channel, not into a suppressed log.
3. **Daily reconciliation (not yet built, planned).** A separate scheduled workflow comparing yesterday's Enrollment Log rows against who is actually on the welcome list, flagging mismatches. That turns a one-off failure into something that cannot go unnoticed for more than a day even if someone misses the Slack alert.

`Welcome List Added?` gates everything downstream. A success continues to the instructor DM, the ops sheet row and the dedup record. Anything else is routed to the automation-errors channel instead of passing silently.
![](cases/assets/enrollment/02 - welcome list check and error split.png)

---

## 🚧 Edge cases - when the Stripe email does not match a HubSpot contact

**Rule: the student paid, so they must never be blocked. Getting them access is non-negotiable; cleaning the data is a follow-up.**

1. **Normalize the email first.** Lowercase and trim before anything touches HubSpot, so a formatting difference alone never causes a false mismatch.
2. **The upsert creates the contact automatically** from the Stripe data (email + name) when no match exists, and HubSpot reports this back as `isNew: true`. Only then does the workflow set a `source_flag` property ("created via enrollment - needs review") and run the rest of the normal flow, so the student still gets their deal, welcome-list add and instructor notification.
3. **Flag it for a human.** Post to the ops Slack channel - *"Enrollment with no matching contact. Created a new contact for jane@x.com, please verify / merge."* - and mark that Google Sheet row **REVIEW**.

*Why:* silently dropping or parking the payment means a paying student gets nothing, which is the worst possible outcome. Creating and flagging keeps the buyer served now and lets ops reconcile duplicates later.

---

## ⚙️ Build notes - what changed once the real APIs hit

**The upsert's `isNew` flag replaced a whole branch.** The plan called for: search HubSpot by email, then branch into two full sets of actions, one for "found" and one for "not found, create and flag". In the real build, HubSpot's contact upsert already does create-if-missing / update-if-found in one call, and its response includes an `isNew` boolean. So the workflow calls upsert once and branches only on `isNew`. Same outcome, half the nodes, no race between a search and a create.

**HubSpot's newer "Segments" lists need a different API.** The welcome list is one of HubSpot's newer Segments (their rebrand of Lists), not a classic static list. The dedicated "add to list" node in n8n calls HubSpot's old v1 list API, which rejected these list IDs outright ("resource not found"). Fixed by calling the current v3 endpoint (`PUT /crm/v3/lists/{id}/memberships/add`) directly, which needs `crm.lists.read` **and** `crm.lists.write` scopes.

**HubSpot date properties want a timestamp, not an ISO string.** `enrollment_date` is a date/time property. The first live attempt sent an ISO 8601 string with a timezone offset and HubSpot rejected it ("not a valid long"). HubSpot date/time properties expect Unix milliseconds. Fixed and confirmed live.

**A blank header row corrupts the Sheets append.** If the sheet's header row is completely empty, the append node can fall back to writing raw upstream JSON instead of the mapped columns. Typing the exact eight header names into row 1 before the first real run fixes it.

---

## 📊 Test results (live)

Three real Stripe sandbox checkouts, run against the live workflow:

<table header-row="true">
<tr>
<td>Case</td>
<td>Trigger</td>
<td>Expected result</td>
<td>Actual result</td>
</tr>
<tr>
<td>Matched contact</td>
<td>Checkout with an existing HubSpot contact's email</td>
<td>Contact tagged, deal created, welcome list added, instructor Slack DM, Sheet row status OK</td>
<td>✅ Confirmed</td>
</tr>
<tr>
<td>Mismatch</td>
<td>Checkout with a brand-new email</td>
<td>New contact auto-created and flagged, ops Slack warning, Sheet row status REVIEW, student still gets deal / list / instructor notification</td>
<td>✅ Confirmed</td>
</tr>
<tr>
<td>Duplicate event</td>
<td>Same event ID resent</td>
<td>Workflow stops at the dedup check with zero output - no new contact, deal, Slack message or Sheet row</td>
<td>✅ Confirmed</td>
</tr>
</table>

The ops log, with both `OK` and `REVIEW` rows. The `cs_test_` session IDs show these are Stripe test-mode checkouts.
![](cases/assets/enrollment/03 - ops sheet OK and REVIEW.png)

Replaying an already-processed Stripe event through the live workflow. One item flows as far as `Check Not Already Processed`, which emits nothing. Every node after it stays grey: no contact, no deal, no Slack message, no sheet row, no duplicate log entry.
![](cases/assets/enrollment/04 - dedup stop - zero items out.png)

---

## ⏱️ Impact

- **10 to 15 minutes of manual work removed per enrollment.** On a 20-enrollment day that is 3 to 5 hours of copying between five systems, gone.
- **Latency drops from "whenever someone gets to it" to seconds**, so the welcome email lands while the purchase is still fresh.
- **Duplicate payments events cannot double-charge the process.** Dedup is built and proven, not planned.
- **Recommendation:** the reclaimed time goes to the REVIEW rows. The automation is deliberately built to hand humans a short, specific list (unmatched payers, failed list adds) instead of a full manual queue.

---

## 🛠️ Tech stack

- **n8n** - Stripe trigger, branching, dedup check, HTTP calls and error routing
- **Stripe** - `checkout.session.completed` webhook, registered in test mode, line items read via the API
- **HubSpot CRM** - contact upsert, custom contact properties, deal creation, v3 Lists (Segments) API
- **Slack** - instructor DM, ops warnings channel, automation-errors channel
- **Google Sheets** - the ops enrollment log, 8 mapped columns
- **n8n Data Tables** - Course Config (price ID to course, instructor, welcome list) and Enrollment Log (dedup)

---

## ✅ What works

- End to end on a real Stripe checkout: contact, deal, welcome list, instructor DM and ops row, with no human step
- Dedup proven live - a resent event produces zero output
- The welcome-list response is checked explicitly, which is what caught three real failures during the build
- A payer with no matching contact still gets full access, and ops gets a specific flagged row instead of a silent gap
- Course and instructor routing lives in a table ops can edit, so a new course is a row, not a code change
- Failures route to a visible Slack channel rather than a log nobody reads

---

## 🗺️ Scope call - v1 in a day vs trustworthy in a week

**v1 in a day** ships what the buyer feels: Stripe trigger, contact, deal, course tag and welcome email, ops row. Mismatch handled by create-plus-flag. Watched manually for a few days.

**A proper week** makes it trustworthy: retries and a dead-letter alert channel, the daily reconciliation monitor, a maintained course config, logging, and the remaining edge cases (refunds, multiple courses in one checkout, currency), plus a short runbook.

What I would knowingly carry as risk in v1: reconciliation, fuzzy second-match, retries. In practice, dedup and the explicit response check turned out to matter enough that I built both into v1 anyway, once I saw how easily the welcome-list step failed without anyone noticing.

---

## 🔧 Known gaps

- **Daily reconciliation not built.** The scheduled cross-check between the enrollment log and actual welcome-list membership is designed but not built. It should exist before this runs against real money.
- **Deal creation, not update.** Every enrollment creates a new deal rather than checking for an existing open one first, so the returning-student case is not handled in this v1.
- **A missing Course Config row is a silent no-op.** Selling a new course without adding its row means the price lookup returns nothing. Worth an explicit alert.
- **Refunds, multi-course checkouts and currency are out of scope** for this version.

---

## 🎥 Walkthrough

<video src="https://www.loom.com/share/47b8f82fd104491db8eaad34ca27021b"></video>
---

## 📸 Screenshots
