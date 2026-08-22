← Back to the map: [burorichnyi.com](https://burorichnyi.com)
> Gmail → Python bot → Excel parsing → KeyCRM API → Telegram. Daily payment reports processed automatically in under 3 seconds. Zero manual steps.
> 

---

## 🏢 Context

**Business:** HUSH - retail e-commerce

**Client situation:** A business owner received daily Excel payment reports from NovaPay (a Ukrainian payment provider) via email. Each report listed orders that needed to be manually marked as paid in KeyCRM. A manager had to open the email, download the file, open the CRM, search each order number, click "mark as paid" one by one, then notify the team in Telegram. 10–15 minutes per day, every day, with no tolerance for errors.

---

## 🔴 Problem

Three manual steps had to happen in sequence every day:

1. **Email monitoring** — someone had to check Gmail and download the attachment
2. **CRM updates** — each order number from the Excel had to be found and marked paid in KeyCRM manually
3. **Team notification** — a Telegram message had to be sent with the results

**Technical blockers:**

- The Excel file had a non-standard internal structure (`xl/SharedStrings.xml` with capital S instead of lowercase), which broke standard Excel parsing libraries
- The column position of order numbers varied between files — hardcoded indexes were unreliable
- KeyCRM's `payment_status` field is read-only via API — the correct approach required going through the payments endpoint, not a simple PATCH on the order

---

## 🟢 Solution

Built a two-service Python automation running locally on macOS, managed by launchd.

**Service 1 — Gmail Bot** polls Gmail every hour via Gmail API (OAuth 2.0). When it detects a new email from `erp-backoffice-mailer@novapay.ua`, it downloads all `.xlsx` attachments, renames each file to just the date extracted from the filename using regex (`від (\d{1,2} \S+ \d{4} р)`), saves to a structured local folder, sends the file to a Telegram group, and labels the email `NovaPay-Processed` so it is never processed twice.

**Service 2 — Folder Watcher** monitors the save folder using the `watchdog` library. The moment a new file lands, it reads order numbers from the Excel using a custom parser (raw ZIP + XML parsing to handle the non-standard SharedStrings path), locates each order in KeyCRM via `GET /api/v1/order/{id}`, marks unpaid payments as paid via `PUT /api/v1/order/{id}/payment/{paymentId}`, skips already-paid and canceled payments, and sends a structured Telegram summary with per-order status.

> ⚡ **Engineering insight:** KeyCRM's Swagger docs list `payment_status` on orders as read-only. Standard PATCH requests silently fail. The correct flow is to fetch existing payments for the order, filter for `not_paid` status (skipping `canceled`), and update each via the payments sub-endpoint. This was discovered by cross-referencing the OpenAPI spec, the official PHP client library source, and live API testing.
> 

---

## ⚙️ Process

1. **Gmail API polling** — OAuth 2.0 auth with token refresh. Query: `from:erp-backoffice-mailer@novapay.ua -label:NovaPay-Processed newer_than:1d`. Runs every hour via launchd `StartInterval`.
2. **Attachment extraction** — walks the MIME tree recursively to handle nested multipart structures. Decodes base64url attachment data and writes to disk.
3. **File renaming** — regex extracts date from Ukrainian filename pattern. Saves as `11 травня 2026 р.xlsx`. Sends file to Telegram via `sendDocument`.
4. **Email labeling** — applies `NovaPay-Processed` Gmail label. Prevents duplicate processing across runs.
5. **Folder watcher** — `watchdog` `FileSystemEventHandler` detects `on_created` events for `.xlsx` files. Fires instantly on file arrival.
6. **Excel parsing** — raw ZIP extraction. Case-insensitive search for `SharedStrings.xml`. Scans all rows to find header containing `Номер замовлення` dynamically. Extracts all order numbers below it regardless of row position.
7. **KeyCRM order lookup** — `GET /api/v1/order/{id}` with Bearer token auth. Handles 404 (not found) and unexpected statuses.
8. **Payment marking** — fetches payments per order. Skips `paid` and `canceled`. Updates remaining `not_paid` entries via `PUT /api/v1/order/{id}/payment/{paymentId}` with `payment_method_id` from `.env`.
9. **Telegram summary** — single message with per-order status: `ok`, `вже оплачено`, or `error: [reason]`. Sent after all orders are processed.

---

## 📊 Results

<table header-row="true">
<tr>
<td>Metric</td>
<td>Before</td>
<td>After</td>
</tr>
<tr>
<td>Manual work per day</td>
<td>10–15 min</td>
<td>0 min</td>
</tr>
<tr>
<td>Time from email to CRM update</td>
<td>15–60 min</td>
<td>< 3 seconds after email arrives</td>
</tr>
<tr>
<td>Steps requiring human action</td>
<td>3</td>
<td>0</td>
</tr>
<tr>
<td>Error rate</td>
<td>Manual (copy-paste errors possible)</td>
<td>0</td>
</tr>
<tr>
<td>Team notification</td>
<td>Manual Telegram message</td>
<td>Automatic with per-order detail</td>
</tr>
<tr>
<td>System availability</td>
<td>Business hours only</td>
<td>24/7 autonomous</td>
</tr>
</table>

---

## 🛠 Tech Stack

- **Python 3** — core automation language
- **Gmail API (OAuth 2.0)** — email polling and attachment download
- **watchdog** — filesystem event monitoring
- **zipfile + xml.etree** — raw Excel parsing (non-standard SharedStrings handling)
- **KeyCRM REST API** — order lookup and payment status update
- **Telegram Bot API** — file delivery and status notifications
- **launchd (macOS)** — process management, auto-restart, runs on login
- **python-dotenv** — secrets management

---

## 🗂 Architecture

```
Gmail (NovaPay email arrives)
  └─ Gmail Bot (every hour)
       ├─ Download .xlsx attachment
       ├─ Rename to date → save to folder
       ├─ Send file to Telegram group
       └─ Label email NovaPay-Processed

Folder Watcher (instant, event-driven)
  └─ New .xlsx detected
       ├─ Parse Excel → extract order numbers
       ├─ For each order:
       │    ├─ GET /order/{id} → KeyCRM
       │    ├─ Find unpaid payments
       │    └─ PUT /payment/{id} → mark paid
       └─ Send Telegram summary with per-order status
```

---

## ⚠️ Edge Cases Handled

<table header-row="true">
<tr>
<td>Situation</td>
<td>Handling</td>
</tr>
<tr>
<td>Email with no attachment</td>
<td>Telegram alert sent, email labeled processed</td>
</tr>
<tr>
<td>Unexpected filename format</td>
<td>Telegram alert, file skipped</td>
</tr>
<tr>
<td>Multiple attachments</td>
<td>All processed independently</td>
</tr>
<tr>
<td>Order not found in KeyCRM</td>
<td>Logged as `error: не знайдено` in summary</td>
</tr>
<tr>
<td>Order already paid</td>
<td>Logged as `вже оплачено`, skipped</td>
</tr>
<tr>
<td>Canceled payment records</td>
<td>Skipped silently</td>
</tr>
<tr>
<td>Emails older than 24 hours</td>
<td>Excluded from query (`newer_than:1d`)</td>
</tr>
</table>