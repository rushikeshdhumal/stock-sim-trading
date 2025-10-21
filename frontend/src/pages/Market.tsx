import { useState, useEffect } from 'react';
import marketService from '../services/marketService';
import portfolioService from '../services/portfolioService';
import TradingModal from '../components/TradingModal';
import Navigation from '../components/Navigation';
import type { MarketQuote } from '../types/index.js';
import toast from 'react-hot-toast';

export default function Market() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [trending, setTrending] = useState<MarketQuote[]>([]);
  const [popular, setPopular] = useState<MarketQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [showTradingModal, setShowTradingModal] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [portfolioId, setPortfolioId] = useState('');
  const [cashBalance, setCashBalance] = useState(0);

  useEffect(() => {
    loadMarketData();
    loadPortfolioData();
  }, []);

  const loadMarketData = async () => {
    try {
      const [trendingData, popularData] = await Promise.all([
        marketService.getTrending(),
        marketService.getPopular(),
      ]);
      setTrending(trendingData);
      setPopular(popularData);
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

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const results = await marketService.search(searchQuery);
      setSearchResults(results);
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

  const renderAssetCard = (asset: MarketQuote) => (
    <div
      key={asset.symbol}
      className="card hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => openTradeModal(asset.symbol)}
    >
      <div className="flex justify-between items-start mb-2">
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
                {searchResults.map((result) => (
                  <div
                    key={result.symbol}
                    onClick={() => openTradeModal(result.symbol)}
                    className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer transition-colors"
                  >
                    <div className="flex justify-between items-start">
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
                ))}
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

        {/* Popular on Platform */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Popular on Platform</h2>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card">
                  <div className="skeleton h-6 w-20 mb-2"></div>
                  <div className="skeleton h-8 w-32 mb-4"></div>
                  <div className="skeleton h-4 w-full"></div>
                </div>
              ))}
            </div>
          ) : popular.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {popular.map((asset) => renderAssetCard(asset))}
            </div>
          ) : (
            <div className="card text-center py-12 text-gray-500">
              <p>No popular assets yet. Start trading to see what's popular!</p>
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
      />
    </div>
  );
}
