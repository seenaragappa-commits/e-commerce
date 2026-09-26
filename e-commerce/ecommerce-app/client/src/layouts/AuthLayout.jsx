import { PackageSearch, ShieldCheck, Truck } from 'lucide-react';
import Logo from '../components/Logo';
import ProductImage from '../components/ProductImage';

const HIGHLIGHTS = [
  {
    icon: ShieldCheck,
    title: 'Secure by design',
    text: 'Passwords are hashed with bcrypt and every request is verified with a signed token.',
  },
  {
    icon: PackageSearch,
    title: 'Real-time order tracking',
    text: 'Follow every order from the moment it is placed to your doorstep.',
  },
  {
    icon: Truck,
    title: 'Free shipping over $100',
    text: 'Fast delivery on electronics, fashion, home and gaming essentials.',
  },
];

const SHOWCASE = ['smart-watch', 'wireless-headphones', 'game-controller'];

/** Two-column card used by the login and register pages. */
export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="container-page py-8 sm:py-14">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5 lg:grid-cols-[1fr_1.1fr]">
        <aside className="relative hidden flex-col overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-10 text-white lg:flex">
          <div aria-hidden="true" className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
          <div aria-hidden="true" className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-indigo-400/20 blur-3xl" />

          <div className="relative">
            <Logo variant="light" />
            <h2 className="mt-10 text-3xl leading-tight font-extrabold">
              Simple Shopping.
              <br />
              Smarter Experience.
            </h2>
            <p className="mt-3 text-sm text-blue-100">Everything you need, delivered simply.</p>

            <ul className="mt-8 space-y-5">
              {HIGHLIGHTS.map(({ icon: Icon, title: itemTitle, text }) => (
                <li key={itemTitle} className="flex gap-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-bold">{itemTitle}</p>
                    <p className="mt-0.5 text-sm text-blue-100/90">{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mt-auto grid grid-cols-3 gap-3 pt-10" aria-hidden="true">
            {SHOWCASE.map((slug) => (
              <div key={slug} className="rounded-2xl bg-white/95 p-2 shadow-lg shadow-blue-950/20">
                <ProductImage src={`/images/products/${slug}.svg`} alt="" className="aspect-square w-full object-contain" />
              </div>
            ))}
          </div>
        </aside>

        <div className="p-6 sm:p-10 lg:p-12">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-slate-500">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
