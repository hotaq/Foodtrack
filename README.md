# Meal Tracker

A web application for tracking daily meals with photo submissions. Users can upload photos of their breakfast, lunch, and dinner to maintain a streak of consistent eating habits.

## Features

- **User Authentication**: Register and login system
- **Meal Photo Uploads**: Submit photos for breakfast, lunch, and dinner
- **Streak Tracking**: Track consecutive days of complete meal submissions
- **Admin Dashboard**: View user statistics and leaderboard
- **Responsive Design**: Works on mobile and desktop devices

## Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS 4
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **File Storage**: EdgeStore
- **Styling**: Custom vintage-style black and teal theme

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/meal-tracker.git
cd meal-tracker
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
Create a `.env` file in the root directory with the following variables:
```
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/meal_tracker?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"

# EdgeStore
EDGE_STORE_ACCESS_KEY="your-edgestore-access-key"
EDGE_STORE_SECRET_KEY="your-edgestore-secret-key"
```

4. Set up the database
```bash
npx prisma migrate dev --name init
```

5. Run the development server
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

### Creating an Admin User

To create an admin user or promote an existing user to admin:

1. Run the admin creation script:
```bash
node scripts/create-admin.js
```

2. Follow the prompts to enter admin name, email, and password

3. The script will either create a new admin user or update an existing user with admin privileges

4. Admin users can access the admin dashboard at `/admin` to view user statistics, meal data, and manage the application

## Project Structure

- `/app`: Next.js app directory with pages and API routes
- `/components`: React components
- `/lib`: Utility functions and configurations
- `/prisma`: Database schema and migrations
- `/public`: Static assets
- `/scripts`: Utility scripts for administration

## License

This project is licensed under the MIT License - see the LICENSE file for details.
