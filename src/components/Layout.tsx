import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { ArrowLeftRight, ChartBar, ChevronDown, Grid3x3, Menu, Package, ShoppingCart, Users, Warehouse, X } from 'lucide-react';

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDashboardExpanded, setIsDashboardExpanded] = useState(true);
  const location = useLocation();

  const navigation = [
    { 
      name: 'Dashboard',
      href: '/dashboard',
      icon: Grid3x3,
      subItems: [
        { name: 'Transfer Dashboard', href: '/dashboard/transfer' }
      ]
    },
    { name: 'POS', href: '/pos', icon: ShoppingCart },
    { name: 'Inventory', href: '/inventory', icon: Package },
    { name: 'Warehouse', href: '/warehouse', icon: Warehouse },
    { name: 'Stock Transfer', href: '/transfers', icon: ArrowLeftRight },
    { name: 'Reports', href: '/reports', icon: ChartBar },
    { name: 'Users', href: '/users', icon: Users },
  ];

  const renderNavItem = (item: typeof navigation[0], isMobile: boolean = false) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.href || 
                    (item.subItems?.some(sub => location.pathname === sub.href));
    const hasSubItems = item.subItems && item.subItems.length > 0;

    return (
      <div key={item.name} className="space-y-1">
        <Link
          to={item.href}
          onClick={() => {
            if (isMobile) setIsSidebarOpen(false);
            if (hasSubItems) setIsDashboardExpanded(!isDashboardExpanded);
          }}
          className={`group flex items-center justify-between px-2 py-2 text-sm font-medium rounded-md ${
            isActive
              ? 'bg-gray-100 text-gray-900'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center">
            <Icon className="mr-3 h-6 w-6" />
            {item.name}
          </div>
          {hasSubItems && (
            <ChevronDown className={`h-4 w-4 transition-transform ${isDashboardExpanded ? 'rotate-180' : ''}`} />
          )}
        </Link>

        {hasSubItems && isDashboardExpanded && (
          <div className="pl-11 space-y-1">
            {item.subItems.map(subItem => (
              <Link
                key={subItem.name}
                to={subItem.href}
                onClick={() => isMobile && setIsSidebarOpen(false)}
                className={`block py-2 text-sm font-medium rounded-md ${
                  location.pathname === subItem.href
                    ? 'text-indigo-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {subItem.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile Sidebar */}
      <div className="lg:hidden">
        {isSidebarOpen && (
          <div className="fixed inset-0 flex z-40">
            <div
              className="fixed inset-0 bg-gray-600 bg-opacity-75"
              onClick={() => setIsSidebarOpen(false)}
            />

            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button
                  className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <X className="h-6 w-6 text-white" />
                </button>
              </div>

              <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                <nav className="mt-5 px-2 space-y-1">
                  {navigation.map(item => renderNavItem(item, true))}
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-gray-200">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {navigation.map(item => renderNavItem(item))}
            </nav>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        <div className="sticky top-0 z-10 lg:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-gray-100">
          <button
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        <main className="flex-1 p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
