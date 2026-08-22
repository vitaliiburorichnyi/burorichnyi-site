← Back to the map: [burorichnyi.com](https://burorichnyi.com)
> **Personal AI Automation Project**
Advanced variant — Video Analysis Agent (yt-dlp + ffmpeg + Claude Vision)
> 

---

## 🏢 Context

**Use case:** Content intelligence for an entrepreneur building an AI automation business
**Input:** YouTube subscription feed (avg. 7 videos / 152 min per day)
**Output:** Daily Slack digest at 09:00 with ranked summaries + preference learning loop
**Stack:** Python · Claude API · Slack SDK · YouTube Data API v3

---

## ❌ Problem

<table header-row="true">
<tr>
<td>Metric</td>
<td>Value</td>
<td>Issue</td>
</tr>
<tr>
<td>Daily video content</td>
<td>~152 min/day</td>
<td>Impossible to watch everything</td>
</tr>
<tr>
<td>Relevant videos</td>
<td>~2–3 out of 7</td>
<td>60%+ watched time is wasted</td>
</tr>
<tr>
<td>Processing method</td>
<td>Manual</td>
<td>No filtering, no prioritization</td>
</tr>
<tr>
<td>Trend detection</td>
<td>None</td>
<td>Insights missed or found too late</td>
</tr>
<tr>
<td>Preference learning</td>
<td>None</td>
<td>Same noise every day, no improvement</td>
</tr>
</table>

Creators and founders following 50–200+ YouTube channels have no system to extract signal from noise. Watching is the only option — until now.

---

## ✅ Solution

Built a **3-part AI video intelligence system** that runs fully automated:

```
YouTube Subscriptions → Video Download → Frame Extraction
                                              ↓
                              Claude Haiku (Vision Analysis)
                                              ↓
                              Claude Sonnet (Summary + Scoring)
                                              ↓
                              Slack Digest @ 09:00 daily
                                              ↓
                              👍 / 👎 Reactions → Preference DB
                                              ↓
                              Next Summary improved by feedback
```

### Module 1 — Video Fetcher

Pulls all new videos from subscribed channels published in the last 24h via YouTube Data API. Uses upload playlists instead of search endpoint — **99% more quota-efficient**.

### Module 2 — AI Video Analyzer

Downloads each video with yt-dlp (480p), extracts 1 frame every 30 seconds via ffmpeg, then runs a two-model pipeline: Claude Haiku analyzes frames visually (cheap), Claude Sonnet synthesizes transcript + visuals into a structured summary (quality). No human input required.

### Module 3 — Slack Digest + Feedback Loop

Posts one message per video to Slack at 09:00. User reacts with 👍 or 👎. Reactions are saved to SQLite. Every subsequent summary is generated with full preference history injected — the system gets more accurate over time.

---

## ⚙️ Process

### 1. Prompt Architecture

- Frame analysis prompt for Claude Haiku — visual description of each frame batch
- Summary prompt for Claude Sonnet — synthesizes visuals + transcript + preference context
- Preference injection — liked/disliked video history + channel-level affinity scores fed into every prompt

### 2. API Integrations

- **YouTube Data API v3** — OAuth 2.0 subscription feed + upload playlists
- **yt-dlp** — video download, auto-caption extraction (SRT)
- **ffmpeg** — frame extraction at 1fps / 30s intervals, 768×432px
- **Anthropic Claude Haiku** — per-frame visual analysis (cost-optimized)
- **Anthropic Claude Sonnet** — final summary generation (quality-optimized)
- **Slack SDK** — digest delivery + emoji reaction polling
- **SQLite** — local preference and feedback storage

### 3. System Architecture

<table header-row="true">
<tr>
<td>Module</td>
<td>Trigger</td>
<td>Function</td>
</tr>
<tr>
<td>YouTube Fetcher</td>
<td>Daily 09:00</td>
<td>OAuth auth → channel IDs → last 24h videos</td>
</tr>
<tr>
<td>Video Analyzer</td>
<td>Per video</td>
<td>yt-dlp download → ffmpeg frames → Haiku → Sonnet</td>
</tr>
<tr>
<td>Slack Poster</td>
<td>After analysis</td>
<td>One message per video with summary + link</td>
</tr>
<tr>
<td>Reaction Poller</td>
<td>4h window post-post</td>
<td>Polls 👍/👎 → saves to preferences.db</td>
</tr>
<tr>
<td>Preference Injector</td>
<td>Every run</td>
<td>Builds context string from reaction history → injected into Sonnet prompt</td>
</tr>
</table>

### 4. Two-Model Cost Optimization

<table header-row="true">
<tr>
<td>Task</td>
<td>Model</td>
<td>Why</td>
</tr>
<tr>
<td>Frame-by-frame visual analysis</td>
<td>Claude Haiku</td>
<td>High volume, factual description — speed + cost</td>
</tr>
<tr>
<td>Final summary generation</td>
<td>Claude Sonnet</td>
<td>Reasoning, preference matching, tone — quality</td>
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
<td>Time to process 7 videos</td>
<td>152 min</td>
<td>0 min (automated)</td>
<td>**↓ 100%**</td>
</tr>
<tr>
<td>Relevant content surfaced</td>
<td>Manually</td>
<td>Ranked by preference score</td>
<td>**New**</td>
</tr>
<tr>
<td>Response to new videos</td>
<td>Same day</td>
<td>09:00 daily</td>
<td>**Systematic**</td>
</tr>
<tr>
<td>Preference learning</td>
<td>None</td>
<td>Compounds daily via SQLite</td>
<td>**New**</td>
</tr>
<tr>
<td>Cost per day</td>
<td>—</td>
<td>~$0.20</td>
<td>**Predictable**</td>
</tr>
<tr>
<td>Scalability</td>
<td>7 videos/day cap</td>
<td>50+ videos/same cost</td>
<td>**7x+**</td>
</tr>
</table>

---

## 🛠️ Tech Stack

- **Python 3.9+** — core runtime
- **YouTube Data API v3** — subscription feed, OAuth 2.0
- **yt-dlp** — video download + auto-caption extraction
- **ffmpeg** — frame extraction and resizing
- **Anthropic Claude Haiku** — visual frame analysis
- **Anthropic Claude Sonnet** — summary generation + preference reasoning
- **Slack SDK** — digest posting + reaction polling
- **SQLite** — feedback and preference memory
- **schedule** — local cron-style daily trigger

---

## ✅ What Works

- Full end-to-end automation: YouTube → download → vision analysis → Slack → feedback loop
- Two-model pipeline balances cost vs quality (Haiku for volume, Sonnet for output)
- Preference memory compounds — system improves every day with zero extra setup
- Quota-efficient YouTube fetching (upload playlists vs search = 100x fewer API units)
- Handles missing transcripts gracefully — falls back to vision-only analysis
- Single command to run: `python3 main.py`

---

## 🔧 What Can Be Improved

- **Relevance scoring** — add 0–100 score per video based on preference match, sort digest by score
- **Multi-language** — support non-English caption extraction
- **Thumbnail analysis** — add thumbnail as additional signal before downloading full video
- **Topic clustering** — group similar videos across channels in one digest section
- **Email fallback** — send digest via email if Slack is unavailable
- **Cloud deployment** — move from local machine to always-on server (Railway / Render)

---

## 🗺️ Development Roadmap

1. Add per-video relevance score (0–100) → auto-sort digest by score descending
2. Build skip logic — if score < 20 based on title + thumbnail, skip full download
3. Add weekly meta-summary — “Your top topics this week” sent every Monday
4. Deploy to cloud server → remove dependency on local machine being on at 09:00
5. Add multi-channel support — run separate digests for different topic feeds (e.g. AI news vs marketing)

---

## 💰 Cost Model

<table header-row="true">
<tr>
<td>Volume</td>
<td>Daily Cost</td>
<td>Monthly Cost</td>
</tr>
<tr>
<td>7 videos / 152 min</td>
<td>~$0.20</td>
<td>~$6</td>
</tr>
<tr>
<td>20 videos / 400 min</td>
<td>~$0.50</td>
<td>~$15</td>
</tr>
<tr>
<td>50 videos / 1,000 min</td>
<td>~$1.20</td>
<td>~$36</td>
</tr>
</table>

*Haiku handles frame analysis (~80% of token spend). Sonnet handles summaries (~20%).*

---

- [ ]  Screenshot: Slack digest example
- [ ]  Screenshot: 👍/👎 reaction in Slack
- [ ]  Screenshot: preferences.db after 7 days
- [ ]  Example: Claude Sonnet summary output

---

## 📁 GitHub Repository

🔗 [https://github.com/vitaliiburorichnyi/youtube-digest](https://github.com/vitaliiburorichnyi/youtube-digest)