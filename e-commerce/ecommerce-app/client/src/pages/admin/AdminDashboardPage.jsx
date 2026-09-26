import { Link } from 'react-router';
import {
  ArrowRight,
  CircleCheckBig,
  ClipboardList,
  Clock,
  DollarSign,
  Package,
  PackageOpen,
  PackagePlus,
  PackageX,
  RefreshCw,
  Truck,
  Users,
} from 'lucide-react';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import CategorySalesChart from '../../components/admin/CategorySalesChart';
import SalesChart from '../../components/admin/SalesChart';
import StatCard from '../../components/StatCard';
import StatusBreakdown from '../../components/admin/StatusBreakdown';
import ErrorState from '../../components/ErrorState';
import PageTitle from '../../components/PageTitle';
import ProductImage from '../../components/ProductImage';
import Rating from '../../components/Rating';
import { PageLoader } from '../../components/Spinner';
import StockBadge from '../../components/StockBadge';
import { OrderStatusBadge } from '../../components/StatusBadges';
import { useAuth } from '../../context/AuthContext';
import useFetch from '../../hooks/useFetch';
import { getDashboardStats } from '../../services/adminService';
import { formatDate, formatPrice, pluralize } from '../../utils/format';

// The four order-pipeline cards. Each one groups the statuses listed in stats.orderStages.
const STAGE_CARDS = [
  { key: 'pending', label: 'Pending orders', detail: 'Placed or confirmed', icon: Clock, color: 'bg-sky-50 text-sky-600' },
  { key: 'processing', label: 'Processing orders', detail: 'Being packed', icon: PackageOpen, color: 'bg-indigo-50 text-indigo-600' },
  { key: 'shipped', label: 'Shipped orders', detail: 'Shipped or out for delivery', icon: Truck, color: 'bg-violet-50 text-violet-600' },
  { key: 'delivered', label: 'Delivered orders', detail: 'Completed', icon: CircleCheckBig, color: 'bg-emerald-50 text-emerald-600' },
];

const ordersLink = (statuses) => `/admin/orders?status=${encodeURIComponent(statuses.join(','))}`;

