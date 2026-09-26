import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { ArrowLeft, Banknote, Check, CircleAlert, CreditCard, Info, Lock, MapPin } from 'lucide-react';
import InputField from '../components/InputField';
import PageTitle from '../components/PageTitle';
import PriceSummary from '../components/PriceSummary';
import ProductImage from '../components/ProductImage';
import { Spinner } from '../components/Spinner';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { createOrder } from '../services/orderService';
import { PAYMENT_METHODS, STORAGE_KEYS } from '../utils/constants';
import { formatPrice } from '../utils/format';
import { getErrorMessage, getFieldErrors } from '../utils/getErrorMessage';
import { readJSON, removeItem, writeJSON } from '../utils/storage';
import { validateShipping } from '../utils/validation';

const EMPTY_ADDRESS = {
  fullName: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
};

const PAYMENT_ICONS = { 'Cash on Delivery': Banknote, 'Demo Card': CreditCard };

// The saved address is stored per user, so people sharing a computer don't see each other's address.
const addressKey = (userId) => `${STORAGE_KEYS.shippingAddress}:${userId}`;

const loadInitialAddress = (user) => {
  const saved = readJSON(addressKey(user._id), {});
  const address = { ...EMPTY_ADDRESS, fullName: user.name, email: user.email };
  Object.keys(EMPTY_ADDRESS).forEach((field) => {
    if (typeof saved?.[field] === 'string' && saved[field]) address[field] = saved[field];
  });
  return address;
};

const trimAll = (values) => Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value.trim()]));

