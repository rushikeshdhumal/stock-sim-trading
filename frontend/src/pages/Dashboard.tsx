import { useEffect, useState } from 'react';
import portfolioService from '../services/portfolioService';
import { PortfolioWithHoldings } from '../types';
import TradingModal from '../components/TradingModal';
import Navigation from '../components/Navigation';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const [portfolio, setPortfolio] = useState<PortfolioWithHoldings | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTradingModal, setShowTradingModal] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('');
  const [selectedTradeType, setSelectedTradeType] = useState<'BUY' | 'SELL'>('BUY');

  useEffect(() => {
    loadPortfolio();
  }, []);

  const loadPortfolio = async () => {
    try {
      const portfolios = await portfolioService.getPortfolios();
      if (portfolios.length > 0) {
        const portfolioData = await portfolioService.getPortfolioById(portfolios[0].id);
        setPortfolio(portfolioData);
      }
    } catch (error) {
      toast.error('Failed to load portfolio');
    } finally {
      setLoading(false);
    }
  };

  const openTradeModal = (symbol: string = '', type: 'BUY' | 'SELL' = 'BUY') => {
    setSelectedSymbol(symbol);
    setSelectedTradeType(type);
    setShowTradingModal(true);
  };

  const handleTradeComplete = () => {
    loadPortfolio();
  };

  const calculateProfitLoss = () => {
    if (!portfolio?.holdings) return { total: 0, percentage: 0 };

    let totalPL = 0;
    let totalCost = 0;

    portfolio.holdings.forEach(holding => {
      if (holding.profitLoss !== undefined) {
        totalPL += holding.profitLoss;
        totalCost += holding.averageCost * holding.quantity;
      }
    });

    const percentage = totalCost > 0 ? (totalPL / totalCost) * 100 : 0;
    return { total: totalPL, percentage };
  };

  const profitLoss = calculateProfitLoss();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Portfolio Overview</h1>
          <button
            onClick={() => openTradeModal()}
            className="btn btn-primary"
          >
            + New Trade
          </button>
        </div>

        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Value</h3>
            <p className="text-3xl font-bold text-primary-600">
              ${portfolio?.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          <div className="card">
            <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-2">Cash Balance</h3>
            <p className="text-3xl font-bold text-success">
              ${portfolio?.cashBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          <div className="card">
            <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total P/L</h3>
            <p className={`text-3xl font-bold ${profitLoss.total >= 0 ? 'text-success' : 'text-danger'}`}>
              {profitLoss.total >= 0 ? '+' : ''}${profitLoss.total.toFixed(2)}
              <span className="text-lg ml-2">
                ({profitLoss.percentage >= 0 ? '+' : ''}{profitLoss.percentage.toFixed(2)}%)
              </span>
            </p>
          </div>

          <div className="card">
            <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-2">Holdings</h3>
            <p className="text-3xl font-bold">{portfolio?.holdings.length || 0}</p>
          </div>
        </div>

        {/* Holdings Table */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Your Holdings</h2>
            <button
              onClick={() => openTradeModal()}
              className="btn btn-primary text-sm"
            >
              + New Trade
            </button>
          </div>

          {portfolio?.holdings && portfolio.holdings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b dark:border-gray-700">
                    <th className="text-left py-3 px-4">Symbol</th>
                    <th className="text-left py-3 px-4">Type</th>
                    <th className="text-right py-3 px-4">Quantity</th>
                    <th className="text-right py-3 px-4">Avg Cost</th>
                    <th className="text-right py-3 px-4">Current Price</th>
                    <th className="text-right py-3 px-4">Value</th>
                    <th className="text-right py-3 px-4">P/L</th>
                    <th className="text-right py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.holdings.map((holding) => (
                    <tr key={holding.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="py-3 px-4 font-medium">{holding.symbol}</td>
                      <td className="py-3 px-4">
                        <span className="badge badge-info">{holding.assetType}</span>
                      </td>
                      <td className="py-3 px-4 text-right">{holding.quantity}</td>
                      <td className="py-3 px-4 text-right">${holding.averageCost.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right">
                        {holding.currentPrice ? `$${holding.currentPrice.toFixed(2)}` : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-medium">
                        {holding.currentValue ? `$${holding.currentValue.toFixed(2)}` : '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {holding.profitLoss !== undefined ? (
                          <span className={holding.profitLoss >= 0 ? 'text-success' : 'text-danger'}>
                            {holding.profitLoss >= 0 ? '+' : ''}${holding.profitLoss.toFixed(2)}
                            {holding.profitLossPercentage !== undefined && (
                              <span className="text-sm ml-1">
                                ({holding.profitLossPercentage >= 0 ? '+' : ''}{holding.profitLossPercentage.toFixed(2)}%)
                              </span>
                            )}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openTradeModal(holding.symbol, 'BUY')}
                            className="text-success hover:underline text-sm font-medium"
                          >
                            Buy
                          </button>
                          <button
                            onClick={() => openTradeModal(holding.symbol, 'SELL')}
                            className="text-danger hover:underline text-sm font-medium"
                          >
                            Sell
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-4">No holdings yet. Start trading to build your portfolio!</p>
              <button
                onClick={() => openTradeModal()}
                className="btn btn-primary"
              >
                Make Your First Trade
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Trading Modal */}
      <TradingModal
        isOpen={showTradingModal}
        onClose={() => setShowTradingModal(false)}
        portfolioId={portfolio?.id || ''}
        initialSymbol={selectedSymbol}
        initialType={selectedTradeType}
        onTradeComplete={handleTradeComplete}
        cashBalance={portfolio?.cashBalance || 0}
        holdings={portfolio?.holdings.map(h => ({ symbol: h.symbol, quantity: h.quantity })) || []}
      />
    </div>
  );
}
