import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router';
import { ChevronDown, LayoutDashboard, LogIn, LogOut, Menu, Package, Search, ShoppingCart, UserRound, X } from 'lucide-react';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import useLogout from '../hooks/useLogout';
import { getInitials, pluralize } from '../utils/format';

const NAV_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/products', label: 'Products' },
];

const desktopLinkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-semibold transition ${
    isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
  }`;

const mobileLinkClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
    isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
  }`;

/** Search box that opens the catalog with ?keyword=... */
function SearchBar({ id, initialValue, onSearch, className = '' }) {
  const [query, setQuery] = useState(initialValue);

  const handleSubmit = (event) => {
    event.preventDefault();
    onSearch(query.trim());
  };

  return (
    <form onSubmit={handleSubmit} role="search" className={`relative ${className}`}>
      <label htmlFor={id} className="sr-only">
        Search products
      </label>
      <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
      <input
        id={id}
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search products..."
        className="input rounded-full bg-slate-100/70 pl-10 hover:bg-white focus:bg-white"
      />
    </form>
  );
}

function MenuLink({ to, icon: Icon, children, onClick }) {
  return (
    <Link
      to={to}
      role="menuitem"
      onClick={onClick}
      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
    >
      <Icon className="h-4 w-4 text-slate-400" aria-hidden="true" />
      {children}
    </Link>
  );
}

function UserMenu({ user, isAdmin, onLogout }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  // Close the menu when clicking outside of it or pressing Escape.
  useEffect(() => {
    if (!open) return undefined;
    const handleClick = (event) => {
      if (!menuRef.current?.contains(event.target)) setOpen(false);
    };
    const handleKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pr-3 pl-1 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:shadow-sm"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-xs font-bold text-white">
          {getInitials(user.name)}
        </span>
        <span className="max-w-28 truncate">{user.name.split(' ')[0]}</span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-64 animate-slide-up overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10"
        >
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
            {isAdmin && <span className="badge mt-2 bg-blue-50 text-blue-700 ring-1 ring-blue-600/15">Administrator</span>}
          </div>
          <div className="p-1.5">
            <MenuLink to="/profile" icon={UserRound} onClick={close}>
              My Profile
            </MenuLink>
            <MenuLink to="/orders" icon={Package} onClick={close}>
              My Orders
            </MenuLink>
            {isAdmin && (
              <MenuLink to="/admin" icon={LayoutDashboard} onClick={close}>
                Admin Dashboard
              </MenuLink>
            )}
          </div>
          <div className="border-t border-slate-100 p-1.5">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                close();
                onLogout();
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MobileMenu({ user, isAdmin, itemCount, currentKeyword, onSearch, onLogout, onClose }) {
  return (
    <div id="mobile-menu" className="animate-fade-in border-t border-slate-100 bg-white lg:hidden">
      <div className="container-page space-y-4 py-4">
        <SearchBar key={`mobile-${currentKeyword}`} id="mobile-search" initialValue={currentKeyword} onSearch={onSearch} />

        <div className="grid gap-1">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={mobileLinkClass} onClick={onClose}>
              {link.label}
            </NavLink>
          ))}
          <NavLink to="/cart" className={mobileLinkClass} onClick={onClose}>
            Cart
            {itemCount > 0 && <span className="badge ml-auto bg-blue-600 text-white">{itemCount}</span>}
          </NavLink>
        </div>

        {user ? (
          <div className="rounded-2xl border border-slate-200 p-2">
            <div className="flex items-center gap-3 px-2 py-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-sm font-bold text-white">
                {getInitials(user.name)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
                <p className="truncate text-xs text-slate-500">{user.email}</p>
              </div>
            </div>
            <NavLink to="/profile" className={mobileLinkClass} onClick={onClose}>
              <UserRound className="h-4 w-4" /> My Profile
            </NavLink>
            <NavLink to="/orders" end className={mobileLinkClass} onClick={onClose}>
              <Package className="h-4 w-4" /> My Orders
            </NavLink>
            {isAdmin && (
              <NavLink to="/admin" className={mobileLinkClass} onClick={onClose}>
                <LayoutDashboard className="h-4 w-4" /> Admin Dashboard
              </NavLink>
            )}
            <button
              type="button"
              onClick={onLogout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" /> Log out
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Link to="/login" className="btn btn-secondary" onClick={onClose}>
              <LogIn className="h-4 w-4" /> Log in
            </Link>
            <Link to="/register" className="btn btn-primary" onClick={onClose}>
              Sign up
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Navbar() {
  const { user, isAdmin } = useAuth();
  const { itemCount } = useCart();
  const logOut = useLogout();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Keep the search box in sync with the keyword in the URL (the `key` below resets it).
  const currentKeyword = location.pathname === '/products' ? (searchParams.get('keyword') ?? '') : '';

  const handleSearch = (query) => {
    setMobileOpen(false);
    navigate(query ? `/products?keyword=${encodeURIComponent(query)}` : '/products');
  };

  const handleLogout = () => {
    setMobileOpen(false);
    logOut();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-lg">
      <nav className="container-page flex h-16 items-center gap-3 lg:gap-6" aria-label="Main navigation">
        <Logo />

        <div className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={desktopLinkClass}>
              {link.label}
            </NavLink>
          ))}
        </div>

        <SearchBar
          key={`desktop-${currentKeyword}`}
          id="desktop-search"
          initialValue={currentKeyword}
          onSearch={handleSearch}
          className="ml-auto hidden w-full max-w-xs lg:block xl:max-w-sm"
        />

        <div className="ml-auto flex items-center gap-1 lg:ml-0 lg:gap-2">
          <Link
            to="/cart"
            className="relative rounded-xl p-2.5 text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label={`Shopping cart with ${pluralize(itemCount, 'item')}`}
          >
            <ShoppingCart className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 animate-scale-in items-center justify-center rounded-full bg-blue-600 px-1 text-[11px] font-bold text-white ring-2 ring-white">
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            )}
          </Link>

          {user ? (
            <div className="hidden lg:block">
              <UserMenu user={user} isAdmin={isAdmin} onLogout={handleLogout} />
            </div>
          ) : (
            <div className="hidden items-center gap-2 lg:flex">
              <Link to="/login" className="btn btn-ghost">
                Log in
              </Link>
              <Link to="/register" className="btn btn-primary">
                Sign up
              </Link>
            </div>
          )}

          <button
            type="button"
            className="rounded-xl p-2.5 text-slate-700 transition hover:bg-slate-100 lg:hidden"
            onClick={() => setMobileOpen((value) => !value)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <MobileMenu
          user={user}
          isAdmin={isAdmin}
          itemCount={itemCount}
          currentKeyword={currentKeyword}
          onSearch={handleSearch}
          onLogout={handleLogout}
          onClose={() => setMobileOpen(false)}
        />
      )}
    </header>
  );
}
