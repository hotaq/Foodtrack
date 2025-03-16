# Meal Tracker App

A modern web application for tracking meals with social features, authentication, and food verification.

## Features

- User authentication with email/password, Google, and Facebook
- Password reset functionality
- Meal tracking with image uploads
- Food verification using AI
- Favorites system
- Streaks for consistent meal tracking
- Responsive design

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Prisma ORM
- PostgreSQL
- NextAuth.js
- Tailwind CSS

## Deployment on Vercel

### Prerequisites

1. A [Vercel](https://vercel.com) account
2. A PostgreSQL database (e.g., [Neon](https://neon.tech), [Supabase](https://supabase.com), etc.)
3. OAuth credentials for Google and Facebook (optional)
4. SMTP server for email functionality (password reset)

### Steps to Deploy

1. **Fork or clone this repository to your GitHub account**

2. **Connect your GitHub repository to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New" > "Project"
   - Select your repository
   - Vercel will automatically detect Next.js

3. **Configure environment variables**
   - In the Vercel project settings, add the following environment variables:

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

4. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy your application

5. **Run database migrations**
   - After deployment, you need to run Prisma migrations
   - You can do this by connecting to your Vercel project via CLI:
   ```
   vercel login
   vercel link
   vercel env pull .env
   npx prisma migrate deploy
   ```

### Troubleshooting

- **Database connection issues**: Ensure your database allows connections from Vercel's IP addresses
- **OAuth errors**: Verify that your OAuth redirect URIs include your Vercel deployment URL
- **Email sending failures**: Check SMTP credentials and ensure your email provider allows sending from your deployment

## Local Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and fill in the values
4. Run Prisma migrations: `npx prisma migrate dev`
5. Start the development server: `npm run dev`

## License

MIT
