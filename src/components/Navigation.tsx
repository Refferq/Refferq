'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

interface NavigationProps {
  userRole?: 'admin' | 'affiliate';
  userName?: string;
}

export default function Navigation({ userRole, userName }: NavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  // Use auth context if props not provided
  const role = userRole || user?.role || 'affiliate';
  const name = userName || user?.name || 'User';

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const adminNavItems = [
    { name: 'Dashboard', href: '/admin', icon: '📊' },
    { name: 'Affiliates', href: '/admin/affiliates', icon: '👥' },
    { name: 'Referrals', href: '/admin/referrals', icon: '📋' },
    { name: 'Commissions', href: '/admin/commissions', icon: '💰' },
    { name: 'Payouts', href: '/admin/payouts', icon: '💳' },
    { name: 'Settings', href: '/admin/settings', icon: '⚙️' },
  ];

  const affiliateNavItems = [
    { name: 'Dashboard', href: '/affiliate', icon: '📊' },
    { name: 'My Referrals', href: '/affiliate/referrals', icon: '👥' },
    { name: 'Submit Referral', href: '/affiliate/submit', icon: '➕' },
    { name: 'Commissions', href: '/affiliate/commissions', icon: '💰' },
    { name: 'Marketing Tools', href: '/affiliate/tools', icon: '🛠️' },
    { name: 'Profile', href: '/affiliate/profile', icon: '👤' },
  ];

  const navItems = role === 'admin' ? adminNavItems : affiliateNavItems;

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and primary nav */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-indigo-600">
                Affiliate Platform
              </Link>
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 ${
                      isActive
                        ? 'border-indigo-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* User menu */}
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-700">
              {name} ({role})
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="sm:hidden">
        <div className="pt-2 pb-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`block pl-3 pr-4 py-2 text-base font-medium ${
                  isActive
                    ? 'text-indigo-700 bg-indigo-50 border-r-4 border-indigo-500'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}