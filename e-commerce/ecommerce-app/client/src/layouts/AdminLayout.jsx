import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router';
import { ClipboardList, LayoutDashboard, LogOut, Menu, Package, PackagePlus, Store, UserRound, Users, X } from 'lucide-react';
import Logo from '../components/Logo';
import ScrollToTop from '../components/ScrollToTop';
import { useAuth } from '../context/AuthContext';
import useLogout from '../hooks/useLogout';
import { getInitials } from '../utils/format';

// `match` decides when a link is highlighted, e.g. "Products" stays active while
// editing a product, but not on the "Add Product" page (which has its own link).
const NAV_SECTIONS = [
  {
    title: 'Overview',
    links: [{ to: '/admin', label: 'Dashboard', icon: LayoutDashboard, match: (path) => path === '/admin' }],
  },
  {
    title: 'Catalog',
    links: [
      {
        to: '/admin/products',
        label: 'Products',
        icon: Package,
        match: (path) => path.startsWith('/admin/products') && !path.startsWith('/admin/products/new'),
      },
      { to: '/admin/products/new', label: 'Add Product', icon: PackagePlus, match: (path) => path.startsWith('/admin/products/new') },
    ],
  },
  {
    title: 'Sales',
    links: [
      { to: '/admin/orders', label: 'Orders', icon: ClipboardList, match: (path) => path.startsWith('/admin/orders') },
      { to: '/admin/users', label: 'Customers', icon: Users, match: (path) => path.startsWith('/admin/users') },
    ],
  },
  {
    title: 'Account',
    links: [{ to: '/admin/profile', label: 'Profile', icon: UserRound, match: (path) => path.startsWith('/admin/profile') }],
  },
];

const ALL_LINKS = NAV_SECTIONS.flatMap((section) => section.links);

const itemClass = (active) =>
  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
    active ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
  }`;

function SidebarContent({ pathname, headerAction, onNavigate, onLogout }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-slate-100 px-5">
        <Logo />
        {headerAction ?? <span className="badge bg-slate-900 text-white">Admin</span>}
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto p-4" aria-label="Admin navigation">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="px-3 pb-1.5 text-[11px] font-bold tracking-wider text-slate-400 uppercase">{section.title}</p>
            <ul className="space-y-1">
              {section.links.map(({ to, label, icon: Icon, match }) => {
                const active = match(pathname);
                return (
                  <li key={to}>
                    <Link to={to} className={itemClass(active)} aria-current={active ? 'page' : undefined} onClick={onNavigate}>
                      <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 space-y-1 border-t border-slate-100 p-4">
        <Link to="/" className={itemClass(false)} onClick={onNavigate}>
          <Store className="h-5 w-5 shrink-0" aria-hidden="true" />
          Back to Store
        </Link>
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
        >
          <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
          Logout
        </button>
      </div>
    </div>
  );
}

/** Admin area: a fixed sidebar on large screens, a slide-in drawer on phones and tablets. */
export default function AdminLayout() {
  const { user } = useAuth();
  const logOut = useLogout();
  const { pathname: rawPathname } = useLocation();
  const pathname = rawPathname.replace(/\/+$/, '') || '/';
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeButton = useRef(null);

  const currentPage = ALL_LINKS.find((link) => link.match(pathname))?.label ?? 'Admin';

  // While the drawer is open: focus its close button, close it with Escape and stop the page from scrolling.
  useEffect(() => {
    if (!drawerOpen) return undefined;
    closeButton.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setDrawerOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [drawerOpen]);

  const handleLogout = () => {
    setDrawerOpen(false);
    logOut({ message: 'You have been logged out.' });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <ScrollToTop />

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 bg-white lg:block">
        <SidebarContent pathname={pathname} onLogout={handleLogout} />
      </aside>

      {/* Mobile / tablet drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin navigation">
          <div className="absolute inset-0 animate-fade-in bg-slate-900/50" onClick={() => setDrawerOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85%] animate-slide-in-left bg-white shadow-2xl">
            <SidebarContent
              pathname={pathname}
              headerAction={
                <button
                  ref={closeButton}
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="-mr-2 rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              }
              onNavigate={() => setDrawerOpen(false)}
              onLogout={handleLogout}
            />
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/85 px-4 backdrop-blur-lg sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="-ml-1 rounded-xl p-2.5 text-slate-700 transition hover:bg-slate-100 lg:hidden"
            aria-label="Open admin menu"
            aria-expanded={drawerOpen}
          >
            <Menu className="h-5 w-5" />
          </button>
          <p className="truncate text-sm font-bold text-slate-900 lg:hidden">{currentPage}</p>
          <p className="hidden text-sm text-slate-500 lg:block">
            ShopSphere <span className="text-slate-300">/</span> <span className="font-semibold text-slate-900">{currentPage}</span>
          </p>

          <div className="ml-auto flex items-center gap-3">
            <Link to="/" className="btn btn-secondary btn-sm" aria-label="Back to store">
              <Store className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Back to Store</span>
            </Link>
            <Link to="/admin/profile" className="flex items-center gap-2.5 rounded-full transition hover:opacity-90" aria-label="Your admin profile">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-xs font-bold text-white">
                {getInitials(user.name)}
              </span>
              <span className="hidden leading-tight md:block">
                <span className="block text-sm font-semibold text-slate-900">{user.name}</span>
                <span className="block text-xs text-slate-500">Administrator</span>
              </span>
            </Link>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
