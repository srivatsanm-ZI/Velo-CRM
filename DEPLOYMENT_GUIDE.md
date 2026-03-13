# 🚀 Velo CRM — Complete Deployment Guide
### For non-developers. Every step is copy-paste. ~45 minutes total.

---

## What you'll end up with
A real web app at a URL like `https://velo-crm-yourname.vercel.app` that:
- Saves contacts and companies permanently to a real database
- Lets you add, edit, delete, search records
- Runs live ZoomInfo enrichment using your connected account
- Works from any browser, any device, any time

---

## PART 1 — Set up your database (Supabase) ~10 min

**Step 1.1 — Create a Supabase account**
1. Go to https://supabase.com
2. Click **Start your project** → sign up with your email (it's free)
3. Once logged in, click **New project**
4. Fill in:
   - **Project name**: `velo-crm`
   - **Database password**: choose a strong password (save it somewhere)
   - **Region**: pick the one closest to you
5. Click **Create new project** — wait about 2 minutes for it to set up

**Step 1.2 — Create your database tables**
1. In your Supabase project, click **SQL Editor** in the left sidebar
2. Click **New query**
3. Open the file `supabase-schema.sql` from this project folder
4. Copy the entire contents and paste it into the SQL editor
5. Click the **Run** button (green play button)
6. You should see "Success. No rows returned" — that means it worked!
7. Click **Table Editor** in the left sidebar — you should see 3 tables: contacts, companies, notes

**Step 1.3 — Get your Supabase keys**
1. In your Supabase project, click **Settings** (gear icon) in the left sidebar
2. Click **API**
3. Find and copy these two values (you'll need them in Part 3):
   - **Project URL** — looks like `https://abcdefgh.supabase.co`
   - **anon public** key — a long string starting with `eyJ...`

---

## PART 2 — Put the code on GitHub ~10 min

**Step 2.1 — Create a GitHub account**
1. Go to https://github.com
2. Click **Sign up** → enter your email, password, username
3. Verify your email

**Step 2.2 — Create a new repository**
1. Once logged in, click the **+** icon (top right) → **New repository**
2. Fill in:
   - **Repository name**: `velo-crm`
   - Select **Private** (keeps your code private)
3. Click **Create repository**
4. GitHub will show you a page with instructions — **leave this tab open**

**Step 2.3 — Install Git on your computer**
- **Mac**: Open Terminal (search "Terminal" in Spotlight). Type `git --version`. If it asks to install, say yes.
- **Windows**: Download from https://git-scm.com/download/win → run the installer → accept all defaults

**Step 2.4 — Upload the code**

Open Terminal (Mac) or Git Bash (Windows — search for "Git Bash" in Start menu).

Copy and paste these commands ONE AT A TIME, pressing Enter after each:

```bash
cd ~/Desktop
```
*(This moves you to your Desktop — you can change this to wherever you want)*

Now move this project folder to your Desktop (or wherever you ran the command above), then:

```bash
cd velo-crm
git init
git add .
git commit -m "Initial CRM setup"
git branch -M main
```

Now go back to the GitHub tab from Step 2.2. Copy the line that says:
`git remote add origin https://github.com/YOUR-USERNAME/velo-crm.git`

Paste it in Terminal and press Enter. Then run:

```bash
git push -u origin main
```

It will ask for your GitHub username and password.
⚠️ For the password, GitHub no longer accepts your regular password. You need a **Personal Access Token**:
1. Go to https://github.com/settings/tokens
2. Click **Generate new token (classic)**
3. Give it a name, check the **repo** checkbox, click **Generate token**
4. Copy the token and use it as your "password" when Git asks

Refresh your GitHub repository page — you should see all the files!

---

## PART 3 — Deploy to Vercel (makes it live on the web) ~10 min

**Step 3.1 — Create a Vercel account**
1. Go to https://vercel.com
2. Click **Sign Up** → choose **Continue with GitHub** → authorize it

**Step 3.2 — Import your project**
1. Once logged in, click **Add New** → **Project**
2. Find `velo-crm` in the list → click **Import**
3. Vercel will detect it's a Next.js project automatically
4. **Don't click Deploy yet** — first you need to add your secret keys

**Step 3.3 — Add your environment variables**
On the import page, scroll down to **Environment Variables**. Add these three variables one at a time:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL from Step 1.3 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key from Step 1.3 |
| `ANTHROPIC_API_KEY` | Your Anthropic API key (get from console.anthropic.com → API Keys) |

For each one: type the name in the **Name** field, paste the value in the **Value** field, click **Add**.

**Step 3.4 — Deploy!**
1. Click the **Deploy** button
2. Wait 2-3 minutes — Vercel will build and deploy your app
3. When it says "Congratulations!" click **Visit** to see your live app 🎉

Your app is now live at a URL like `https://velo-crm-abc123.vercel.app`

**Bookmark that URL** — it's your CRM, available 24/7 from anywhere.

---

## PART 4 — Using your CRM

**Adding contacts**: Click **+ Add Contact**, fill in the form, click Save.

**Adding companies**: Switch to the Companies tab, click **+ Add Company**.

**Enriching with ZoomInfo**: Click the **⚡ Enrich** button next to any record. This calls ZoomInfo in real-time and fills in phone numbers, seniority, department, LinkedIn URL, company details, and more. Takes about 5-10 seconds.

**Bulk Enrich**: Click **⚡ Bulk Enrich** to enrich all unenriched records at once.

**Adding notes/activity**: Click any record to open the detail view. You can log notes, calls, emails, and meetings with timestamps.

**Importing contacts from CSV**: Click **⬆ Import CSV** on the Contacts tab. Your CSV can have columns named: first_name, last_name, email, title, company, phone, city, state, country (flexible matching — it handles variations).

---

## PART 5 — Making updates (when you want to change something)

If you ever want to update the app after making changes to the code:

```bash
cd velo-crm   # (or wherever your folder is)
git add .
git commit -m "Describe what you changed"
git push
```

Vercel will automatically detect the push and redeploy in ~2 minutes. No extra steps!

---

## Troubleshooting

**"Module not found" error on Vercel**: Make sure all 3 environment variables are set correctly in Vercel → Settings → Environment Variables.

**Enrichment returns an error**: Check that your `ANTHROPIC_API_KEY` is correct and that your ZoomInfo MCP connection is active in Claude.ai.

**Database error**: Go back to Supabase → SQL Editor and re-run the schema SQL.

**Can't push to GitHub**: Make sure you're using a Personal Access Token (not your password) — see Step 2.4.

---

## Summary of accounts you'll create

| Service | URL | Cost | What it does |
|---------|-----|------|--------------|
| Supabase | supabase.com | Free | Stores all your CRM data |
| GitHub | github.com | Free | Holds your code |
| Vercel | vercel.com | Free | Runs your app live on the web |
| Anthropic | console.anthropic.com | Pay-per-use | Powers ZoomInfo enrichment |

---

*Built with Next.js, Supabase, and ZoomInfo MCP via Anthropic API*
