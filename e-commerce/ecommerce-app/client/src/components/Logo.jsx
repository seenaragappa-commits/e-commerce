import { Link } from 'react-router';
import logoMark from '../assets/logo-mark.svg';

export default function Logo({ variant = 'dark', className = '' }) {
  const light = variant === 'light';

  return (
    <Link to="/" className={`group inline-flex shrink-0 items-center gap-2.5 ${className}`} aria-label="ShopSphere home">
      <img
        src={logoMark}
        alt=""
        width="36"
        height="36"
        className="h-9 w-9 transition-transform duration-300 group-hover:-rotate-6"
      />
      <span className={`text-xl font-extrabold tracking-tight ${light ? 'text-white' : 'text-slate-900'}`}>
        Shop<span className={light ? 'text-blue-200' : 'text-blue-600'}>Sphere</span>
      </span>
    </Link>
  );
}
