import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import watchlistService, { WatchlistItem } from '../services/watchlistService';
import Navigation from '../components/Navigation';
import { toast } from 'react-hot-toast';

export default function Watchlist() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchWatchlist = async () => {
      if (!mounted) return;

      try {
        const data = await watchlistService.getWatchlist();
        if (mounted) {
          setWatchlist(data);
        }
      } catch (error: any) {
        if (mounted) {
          toast.error(error.response?.data?.error || 'Failed to load watchlist');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchWatchlist();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchWatchlist, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleRemove = async (id: string, symbol: string) => {
    try {
      await watchlistService.removeFromWatchlist(id);
      setWatchlist((prev) => prev.filter((item) => item.id !== id));
      toast.success(`${symbol} removed from watchlist`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to remove from watchlist');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (watchlist.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Your Watchlist</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              You haven't added any symbols to your watchlist yet.
            </p>
            <Link
              to="/market"
              className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Browse Market
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Your Watchlist</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Track your favorite stocks and cryptocurrencies with real-time prices
          </p>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {watchlist.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{item.symbol}</h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  {item.assetType}
                </span>
              </div>
              <button
                onClick={() => handleRemove(item.id, item.symbol)}
                className="text-gray-400 hover:text-red-600 transition-colors duration-200"
                title="Remove from watchlist"
                aria-label={`Remove ${item.symbol} from watchlist`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {item.currentPrice !== undefined ? (
              <div className="space-y-2">
                <div className="flex items-baseline">
                  <span className="text-2xl font-bold text-gray-900">
                    ${item.currentPrice.toFixed(2)}
                  </span>
                </div>
                {item.change24h !== undefined && item.changePercentage !== undefined && (
                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded text-sm font-medium ${
                        item.change24h >= 0
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {item.change24h >= 0 ? '+' : ''}
                      {item.change24h.toFixed(2)}
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        item.changePercentage >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {item.changePercentage >= 0 ? '+' : ''}
                      {item.changePercentage.toFixed(2)}%
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-500">Price data unavailable</div>
            )}

            {item.notes && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">{item.notes}</p>
              </div>
            )}

            <div className="mt-4 text-xs text-gray-500">
              Added {new Date(item.addedAt).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}
