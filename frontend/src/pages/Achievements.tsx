import { useState, useEffect } from 'react';
import achievementService, { AchievementProgress } from '../services/achievementService';
import Navigation from '../components/Navigation';
import toast from 'react-hot-toast';

export default function Achievements() {
  const [progress, setProgress] = useState<AchievementProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    setLoading(true);
    try {
      const data = await achievementService.getProgress();
      setProgress(data);
    } catch (error) {
      toast.error('Failed to load achievements');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckAchievements = async () => {
    setChecking(true);
    try {
      const result = await achievementService.checkAchievements();

      if (result.count > 0) {
        toast.success(result.message);
        await loadProgress(); // Reload to show new achievements
      } else {
        toast('No new achievements earned yet. Keep trading!');
      }
    } catch (error) {
      toast.error('Failed to check achievements');
    } finally {
      setChecking(false);
    }
  };

  const getDefaultIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('first')) return '🎯';
    if (lowerName.includes('week')) return '📈';
    if (lowerName.includes('beat')) return '🏆';
    if (lowerName.includes('diamond')) return '💎';
    if (lowerName.includes('day trader')) return '⚡';
    if (lowerName.includes('diversified')) return '🌐';
    if (lowerName.includes('top')) return '⭐';
    return '🏅';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Achievements</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Unlock badges by completing trading challenges
          </p>
        </div>

        {/* Progress Overview */}
        {progress && (
          <div className="card mb-8 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-lg opacity-90 mb-2">Your Progress</h3>
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl font-bold">{progress.earned}</span>
                  <span className="text-2xl">/ {progress.total}</span>
                  <span className="text-lg opacity-90">achievements</span>
                </div>
              </div>
              <div className="w-full md:w-auto">
                <div className="text-sm opacity-90 mb-2">Completion</div>
                <div className="w-full md:w-48 bg-white bg-opacity-20 rounded-full h-4">
                  <div
                    className="bg-white rounded-full h-4 transition-all duration-500"
                    style={{ width: `${progress.progress}%` }}
                  ></div>
                </div>
                <div className="text-center mt-1 text-sm font-semibold">
                  {progress.progress.toFixed(1)}%
                </div>
              </div>
              <button
                onClick={handleCheckAchievements}
                disabled={checking}
                className="btn bg-white text-purple-600 hover:bg-gray-100 font-semibold px-6"
              >
                {checking ? 'Checking...' : 'Check for New Achievements'}
              </button>
            </div>
          </div>
        )}

        {/* Achievements Grid */}
        <div>
          <h2 className="text-2xl font-bold mb-6">All Achievements</h2>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="card">
                  <div className="skeleton w-16 h-16 rounded-full mb-4"></div>
                  <div className="skeleton h-6 w-32 mb-2"></div>
                  <div className="skeleton h-4 w-full"></div>
                </div>
              ))}
            </div>
          ) : progress && progress.achievements.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {progress.achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`card transition-all duration-300 ${
                    achievement.earned
                      ? 'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-yellow-400 shadow-lg'
                      : 'opacity-60 grayscale hover:grayscale-0 hover:opacity-100'
                  }`}
                >
                  {/* Badge Icon */}
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`text-6xl ${
                        achievement.earned ? 'animate-bounce' : ''
                      }`}
                    >
                      {achievement.badgeIcon || getDefaultIcon(achievement.name)}
                    </div>
                    {achievement.earned && (
                      <div className="badge badge-success text-xs">
                        Earned
                      </div>
                    )}
                  </div>

                  {/* Achievement Info */}
                  <h3 className="text-xl font-bold mb-2">{achievement.name}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                    {achievement.description}
                  </p>

                  {/* Earned Date */}
                  {achievement.earned && achievement.earnedAt && (
                    <div className="mt-4 pt-4 border-t dark:border-gray-600">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Earned on{' '}
                        {new Date(achievement.earnedAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  )}

                  {/* Locked State */}
                  {!achievement.earned && (
                    <div className="mt-4 pt-4 border-t dark:border-gray-600">
                      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                        <span className="text-xs">Locked</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="card text-center py-12 text-gray-500">
              <p className="text-lg mb-2">No achievements available yet</p>
              <p className="text-sm">Check back soon for new challenges!</p>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="mt-8 card bg-blue-50 dark:bg-blue-900/20">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
            How to Earn Achievements
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
            <li>• Complete trades to unlock trading-related achievements</li>
            <li>• Diversify your portfolio by holding multiple assets</li>
            <li>• Achieve consistent returns to earn performance badges</li>
            <li>• Climb the leaderboards to unlock ranking achievements</li>
            <li>• Hold positions for extended periods for patience rewards</li>
            <li>• Achievements are checked automatically after each trade</li>
            <li>• You can also manually check for new achievements anytime</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
