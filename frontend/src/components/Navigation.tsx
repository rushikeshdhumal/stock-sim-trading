import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../context/authStore';

export default function Navigation() {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navLinkClass = (path: string) =>
    `px-4 py-2 rounded-lg font-medium transition-colors ${
      isActive(path)
        ? 'bg-primary-600 text-white'
        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
    }`;

  return (
    <header className="bg-white dark:bg-gray-800 shadow sticky top-0 z-40">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo/Brand */}
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-primary-600">📈</span>
            <h1 className="text-xl md:text-2xl font-bold text-primary-600">
              Trading and Simulation
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            <Link to="/dashboard" className={navLinkClass('/dashboard')}>
              Dashboard
            </Link>
            <Link to="/market" className={navLinkClass('/market')}>
              Market
            </Link>
            <Link to="/watchlist" className={navLinkClass('/watchlist')}>
              Watchlist
            </Link>
            <Link to="/leaderboard" className={navLinkClass('/leaderboard')}>
              Leaderboard
            </Link>
            <Link to="/achievements" className={navLinkClass('/achievements')}>
              Achievements
            </Link>
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 dark:text-gray-400 hidden sm:inline">
              {user?.username}
            </span>
            <button
              onClick={logout}
              className="btn btn-secondary text-sm"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden mt-4 flex gap-2 overflow-x-auto pb-2">
          <Link
            to="/dashboard"
            className={`${navLinkClass('/dashboard')} text-sm whitespace-nowrap`}
          >
            Dashboard
          </Link>
          <Link
            to="/market"
            className={`${navLinkClass('/market')} text-sm whitespace-nowrap`}
          >
            Market
          </Link>
          <Link
            to="/watchlist"
            className={`${navLinkClass('/watchlist')} text-sm whitespace-nowrap`}
          >
            Watchlist
          </Link>
          <Link
            to="/leaderboard"
            className={`${navLinkClass('/leaderboard')} text-sm whitespace-nowrap`}
          >
            Leaderboard
          </Link>
          <Link
            to="/achievements"
            className={`${navLinkClass('/achievements')} text-sm whitespace-nowrap`}
          >
            Achievements
          </Link>
        </nav>
      </div>
    </header>
  );
}
