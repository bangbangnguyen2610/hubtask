# Deploy to Cloudflare Pages

## Option 1: Deploy via Cloudflare Dashboard (Recommended)

### Step 1: Push to GitHub
```bash
cd task-dashboard
git init
git add .
git commit -m "Initial commit: Task Dashboard"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/task-dashboard.git
git push -u origin main
```

### Step 2: Connect to Cloudflare Pages
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select **Pages** from the sidebar
3. Click **Create a project** > **Connect to Git**
4. Select your GitHub repository
5. Configure build settings:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Root directory:** `/` (leave empty)
6. Click **Save and Deploy**

---

## Option 2: Deploy via Wrangler CLI

### Step 1: Install Wrangler
```bash
npm install -g wrangler
```

### Step 2: Login to Cloudflare
```bash
wrangler login
```

### Step 3: Deploy
```bash
cd task-dashboard
npm run build
wrangler pages deploy dist --project-name=task-dashboard
```

---

## Environment Variables (Optional)

If you want to use server-side API calls, add these in Cloudflare Pages settings:

| Variable | Description |
|----------|-------------|
| `LARK_APP_ID` | Lark App ID |
| `LARK_APP_SECRET` | Lark App Secret |
| `CF_API_TOKEN` | Cloudflare API Token |
| `CF_ACCOUNT_ID` | Cloudflare Account ID |

---

## Custom Domain

1. In Cloudflare Pages project settings
2. Go to **Custom domains**
3. Add your domain (must be on Cloudflare DNS)

---

## Useful Commands

```bash
# Development
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview
```
