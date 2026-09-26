import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, ArrowRight, Lock, ShoppingBag, Trash2, Truck } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import PageTitle from '../components/PageTitle';
import PriceSummary from '../components/PriceSummary';
import ProductImage from '../components/ProductImage';
import QuantitySelector from '../components/QuantitySelector';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { FREE_SHIPPING_THRESHOLD, LOW_STOCK_THRESHOLD } from '../utils/constants';
import { formatPrice, pluralize } from '../utils/format';

// Wide cart panel (@2xl container query): Product | Price | Quantity | Subtotal | Remove
const ROW_GRID = 'grid-cols-[minmax(0,1fr)_110px_140px_110px_44px] items-center gap-4';

function CartItemRow({ item, onQuantityChange, onRemove }) {
  const productUrl = `/products/${item._id}`;

  const image = (
    <Link to={productUrl} className="shrink-0 overflow-hidden rounded-xl bg-gradient-to-b from-slate-50 to-slate-100 ring-1 ring-slate-200/70">
      <ProductImage src={item.image} alt={item.name} className="h-20 w-20 object-cover sm:h-24 sm:w-24" />
    </Link>
  );

  const details = (
    <div className="min-w-0 flex-1">
      <p className="text-[11px] font-bold tracking-wider text-blue-600 uppercase">{item.category}</p>
      <Link to={productUrl} className="mt-0.5 line-clamp-2 text-sm font-semibold text-slate-900 hover:text-blue-600 sm:text-base">
        {item.name}
      </Link>
      <p className="mt-1 text-sm text-slate-500 @2xl:hidden">{formatPrice(item.price)} each</p>
      {item.stock <= LOW_STOCK_THRESHOLD && (
        <p className="mt-1 text-xs font-semibold text-amber-600">Only {item.stock} left in stock</p>
      )}
    </div>
  );

  const quantity = (
    <QuantitySelector size="sm" value={item.quantity} max={item.stock} onChange={(value) => onQuantityChange(item, value)} />
  );

  const removeButton = (
    <button
      type="button"
      onClick={() => onRemove(item)}
      className="shrink-0 self-start rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 @2xl:self-center"
      aria-label={`Remove ${item.name} from cart`}
    >
      <Trash2 className="h-5 w-5" />
    </button>
  );

  const lineTotal = formatPrice(item.price * item.quantity);

  return (
    <li className="py-5">
      {/* Phones & tablets: stacked layout */}
      <div className="@2xl:hidden">
        <div className="flex gap-4">
          {image}
          {details}
          {removeButton}
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          {quantity}
          <p className="text-base font-bold text-slate-900">{lineTotal}</p>
        </div>
      </div>

      {/* Desktop: table-like row */}
      <div className={`hidden @2xl:grid ${ROW_GRID}`}>
        <div className="flex min-w-0 items-center gap-4">
          {image}
          {details}
        </div>
        <p className="text-sm font-medium text-slate-700">{formatPrice(item.price)}</p>
        <div>{quantity}</div>
        <p className="text-sm font-bold text-slate-900">{lineTotal}</p>
        {removeButton}
      </div>
    </li>
  );
}

function FreeShippingProgress({ subtotal }) {
  const remaining = FREE_SHIPPING_THRESHOLD - subtotal;
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  return (
    <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200/70">
      <p className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <Truck className={`h-4 w-4 ${remaining <= 0 ? 'text-emerald-600' : 'text-blue-600'}`} aria-hidden="true" />
        {remaining <= 0 ? (
          <span>
            You&apos;ve unlocked <span className="font-bold text-emerald-600">free shipping</span>!
          </span>
        ) : (
          <span>
            Add <span className="font-bold text-slate-900">{formatPrice(remaining)}</span> more for free shipping
          </span>
        )}
      </p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100} aria-label="Progress towards free shipping">
        <div
          className={`h-full rounded-full transition-all duration-500 ${remaining <= 0 ? 'bg-emerald-500' : 'bg-blue-600'}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export default function CartPage() {
  const { cartItems, itemCount, subtotal, shipping, total, updateQuantity, removeFromCart, clearCart, syncCart } = useCart();
  const toast = useToast();
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  // Refresh prices and stock from the server when the cart is opened.
  useEffect(() => {
    syncCart();
  }, [syncCart]);

  const handleQuantityChange = (item, quantity) => {
    if (quantity > item.stock) {
      toast.error(`Only ${item.stock} of "${item.name}" available`);
      return;
    }
    updateQuantity(item._id, quantity);
  };

  const handleRemove = (item) => {
    removeFromCart(item._id);
    toast.info(`"${item.name}" was removed from your cart`);
  };

  const handleClearCart = () => {
    clearCart();
    setConfirmClearOpen(false);
    toast.info('Your cart is now empty');
  };

  if (cartItems.length === 0) {
    return (
      <div className="container-page py-16">
        <PageTitle title="Shopping Cart" />
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          message="Looks like you haven't added anything yet. Explore our products and find something you love."
          action={
            <Link to="/products" className="btn btn-primary btn-lg">
              Start shopping
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <>
      <PageTitle title="Shopping Cart" />
      <div className="container-page py-8 sm:py-10">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Shopping Cart</h1>
        <p className="mt-2 text-sm text-slate-500">{pluralize(itemCount, 'item')} in your cart</p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
          <section className="@container card px-4 sm:px-6" aria-label="Cart items">
            <div className={`hidden border-b border-slate-100 py-3 text-xs font-bold tracking-wider text-slate-500 uppercase @2xl:grid ${ROW_GRID}`}>
              <span>Product</span>
              <span>Price</span>
              <span>Quantity</span>
              <span>Subtotal</span>
              <span className="sr-only">Remove</span>
            </div>

            <ul className="divide-y divide-slate-100">
              {cartItems.map((item) => (
                <CartItemRow key={item._id} item={item} onQuantityChange={handleQuantityChange} onRemove={handleRemove} />
              ))}
            </ul>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 py-4 sm:flex-row sm:items-center sm:justify-between">
              <Link to="/products" className="btn btn-ghost justify-start px-2">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Continue shopping
              </Link>
              <button type="button" onClick={() => setConfirmClearOpen(true)} className="btn btn-danger-ghost self-start px-2 sm:self-auto">
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Clear cart
              </button>
            </div>
          </section>

          <aside>
            <div className="card sticky top-24 p-6">
              <h2 className="text-lg font-bold text-slate-900">Order Summary</h2>
              <div className="mt-5">
                <FreeShippingProgress subtotal={subtotal} />
              </div>
              <div className="mt-5">
                <PriceSummary itemCount={itemCount} subtotal={subtotal} shipping={shipping} total={total} estimated />
              </div>
              <Link to="/checkout" className="btn btn-primary btn-lg mt-6 w-full">
                Proceed to Checkout
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Link>
              <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-500">
                <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                Final prices are confirmed securely at checkout
              </p>
            </div>
          </aside>
        </div>
      </div>

      <ConfirmDialog
        open={confirmClearOpen}
        title="Clear your cart?"
        message={
          itemCount === 1 ? 'This will remove the item from your cart.' : `This will remove all ${itemCount} items from your cart.`
        }
        confirmLabel="Clear cart"
        onConfirm={handleClearCart}
        onCancel={() => setConfirmClearOpen(false)}
      />
    </>
  );
}
