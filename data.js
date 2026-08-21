/*
 * data.js: single source of truth for the map.
 *
 * Loaded via a plain <script src> tag rather than fetch('data.json') because a
 * fetch of a local .json file is blocked by the browser when the page is opened
 * from file://, and the build spec requires the page to work from file:// with
 * no server. Same data, same shape, one file, no build step.
 *
 * System `hook`, `result`, `stack`, `notion` and `github` values are verbatim
 * from section 2 of BURORICHNYI_SITE_BUILD_SPEC.md (provenance audit 07.08.2026).
 * Do not re-derive these from other files on disk.
 */

window.PORTFOLIO_DATA = {
  meta: {
    name: "Vitalii Burorichnyi",
    tagline:
      "I build AI systems that remove manual work from support, sales and operations - and I measure whether they did.",
    email: "vitalii.burorichnyi@gmail.com",
    linkedin: "https://www.linkedin.com/in/burorichnyi",
    github: "https://github.com/vitaliiburorichnyi"
  },

  bands: [
    {
      id: "problems",
      label: "Problems",
      descriptor: "what businesses actually come to me with",
      kind: "problem"
    },
    {
      id: "systems",
      label: "Systems",
      descriptor: "what I built",
      kind: "system"
    },
    {
      id: "capabilities",
      label: "Capabilities",
      descriptor: "how it works under the hood",
      kind: "capability"
    }
  ],

  /*
   * The map carries no provenance or context marker. Systems are presented on
   * what they do and what they achieved. The engagement record behind each one
   * is kept privately, outside this repo.
   */

  /*
   * Guided tours. Sequences are fixed by section 5 of the spec. Each step names
   * a node by kind and id, plus one sentence of narration.
   * `kind: "contact"` is the only non-node step: it closes the hiring tour.
   */
  tours: [
    {
      id: "build",
      label: "I need a system built",
      forWhom: "For business owners",
      steps: [
        {
          kind: "problem", id: "support-drowning",
          say: "Start with what it feels like from the inside: mail arriving faster than anyone can answer it."
        },
        {
          kind: "system", id: "email-support",
          say: "That exact problem, solved for a real business, with the handling time measured before and after."
        },
        {
          kind: "problem", id: "leads-cold",
          say: "The same shape on the sales side. Nothing is broken, the replies are just too slow to matter."
        },
        {
          kind: "system", id: "voice-qualifier",
          say: "So the agent calls back inside two minutes, qualifies the lead, and writes a score into the CRM."
        },
        {
          kind: "capability", id: "discovery",
          say: "Every one of these started here, mapping what actually happens today before automating any of it."
        }
      ]
    },
    {
      id: "hiring",
      label: "I'm hiring",
      forWhom: "For recruiters and hiring managers",
      steps: [
        {
          kind: "system", id: "rag",
          say: "Read this one first. The repository is public, and the quality is measured rather than asserted."
        },
        {
          kind: "capability", id: "llm-eval",
          say: "That measurement is the point: a golden set and a judge, so a prompt change becomes a number."
        },
        {
          kind: "system", id: "email-support",
          say: "The same discipline on production work for a real business, where the time saved was the deliverable."
        },
        {
          kind: "capability", id: "human-loop",
          say: "And the judgement that keeps it safe: anything customer-facing waits for a person to approve it."
        },
        {
          kind: "contact",
          say: "That is the short version. The code is on GitHub, the full write-ups are in Notion, and I am reachable below."
        }
      ]
    },
    {
      id: "hard-parts",
      label: "Show me the hard parts",
      forWhom: "For engineers and technical interviewers",
      steps: [
        {
          kind: "capability", id: "rag",
          say: "Retrieval over a versioned knowledge base with citations, instead of facts frozen into a prompt."
        },
        {
          kind: "system", id: "rag",
          say: "The system it runs in, where every retrieval is logged to Postgres before anything reaches a customer."
        },
        {
          kind: "capability", id: "llm-eval",
          say: "Thirty questions, an LLM judge, and a number for correctness, grounding and escalation."
        },
        {
          kind: "capability", id: "structured-output",
          say: "The unglamorous part that makes the rest composable: strict JSON the next step can act on."
        },
        {
          kind: "capability", id: "cost-aware",
          say: "And the economics: a cheap model triages, a strong one only ever sees what survived."
        }
      ]
    }
  ],

  /* Cases whose page has been generated from Notion into cases/<id>.html.
     Everything not listed here still links straight out to Notion, so the
     rollout can go one case at a time. Written by sync/build.js. */
  casePages: ["rag"],

  problems: [
    {
      id: "support-drowning",
      label: "Support drowning",
      blurb:
        "Inbound tickets and emails arrive faster than a small team can read them, so replies slip and the urgent ones get buried."
    },
    {
      id: "leads-cold",
      label: "Leads going cold",
      blurb:
        "A lead that waits hours for a first reply has usually already spoken to someone else."
    },
    {
      id: "calls-unreviewed",
      label: "Calls never reviewed",
      blurb:
        "Calls happen, nobody listens back, and the reason customers leave stays invisible."
    },
    {
      id: "manual-entry",
      label: "Manual data entry",
      blurb:
        "Someone retypes the same numbers between an inbox, a spreadsheet and a CRM every day."
    },
    {
      id: "no-visibility",
      label: "No pipeline visibility",
      blurb:
        "The pipeline is in the CRM, but nobody knows which deals are actually at risk until they are already lost."
    },
    {
      id: "answers-buried",
      label: "Answers buried in documents",
      blurb:
        "The answer exists in a document somewhere. Finding it takes longer than writing it from scratch."
    },
    {
      id: "orders-scattered",
      label: "Orders scattered across channels",
      blurb:
        "Orders arrive by chat, phone and on paper, then someone consolidates them by hand before anything can be sent."
    },
    {
      id: "missed-calls",
      label: "Missed inbound calls",
      blurb:
        "Calls outside working hours, or during a busy hour, ring out and never become a customer."
    },
    {
      id: "compliance-blind",
      label: "Nobody knows what expires",
      blurb:
        "Licences, certifications and renewals live in inboxes and people's heads, so a lapse is found by accident rather than reported."
    },
    {
      id: "too-much-to-read",
      label: "Too much to read",
      blurb:
        "More sources publish more than anyone can keep up with, so the useful few percent never gets read."
    }
  ],

  capabilities: [
    {
      id: "rag",
      label: "RAG & retrieval",
      blurb:
        "Answers retrieved from a versioned knowledge base and cited, instead of baked into a prompt."
    },
    {
      id: "llm-eval",
      label: "LLM evaluation",
      blurb:
        "A golden question set and an LLM judge, so a change to a prompt is measured rather than guessed at."
    },
    {
      id: "human-loop",
      label: "Human-in-the-loop",
      blurb:
        "Anything customer-facing and reversible only once waits for a human approval before it goes out."
    },
    {
      id: "structured-output",
      label: "Structured output",
      blurb:
        "Model responses come back as strict JSON that the next step can act on without parsing prose."
    },
    {
      id: "escalation",
      label: "Escalation & SLA logic",
      blurb:
        "Priority tiers, timers and a defined chain, so nothing sits unanswered past its deadline."
    },
    {
      id: "voice-ai",
      label: "Voice AI",
      blurb:
        "Real phone calls over SIP, with the agent identifying the caller and writing back to the systems of record."
    },
    {
      id: "crm",
      label: "CRM integration",
      blurb:
        "Reading and writing deals, contacts and order state across HubSpot, Zoho and KeyCRM."
    },
    {
      id: "error-handling",
      label: "Error handling & alerting",
      blurb:
        "Retries, dead-letter handling, and an alert to a human the moment a run fails quietly."
    },
    {
      id: "cost-aware",
      label: "Cost-aware model selection",
      blurb:
        "A cheap model triages, a strong model only sees what survived, which is what keeps a daily job at cents."
    },
    {
      id: "discovery",
      label: "Discovery & process mapping",
      blurb:
        "Mapping the current process and its exceptions before automating any of it, because automating the wrong process is worse than leaving it manual."
    },
    {
      id: "derived-state",
      label: "Derived state & scheduled checks",
      blurb:
        "Status calculated from the data rather than typed by a person, and a time-driven job to report it, because a condition-based trigger never fires on the day a date quietly passes."
    },
    {
      id: "idempotency",
      label: "Idempotency & safe retries",
      blurb:
        "Alert state and processed-event ids live on the record itself, so a retry, a resent webhook or a second run repeats nothing it has already done."
    }
  ],

  systems: [
    {
      id: "rag",
      name: "RAG Support Knowledge Agent",
      team: "solo",
      year: 2026,
      problems: ["answers-buried", "support-drowning"],
      capabilities: ["rag", "llm-eval", "human-loop", "structured-output"],
      stack: [
        "n8n",
        "Supabase pgvector",
        "OpenAI embeddings",
        "Claude Sonnet 4.6",
        "Postgres"
      ],
      hook:
        "Rebuilt a support agent from hardcoded prompt rules into retrieval over a versioned knowledge base: grounded, cited, and measured.",
      result:
        "30-question golden set, LLM-judged: 95% correct, 100% grounded, 100% of out-of-scope questions escalated to a human.",
      notion: "https://app.notion.com/p/3b570072ce9281c18933e035a1efb68c",
      github: "https://github.com/vitaliiburorichnyi/rag-support-agent"
    },
    {
      id: "licensure-directory",
      name: "Staff & Licensure Directory",
      team: "solo",
      year: 2026,
      problems: ["compliance-blind", "manual-entry"],
      capabilities: ["derived-state", "discovery"],
      stack: ["Airtable", "Notion"],
      hook:
        "A staff directory built around the question a telemedicine practice actually needs answered: who can legally see a patient in which state, and whose licence is about to lapse.",
      result:
        "A lapsed licence stops being found by chance and becomes reported every morning. Nine consecutive daily runs, every status branch exercised including the no-expiry case.",
      notion: "https://app.notion.com/p/3c370072ce9281f48c81d83c202b565a",
      github: null
    },
    {
      id: "email-support",
      name: "AI Email Support System",
      team: "solo",
      problems: ["support-drowning"],
      capabilities: ["structured-output", "escalation", "human-loop"],
      stack: ["n8n", "GPT-4o-mini", "Gmail API", "Google Sheets", "Telegram"],
      hook:
        "Classifies every incoming email P1-P4, auto-replies to routine ones, and fires an instant alert on legal or fraud threats.",
      result:
        "Support handling cut from 2-4 hrs/day to ~20 min/day (85%). P1 alerts instant. P3 replies in 30 seconds.",
      notion: "https://app.notion.com/p/37370072ce928073b947e35b25dce33e",
      github: "https://github.com/vitaliiburorichnyi/hush-email-automation"
    },
    {
      id: "voice-qualifier",
      name: "AI Voice Sales Qualifier",
      team: "solo",
      problems: ["leads-cold"],
      capabilities: ["voice-ai", "crm", "structured-output"],
      stack: ["Happ.tools", "SIP", "n8n", "Claude", "Zoho CRM", "Telegram"],
      hook:
        "An outbound voice agent that calls every new lead within 2 minutes, runs BANT qualification, and scores them 0-100 into the CRM.",
      result:
        "Response time hours to under 2 min (98%). Qualification 20 min to 2 min per lead (90%). Capacity up ~10x, same headcount.",
      notion: "https://app.notion.com/p/36b70072ce9280a28066d6d9c767d640",
      github:
        "https://github.com/vitaliiburorichnyi/growthlab-ai-sales-ecosystem"
    },
    {
      id: "call-qa",
      name: "Call QA & Retention Automation",
      team: "solo",
      problems: ["calls-unreviewed"],
      capabilities: ["human-loop", "structured-output", "escalation"],
      stack: [
        "n8n",
        "Whisper",
        "GPT-5 mini",
        "Google Drive",
        "Slack",
        "Telegram"
      ],
      hook:
        "Transcribes every support call, scores it across 8 criteria, and drafts a retention email for any call below threshold - sent only on manager approval.",
      result:
        "Call QA coverage 0% to 100%. Zero calls missed. No unsupervised outbound.",
      notion: "https://app.notion.com/p/37570072ce92809890bafcb6657f2565",
      github: "https://github.com/vitaliiburorichnyi/customer-signal-ai"
    },
    {
      id: "payment-report",
      name: "Payment Report Automation",
      team: "solo",
      problems: ["manual-entry"],
      capabilities: ["error-handling", "crm"],
      stack: [
        "Python",
        "Gmail API",
        "KeyCRM REST API",
        "Telegram Bot API",
        "watchdog"
      ],
      hook:
        "A Python service that parses daily payment reports, matches each order, and marks it paid in the CRM automatically.",
      result:
        "Manual work 10-15 min/day to zero. Time from payment email to CRM update: 15-60 min to under 3 seconds.",
      notion: "https://app.notion.com/p/36470072ce9280609377ef0bccb92281",
      github: null
    },
    {
      id: "ticket-router",
      name: "Support Ticket Router with SLA Control",
      team: "solo",
      problems: ["support-drowning"],
      capabilities: ["escalation", "structured-output"],
      stack: ["n8n", "GPT-4o-mini", "Gmail", "Google Sheets", "Slack"],
      hook:
        "Classifies every ticket in ~8 seconds and enforces a 3-level SLA escalation chain so nothing slips.",
      result:
        "Triage time cut 85%. Classification 15 min to 8 seconds. Same logic scales to 500+ tickets/day.",
      notion: "https://app.notion.com/p/37a70072ce9280e3bc23c7cb463bfdcf",
      github: null
    },
    {
      id: "voice-retail",
      name: "Voice AI Agent for Retail",
      team: "solo",
      problems: ["missed-calls"],
      capabilities: ["voice-ai", "human-loop"],
      stack: ["Happ.tools", "n8n", "SIP / Zadarma", "Google Sheets", "ngrok"],
      hook:
        "A voice agent that answers every inbound call instantly, identifies the caller, and updates delivery addresses in real time.",
      result:
        "70% of calls resolved with no human. 24/7 coverage. Every call logged.",
      notion: "https://app.notion.com/p/36770072ce9280218033d3d5655d205e",
      github:
        "https://github.com/vitaliiburorichnyi/Voice-AI-Agent-for-Retail-Boutique"
    },
    {
      id: "smartorder",
      name: "SmartOrder - Order Automation for HoReCa",
      team: "team of 3",
      role: "Automation Engineer",
      problems: ["orders-scattered"],
      capabilities: ["structured-output", "human-loop"],
      stack: ["n8n", "Claude Haiku", "Supabase", "Telegram Bot API", "Vercel"],
      hook:
        "Staff type orders in plain language; AI parses, matches suppliers, flags duplicates, and a manager dispatches to all four suppliers in one tap.",
      result:
        "Order consolidation 10-20 min/day to instant. Duplicate detection at intake. Full audit trail.",
      notion: "https://app.notion.com/p/38170072ce928027b363c5c97de6659b",
      github: "https://github.com/vitaliiburorichnyi/smart-order-management"
    },
    {
      id: "pipeline-intel",
      name: "Sales Pipeline Intelligence System",
      team: "solo",
      problems: ["no-visibility"],
      capabilities: ["crm", "structured-output"],
      stack: ["n8n", "HubSpot", "GPT-5 mini", "Google Sheets", "Telegram"],
      hook:
        "Scores deal health weekly, flags at-risk pipeline automatically, and delivers a Friday forecast with no spreadsheet work.",
      result:
        "Manual weekly CRM review eliminated. At-risk deals flagged automatically.",
      notion: "https://app.notion.com/p/36870072ce928022b845c7f4b5e97afe",
      github: null
    },
    {
      id: "stale-deals",
      name: "Stale Deal Alerts with Escalation",
      team: "solo",
      problems: ["no-visibility"],
      capabilities: ["escalation", "crm", "idempotency"],
      stack: ["n8n", "HubSpot", "Slack", "n8n Data Table"],
      hook:
        "Checks every open proposal daily, nudges the owning rep in Slack after three quiet working days, and escalates to the manager on day five.",
      result:
        "~90 min/week of manual review removed (~75+ hrs/year). Cooling deals surfaced 5x sooner. An immediate re-run produces zero repeat pings.",
      notion: "https://app.notion.com/p/3bc70072ce92811b9c8ee6068bd3ee80",
      github: null
    },
    {
      id: "enrollment",
      name: "Enrollment Automation with Idempotency",
      team: "solo",
      problems: ["manual-entry"],
      capabilities: ["crm", "error-handling", "idempotency"],
      stack: ["n8n", "Stripe", "HubSpot", "Slack", "Google Sheets"],
      hook:
        "One Stripe checkout drives the contact, deal, welcome list, instructor DM and ops log in a single run, behind a dedup check that runs before any write.",
      result:
        "10-15 min of manual work removed per enrollment. A resent event produces zero output. Reading the response body caught three silent failures during the build.",
      notion: "https://app.notion.com/p/3bc70072ce9281f9a3cff87234576969",
      github: null
    },
    {
      id: "lead-funnel",
      name: "Lead Qualification & Auto-Funnel",
      team: "solo",
      problems: ["leads-cold", "manual-entry"],
      capabilities: ["crm", "structured-output"],
      stack: [
        "n8n",
        "Wix Velo",
        "Zoho CRM",
        "Klaviyo",
        "OpenRouter",
        "Telegram"
      ],
      hook:
        "Every website lead is scored hot/warm/cold and routed into the CRM and the right email sequence simultaneously.",
      result:
        "15-20 min of manual work per lead to under 10 seconds. Four systems updated at once.",
      notion: "https://app.notion.com/p/34670072ce92807c931df1beeca4ac19",
      github: null
    },
    {
      id: "youtube-digest",
      name: "YouTube Video Intelligence Digest",
      team: "solo",
      problems: ["too-much-to-read"],
      capabilities: ["cost-aware", "structured-output"],
      stack: [
        "Python",
        "Claude Haiku",
        "Claude Sonnet",
        "YouTube Data API",
        "Slack SDK",
        "SQLite"
      ],
      hook:
        "Watches 50+ channels, triages with a cheap model, summarises the survivors with a strong one, and delivers a daily Slack digest.",
      result: "Hours of manual watching replaced by a digest. ~$0.20/day to run.",
      notion: "https://app.notion.com/p/36e70072ce92801ebcaec17716364b0c",
      github: null
    }
  ]
};
