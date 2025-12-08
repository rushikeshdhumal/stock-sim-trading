import { useState, useEffect } from 'react';
import marketService from '../services/marketService';
import portfolioService from '../services/portfolioService';
import watchlistService from '../services/watchlistService';
import TradingModal from '../components/TradingModal';
import Navigation from '../components/Navigation';
import type { MarketQuote } from '../types/index.js';
import toast from 'react-hot-toast';

export default function Market() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [trending, setTrending] = useState<MarketQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [showTradingModal, setShowTradingModal] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [portfolioId, setPortfolioId] = useState('');
  const [cashBalance, setCashBalance] = useState(0);
  const [watchlistStatus, setWatchlistStatus] = useState<Map<string, boolean>>(new Map());

  useEffect(() => {
    loadMarketData();
    loadPortfolioData();
  }, []);

  const loadMarketData = async () => {
    try {
      const trendingData = await marketService.getTrending();
      setTrending(trendingData);
      // Load watchlist status after market data is loaded
      await loadWatchlistStatus(trendingData, []);
    } catch (error) {
      console.error('Failed to load market data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPortfolioData = async () => {
    try {
      const portfolios = await portfolioService.getPortfolios();
      if (portfolios.length > 0) {
        setPortfolioId(portfolios[0].id);
        setCashBalance(Number(portfolios[0].cashBalance || 0));
      }
    } catch (error) {
      console.error('Failed to load portfolio:', error);
    }
  };

  const loadWatchlistStatus = async (
    trendingData: MarketQuote[] = trending,
    searchData: any[] = searchResults
  ) => {
    try {
      const allSymbols = [
        ...trendingData.map((a) => a.symbol),
        ...searchData.map((r) => r.symbol),
      ];
      const uniqueSymbols = [...new Set(allSymbols)];

      if (uniqueSymbols.length === 0) {
        return;
      }

      // Use batch endpoint for better performance (1 request instead of N)
      const statusObject = await watchlistService.checkBatchWatchlistStatus(uniqueSymbols);

      const statusMap = new Map<string, boolean>();
      Object.entries(statusObject).forEach(([symbol, inWatchlist]) => {
        statusMap.set(symbol, inWatchlist);
      });

      setWatchlistStatus(statusMap);
    } catch (error) {
      console.error('Failed to load watchlist status:', error);
    }
  };

  const toggleWatchlist = async (
    symbol: string,
    assetType: 'STOCK',
    e: React.MouseEvent
  ) => {
    e.stopPropagation(); // Prevent opening trade modal

    const isInWatchlist = watchlistStatus.get(symbol);

    try {
      if (isInWatchlist) {
        await watchlistService.removeFromWatchlistBySymbol(symbol);
        toast.success(`${symbol} removed from watchlist`);
      } else {
        await watchlistService.addToWatchlist(symbol, assetType);
        toast.success(`${symbol} added to watchlist`);
      }

      // Update status
      setWatchlistStatus((prev) => {
        const newMap = new Map(prev);
        newMap.set(symbol, !isInWatchlist);
        return newMap;
      });
    } catch (error: any) {
      if (error.response?.data?.error?.includes('already in watchlist')) {
        toast.error('Already in watchlist');
      } else {
        toast.error(
          error.response?.data?.error || 'Failed to update watchlist'
        );
      }
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const results = await marketService.search(searchQuery);
      setSearchResults(results);
      // Update watchlist status to include search results
      await loadWatchlistStatus(trending, results);
    } catch (error) {
      toast.error('Search failed');
    } finally {
      setSearching(false);
    }
  };

  const openTradeModal = (symbol: string) => {
    setSelectedSymbol(symbol);
    setShowTradingModal(true);
  };

  const handleTradeComplete = () => {
    loadPortfolioData();
  };

  const renderAssetCard = (asset: MarketQuote) => {
    const isInWatchlist = watchlistStatus.get(asset.symbol) || false;

    return (
      <div
        key={asset.symbol}
        className="card hover:shadow-lg transition-shadow cursor-pointer relative"
        onClick={() => openTradeModal(asset.symbol)}
      >
        {/* Watchlist Button */}
        <button
          onClick={(e) => toggleWatchlist(asset.symbol, 'STOCK', e)}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          title={isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
          aria-label={isInWatchlist ? `Remove ${asset.symbol} from watchlist` : `Add ${asset.symbol} to watchlist`}
          aria-pressed={isInWatchlist}
        >
          {isInWatchlist ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-yellow-500"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
          )}
        </button>

        <div className="flex justify-between items-start mb-2 pr-10">
          <div>
            <h3 className="text-xl font-bold">{asset.symbol}</h3>
            <span className="badge badge-info text-xs">{asset.assetType}</span>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">${asset.currentPrice.toFixed(2)}</div>
          </div>
        </div>
        <div className="flex justify-between items-center mt-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">24h Change</span>
          <span
            className={`font-semibold ${
              asset.change24h >= 0 ? 'text-success' : 'text-danger'
            }`}
          >
            {asset.change24h >= 0 ? '+' : ''}
            {asset.change24h.toFixed(2)} ({asset.changePercentage.toFixed(2)}%)
          </span>
        </div>
        {asset.volume && (
          <div className="flex justify-between items-center mt-2 text-sm">
            <span className="text-gray-600 dark:text-gray-400">Volume</span>
            <span>{asset.volume.toLocaleString()}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Search Bar */}
        <div className="card mb-8">
          <h2 className="text-2xl font-bold mb-4">Search Assets</h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="input flex-1"
              placeholder="Search by symbol (e.g., AAPL, BTC, TSLA)..."
            />
            <button
              onClick={handleSearch}
              className="btn btn-primary px-8"
              disabled={searching}
            >
              {searching ? 'Searching...' : 'Search'}
            </button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Search Results</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.map((result) => {
                  const isInWatchlist = watchlistStatus.get(result.symbol) || false;

                  return (
                    <div
                      key={result.symbol}
                      onClick={() => openTradeModal(result.symbol)}
                      className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer transition-colors relative"
                    >
                      {/* Watchlist Button */}
                      <button
                        onClick={(e) => toggleWatchlist(result.symbol, 'STOCK', e)}
                        className="absolute top-2 right-2 p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
                        title={isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
                      >
                        {isInWatchlist ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-yellow-500"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                            />
                          </svg>
                        )}
                      </button>

                      <div className="flex justify-between items-start pr-8">
                        <div>
                          <div className="font-bold text-lg">{result.symbol}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {result.assetType}
                          </div>
                        </div>
                        {result.currentPrice && (
                          <div className="text-right">
                            <div className="font-semibold">
                              ${result.currentPrice.toFixed(2)}
                            </div>
                            {result.change24h !== undefined && (
                              <div
                                className={`text-sm ${
                                  result.change24h >= 0 ? 'text-success' : 'text-danger'
                                }`}
                              >
                                {result.change24h >= 0 ? '+' : ''}
                                {result.change24h.toFixed(2)}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {searchQuery && searchResults.length === 0 && !searching && (
            <div className="mt-6 text-center text-gray-500">
              No results found for "{searchQuery}"
            </div>
          )}
        </div>

        {/* Trending Assets */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Trending Assets</h2>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="card">
                  <div className="skeleton h-6 w-20 mb-2"></div>
                  <div className="skeleton h-8 w-32 mb-4"></div>
                  <div className="skeleton h-4 w-full"></div>
                </div>
              ))}
            </div>
          ) : trending.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trending.map((asset) => renderAssetCard(asset))}
            </div>
          ) : (
            <div className="card text-center py-12 text-gray-500">
              <p>No trending assets available</p>
            </div>
          )}
        </div>
      </main>

      {/* Trading Modal */}
      <TradingModal
        isOpen={showTradingModal}
        onClose={() => setShowTradingModal(false)}
        portfolioId={portfolioId}
        initialSymbol={selectedSymbol}
        initialType="BUY"
        onTradeComplete={handleTradeComplete}
        cashBalance={cashBalance}
        holdings={[]}
        onToggleWatchlist={toggleWatchlist}
        watchlistStatus={watchlistStatus}
      />
    </div>
  );
}
