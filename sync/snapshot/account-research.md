← Back to the map: [burorichnyi.com](https://burorichnyi.com)
# Finds a fact about each prospect, proves it on the live page, and writes the email opening from it

---

## 🏢 Context

**Built for:** an AI outbound sales platform that writes cold emails for its B2B customers
**Users:** sales teams sending first-touch emails at volume
**Input per prospect:** company name, company website, what the sender sells, the problem the sender solves
**Core problem:** the first line of a cold email must be about the prospect, and AI research invents facts

---

## ❌ Problem

<table header-row="true">
<tr>
<td>What went wrong</td>
<td>Why it matters</td>
</tr>
<tr>
<td>AI research returned "facts" that were not on any page</td>
<td>One invented fact in the first line and the prospect stops reading</td>
</tr>
<tr>
<td>Results came back in a loose format</td>
<td>The email step could not use them reliably</td>
</tr>
<tr>
<td>When research failed, nothing said so</td>
<td>Nobody could tell a quiet failure from "nothing found"</td>
</tr>
<tr>
<td>Personalisation repeated the company's own slogan</td>
<td>"You sell X" is not news to the person who sells X</td>
</tr>
</table>
A good salesperson does this by hand: opens the website, finds something recent and real, and opens the email with it. It takes minutes per prospect. The goal was a system that does the same at volume and never makes anything up.

---

## ✅ Solution

A research and writing pipeline with one rule at its centre: **no source, no line.** A fact that cannot be proved word for word on a live page does not exist, and the email falls back to a normal opening.

```
INPUT  company . website . what the sender sells
   |
   v
SEARCH 1  what HAPPENED (hires, releases, events)
SEARCH 2  what IS TRUE (roles, products, certifications)
   |
   v
SORT      candidates against the customer's own list
          of signals, in their order of priority
   |
   v
EXTRACT   the exact sentence from the page
   |
   v
PROVE     code opens the page and compares the
          sentence letter by letter    (no model)
   |
   +--- not on the page --> stop, reason recorded
   |
   v
RULES     19 checks: right type, allowed page,
          not out of date, claim supported
   |
   v
WRITE     the opening, built on the proved fact
   |
   v
LINK      code adds the verified page link
```

---

## ⚙️ How it works

**1. Two searches, not one.** One looks for things that happened and have a date: a new hire, a product release, an event. The other looks for things that are simply true: open roles, products, certifications. They live on different pages, so one question finds only half of them.

**2. The customer's own priorities decide.** Each sales team ranks the signals it wants (for example: job openings first, then new partnerships, then product releases). A model sorts what the searches found against that list, in that order, and writes down why it refused each candidate it did not pick.

**3. Proof by code, not by a model.** The system opens the source page and checks that the quoted sentence is really there, character by character. If it is not, the fact is dropped. No model can argue with this step.

**4. Rules before writing.** A true fact can still be refused: the signal type is one the customer turned down, the page is not an allowed source, or the event is already over. When a claim says more than its sentence proves, the system rewrites it using only that sentence and checks it again, instead of throwing the prospect away.

**5. Writing with guard rails.** The writer gets the fact and a short note on what it may and may not say. It never sees the link. Code places the verified link at the end of the sentence that carries the fact, so an email cannot carry an invented or wrong link. An email that copies the page or praises the prospect is written again.

**6. Nothing fails in silence.** A prospect without an email still leaves a record with one of ten fixed reasons: inputs missing, website does not match the company, nothing recent enough, sentence not on the page, and so on. The reasons come from a fixed list, so they can be counted across runs.

---

## 🔍 Example (invented company)

```
signal_fact     they are hiring a local account executive
signal_quote    "Local Account Executive"
signal_url      https://www.example.com/careers
source          careers page
```

The email opening built from it:

> Northwind Logistics is hiring a local account executive. A new rep needs qualified prospects to contact from the first week. ...

Every word of the fact traces back to the quoted sentence, and the quoted sentence traces back to the live page.

---

## 📊 Results

Measured on a test set of 49 real B2B accounts:

<table header-row="true">
<tr>
<td>Metric</td>
<td>Result</td>
</tr>
<tr>
<td>Accounts that got an email built on a fact checked word for word on the live page</td>
<td>**69% (34 of 49)**</td>
</tr>
<tr>
<td>Facts in an email that were not on the source page</td>
<td>**0**, by design: code checks every quote</td>
</tr>
<tr>
<td>Accounts without an email that left no reason</td>
<td>**0**: each stop is recorded with one of ten reasons</td>
</tr>
<tr>
<td>Emails with a link written by the model</td>
<td>**0**: the link is placed by code</td>
</tr>
</table>
---

## 🧠 What I learned

- **Truth can be a hard gate. Relevance cannot.** Whether a quote is on the page is a yes or no, so code checks it. Whether a fact is worth writing about is a judgement, so the system shows its reasoning to a person instead of blocking.
- **A check must be broken on purpose before it is trusted.** Several checks looked fine and could never fail. Each rule now has a test that makes it fire.
- **Store the whole answer, not a summary.** Keeping every model reply in full answered questions later that the parsed fields could not.

---

## 🛠 Tools

Python · Perplexity Sonar (search) · Gemini (sorting) · JSON schema validation · character-level quote verification
