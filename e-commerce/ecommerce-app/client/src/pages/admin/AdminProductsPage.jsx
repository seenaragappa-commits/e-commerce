import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { PackagePlus, PackageSearch, Pencil, Search, Star, Trash2 } from 'lucide-react';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import ConfirmDialog from '../../components/ConfirmDialog';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import PageTitle from '../../components/PageTitle';
import Pagination from '../../components/Pagination';
import ProductImage from '../../components/ProductImage';
import { PageLoader } from '../../components/Spinner';
import StockBadge from '../../components/StockBadge';
import { useToast } from '../../context/ToastContext';
import useFetch from '../../hooks/useFetch';
import { deleteProduct, getProducts } from '../../services/productService';
import { CATEGORIES, LOW_STOCK_THRESHOLD } from '../../utils/constants';
import { formatPrice, pluralize } from '../../utils/format';
import { getErrorMessage } from '../../utils/getErrorMessage';
import { withChanges } from '../../utils/searchParams';

const PAGE_SIZE = 10;

const STOCK_FILTERS = [
  { value: '', label: 'All stock' },
  { value: 'in', label: 'In stock' },
  { value: 'low', label: `Low stock (1-${LOW_STOCK_THRESHOLD})` },
  { value: 'out', label: 'Out of Stock' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'name', label: 'Name: A to Z' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'stock-asc', label: 'Stock: lowest first' },
  { value: 'rating', label: 'Rating: highest first' },
];

const THUMBNAIL_CLASS = 'shrink-0 rounded-lg bg-gradient-to-b from-slate-50 to-slate-100 object-cover ring-1 ring-slate-200/70';

function ProductSearch({ initialValue, onSearch }) {
  const [query, setQuery] = useState(initialValue);

  return (
    <form
      role="search"
      className="relative flex-1"
      onSubmit={(event) => {
        event.preventDefault();
        onSearch(query.trim());
      }}
    >
      <label htmlFor="admin-product-search" className="sr-only">
        Search products
      </label>
      <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
      <input
        id="admin-product-search"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search products..."
        className="input pl-10"
      />
    </form>
  );
}

function RatingCell({ rating }) {
  if (!rating) return <span className="text-xs text-slate-400">No rating</span>;
  return (
    <span className="inline-flex items-center gap-1 font-semibold text-slate-900 tabular-nums">
      <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
      {rating.toFixed(1)}
      <span className="sr-only"> out of 5</span>
    </span>
  );
}

function RowActions({ product, onDelete }) {
  return (
    <div className="flex justify-end gap-2">
      <Link to={`/admin/products/edit/${product._id}`} className="btn btn-secondary btn-sm" aria-label={`Edit ${product.name}`}>
        <Pencil className="h-4 w-4" aria-hidden="true" />
        Edit
      </Link>
      <button
        type="button"
        onClick={() => onDelete(product)}
        className="btn btn-danger-ghost btn-sm ring-1 ring-red-200"
        aria-label={`Delete ${product.name}`}
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
        Delete
      </button>
    </div>
  );
}