function SectionCard({ id, title, subtitle, action, children, className = '' }) {
  return (
    <section className={`card overflow-hidden ${className}`} aria-labelledby={id}>
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
        <div>
          <h2 id={id} className="text-base font-bold text-slate-900">
            {title}
          </h2>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function ViewAllLink({ to, children = 'View all' }) {
  return (
    <Link to={to} className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700">
      {children} <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </Link>
  );
}

function RecentOrders({ orders }) {
  if (orders.length === 0) return <p className="px-6 py-10 text-center text-sm text-slate-500">No orders yet.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px] text-sm">
        <thead>
          <tr className="bg-slate-50 text-left text-xs font-bold tracking-wider text-slate-500 uppercase">
            <th className="px-5 py-3 sm:px-6">Order ID</th>
            <th className="px-3 py-3">Customer</th>
            <th className="px-3 py-3">Date</th>
            <th className="px-3 py-3 text-right">Total</th>
            <th className="px-5 py-3 sm:px-6">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {orders.map((order) => (
            <tr key={order._id} className="transition hover:bg-slate-50/70">
              <td className="px-5 py-3 sm:px-6">
                <Link to={`/admin/orders/${order._id}`} className="font-mono text-xs font-bold text-blue-700 hover:underline">
                  {order.orderNumber}
                </Link>
              </td>
              <td className="px-3 py-3">
                <p className="font-medium text-slate-900">{order.user?.name ?? order.shippingAddress.fullName}</p>
                <p className="text-xs text-slate-500">{order.user?.email ?? order.shippingAddress.email}</p>
              </td>
              <td className="px-3 py-3 whitespace-nowrap text-slate-600">{formatDate(order.createdAt)}</td>
              <td className="px-3 py-3 text-right font-semibold whitespace-nowrap text-slate-900 tabular-nums">{formatPrice(order.totalPrice)}</td>
              <td className="px-5 py-3 sm:px-6">
                <OrderStatusBadge status={order.orderStatus} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LowStockList({ products }) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center px-6 py-10 text-center">
        <PackageX className="h-8 w-8 text-slate-300" aria-hidden="true" />
        <p className="mt-2 text-sm text-slate-500">Everything is well stocked.</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-slate-100">
      {products.map((product) => (
        <li key={product._id} className="flex items-center gap-3 px-5 py-3 sm:px-6">
          <ProductImage
            src={product.image}
            alt=""
            className="h-11 w-11 shrink-0 rounded-lg bg-gradient-to-b from-slate-50 to-slate-100 object-cover ring-1 ring-slate-200/70"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">{product.name}</p>
            <div className="mt-1 flex items-center gap-2">
              <StockBadge stock={product.stock} />
              <span className="text-xs text-slate-500">{pluralize(product.stock, 'unit')}</span>
            </div>
          </div>
          <Link to={`/admin/products/edit/${product._id}`} className="btn btn-secondary btn-sm" aria-label={`Restock ${product.name}`}>
            Restock
          </Link>
        </li>
      ))}
    </ul>
  );
}

function RecentProducts({ products }) {
  if (products.length === 0) return <p className="px-6 py-10 text-center text-sm text-slate-500">No products yet.</p>;

  return (
    <ul className="divide-y divide-slate-100">
      {products.map((product) => (
        <li key={product._id} className="flex items-center gap-3 px-5 py-3 sm:px-6">
          <ProductImage
            src={product.image}
            alt=""
            className="h-12 w-12 shrink-0 rounded-lg bg-gradient-to-b from-slate-50 to-slate-100 object-cover ring-1 ring-slate-200/70"
          />
          <div className="min-w-0 flex-1">
            <Link to={`/admin/products/edit/${product._id}`} className="block truncate text-sm font-semibold text-slate-900 hover:text-blue-600">
              {product.name}
            </Link>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
              <span>{product.category}</span>
              <span>Added {formatDate(product.createdAt)}</span>
              <Rating value={product.rating} />
            </div>
          </div>
          <div className="hidden text-right sm:block">
            <p className="text-sm font-bold text-slate-900">{formatPrice(product.price)}</p>
            <StockBadge stock={product.stock} className="mt-1" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const { data: stats, loading, error, reload } = useFetch(getDashboardStats, 'admin-stats');

  if (loading && !stats) return <PageLoader label="Loading dashboard..." />;
  if (error && !stats) return <ErrorState message={error} onRetry={reload} />;

  const { ordersSummary, orderStages } = stats;
  const inProgress = ordersSummary.pending + ordersSummary.processing + ordersSummary.shipped;

  return (
    <div className={`space-y-6 transition-opacity ${loading ? 'opacity-60' : ''}`}>
      <PageTitle title="Admin Dashboard" />
      <AdminPageHeader
        title="Dashboard"
        description={`Welcome back, ${user.name}. Here's what is happening in your store.`}
        actions={
          <>
            <button type="button" onClick={reload} className="btn btn-secondary" disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
              Refresh
            </button>
            <Link to="/admin/products/new" className="btn btn-primary">
              <PackagePlus className="h-4 w-4" aria-hidden="true" />
              Add product
            </Link>
          </>
        }
      />

      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Could not refresh the dashboard: {error}
        </p>
      )}

      {/* Store totals */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={DollarSign}
          label="Total revenue"
          value={formatPrice(stats.totalRevenue)}
          detail={`Avg. order ${formatPrice(stats.averageOrderValue)} - cancelled excluded`}
          color="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          icon={ClipboardList}
          label="Total orders"
          value={stats.totalOrders.toLocaleString()}
          detail={`${inProgress} in progress - ${ordersSummary.cancelled} cancelled`}
          color="bg-blue-50 text-blue-600"
          to="/admin/orders"
        />
        <StatCard
          icon={Package}
          label="Total products"
          value={stats.totalProducts.toLocaleString()}
          detail={`${stats.lowStockCount} low on stock (${stats.outOfStockCount} out of stock)`}
          color="bg-amber-50 text-amber-600"
          to="/admin/products"
        />
        <StatCard
          icon={Users}
          label="Total customers"
          value={stats.totalCustomers.toLocaleString()}
          detail="Registered customer accounts"
          color="bg-violet-50 text-violet-600"
          to="/admin/users"
        />
      </div>

      {/* Order pipeline */}
      <section aria-labelledby="pipeline-heading">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="pipeline-heading" className="text-sm font-bold tracking-wider text-slate-500 uppercase">
            Orders by stage
          </h2>
          <Link to={ordersLink(orderStages.cancelled)} className="text-sm font-medium text-slate-500 hover:text-slate-900">
            {pluralize(ordersSummary.cancelled, 'cancelled order')}
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {STAGE_CARDS.map((card) => (
            <StatCard
              key={card.key}
              icon={card.icon}
              label={card.label}
              value={ordersSummary[card.key].toLocaleString()}
              detail={card.detail}
              color={card.color}
              to={ordersLink(orderStages[card.key])}
            />
          ))}
        </div>
      </section>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SalesChart days={stats.salesLast7Days} />
        </div>
        <CategorySalesChart categories={stats.salesByCategory} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <SectionCard
          id="recent-orders-heading"
          title="Recent orders"
          subtitle="The latest orders from your customers"
          action={<ViewAllLink to="/admin/orders" />}
          className="xl:col-span-2"
        >
          <RecentOrders orders={stats.recentOrders} />
        </SectionCard>

        <SectionCard
          id="low-stock-heading"
          title="Low stock"
          subtitle={`Products with ${stats.lowStockThreshold} or fewer units left`}
          action={<ViewAllLink to="/admin/products?sort=stock-asc">Inventory</ViewAllLink>}
        >
          <LowStockList products={stats.lowStockProducts} />
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <SectionCard
          id="recent-products-heading"
          title="Recent products"
          subtitle="The newest additions to the catalog"
          action={<ViewAllLink to="/admin/products" />}
          className="xl:col-span-2"
        >
          <RecentProducts products={stats.recentProducts} />
        </SectionCard>

        <StatusBreakdown items={stats.ordersByStatus} />
      </div>
    </div>
  );
}