function CheckoutSteps() {
  const steps = [
    { label: 'Cart', state: 'done' },
    { label: 'Shipping & Payment', state: 'current' },
    { label: 'Confirmation', state: 'upcoming' },
  ];

  return (
    <ol className="flex items-center gap-2 text-xs font-semibold sm:gap-3 sm:text-sm" aria-label="Checkout progress">
      {steps.map((step, index) => (
        <li key={step.label} className="flex items-center gap-2 sm:gap-3">
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${
              step.state === 'done'
                ? 'bg-emerald-500 text-white'
                : step.state === 'current'
                  ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                  : 'border-2 border-slate-200 bg-white text-slate-400'
            }`}
          >
            {step.state === 'done' ? <Check className="h-4 w-4" strokeWidth={3} /> : index + 1}
          </span>
          {/* On phones only the current step's label is shown, so the bar fits the screen. */}
          <span
            className={`${step.state === 'upcoming' ? 'text-slate-400' : 'text-slate-900'} ${step.state === 'current' ? '' : 'sr-only sm:not-sr-only'}`}
            aria-current={step.state === 'current' ? 'step' : undefined}
          >
            {step.label}
          </span>
          {index < steps.length - 1 && <span className="h-px w-5 bg-slate-300 sm:w-12" aria-hidden="true" />}
        </li>
      ))}
    </ol>
  );
}

function DemoCardPreview({ name }) {
  return (
    <div className="relative aspect-[1.586/1] w-full max-w-xs overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-slate-900 to-blue-950 p-5 text-white shadow-xl shadow-slate-900/20">
      <div aria-hidden="true" className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-blue-500/25 blur-2xl" />
      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-start justify-between">
          <span className="rounded-md bg-amber-400 px-2 py-0.5 text-[10px] font-extrabold tracking-widest text-amber-950">DEMO CARD</span>
          <span className="text-sm font-extrabold tracking-tight italic">ShopSphere</span>
        </div>
        <div className="h-7 w-10 rounded-md bg-gradient-to-br from-amber-200 to-amber-500" aria-hidden="true" />
        <p className="font-mono text-sm tracking-[0.12em] whitespace-nowrap sm:text-lg sm:tracking-[0.2em]" aria-label="Demo card ending in 4242">
          •••• •••• •••• 4242
        </p>
        <div className="flex items-end justify-between text-[10px] uppercase">
          <div className="min-w-0">
            <p className="text-slate-400">Card holder</p>
            <p className="mt-0.5 truncate text-xs font-semibold tracking-wide">{name || 'Your name'}</p>
          </div>
          <div className="text-right">
            <p className="text-slate-400">Valid thru</p>
            <p className="mt-0.5 text-xs font-semibold">12/30</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const { user } = useAuth();
  const { cartItems, itemCount, subtotal, shipping, total, clearCart, syncCart } = useCart();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState(() => loadInitialAddress(user));
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0].value);
  const [saveAddress, setSaveAddress] = useState(true);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  // Make sure prices and stock are up to date before the customer pays.
  useEffect(() => {
    syncCart();
  }, [syncCart]);

  // Nothing to check out (unless we just placed the order and are redirecting).
  if (cartItems.length === 0 && !orderPlaced) return <Navigate to="/cart" replace />;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerError('');

    const validationErrors = validateShipping(form);
    setErrors(validationErrors);
    const firstInvalidField = Object.keys(validationErrors)[0];
    if (firstInvalidField) {
      document.getElementById(firstInvalidField)?.focus();
      toast.error('Please complete the highlighted fields');
      return;
    }

    setSubmitting(true);
    try {
      const shippingAddress = trimAll(form);
      // Only product ids and quantities are sent - the server calculates the real prices.
      const order = await createOrder({ cartItems, shippingAddress, paymentMethod });

      if (saveAddress) writeJSON(addressKey(user._id), shippingAddress);
      else removeItem(addressKey(user._id));

      setOrderPlaced(true);
      clearCart();
      toast.success('Order placed successfully!');
      navigate(`/order-success/${order._id}`, { replace: true });
    } catch (error) {
      setServerError(getErrorMessage(error));
      setErrors(getFieldErrors(error));
      // Stock or availability changed: refresh the cart so the customer can review it.
      if ([404, 409].includes(error.response?.status)) syncCart();
      setSubmitting(false);
    }
  };

  const isDemoCard = paymentMethod === 'Demo Card';

  return (
    <>
      <PageTitle title="Checkout" />
      <div className="container-page py-8 sm:py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Checkout</h1>
            <p className="mt-2 text-sm text-slate-500">Almost there! Tell us where to deliver your order.</p>
          </div>
          <CheckoutSteps />
        </div>

        {serverError && (
          <div role="alert" className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-semibold">We couldn&apos;t place your order</p>
              <p className="mt-0.5">{serverError}</p>
            </div>
          </div>
        )}

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_400px]">
          <form id="checkout-form" onSubmit={handleSubmit} noValidate className="space-y-8">
            {/* Shipping information */}
            <section className="card p-5 sm:p-7" aria-labelledby="shipping-heading">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <MapPin className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 id="shipping-heading" className="text-lg font-bold text-slate-900">
                    Shipping information
                  </h2>
                  <p className="text-xs text-slate-500">All fields are required</p>
                </div>
              </div>

              <div className="mt-6 grid gap-5 sm:grid-cols-6">
                <InputField className="sm:col-span-3" label="Full name" name="fullName" autoComplete="name" value={form.fullName} onChange={handleChange} error={errors.fullName} />
                <InputField className="sm:col-span-3" label="Email" name="email" type="email" autoComplete="email" value={form.email} onChange={handleChange} error={errors.email} />
                <InputField className="sm:col-span-3" label="Phone" name="phone" type="tel" autoComplete="tel" placeholder="+1 555 123 4567" value={form.phone} onChange={handleChange} error={errors.phone} />
                <InputField className="sm:col-span-3" label="Country" name="country" autoComplete="country-name" placeholder="United States" value={form.country} onChange={handleChange} error={errors.country} />
                <InputField className="sm:col-span-6" label="Street address" name="address" autoComplete="street-address" placeholder="House number, street, apartment" value={form.address} onChange={handleChange} error={errors.address} />
                <InputField className="sm:col-span-2" label="City" name="city" autoComplete="address-level2" value={form.city} onChange={handleChange} error={errors.city} />
                <InputField className="sm:col-span-2" label="State" name="state" autoComplete="address-level1" value={form.state} onChange={handleChange} error={errors.state} />
                <InputField className="sm:col-span-2" label="Postal code" name="postalCode" autoComplete="postal-code" value={form.postalCode} onChange={handleChange} error={errors.postalCode} />
              </div>

              <label className="mt-6 flex cursor-pointer items-center gap-3 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={saveAddress}
                  onChange={(event) => setSaveAddress(event.target.checked)}
                  className="h-4 w-4 cursor-pointer accent-blue-600"
                />
                Save this address for my next order
              </label>
            </section>

            {/* Payment */}
            <section className="card p-5 sm:p-7" aria-labelledby="payment-heading">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <CreditCard className="h-5 w-5" aria-hidden="true" />
                </span>
                <h2 id="payment-heading" className="text-lg font-bold text-slate-900">
                  Payment method
                </h2>
              </div>

              <fieldset className="mt-6">
                <legend className="sr-only">Choose a payment method</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {PAYMENT_METHODS.map((method) => {
                    const selected = paymentMethod === method.value;
                    const Icon = PAYMENT_ICONS[method.value];
                    return (
                      <label
                        key={method.value}
                        className={`relative flex cursor-pointer gap-3 rounded-2xl border-2 p-4 transition ${
                          selected ? 'border-blue-600 bg-blue-50/50' : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method.value}
                          checked={selected}
                          onChange={() => setPaymentMethod(method.value)}
                          className="sr-only"
                        />
                        <span
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${selected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}
                        >
                          <Icon className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2 text-sm font-bold text-slate-900">
                            {method.label}
                            {method.value === 'Demo Card' && <span className="badge bg-amber-100 text-amber-800">DEMO</span>}
                          </span>
                          <span className="mt-1 block text-xs text-slate-500">{method.description}</span>
                        </span>
                        <span
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${selected ? 'border-blue-600' : 'border-slate-300'}`}
                          aria-hidden="true"
                        >
                          {selected && <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              {isDemoCard ? (
                <div className="mt-6 grid items-center gap-5 rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200/70 sm:grid-cols-[auto_1fr]">
                  <DemoCardPreview name={form.fullName} />
                  <div className="flex gap-3 text-sm text-slate-600">
                    <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
                    <p>
                      <span className="font-semibold text-slate-900">This is a demo payment.</span> No card details are collected
                      and no money is charged. Your order will simply be marked as <span className="font-semibold">Paid</span>.
                    </p>
                  </div>
                </div>
              ) : (
                <p className="mt-5 flex items-start gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 ring-1 ring-slate-200/70">
                  <Banknote className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
                  Please keep the exact amount ready - you&apos;ll pay the courier when your order is delivered.
                </p>
              )}
            </section>

            <Link to="/cart" className="btn btn-ghost px-2">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to cart
            </Link>
          </form>

          {/* Order summary */}
          <aside>
            <div className="card sticky top-24 p-6">
              <h2 className="text-lg font-bold text-slate-900">Order summary</h2>
              <ul className="mt-5 max-h-80 space-y-4 overflow-y-auto pr-1">
                {cartItems.map((item) => (
                  <li key={item._id} className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      <ProductImage
                        src={item.image}
                        alt={item.name}
                        className="h-16 w-16 rounded-xl bg-gradient-to-b from-slate-50 to-slate-100 object-cover ring-1 ring-slate-200/70"
                      />
                      <span className="absolute -top-2 -right-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-700 px-1 text-[11px] font-bold text-white">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-semibold text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-500">
                        {item.quantity} x {formatPrice(item.price)}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-slate-900">{formatPrice(item.price * item.quantity)}</p>
                  </li>
                ))}
              </ul>

              <div className="mt-6 border-t border-slate-100 pt-5">
                <PriceSummary itemCount={itemCount} subtotal={subtotal} shipping={shipping} total={total} />
              </div>

              <button type="submit" form="checkout-form" className="btn btn-primary btn-lg mt-6 w-full" disabled={submitting}>
                {submitting ? <Spinner className="h-5 w-5" /> : <Lock className="h-5 w-5" aria-hidden="true" />}
                {submitting ? 'Placing your order...' : `Place Order - ${formatPrice(total)}`}
              </button>
              <p className="mt-4 text-center text-xs text-slate-500">
                Prices and stock are verified by our server when you place the order.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
