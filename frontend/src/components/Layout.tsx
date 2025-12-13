import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import {
  Package,
  RotateCcw,
  BarChart3,
  Users,
  LogOut,
  ShoppingCart,
  Cpu,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, isAdmin, isSystem } = useAuth();
  const { totalItems } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login?role=system');
  };

  const systemNavItems = [
    { path: '/items', label: 'Borrow Items', icon: Package },
    { path: '/return', label: 'Return Items', icon: RotateCcw },
  ];

  const adminNavItems = [
    { path: '/admin/items', label: 'Inventory', icon: Package },
    { path: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/admin/borrowers', label: 'Borrowers', icon: Users },
  ];

  const navItems = isAdmin ? adminNavItems : systemNavItems;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Cpu className="h-8 w-8 text-primary" />
                <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-success animate-pulse" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">IoT Lab</h1>
                <p className="text-xs text-muted-foreground -mt-1">Inventory System</p>
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={location.pathname === item.path ? 'secondary' : 'ghost'}
                  size="sm"
                  className={cn(
                    'gap-2',
                    location.pathname === item.path && 'bg-primary/10 text-primary'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {/* Cart indicator for system users */}
            {isSystem && (
              <Link to="/items">
                <Button variant="outline" size="sm" className="relative gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  {totalItems > 0 && (
                    <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                      {totalItems}
                    </span>
                  )}
                </Button>
              </Link>
            )}

            {/* User info */}
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-medium text-foreground">{user?.username}</span>
              <span className={cn(
                'text-xs font-mono px-1.5 py-0.5 rounded',
                isAdmin ? 'bg-warning/20 text-warning' : 'bg-primary/20 text-primary'
              )}>
                {user?.role.toUpperCase()}
              </span>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
            </Button>

            {/* Mobile menu toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden border-t border-border bg-card p-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Button
                  variant={location.pathname === item.path ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start gap-2',
                    location.pathname === item.path && 'bg-primary/10 text-primary'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            ))}
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main className="container py-6">{children}</main>
    </div>
  );
};
