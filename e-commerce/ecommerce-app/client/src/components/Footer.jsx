import { Link } from 'react-router';
import { CreditCard, PackageSearch, ShieldCheck, Truck } from 'lucide-react';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES, TAGLINE } from '../utils/constants';

const CURRENT_YEAR = new Date().getFullYear();

function FooterHeading({ children }) {
  return <h3 className="text-sm font-bold tracking-wide text-slate-900">{children}</h3>;
}

function FooterLink({ to, children }) {
  return (
    <li>
      <Link to={to} className="text-sm text-slate-500 transition hover:text-blue-600">
        {children}
      </Link>
    </li>
  );
}

export default function Footer() {
  const { user, isAdmin } = useAuth();

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <Logo />
          <p className="mt-4 text-sm font-semibold text-slate-700">{TAGLINE}</p>
          <p className="mt-2 max-w-xs text-sm text-slate-500">
            Quality electronics, fashion, home essentials and gaming gear - delivered simply, tracked every step of the way.
          </p>
        </div>

        <div>
          <FooterHeading>Shop</FooterHeading>
          <ul className="mt-4 space-y-2.5">
            <FooterLink to="/products">All Products</FooterLink>
            {CATEGORIES.map((category) => (
              <FooterLink key={category} to={`/products?category=${category}`}>
                {category}
              </FooterLink>
            ))}
          </ul>
        </div>

        <div>
          <FooterHeading>Account</FooterHeading>
          <ul className="mt-4 space-y-2.5">
            {user ? (
              <>
                <FooterLink to="/profile">My Profile</FooterLink>
                <FooterLink to="/orders">My Orders</FooterLink>
                <FooterLink to="/cart">Shopping Cart</FooterLink>
                {isAdmin && <FooterLink to="/admin">Admin Dashboard</FooterLink>}
              </>
            ) : (
              <>
                <FooterLink to="/login">Log in</FooterLink>
                <FooterLink to="/register">Create account</FooterLink>
                <FooterLink to="/cart">Shopping Cart</FooterLink>
              </>
            )}
          </ul>
        </div>

        <div>
          <FooterHeading>Why ShopSphere</FooterHeading>
          <ul className="mt-4 space-y-3 text-sm text-slate-500">
            <li className="flex items-start gap-2.5">
              <Truck className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" aria-hidden="true" />
              Free shipping on orders over $100
            </li>
            <li className="flex items-start gap-2.5">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" aria-hidden="true" />
              Secure accounts with hashed passwords
            </li>
            <li className="flex items-start gap-2.5">
              <PackageSearch className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" aria-hidden="true" />
              Track every order step by step
            </li>
            <li className="flex items-start gap-2.5">
              <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" aria-hidden="true" />
              Cash on delivery or demo card payment
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-100">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {CURRENT_YEAR} ShopSphere. All rights reserved.</p>
          <p>Demo store built with React, Express &amp; MongoDB - no real payments are processed.</p>
        </div>
      </div>
    </footer>
  );
}
