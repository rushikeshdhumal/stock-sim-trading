import { useState, useEffect } from 'react';
import { useAuthStore } from '../context/authStore';
import leaderboardService from '../services/leaderboardService';
import type { LeaderboardEntry, UserPosition } from '../services/leaderboardService';
import Navigation from '../components/Navigation';
import toast from 'react-hot-toast';

type Period = 'daily' | 'weekly' | 'monthly' | 'all_time';

export default function Leaderboard() {
  const { user } = useAuthStore();
  const [period, setPeriod] = useState<Period>('all_time');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userPosition, setUserPosition] = useState<UserPosition | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboardData();
  }, [period]);

  const loadLeaderboardData = async () => {
    setLoading(true);
    try {
      const [leaderboardData, positionData] = await Promise.all([
        leaderboardService.getLeaderboard(period, 100),
        leaderboardService.getUserPosition(period).catch(() => null),
      ]);

      setLeaderboard(leaderboardData);
      setUserPosition(positionData);
    } catch (error) {
      toast.error('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getPeriodLabel = (p: Period) => {
    const labels = {
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      all_time: 'All Time',
    };
    return labels[p];
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Leaderboards</h1>
          <p className="text-gray-600 dark:text-gray-400">
            See how you rank against other traders
          </p>
        </div>

        {/* User Position Card */}
        {userPosition && userPosition.ranked && (
          <div className="card mb-8 bg-gradient-to-r from-primary-500 to-primary-600 text-white">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-lg opacity-90 mb-1">Your Rank - {getPeriodLabel(period)}</h3>
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl font-bold">{getRankBadge(userPosition.rank)}</span>
                  <span className="text-2xl">
                    out of {userPosition.totalParticipants} traders
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm opacity-90 mb-1">Return</div>
                <div className="text-3xl font-bold">
                  {userPosition.returnPercentage >= 0 ? '+' : ''}
                  {userPosition.returnPercentage.toFixed(2)}%
                </div>
                <div className="text-sm opacity-90 mt-1">
                  Top {userPosition.percentile.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Period Selector */}
        <div className="card mb-8">
          <div className="flex flex-wrap gap-3">
            {(['daily', 'weekly', 'monthly', 'all_time'] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  period === p
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {getPeriodLabel(p)}
              </button>
            ))}
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="card">
          <h2 className="text-2xl font-bold mb-6">{getPeriodLabel(period)} Rankings</h2>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="skeleton w-12 h-12 rounded-full"></div>
                  <div className="flex-1">
                    <div className="skeleton h-4 w-32 mb-2"></div>
                    <div className="skeleton h-3 w-24"></div>
                  </div>
                  <div className="skeleton h-6 w-20"></div>
                </div>
              ))}
            </div>
          ) : leaderboard.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b dark:border-gray-700">
                    <th className="text-left py-4 px-4">Rank</th>
                    <th className="text-left py-4 px-4">Trader</th>
                    <th className="text-left py-4 px-4 hidden md:table-cell">Portfolio</th>
                    <th className="text-right py-4 px-4">Total Value</th>
                    <th className="text-right py-4 px-4">Return</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry) => {
                    const isCurrentUser = entry.username === user?.username;
                    return (
                      <tr
                        key={entry.id}
                        className={`border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                          isCurrentUser ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                        }`}
                      >
                        <td className="py-4 px-4">
                          <span className="text-2xl font-bold">{getRankBadge(entry.rank)}</span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold">
                              {entry.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold">
                                {entry.username}
                                {isCurrentUser && (
                                  <span className="ml-2 text-xs bg-primary-600 text-white px-2 py-1 rounded">
                                    You
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-600 dark:text-gray-400 hidden md:table-cell">
                          {entry.portfolioName}
                        </td>
                        <td className="py-4 px-4 text-right font-semibold">
                          ${entry.totalValue.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span
                            className={`font-bold text-lg ${
                              entry.returnPercentage >= 0 ? 'text-success' : 'text-danger'
                            }`}
                          >
                            {entry.returnPercentage >= 0 ? '+' : ''}
                            {entry.returnPercentage.toFixed(2)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg mb-2">No rankings available yet</p>
              <p className="text-sm">Start trading to appear on the leaderboard!</p>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="mt-8 card bg-blue-50 dark:bg-blue-900/20">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            How Rankings Work
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• Rankings are based on portfolio return percentage</li>
            <li>• Daily rankings reset each day at midnight</li>
            <li>• Weekly rankings cover the last 7 days</li>
            <li>• Monthly rankings cover the last 30 days</li>
            <li>• All-time rankings show lifetime performance</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
