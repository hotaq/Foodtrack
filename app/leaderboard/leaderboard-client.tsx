'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { signOut } from 'next-auth/react';
import { Award, Trophy, Medal, Crown, Search, User } from 'lucide-react';

interface Streak {
  id: string;
  currentStreak: number;
  longestStreak: number;
  user: {
    id: string;
    name: string | null;
    image: string | null;
    createdAt: Date;
    role: string;
  };
}

interface CurrentUserRank {
  rank: number;
  streak: number;
  userId: string;
}

interface LeaderboardClientProps {
  topStreaks: Streak[];
  currentUserRank: CurrentUserRank | null;
  isLoggedIn: boolean;
}

export default function LeaderboardClient({ 
  topStreaks, 
  currentUserRank, 
  isLoggedIn 
}: LeaderboardClientProps) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter streaks based on search term
  const filteredStreaks = topStreaks.filter(streak => 
    streak.user.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get rank icon based on position
  const getRankIcon = (index: number) => {
    switch(index) {
      case 0:
        return <Crown className="text-yellow-500" size={24} />;
      case 1:
        return <Trophy className="text-gray-400" size={24} />;
      case 2:
        return <Medal className="text-amber-700" size={24} />;
      default:
        return <span className="text-gray-400 font-bold w-6 text-center">{index + 1}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-primary py-4">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold vintage-text text-primary">Streak Leaderboard</h1>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="vintage-button bg-primary text-sm py-2 px-4">
                Dashboard
              </Link>
              {isLoggedIn && currentUserRank && (
                <div className="flex items-center bg-card px-4 py-2 rounded-lg vintage-border">
                  <Award className="text-primary mr-2" size={18} />
                  <span className="text-sm">Your Rank: <span className="font-bold">{currentUserRank.rank}</span></span>
                </div>
              )}
              {isLoggedIn && (
                <button
                  onClick={() => {
                    signOut({ redirect: true, callbackUrl: '/' });
                  }}
                  className="vintage-button bg-secondary text-sm py-2 px-4"
                >
                  Sign Out
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="bg-card p-6 rounded-lg vintage-border mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold vintage-text">Top Streakers</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-background border border-input rounded-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-primary/20">
                  <th className="text-left py-2 px-4">Rank</th>
                  <th className="text-left py-2 px-4">User</th>
                  <th className="text-left py-2 px-4">Role</th>
                  <th className="text-right py-2 px-4">Current Streak</th>
                  <th className="text-right py-2 px-4">Longest Streak</th>
                  <th className="text-right py-2 px-4">Member Since</th>
                </tr>
              </thead>
              <tbody>
                {filteredStreaks.map((streak, index) => (
                  <tr 
                    key={streak.id} 
                    className={`border-b border-primary/10 hover:bg-primary/5 ${
                      currentUserRank && streak.user.id === currentUserRank.userId ? 'bg-primary/10' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center">
                        {getRankIcon(index)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-primary/20 mr-3 flex items-center justify-center">
                          {streak.user.image ? (
                            <Image 
                              src={streak.user.image} 
                              alt={streak.user.name || 'User'} 
                              width={32} 
                              height={32} 
                              className="object-cover"
                            />
                          ) : (
                            <User size={16} className="text-primary" />
                          )}
                        </div>
                        <span className="font-medium">{streak.user.name || 'Anonymous'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {streak.user.role === 'ADMIN' ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-primary/20 text-primary">
                          Admin
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-200/10 text-gray-300">
                          User
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-bold text-primary">{streak.currentStreak}</span>
                      <span className="text-xs ml-1">days</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {streak.longestStreak}
                      <span className="text-xs ml-1">days</span>
                    </td>
                    <td className="py-3 px-4 text-right text-sm">
                      {new Date(streak.user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {filteredStreaks.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400">
                      {searchTerm ? 'No users found matching your search' : 'No streak data available yet'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg vintage-border">
          <h2 className="text-xl font-bold vintage-text mb-4">About Streaks</h2>
          <div className="space-y-4 text-sm">
            <p>
              Streaks are calculated based on consecutive days of meal logging. To maintain your streak, 
              you need to log at least one meal every day.
            </p>
            <p>
              The leaderboard shows the top 50 users with the highest current streaks. Keep logging your meals 
              daily to climb the ranks!
            </p>
            <div className="flex items-center space-x-6 mt-6">
              <div className="flex items-center">
                <Crown className="text-yellow-500 mr-2" size={20} />
                <span>1st Place</span>
              </div>
              <div className="flex items-center">
                <Trophy className="text-gray-400 mr-2" size={20} />
                <span>2nd Place</span>
              </div>
              <div className="flex items-center">
                <Medal className="text-amber-700 mr-2" size={20} />
                <span>3rd Place</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 