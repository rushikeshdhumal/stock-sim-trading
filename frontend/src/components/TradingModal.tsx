import { useState, useEffect } from 'react';
import type { MarketQuote } from '../types/index.js';
import marketService from '../services/marketService';
import tradeService from '../services/tradeService';
import toast from 'react-hot-toast';

interface TradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  portfolioId: string;
  initialSymbol?: string;
  initialType?: 'BUY' | 'SELL';
  onTradeComplete: () => void;
  cashBalance: number;
  holdings?: Array<{ symbol: string; quantity: number }>;
  onToggleWatchlist?: (symbol: string, assetType: 'STOCK', e: React.MouseEvent) => void;
  watchlistStatus?: Map<string, boolean>;
}

export default function TradingModal({
  isOpen,
  onClose,
  portfolioId,
  initialSymbol = '',
  initialType = 'BUY',
  onTradeComplete,
  cashBalance,
  holdings = [],
  onToggleWatchlist,
  watchlistStatus,
}: TradingModalProps) {
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>(initialType);
  const [symbol, setSymbol] = useState(initialSymbol);
  const [quantity, setQuantity] = useState('');
  const [quote, setQuote] = useState<MarketQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen && initialSymbol) {
      setSymbol(initialSymbol);
      loadQuote(initialSymbol);
    }
  }, [initialSymbol, isOpen]);

  const loadQuote = async (sym: string) => {
    if (!sym) return;

    setSearching(true);
    try {
      const data = await marketService.getQuote(sym.toUpperCase());
      setQuote(data);
      setSearchResults([]);
    } catch (error) {
      toast.error('Failed to load quote');
    } finally {
      setSearching(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSymbol(query);
    if (query.length < 1) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const results = await marketService.search(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectSymbol = (selectedSymbol: string) => {
    setSymbol(selectedSymbol);
    loadQuote(selectedSymbol);
  };

  const handleTrade = async () => {
    if (!symbol || !quantity || !quote) {
      toast.error('Please fill in all fields');
      return;
    }

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    // Validation
    const totalValue = quote.currentPrice * qty;

    if (tradeType === 'BUY') {
      const cash = Number(cashBalance || 0);
      if (totalValue > cash) {
        toast.error(`Insufficient funds. You need $${totalValue.toFixed(2)} but only have $${cash.toFixed(2)}`);
        return;
      }
    } else {
      const holding = holdings.find(h => h.symbol === symbol);
      if (!holding || holding.quantity < qty) {
        toast.error(`Insufficient holdings. You have ${holding?.quantity || 0} but trying to sell ${qty}`);
        return;
      }
    }

    setLoading(true);
    try {
      const tradeData = {
        portfolioId,
        symbol: symbol.toUpperCase(),
        assetType: 'STOCK' as const,
        tradeType: tradeType,
        quantity: qty,
      };

      if (tradeType === 'BUY') {
        await tradeService.executeBuy(tradeData);
        toast.success(`Successfully bought ${qty} ${symbol}`);
      } else {
        await tradeService.executeSell(tradeData);
        toast.success(`Successfully sold ${qty} ${symbol}`);
      }

      onTradeComplete();
      onClose();
      resetForm();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Trade failed');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSymbol('');
    setQuantity('');
    setQuote(null);
    setSearchResults([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const totalValue = quote && quantity ? quote.currentPrice * parseFloat(quantity) : 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
          <h2 className="text-2xl font-bold">Trade Assets</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Trade Type Toggle */}
        <div className="p-6 border-b dark:border-gray-700">
          <div className="flex gap-2">
            <button
              onClick={() => setTradeType('BUY')}
              className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                tradeType === 'BUY'
                  ? 'bg-success text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              BUY
            </button>
            <button
              onClick={() => setTradeType('SELL')}
              className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                tradeType === 'SELL'
                  ? 'bg-danger text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              SELL
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* Symbol Search */}
          <div>
            <label className="block text-sm font-medium mb-2">Symbol</label>
            {quote ? (
              <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <div>
                  <div className="text-2xl font-bold">{symbol}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{quote.assetType}</div>
                </div>
                <button
                  onClick={() => {
                    setQuote(null);
                    setSymbol('');
                    setQuantity('');
                  }}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  value={symbol}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="input uppercase"
                  placeholder="Enter symbol (e.g., AAPL, BTC)"
                  disabled={loading}
                />
                {searching && (
                  <div className="absolute right-3 top-3">
                    <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            )}

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-2 bg-white dark:bg-gray-700 border dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {searchResults.map((result, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectSymbol(result.symbol)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-600 flex justify-between items-center"
                  >
                    <div>
                      <div className="font-semibold">{result.symbol}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {result.assetType}
                      </div>
                    </div>
                    {result.currentPrice && (
                      <div className="text-right">
                        <div className="font-semibold">${result.currentPrice.toFixed(2)}</div>
                        {result.change24h && (
                          <div className={`text-sm ${result.change24h >= 0 ? 'text-success' : 'text-danger'}`}>
                            {result.change24h >= 0 ? '+' : ''}{result.change24h.toFixed(2)}
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Current Price */}
          {quote && (
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Current Price</span>
                <span className="text-2xl font-bold">${quote.currentPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">24h Change</span>
                <span className={quote.change24h >= 0 ? 'text-success' : 'text-danger'}>
                  {quote.change24h >= 0 ? '+' : ''}{quote.change24h.toFixed(2)} ({quote.changePercentage.toFixed(2)}%)
                </span>
              </div>
              {/* Watchlist Button */}
              {onToggleWatchlist && watchlistStatus && (
                <div className="flex justify-center mt-3 pt-3 border-t dark:border-gray-600">
                  <button
                    onClick={(e) => onToggleWatchlist(symbol, 'STOCK', e)}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-600 hover:bg-gray-100 dark:hover:bg-gray-500 rounded-lg transition-colors text-sm font-medium"
                  >
                    {watchlistStatus.get(symbol) ? (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-yellow-500"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span>Remove from Watchlist</span>
                      </>
                    ) : (
                      <>
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
                        <span>Add to Watchlist</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium mb-2">Quantity</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="input"
              placeholder="Enter quantity"
              min="0"
              step="0.00000001"
              disabled={loading || !quote}
            />
            {tradeType === 'SELL' && symbol && (
              <p className="text-sm text-gray-500 mt-1">
                Available: {holdings.find(h => h.symbol === symbol)?.quantity || 0}
              </p>
            )}
          </div>

          {/* Order Summary */}
          {quote && quantity && parseFloat(quantity) > 0 && (
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Quantity</span>
                <span className="font-medium">{parseFloat(quantity)} {symbol}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Price per unit</span>
                <span className="font-medium">${quote.currentPrice.toFixed(2)}</span>
              </div>
              <div className="border-t dark:border-gray-600 pt-2 flex justify-between">
                <span className="font-semibold">Total Value</span>
                <span className="font-bold text-lg">${totalValue.toFixed(2)}</span>
              </div>
              {tradeType === 'BUY' && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Cash after trade</span>
                  <span className={Number(cashBalance || 0) - totalValue >= 0 ? 'text-success' : 'text-danger'}>
                    ${(Number(cashBalance || 0) - totalValue).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Cash Balance */}
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600 dark:text-gray-400">Available Cash</span>
            <span className="font-semibold">${Number(cashBalance || 0).toFixed(2)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t dark:border-gray-700 flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 btn btn-secondary py-3"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleTrade}
            disabled={loading || !quote || !quantity || parseFloat(quantity) <= 0}
            className={`flex-1 py-3 rounded-lg font-semibold ${
              tradeType === 'BUY'
                ? 'bg-success text-white hover:bg-success-dark'
                : 'bg-danger text-white hover:bg-danger-dark'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? 'Processing...' : `${tradeType} ${symbol || 'Asset'}`}
          </button>
        </div>
      </div>
    </div>
  );
}
