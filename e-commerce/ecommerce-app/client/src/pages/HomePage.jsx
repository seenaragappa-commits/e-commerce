import { Link } from 'react-router';
import {
  ArrowRight,
  BadgeCheck,
  PackageSearch,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Truck,
} from 'lucide-react';
import PageTitle from '../components/PageTitle';
import ProductGrid from '../components/ProductGrid';
import ProductImage from '../components/ProductImage';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import useFetch from '../hooks/useFetch';
import { getCategories, getProducts } from '../services/productService';
import { CATEGORIES } from '../utils/constants';

const CATEGORY_STYLES = {
  Electronics: {
    image: '/images/products/wireless-headphones.svg',
    tint: 'from-blue-50 to-sky-100/70',
    accent: 'text-blue-700',
    blurb: 'Audio, wearables & phones',
  },
  Fashion: {
    image: '/images/products/running-shoes.svg',
    tint: 'from-rose-50 to-orange-100/60',
    accent: 'text-rose-700',
    blurb: 'Sneakers, bags & eyewear',
  },
  Home: {
    image: '/images/products/desk-lamp.svg',
    tint: 'from-amber-50 to-yellow-100/60',
    accent: 'text-amber-700',
    blurb: 'Lighting & everyday living',
  },
  Accessories: {
    image: '/images/products/laptop-stand.svg',
    tint: 'from-emerald-50 to-teal-100/60',
    accent: 'text-emerald-700',
    blurb: 'Desk setup & fitness',
  },
  Gaming: {
    image: '/images/products/game-controller.svg',
    tint: 'from-violet-50 to-purple-100/60',
    accent: 'text-violet-700',
    blurb: 'Keyboards, mice & controllers',
  },
};

const BENEFITS = [
  {
    icon: ShieldCheck,
    title: 'Secure Checkout',
    text: 'Passwords are hashed with bcrypt and every order is protected by your login token.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: Truck,
    title: 'Fast Delivery',
    text: 'Orders arrive in about 5 days, with free shipping on orders over $100.',
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    icon: BadgeCheck,
    title: 'Quality Products',
    text: 'A curated catalog of highly rated products across five categories.',
    color: 'bg-amber-50 text-amber-600',
  },
  {
    icon: ShoppingBag,
    title: 'Easy Shopping',
    text: 'Smart search, handy filters and a cart that remembers your picks.',
    color: 'bg-violet-50 text-violet-600',
  },
];