export default function AdminProductsPage() {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const keyword = searchParams.get('keyword') ?? '';
  const category = searchParams.get('category') ?? '';
  const stock = searchParams.get('stock') ?? '';
  const sort = searchParams.get('sort') ?? 'newest';
  const page = Math.max(1, Number.parseInt(searchParams.get('page'), 10) || 1);

  const { data, loading, error, reload } = useFetch(
    () => getProducts({ keyword, category, stock, sort, page, limit: PAGE_SIZE }),
    `admin-products?${searchParams.toString()}`,
  );
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const updateParams = (changes) => setSearchParams(withChanges(changes, { sort: 'newest' }));

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteProduct(productToDelete._id);
      toast.success(`"${productToDelete.name}" was deleted`);
      setProductToDelete(null);
      // Deleted the last product on this page? Go back one page.
      if (data.products.length === 1 && page > 1) updateParams({ page: page - 1 });
      else reload();
    } catch (deleteError) {
      toast.error(getErrorMessage(deleteError));
    } finally {
      setDeleting(false);
    }
  };

  if (loading && !data) return <PageLoader label="Loading products..." />;

  const products = data?.products ?? [];
  const hasFilters = Boolean(keyword || category || stock);

  let content;
  if (error) {
    content = <ErrorState message={error} onRetry={reload} />;
  } else if (products.length === 0) {
    content = (
      <EmptyState
        icon={PackageSearch}
        title={hasFilters ? 'No products match these filters' : 'No products yet'}
        message={hasFilters ? 'Try a different keyword, category or stock level.' : 'Add your first product to start selling.'}
        action={
          hasFilters ? (
            <button type="button" onClick={() => setSearchParams(new URLSearchParams())} className="btn btn-secondary">
              Clear filters
            </button>
          ) : (
            <Link to="/admin/products/new" className="btn btn-primary">
              <PackagePlus className="h-4 w-4" aria-hidden="true" /> Add product
            </Link>
          )
        }
      />
    );
  } else {
    content = (
      <div className={`transition-opacity ${loading ? 'opacity-60' : ''}`}>
        {/* Table on wide screens (1280px+) */}
        <div className="card hidden overflow-x-auto xl:block">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs font-bold tracking-wider text-slate-500 uppercase">
                <th className="w-20 px-5 py-3">Image</th>
                <th className="px-3 py-3">Name</th>
                <th className="px-3 py-3">Category</th>
                <th className="px-3 py-3 text-right">Price</th>
                <th className="px-3 py-3">Stock</th>
                <th className="px-3 py-3">Rating</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((product) => (
                <tr key={product._id} className="transition hover:bg-slate-50/70">
                  <td className="px-5 py-3">
                    <ProductImage src={product.image} alt="" className={`h-12 w-12 ${THUMBNAIL_CLASS}`} />
                  </td>
                  <td className="max-w-72 px-3 py-3">
                    <Link to={`/products/${product._id}`} className="line-clamp-2 font-semibold text-slate-900 hover:text-blue-600" title="View in store">
                      {product.name}
                    </Link>
                    <p className="mt-0.5 flex items-center gap-2 font-mono text-xs text-slate-400 uppercase">
                      #{product._id.slice(-8)}
                      {product.isFeatured && (
                        <span className="badge bg-amber-50 px-2 py-0 font-sans text-[11px] text-amber-700 normal-case ring-1 ring-amber-600/20">
                          Featured
                        </span>
                      )}
                    </p>
                  </td>
                  <td className="px-3 py-3 text-slate-600">{product.category}</td>
                  <td className="px-3 py-3 text-right font-semibold text-slate-900 tabular-nums">{formatPrice(product.price)}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <span className="w-9 font-semibold text-slate-900 tabular-nums">{product.stock}</span>
                      <StockBadge stock={product.stock} />
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <RatingCell rating={product.rating} />
                  </td>
                  <td className="px-5 py-3">
                    <RowActions product={product} onDelete={setProductToDelete} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Cards on phones, tablets and small laptops (two columns from 768px) */}
        <ul className="grid gap-3 md:grid-cols-2 xl:hidden">
          {products.map((product) => (
            <li key={product._id} className="card flex flex-col p-4">
              <div className="mb-3 flex gap-3">
                <ProductImage src={product.image} alt="" className={`h-16 w-16 ${THUMBNAIL_CLASS}`} />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-[11px] font-bold tracking-wider text-blue-600 uppercase">
                    {product.category}
                    {product.isFeatured && (
                      <span className="badge bg-amber-50 px-2 py-0 text-[11px] tracking-normal text-amber-700 normal-case ring-1 ring-amber-600/20">
                        Featured
                      </span>
                    )}
                  </p>
                  <Link to={`/products/${product._id}`} className="line-clamp-2 text-sm font-semibold text-slate-900 hover:text-blue-600">
                    {product.name}
                  </Link>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm">
                    <span className="font-bold text-slate-900">{formatPrice(product.price)}</span>
                    <RatingCell rating={product.rating} />
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <StockBadge stock={product.stock} />
                    <span className="text-xs text-slate-500">{pluralize(product.stock, 'unit')} in stock</span>
                  </div>
                </div>
              </div>
              <div className="mt-auto border-t border-slate-100 pt-3">
                <RowActions product={product} onDelete={setProductToDelete} />
              </div>
            </li>
          ))}
        </ul>

        <Pagination page={data.page} pages={data.pages} onPageChange={(nextPage) => updateParams({ page: nextPage })} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageTitle title="Manage products" />
      <AdminPageHeader
        title="Products"
        description={data ? `${pluralize(data.total, 'product')} ${hasFilters ? (data.total === 1 ? 'matches your filters' : 'match your filters') : 'in the catalog'}` : 'Manage your catalog'}
        actions={
          <Link to="/admin/products/new" className="btn btn-primary">
            <PackagePlus className="h-4 w-4" aria-hidden="true" />
            Add product
          </Link>
        }
      />

      <div className="space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row">
          <ProductSearch key={keyword} initialValue={keyword} onSearch={(value) => updateParams({ keyword: value })} />
          <div className="grid grid-cols-2 gap-3 lg:flex">
            <label htmlFor="admin-category-filter" className="sr-only">
              Filter by category
            </label>
            <select
              id="admin-category-filter"
              value={category}
              onChange={(event) => updateParams({ category: event.target.value })}
              className="input cursor-pointer lg:w-48"
            >
              <option value="">All categories</option>
              {CATEGORIES.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <label htmlFor="admin-product-sort" className="sr-only">
              Sort products
            </label>
            <select
              id="admin-product-sort"
              value={sort}
              onChange={(event) => updateParams({ sort: event.target.value })}
              className="input cursor-pointer lg:w-52"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Filter by stock level">
          {STOCK_FILTERS.map((filter) => {
            const selected = stock === filter.value;
            return (
              <button
                key={filter.value || 'all'}
                type="button"
                onClick={() => updateParams({ stock: filter.value })}
                aria-pressed={selected}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                  selected ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      {content}

      <ConfirmDialog
        open={Boolean(productToDelete)}
        title="Delete this product?"
        message={`"${productToDelete?.name}" will be removed from the catalog and can no longer be ordered. Existing orders keep their own copy of the product details. This cannot be undone.`}
        confirmLabel="Delete product"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setProductToDelete(null)}
      />
    </div>
  );
}
