import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  User, 
  Calendar, 
  Dumbbell, 
  Search, 
  TrendingUp,
  Heart
} from 'lucide-react';

const Navigation: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/meals', icon: Calendar, label: 'Meals' },
    { path: '/exercises', icon: Dumbbell, label: 'Workouts' },
    { path: '/food-search', icon: Search, label: 'Food Search' },
    { path: '/progress', icon: TrendingUp, label: 'Progress' },
    { path: '/profile', icon: User, label: 'Profile' }
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white shadow-lg z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo Section - Fixed width agar tidak terhimpit */}
          <Link to="/dashboard" className="flex items-center space-x-2 flex-shrink-0">
            <Heart className="h-8 w-8 text-green-600" />
            <span className="text-xl font-bold text-gray-900 hidden xs:block">HealthyGO</span>
          </Link>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-8">
            {navItems.map(({ path, icon: Icon, label }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === path
                    ? 'text-green-600 bg-green-50'
                    : 'text-gray-700 hover:text-green-600 hover:bg-green-50'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Link>
            ))}
          </div>

          {/* Mobile Menu (Scrollable) */}
          {/* PERBAIKAN: Menggunakan min-w-0 agar flex item bisa shrink, dan menghapus justify-end */}
          <div className="md:hidden flex flex-1 min-w-0">
            <div className="flex overflow-x-auto items-center space-x-2 no-scrollbar py-1 w-full justify-start sm:justify-end mask-fade">
              {navItems.map(({ path, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  className={`p-2 rounded-md flex-shrink-0 transition-colors ${
                    location.pathname === path
                      ? 'text-green-600 bg-green-50'
                      : 'text-gray-700 hover:text-green-600'
                  }`}
                >
                  <Icon className="h-6 w-6" />
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        /* Opsional: Memberi efek pudar di ujung jika scrollable */
        .mask-fade {
          mask-image: linear-gradient(to right, black 85%, transparent 100%);
          -webkit-mask-image: linear-gradient(to right, black 85%, transparent 100%);
        }
      `}</style>
    </nav>
  );
};

export default Navigation;