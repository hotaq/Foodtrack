# Deploying to Vercel

This guide will help you deploy your Meal Tracker app to Vercel.

## Prerequisites

1. A [Vercel](https://vercel.com) account
2. A PostgreSQL database (e.g., [Neon](https://neon.tech), [Supabase](https://supabase.com), etc.)
3. OAuth credentials for Google and Facebook (optional)
4. SMTP server for email functionality (password reset)

## Option 1: Automatic Deployment (Recommended)

We've created a helper script to make deployment easier:

```bash
npm run deploy
```

This script will:
1. Check if Vercel CLI is installed and install it if needed
2. Log you in to Vercel if needed
3. Guide you through setting up a new project or linking to an existing one
4. Pull environment variables
5. Deploy your app
6. Run database migrations

## Option 2: Manual Deployment

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Login to Vercel

```bash
vercel login
```

### 3. Deploy to Vercel

```bash
vercel
```

Follow the prompts to configure your project.

### 4. Set Environment Variables

In the Vercel dashboard, go to your project settings and add the following environment variables:

```
DATABASE_URL=your-postgresql-connection-string
NEXTAUTH_SECRET=your-random-secret-key

# OAuth (optional, but required for social login)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_CLIENT_ID=your-facebook-client-id
FACEBOOK_CLIENT_SECRET=your-facebook-client-secret

# Email (required for password reset)
SMTP_HOST=your-smtp-host
SMTP_PORT=your-smtp-port
SMTP_USER=your-smtp-username
SMTP_PASSWORD=your-smtp-password
EMAIL_FROM=your-email-address
```

### 5. Run Database Migrations

```bash
vercel env pull .env
npx prisma migrate deploy
```

## Option 3: GitHub Integration

1. Push your code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "Add New" > "Project"
4. Select your repository
5. Configure project settings
6. Add environment variables
7. Deploy

## Troubleshooting

### Database Connection Issues

- Ensure your database allows connections from Vercel's IP addresses
- Check that your DATABASE_URL is correct
- For Neon or other serverless databases, make sure you're using the correct connection string format

### OAuth Errors

- Verify that your OAuth redirect URIs include your Vercel deployment URL
- Add `https://your-vercel-domain.vercel.app/api/auth/callback/google` and `https://your-vercel-domain.vercel.app/api/auth/callback/facebook` to your OAuth provider's allowed redirect URIs

### Email Sending Failures

- Check SMTP credentials
- Ensure your email provider allows sending from your deployment
- Try using a service like SendGrid, Mailgun, or Resend for more reliable email delivery

## Updating Your Deployment

To update your deployment after making changes:

```bash
vercel --prod
```

Or use our helper script:

```bash
npm run deploy
``` 