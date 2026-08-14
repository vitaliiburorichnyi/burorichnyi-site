← Back to the map: [burorichnyi.com](https://burorichnyi.com)
Retrieval-Augmented Answers over a Versioned Knowledge Base, with a Measured Eval Suite
---
## 🏢 Context
**Type:** Self-initiated rebuild of [Case #01](https://app.notion.com/p/37370072ce928073b947e35b25dce33e) — built and published as an open repository<br>**Built:** July 2026, shipped 29.07.2026<br>**Base system:** the existing Gmail P1–P4 support triage from Case #01<br>**Core problem:** the original agent answered from hardcoded prompt rules — it could not be updated without editing the prompt, and it had no way to say "I don't know"
This is not a standalone demo. It replaces the answer step inside a working email-support workflow, which is what makes the escalation logic and the logging matter — a wrong answer would have gone to a real inbox.
---
## ❌ Problem
<table header-row="true">
<tr>
<td>Aspect</td>
<td>Before</td>
<td>Why it breaks</td>
</tr>
<tr>
<td>Answer source</td>
<td>Hardcoded rules inside one large prompt</td>
<td>Policy change means editing and re-testing the prompt</td>
</tr>
<tr>
<td>Coverage awareness</td>
<td>None</td>
<td>Unanswerable questions get a confident guess instead of a handoff</td>
</tr>
<tr>
<td>Traceability</td>
<td>None</td>
<td>No way to tell which source produced an answer</td>
</tr>
<tr>
<td>Quality measurement</td>
<td>Manual spot checks</td>
<td>"It seems fine" is not a baseline you can regress against</td>
</tr>
<tr>
<td>Knowledge updates</td>
<td>Manual prompt edit</td>
<td>Stale information stays live until someone remembers</td>
</tr>
</table>
The failure mode that matters commercially: a support agent that invents a refund policy costs more than one that stays silent. The original system had no mechanism to stay silent.
---
## ✅ Solution
A three-part pipeline — ingestion, retrieval, evaluation — wired into the live email workflow.
```plain text
INGESTION (on every KB doc change)
Drive folder -> extract text -> delete stale chunks by doc_id
            -> heading-aware chunking (2000 chars, 15% overlap)
            -> embed -> Supabase pgvector

RETRIEVAL (per incoming email)
Gmail -> classify P1-P4 -> embed question -> top-5 cosine search
      -> build context + confidence check
      -> Claude answers ONLY from retrieved context
      -> confident? cited answer : escalate to human
      -> log query, chunks, scores, answer  (BEFORE any send)
      -> P1-P4 routing: draft / auto-send / label

EVAL (on demand)
30-question golden set -> full pipeline -> Claude judge
      -> grounded? correct? escalated correctly?
      -> eval_results pass-rate table
```
### Ingestion
A Drive-triggered workflow watches the knowledge base folder. On any new or edited file: download, extract, chunk on markdown headings, embed, **delete that document's old chunks**, insert the new ones. Editing a policy document and saving it fully refreshes the vector store with no manual re-indexing and no orphaned chunks left searchable beside the new version.
### Retrieval
The customer question is embedded and matched against the top 5 chunks by cosine similarity. Claude answers **only** from what came back, citing the source document by name. If any part of the question isn't covered, the whole reply escalates rather than mixing a real answer with a gap.
### Evaluation
30 golden question-answer pairs — 21 answerable, 9 deliberately outside the knowledge base — run through the full pipeline and are judged by Claude against the **actual retrieved context**, not a summary of it, on three separate axes: grounded, correct, and escalated correctly.
---
## ⚙️ Engineering decisions
### 1. Heading-aware chunking, not fixed-size
Policy documents have semantic boundaries. A "Refund timing" section split mid-sentence produces two chunks that are each individually misleading. Chunking on markdown headings at 2000 characters with 15% overlap keeps a policy intact.
### 2. pgvector over a dedicated vector database
The data already lives in Postgres. Plain SQL, HNSW index, self-hostable, no additional vendor. A dedicated vector store starts winning past roughly 10M vectors; this knowledge base is in the low thousands.
### 3. The escalation threshold is measured, not guessed
<table header-row="true">
<tr>
<td>Question type</td>
<td>Cosine distance range</td>
</tr>
<tr>
<td>Answerable</td>
<td>0.36 – 0.67</td>
</tr>
<tr>
<td>Out of knowledge base</td>
<td>0.59 – 0.74</td>
</tr>
</table>
The threshold sits at 0.65. The 0.59–0.67 band overlaps by construction — no single hard threshold separates them perfectly. That is a documented trade-off with the distribution behind it, not a number picked because it looked reasonable.
### 4. Log before you send
Every request — question, retrieved chunk titles and scores, final answer, escalation reason — writes to `retrieval_logs` **before** any Gmail action runs. A failure on the Gmail side can never erase the audit trail of what the system decided.
### 5. Retrieved context is data, never instructions
Both the retrieved chunks and the customer's own email are passed to the model as data. The system prompt is fixed and cannot be overridden by content inside a chunk or inside a customer message.
---
## 📊 Results
<table header-row="true">
<tr>
<td>Measure</td>
<td>Result</td>
<td>What it means</td>
</tr>
<tr>
<td>Answerable questions correct</td>
<td>**20 / 21 — 95%**</td>
<td>Answers match the knowledge base</td>
</tr>
<tr>
<td>Answers grounded in retrieved source</td>
<td>**21 / 21 — 100%**</td>
<td>Nothing invented beyond the retrieved context</td>
</tr>
<tr>
<td>Out-of-KB questions escalated</td>
<td>**9 / 9 — 100%**</td>
<td>The system knows what it does not know</td>
</tr>
<tr>
<td>Knowledge base updates</td>
<td>Edit the doc, save</td>
<td>No prompt editing, no manual re-index</td>
</tr>
<tr>
<td>Auditability</td>
<td>Every retrieval logged</td>
<td>Queryable in Postgres, not a black box</td>
</tr>
</table>
The full per-question table, the two documented edge cases, and the three-iteration methodology story are published in `eval_results.md` in the repository.
**Worth reading in that file:** the eval process found three separate problems — a mislabeled golden question, a real model inference gap, and a bug in the judge design itself. All three are written up rather than quietly fixed. A drop in accuracy while groundedness held at 100% is arithmetically impossible if the judge is sound, and that contradiction is what exposed the judge bug.
---
## 🛠️ Tech Stack
<table header-row="true">
<tr>
<td>Layer</td>
<td>Choice</td>
<td>Why</td>
</tr>
<tr>
<td>Vector database</td>
<td>Supabase — Postgres + pgvector, HNSW, cosine</td>
<td>Data already in Postgres, plain SQL, self-hostable</td>
</tr>
<tr>
<td>Embeddings</td>
<td>OpenAI `text-embedding-3-small`</td>
<td>1536 dimensions, cheap, standard</td>
</tr>
<tr>
<td>Generation and judge</td>
<td>Claude Sonnet 4.6</td>
<td>Already used elsewhere in this support system</td>
</tr>
<tr>
<td>Orchestration</td>
<td>n8n native LangChain nodes</td>
<td>Whole pipeline without a custom backend</td>
</tr>
<tr>
<td>Observability</td>
<td>Supabase `retrieval_logs`, `eval_results`</td>
<td>Every request and eval run is queryable</td>
</tr>
</table>
---
## ✅ What works
- Answers are generated from a versioned knowledge base and cite their source document
- Editing a knowledge base document refreshes the vector store automatically, with stale chunks deleted by `doc_id`
- Questions outside the knowledge base escalate to a human instead of being guessed at
- A mixed email — one covered question, one uncovered — escalates as a whole rather than returning a partial answer beside a gap
- Every retrieval is logged before any outbound action, so the audit trail survives a downstream failure
- The evaluation set can be re-run after any change to see immediately what broke
---
## 🔧 Known limitations, handled honestly
- **Threshold overlap zone.** Answerable questions score 0.36–0.67; out-of-KB questions score 0.59–0.74. The overlapping band is ambiguous by construction and no single threshold separates it cleanly.
- **Guardrails overcorrect.** Tightening the anti-hallucination instruction to close one gap introduced a one-question regression elsewhere. Real systems trade one failure mode for another; the work is measuring the trade, not assuming the fix is free.
- **Silent parameter corruption in Postgres logging.** n8n's comma-separated `queryReplacement` shorthand splits on *any* comma in the resolved string — including commas inside ordinary customer text — silently shifting every parameter after it. Fixed by passing a single array-valued expression. Found through testing with realistic input, not theorised.
---
## 🗺️ What I would do at 10× scale
1. Re-ranking on top of the vector search
2. Hybrid keyword + vector search for exact-match terms like SKUs and order numbers
3. Per-tenant namespaces if this served multiple stores
4. Nightly scheduled eval runs with alerting on pass-rate drift
---
## 📁 GitHub Repository
🔗 [https://github.com/vitaliiburorichnyi/rag-support-agent](https://github.com/vitaliiburorichnyi/rag-support-agent)
Includes `schema.sql`, the three n8n workflow exports, the 10 knowledge base source documents, and the full eval results table.
