# ApplyFlow

ApplyFlow is a full-stack internship application tracker. Users create an
account or enter as a guest, save opportunities, search and filter their
pipeline, record next steps, and move applications through Saved, Applied,
Interview and Offer.

**Live demo:** [applyflow-ak-dac3.vercel.app](https://applyflow-ak-dac3.vercel.app)

## Highlights

- Email/password authentication with Supabase Auth
- One-click, browser-isolated guest demo with realistic sample applications
- Private per-user records enforced by PostgreSQL Row Level Security
- Create, read, update and delete operations
- Search, stage filters, weekly goals and response-rate metrics
- Responsive, keyboard-friendly Next.js interface
- Automatic Vercel deployments from GitHub

## Tech stack

- Next.js 16, React 19 and JavaScript
- Supabase Auth and PostgreSQL
- Supabase Row Level Security policies
- Vercel

## Run locally

Requirements: Node.js 22 or newer and a Supabase project.

1. Install dependencies:

   ```bash
   npm install
   ```

2. In your Supabase dashboard, open **SQL Editor**, create a new query, paste
   [`supabase/schema.sql`](supabase/schema.sql), and run it once.

3. Copy the environment template:

   ```bash
   cp .env.example .env.local
   ```

4. From Supabase **Project Settings → API**, add the project URL and publishable
   key to `.env.local`:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key
   ```

   Do not use or commit the `service_role` key. ApplyFlow does not need it.

5. Start the app:

   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000).

## Publish on GitHub

Create an empty repository named `applyflow`, then run:

```bash
git init
git branch -M main
git add .
git commit -m "Build public ApplyFlow application tracker"
git remote add origin https://github.com/YOUR_USERNAME/applyflow.git
git push -u origin main
```

If the empty GitHub repository shows different commands, use its repository URL
in the `git remote add` command above.

## Deploy on Vercel

1. In Vercel, choose **Add New → Project** and import the GitHub repository.
2. Keep the detected framework as **Next.js**.
3. Add both variables from `.env.local` under **Environment Variables**.
4. Deploy.
5. In Supabase **Authentication → URL Configuration**, set the Site URL to the
   Vercel production URL and add that URL to Redirect URLs.

Future pushes to `main` will automatically create production deployments.

## Security model

The browser uses a Supabase publishable key, which is safe to expose. Access is
restricted by database policies in `supabase/schema.sql`: signed-in users can
only select, insert, update or delete rows whose `user_id` matches their unique
Supabase Auth ID. The unauthenticated database role has no table access. Guest
demo records stay in the visitor's browser storage and are never sent to the
database.

## Useful commands

```bash
npm run dev
npm run lint
npm run build
```
