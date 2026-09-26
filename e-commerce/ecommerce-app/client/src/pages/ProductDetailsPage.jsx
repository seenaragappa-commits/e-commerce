import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ArrowRight, CalendarDays, PackageSearch, PackageX, ShieldCheck, ShoppingCart, Truck, Zap } from 'lucide-react';
import Breadcrumbs from '../components/Breadcrumbs';
import EmptyState from '../components/EmptyState';
import PageTitle from '../components/PageTitle';
import ProductGrid from '../components/ProductGrid';
import ProductImage from '../components/ProductImage';
import QuantitySelector from '../components/QuantitySelector';
import Rating from '../components/Rating';
import StockBadge from '../components/StockBadge';
import { useCart } from '../context/CartContext';
import useFetch from '../hooks/useFetch';
import { getProduct, getProducts } from '../services/productService';
import { FREE_SHIPPING_THRESHOLD } from '../utils/constants';
import { formatPrice } from '../utils/format';

const PERKS = [
  { icon: Truck, text: `Free shipping on orders over ${formatPrice(FREE_SHIPPING_THRESHOLD)}` },
  { icon: CalendarDays, text: 'Delivered in about 5 days' },
  { icon: ShieldCheck, text: 'Secure checkout' },
  { icon: PackageSearch, text: 'Live order tracking' },
];

function ProductDetailsSkeleton() {
  return (
    <div className="container-page py-8" role="status" aria-label="Loading product">
      <div className="h-4 w-64 animate-pulse rounded bg-slate-200" />
      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="aspect-square animate-pulse rounded-3xl bg-slate-200/70" />
        <div className="space-y-5">
          <div className="h-6 w-28 animate-pulse rounded-full bg-slate-200" />
          <div className="h-10 w-4/5 animate-pulse rounded-lg bg-slate-200" />
          <div className="h-5 w-48 animate-pulse rounded bg-slate-200" />
          <div className="h-12 w-40 animate-pulse rounded-lg bg-slate-200" />
          <div className="space-y-2 pt-4">
            <div className="h-4 animate-pulse rounded bg-slate-200" />
            <div className="h-4 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
          </div>
          <div className="h-40 animate-pulse rounded-2xl bg-slate-200/70" />
        </div>
      </div>
    </div>
  );
}