function SectionHeader({ eyebrow, title, subtitle, link }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm font-bold tracking-wider text-blue-600 uppercase">{eyebrow}</p>
        <h2 className="section-title mt-1">{title}</h2>
        {subtitle && <p className="section-subtitle">{subtitle}</p>}
      </div>
      {link && (
        <Link to={link.to} className="group inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700">
          {link.label}
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/90 via-white to-slate-50">
      <div aria-hidden="true" className="pointer-events-none absolute -top-40 -right-40 h-[30rem] w-[30rem] rounded-full bg-blue-200/40 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-48 -left-40 h-[26rem] w-[26rem] rounded-full bg-indigo-200/30 blur-3xl" />

      <div className="container-page relative grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:py-24">
        <div className="animate-slide-up">
          <span className="badge bg-white px-3 py-1.5 text-blue-700 shadow-sm ring-1 ring-blue-600/10">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Simple Shopping. Smarter Experience.
          </span>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-balance text-slate-900 sm:text-5xl xl:text-6xl xl:leading-[1.05]">
            Everything You Need,{' '}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Delivered Simply.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base text-slate-600 sm:text-lg">
            Discover electronics, fashion, home essentials and gaming gear in one place - with secure checkout, fast delivery
            and live order tracking from cart to doorstep.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/products" className="btn btn-primary btn-lg group">
              Shop Now
              <ArrowRight className="h-5 w-5 transition group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
            <a href="#categories" className="btn btn-secondary btn-lg">
              Browse Categories
            </a>
          </div>
          <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-slate-600">
            <li className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-blue-600" aria-hidden="true" /> Free shipping over $100
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-blue-600" aria-hidden="true" /> Secure checkout
            </li>
            <li className="flex items-center gap-2">
              <PackageSearch className="h-4 w-4 text-blue-600" aria-hidden="true" /> Live order tracking
            </li>
          </ul>
        </div>

        {/* Product showcase */}
        <div className="relative mx-auto w-full max-w-lg animate-fade-in lg:max-w-none">
          <div aria-hidden="true" className="absolute inset-8 rounded-[3rem] bg-gradient-to-tr from-blue-600 to-indigo-500 opacity-20 blur-3xl" />
          <div className="relative grid grid-cols-2 gap-4 sm:gap-5">
            <Link
              to="/products?category=Electronics"
              className="group col-span-2 overflow-hidden rounded-3xl bg-white p-5 shadow-xl shadow-slate-900/5 ring-1 ring-slate-100 transition hover:shadow-2xl sm:p-6"
            >
              <div className="flex items-center justify-between">
                <span className="badge bg-blue-50 text-blue-700 ring-1 ring-blue-600/10">Featured</span>
                <span className="text-xs font-semibold text-slate-400">Electronics</span>
              </div>
              <ProductImage
                src="/images/products/wireless-headphones.svg"
                alt="Wireless noise-cancelling headphones"
                className="mx-auto -my-2 h-52 w-52 object-contain transition duration-500 group-hover:scale-105 sm:h-60 sm:w-60"
              />
              <p className="text-sm font-bold text-slate-900">Wireless Noise-Cancelling Headphones</p>
              <p className="mt-0.5 text-xs text-slate-500">40-hour battery - Active noise cancellation</p>
            </Link>
            <Link
              to="/products?category=Electronics"
              className="group rounded-3xl bg-white p-4 shadow-lg shadow-slate-900/5 ring-1 ring-slate-100 transition hover:shadow-xl"
            >
              <ProductImage
                src="/images/products/smart-watch.svg"
                alt="Smart watch"
                className="mx-auto aspect-square w-full object-contain transition duration-500 group-hover:scale-105"
              />
              <p className="mt-1 text-sm font-bold text-slate-900">Smart Watch</p>
            </Link>
            <Link
              to="/products?category=Gaming"
              className="group rounded-3xl bg-white p-4 shadow-lg shadow-slate-900/5 ring-1 ring-slate-100 transition hover:shadow-xl"
            >
              <ProductImage
                src="/images/products/mechanical-keyboard.svg"
                alt="Mechanical keyboard"
                className="mx-auto aspect-square w-full object-contain transition duration-500 group-hover:scale-105"
              />
              <p className="mt-1 text-sm font-bold text-slate-900">Gaming Gear</p>
            </Link>
          </div>

          <div className="absolute top-[28%] -left-4 hidden items-center gap-3 rounded-2xl bg-white p-3 pr-4 shadow-xl shadow-slate-900/10 ring-1 ring-slate-100 sm:flex lg:-left-8">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Truck className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs text-slate-500">Order tracking</p>
              <p className="text-sm font-bold text-slate-900">Cart to doorstep</p>
            </div>
          </div>

          <div className="absolute -top-4 right-2 hidden items-center gap-2 rounded-2xl bg-white px-3.5 py-2.5 shadow-xl shadow-slate-900/10 ring-1 ring-slate-100 sm:flex">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
            <p className="text-sm font-bold text-slate-900">Top rated picks</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function CategoryCard({ category }) {
  const style = CATEGORY_STYLES[category.name] ?? CATEGORY_STYLES.Electronics;

  return (
    <Link
      to={`/products?category=${encodeURIComponent(category.name)}`}
      className={`group flex flex-col rounded-2xl bg-gradient-to-br p-4 ring-1 ring-slate-200/60 transition duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-900/5 sm:p-5 ${style.tint}`}
    >
      <ProductImage
        src={style.image}
        alt=""
        className="mx-auto h-24 w-24 object-contain transition duration-500 group-hover:scale-110 sm:h-32 sm:w-32"
      />
      <h3 className="mt-3 text-base font-bold text-slate-900">{category.name}</h3>
      <p className="text-xs text-slate-500">{style.blurb}</p>
      <p className={`mt-3 flex items-center gap-1 text-xs font-bold ${style.accent}`}>
        {category.count === null ? 'Explore' : `${category.count} ${category.count === 1 ? 'product' : 'products'}`}
        <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" aria-hidden="true" />
      </p>
    </Link>
  );
}

function CategoriesSection() {
  const { data: categories } = useFetch(getCategories, 'categories');
  // Show the category names straight away; counts appear once they have loaded.
  const list = categories ?? CATEGORIES.map((name) => ({ name, count: null }));

  return (
    <section id="categories" className="container-page scroll-mt-24 py-16 sm:py-20">
      <SectionHeader
        eyebrow="Categories"
        title="Shop by category"
        subtitle="From everyday essentials to your next gaming upgrade."
        link={{ to: '/products', label: 'View all products' }}
      />
      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-5">
        {list.map((category) => (
          <CategoryCard key={category.name} category={category} />
        ))}
      </div>
    </section>
  );
}

function FeaturedProducts() {
  const { data, loading, error, reload } = useFetch(
    () => getProducts({ featured: 'true', sort: 'rating', limit: 8 }),
    'featured-products',
  );
  const products = data?.products ?? [];

  let content = <ProductGrid products={products} loading={loading} skeletonCount={8} />;
  if (error) content = <ErrorState message={error} onRetry={reload} />;
  else if (!loading && products.length === 0) {
    content = (
      <EmptyState
        icon={ShoppingBag}
        title="No featured products yet"
        message="Check back soon, or browse the full catalog."
        action={
          <Link to="/products" className="btn btn-primary">
            Browse products
          </Link>
        }
      />
    );
  }

  return (
    <section className="border-y border-slate-200/70 bg-white py-16 sm:py-20">
      <div className="container-page">
        <SectionHeader
          eyebrow="Featured"
          title="Featured products"
          subtitle="Hand-picked favourites our customers love."
          link={{ to: '/products', label: 'Shop all products' }}
        />
        <div className="mt-8">{content}</div>
      </div>
    </section>
  );
}

function PromoBanner() {
  return (
    <section className="container-page py-16 sm:py-20">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-6 py-10 text-white sm:px-12 sm:py-14">
        <div aria-hidden="true" className="absolute -top-20 -right-10 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
        <div aria-hidden="true" className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-indigo-400/30 blur-3xl" />
        <div className="relative grid items-center gap-8 md:grid-cols-[1.3fr_1fr]">
          <div>
            <span className="badge bg-white/15 text-white ring-1 ring-white/25">Category spotlight</span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">Level up your setup</h2>
            <p className="mt-3 max-w-lg text-blue-100">
              Mechanical keyboards, precision mice and wireless controllers - everything you need for your next session.
            </p>
            <Link to="/products?category=Gaming" className="btn btn-lg group mt-7 bg-white text-blue-700 shadow-lg hover:bg-blue-50">
              Shop Gaming
              <ArrowRight className="h-5 w-5 transition group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </div>
          <div className="relative hidden h-56 md:block" aria-hidden="true">
            <ProductImage src="/images/products/mechanical-keyboard.svg" alt="" className="absolute top-0 right-10 h-56 w-56 object-contain drop-shadow-2xl" />
            <ProductImage src="/images/products/gaming-mouse.svg" alt="" className="absolute right-0 -bottom-6 h-36 w-36 object-contain drop-shadow-2xl" />
          </div>
        </div>
      </div>
    </section>
  );
}

function Benefits() {
  return (
    <section className="container-page pb-20">
      <SectionHeader eyebrow="Why ShopSphere" title="Shopping made simple" subtitle="Everything we do is designed around a smooth, secure experience." />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {BENEFITS.map(({ icon: Icon, title, text, color }) => (
          <div key={title} className="card p-6 transition hover:-translate-y-0.5 hover:shadow-md">
            <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${color}`}>
              <Icon className="h-6 w-6" aria-hidden="true" />
            </span>
            <h3 className="mt-5 text-base font-bold text-slate-900">{title}</h3>
            <p className="mt-1.5 text-sm text-slate-500">{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      <PageTitle />
      <Hero />
      <CategoriesSection />
      <FeaturedProducts />
      <PromoBanner />
      <Benefits />
    </>
  );
}
