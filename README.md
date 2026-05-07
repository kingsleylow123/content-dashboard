# Content Analytics Dashboard

Real-time social media analytics for Instagram + YouTube — built with Claude Code.

**Track views, likes, engagement, and top posts. AI-powered recommendations on what to repost, remix, or try from a new angle.**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/kingsleylow123/content-dashboard&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,APIFY_API_TOKEN,IG_USERNAME,YT_CHANNEL_URL,ANTHROPIC_API_KEY,CRON_SECRET&envDescription=API%20keys%20for%20Supabase%2C%20Apify%2C%20and%20Anthropic&envLink=https%3A%2F%2Fgithub.com%2Fkingsleylow123%2Fcontent-dashboard%23environment-variables&project-name=my-content-dashboard&repository-name=my-content-dashboard)

---

## What It Does

| Feature | Detail |
|---------|--------|
| **6 KPI cards** | Views, Reach, Engagement Rate, Followers, Shares, Saves — with sparklines + trend arrows |
| **Charts** | Views & Reach area chart + Engagement Breakdown bar chart |
| **Top Posts grid** | Thumbnails, platform badge, outlier score, sort by any metric |
| **AI Recommendations** | Repost / Remix Hook / New Angle — computed from your real data |
| **AI Analyze** | One click → Claude tells you avg metrics, best time to post, hook patterns |
| **Shorts toggle** | Show/hide YouTube Shorts separately |
| **Auto sync** | Daily cron at 2 AM UTC keeps data fresh |
| **Sync Now** | Manual sync button — followers update immediately |

No official Instagram or YouTube API needed. Uses **Apify** for scraping — free account works.

---

## Deploy in 5 Steps

### Step 1 — Set up Supabase (free)

1. Go to [supabase.com](https://supabase.com) → New project
2. Open **SQL Editor** → **New Query**
3. Paste the contents of [`supabase/schema.sql`](supabase/schema.sql) and click **Run**
4. Go to **Project Settings → API** and copy your Project URL and anon key

### Step 2 — Get an Apify token (free)

1. Sign up at [console.apify.com](https://console.apify.com)
2. Go to **Settings → Integrations** → copy your API token
3. No credit card needed for basic scraping

### Step 3 — Get an Anthropic key (for AI Analyze)

1. Go to [console.anthropic.com](https://console.anthropic.com) → API Keys → Create key
2. Free trial credits included

### Step 4 — Click Deploy

Click the **Deploy with Vercel** button above. Vercel will ask you to fill in these env vars:

| Variable | Where to get it |
|----------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `APIFY_API_TOKEN` | console.apify.com → Settings → Integrations |
| `IG_USERNAME` | Your Instagram handle without @ (e.g. `john.doe`) |
| `YT_CHANNEL_URL` | Your YouTube channel URL (e.g. `https://www.youtube.com/@johndoe`) |
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys |
| `CRON_SECRET` | Any random string (e.g. `my-dashboard-2026`) |

### Step 5 — Hit Sync Now

Open your deployed URL → click **Sync Now** → wait ~90 seconds → your data appears.

---

## Local Development

```bash
git clone https://github.com/kingsleylow123/content-dashboard
cd content-dashboard
npm install

# Copy and fill in your env vars
cp .env.example .env.local

npm run dev
# → http://localhost:3000
```

---

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: Supabase (Postgres)
- **Scraping**: Apify (Instagram + YouTube)
- **AI**: Claude Haiku (Anthropic)
- **Charts**: Recharts
- **UI**: shadcn/ui + Tailwind CSS 4
- **Hosting**: Vercel

---

## Notes

- **Instagram shares/saves**: Not available via public scraping — requires official Instagram Graph API
- **Cron**: Vercel hobby plan = 1 cron/day. Upgrade to Pro for every-6-hours sync
- **Thumbnails**: Proxied server-side to bypass CDN CORS restrictions
- **Followers**: Updates on every manual Sync Now click

---

Built with [Claude Code](https://claude.ai/code) by [@kingsleylow.ai](https://instagram.com/kingsleylow.ai)