function RelatedProducts({ category, excludeId }) {
  const { data, loading } = useFetch(() => getProducts({ category, sort: 'rating', limit: 5 }), `related:${category}`);
  const products = (data?.products ?? []).filter((product) => product._id !== excludeId).slice(0, 4);

  if (!loading && products.length === 0) return null;

  return (
    <section className="mt-16 border-t border-slate-200 pt-12">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="section-title">You may also like</h2>
          <p className="section-subtitle">More top picks from {category}</p>
        </div>
        <Link to={`/products?category=${encodeURIComponent(category)}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700">
          View all {category}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
      <div className="mt-6">
        <ProductGrid products={products} loading={loading} skeletonCount={4} columns="grid-cols-2 lg:grid-cols-4" />
      </div>
    </section>
  );
}

function ProductDetails({ productId }) {
  const navigate = useNavigate();
  const { addToCart, getItemQuantity } = useCart();
  const { data: product, loading, error, reload } = useFetch(() => getProduct(productId), `product:${productId}`);
  const [quantity, setQuantity] = useState(1);

  if (loading) return <ProductDetailsSkeleton />;

  if (error || !product) {
    return (
      <div className="container-page py-16">
        <PageTitle title="Product not available" />
        <EmptyState
          icon={PackageX}
          title="Product not available"
          message={error || 'This product could not be found.'}
          action={
            <>
              <button type="button" onClick={reload} className="btn btn-secondary">
                Try again
              </button>
              <Link to="/products" className="btn btn-primary">
                Browse products
              </Link>
            </>
          }
        />
      </div>
    );
  }

  const inCart = getItemQuantity(product._id);
  const outOfStock = product.stock <= 0;
  // You can't add more than what is left after the units already in your cart.
  const available = Math.max(0, product.stock - inCart);
  const selectedQuantity = Math.min(quantity, Math.max(available, 1));

  const handleAddToCart = () => {
    if (addToCart(product, selectedQuantity)) setQuantity(1);
  };

  const handleBuyNow = () => {
    if (available > 0) addToCart(product, selectedQuantity);
    navigate('/checkout');
  };

  return (
    <>
      <PageTitle title={product.name} />
      <div className="container-page py-8">
        <Breadcrumbs
          items={[
            { label: 'Products', to: '/products' },
            { label: product.category, to: `/products?category=${encodeURIComponent(product.category)}` },
            { label: product.name },
          ]}
        />

        <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Large product image */}
          <div>
            <div className="relative aspect-square overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-100 shadow-sm lg:sticky lg:top-24">
              <ProductImage
                src={product.image}
                alt={product.name}
                className={`h-full w-full animate-fade-in object-cover ${outOfStock ? 'opacity-60 grayscale' : ''}`}
              />
              {product.isFeatured && (
                <span className="badge absolute top-4 left-4 bg-white/90 text-blue-700 shadow-sm ring-1 ring-blue-600/10">Featured</span>
              )}
            </div>
          </div>

          {/* Product information */}
          <div>
            <Link
              to={`/products?category=${encodeURIComponent(product.category)}`}
              className="badge bg-blue-50 text-blue-700 ring-1 ring-blue-600/10 transition hover:bg-blue-100"
            >
              {product.category}
            </Link>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">{product.name}</h1>
            <Rating value={product.rating} count={product.numReviews} size="lg" className="mt-3" />

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <p className="text-4xl font-extrabold tracking-tight text-slate-900">{formatPrice(product.price)}</p>
              <StockBadge stock={product.stock} className="px-3 py-1 text-sm" />
            </div>
            <p className="mt-1.5 text-sm text-slate-500">
              {product.price >= FREE_SHIPPING_THRESHOLD
                ? 'This item qualifies for free shipping.'
                : `Add ${formatPrice(FREE_SHIPPING_THRESHOLD - product.price)} more to your order for free shipping.`}
            </p>

            <p className="mt-6 leading-7 text-slate-600">{product.description}</p>

            {/* Purchase box */}
            <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              {outOfStock ? (
                <div className="flex items-start gap-3 text-sm">
                  <PackageX className="h-5 w-5 shrink-0 text-red-500" aria-hidden="true" />
                  <div>
                    <p className="font-semibold text-slate-900">Out of Stock</p>
                    <p className="mt-0.5 text-slate-500">This product will be available again soon. Explore similar items below.</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="font-semibold text-slate-900">Quantity</span>
                    <span className="text-slate-500">
                      {product.stock} available
                      {inCart > 0 && ` - ${inCart} already in your cart`}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                    <div className="flex items-center justify-between gap-3">
                      <QuantitySelector
                        value={selectedQuantity}
                        max={Math.max(available, 1)}
                        onChange={setQuantity}
                        disabled={available === 0}
                      />
                      <p className="text-sm text-slate-500 sm:hidden">
                        Total: <span className="font-bold text-slate-900">{formatPrice(product.price * selectedQuantity)}</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      disabled={available === 0}
                      className="btn btn-primary btn-lg min-w-0 flex-1 whitespace-normal"
                    >
                      <ShoppingCart className="h-5 w-5 shrink-0" aria-hidden="true" />
                      {available === 0 ? 'All in your cart' : 'Add to Cart'}
                    </button>
                  </div>
                  <button type="button" onClick={handleBuyNow} className="btn btn-secondary btn-lg mt-3 w-full">
                    <Zap className="h-5 w-5 text-amber-500" aria-hidden="true" />
                    Buy Now
                  </button>
                  {inCart > 0 && (
                    <Link to="/cart" className="mt-4 flex items-center justify-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700">
                      View cart ({inCart} {inCart === 1 ? 'unit' : 'units'})
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  )}
                </>
              )}
            </div>

            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {PERKS.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-sm font-medium text-slate-700 ring-1 ring-slate-200/80">
                  <Icon className="h-5 w-5 shrink-0 text-blue-600" aria-hidden="true" />
                  {text}
                </li>
              ))}
            </ul>

            <dl className="mt-6 divide-y divide-slate-100 rounded-2xl bg-white text-sm ring-1 ring-slate-200/80">
              <div className="flex justify-between gap-4 px-4 py-3">
                <dt className="text-slate-500">Category</dt>
                <dd className="font-semibold text-slate-900">{product.category}</dd>
              </div>
              <div className="flex justify-between gap-4 px-4 py-3">
                <dt className="text-slate-500">Availability</dt>
                <dd className={`font-semibold ${outOfStock ? 'text-red-600' : 'text-slate-900'}`}>
                  {outOfStock ? 'Out of Stock' : `${product.stock} in stock`}
                </dd>
              </div>
              <div className="flex justify-between gap-4 px-4 py-3">
                <dt className="text-slate-500">Customer rating</dt>
                <dd className="font-semibold text-slate-900">
                  {product.rating > 0
                    ? `${product.rating.toFixed(1)} / 5${product.numReviews > 0 ? ` (${product.numReviews} ratings)` : ''}`
                    : 'No reviews yet'}
                </dd>
              </div>
              <div className="flex justify-between gap-4 px-4 py-3">
                <dt className="text-slate-500">Product code</dt>
                <dd className="font-mono text-xs font-semibold text-slate-900 uppercase">{product._id.slice(-8)}</dd>
              </div>
            </dl>
          </div>
        </div>

        <RelatedProducts category={product.category} excludeId={product._id} />
      </div>
    </>
  );
}

export default function ProductDetailsPage() {
  const { id } = useParams();
  // The key resets the page (e.g. the chosen quantity) when moving to another product.
  return <ProductDetails key={id} productId={id} />;
}
