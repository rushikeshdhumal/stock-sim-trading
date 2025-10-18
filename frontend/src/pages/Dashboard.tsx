import { useEffect, useState } from 'react';
import { useAuthStore } from '../context/authStore';
import portfolioService from '../services/portfolioService';
import { PortfolioWithHoldings } from '../types';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { user, logout } = useAuthStore();
  const [portfolio, setPortfolio] = useState<PortfolioWithHoldings | null>(null);
  const [loading, setLoading] = useState(true);

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

  const handleLogout = async () => {
    await logout();
  };

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
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary-600">Stock Sim Trading</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm">Welcome, {user?.username}!</span>
            <button onClick={handleLogout} className="btn btn-secondary text-sm">
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
            <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-2">Holdings</h3>
            <p className="text-3xl font-bold">{portfolio?.holdings.length || 0}</p>
          </div>
        </div>

        {/* Holdings Table */}
        <div className="card">
          <h2 className="card-header">Your Holdings</h2>

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
                    <th className="text-right py-3 px-4">P/L</th>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>No holdings yet. Start trading to build your portfolio!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
