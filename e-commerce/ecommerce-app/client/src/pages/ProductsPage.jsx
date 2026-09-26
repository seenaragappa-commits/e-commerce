import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { PackageSearch, Search, SlidersHorizontal, X } from 'lucide-react';
import Breadcrumbs from '../components/Breadcrumbs';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import PageTitle from '../components/PageTitle';
import Pagination from '../components/Pagination';
import ProductFilters from '../components/ProductFilters';
import ProductGrid from '../components/ProductGrid';
import useFetch from '../hooks/useFetch';
import { getCategories, getProducts } from '../services/productService';
import { SORT_OPTIONS } from '../utils/constants';
import { formatPrice, pluralize } from '../utils/format';
import { withChanges } from '../utils/searchParams';

const PAGE_SIZE = 12;

/** Reads every filter from the URL, so filtered pages can be bookmarked and shared. */
const readFilters = (searchParams) => ({
  keyword: searchParams.get('keyword') ?? '',
  category: searchParams.get('category') ?? '',
  minPrice: searchParams.get('minPrice') ?? '',
  maxPrice: searchParams.get('maxPrice') ?? '',
  inStock: searchParams.get('inStock') === 'true',
  sort: searchParams.get('sort') ?? 'newest',
  page: Math.max(1, Number.parseInt(searchParams.get('page'), 10) || 1),
});

function CatalogSearch({ initialValue, onSearch }) {
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
      <label htmlFor="catalog-search" className="sr-only">
        Search in catalog
      </label>
      <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
      <input
        id="catalog-search"
        type="search"
        placeholder="Search by name, description or category..."
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="input pl-10"
      />
    </form>
  );
}

function FilterChip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 py-1 pr-1 pl-3 text-xs font-semibold text-blue-700">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="rounded-full p-0.5 transition hover:bg-blue-100"
        aria-label={`Remove filter ${label}`}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </span>
  );
}

const describePriceFilter = (minPrice, maxPrice) => {
  if (minPrice && maxPrice) return `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`;
  if (minPrice) return `From ${formatPrice(minPrice)}`;
  return `Up to ${formatPrice(maxPrice)}`;
};

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const filters = readFilters(searchParams);

  const { data, loading, error, reload } = useFetch(
    () =>
      getProducts({
        keyword: filters.keyword,
        category: filters.category,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        inStock: filters.inStock ? 'true' : '',
        sort: filters.sort,
        page: filters.page,
        limit: PAGE_SIZE,
      }),
    `products?${searchParams.toString()}`,
  );
  const { data: categories } = useFetch(getCategories, 'categories');

  /** Writes filter changes to the URL. Changing a filter always goes back to page 1. */
  const updateFilters = (changes) => setSearchParams(withChanges(changes, { sort: 'newest' }));

  const resetFilters = () => {
    setSearchParams(new URLSearchParams());
    setMobileFiltersOpen(false);
  };

  const goToPage = (page) => {
    updateFilters({ page });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const products = data?.products ?? [];
  const total = data?.total ?? 0;

  const activeFilters = [];
  if (filters.keyword) activeFilters.push({ key: 'keyword', label: `"${filters.keyword}"`, clear: { keyword: '' } });
  if (filters.category) activeFilters.push({ key: 'category', label: filters.category, clear: { category: '' } });
  if (filters.minPrice || filters.maxPrice) {
    activeFilters.push({
      key: 'price',
      label: describePriceFilter(filters.minPrice, filters.maxPrice),
      clear: { minPrice: '', maxPrice: '' },
    });
  }
  if (filters.inStock) activeFilters.push({ key: 'inStock', label: 'In stock', clear: { inStock: false } });

  let heading = filters.category || 'All Products';
  if (filters.keyword) heading = `Results for "${filters.keyword}"`;

  let results;
  if (error) {
    results = <ErrorState message={error} onRetry={reload} />;
  } else if (!loading && products.length === 0) {
    results = (
      <EmptyState
        icon={PackageSearch}
        title="No products found"
        message="We couldn't find anything matching your filters. Try a different search or remove some filters."
        action={
          <button type="button" onClick={resetFilters} className="btn btn-primary">
            Clear all filters
          </button>
        }
      />
    );
  } else {
    results = (
      <>
        <ProductGrid products={products} loading={loading} skeletonCount={9} columns="grid-cols-2 md:grid-cols-3 lg:grid-cols-3" />
        <Pagination page={data?.page ?? filters.page} pages={data?.pages ?? 1} onPageChange={goToPage} />
      </>
    );
  }

  const filterPanel = (
    <ProductFilters
      filters={filters}
      categories={categories}
      onChange={(changes) => updateFilters(changes)}
      onReset={resetFilters}
    />
  );

  return (
    <>
      <PageTitle title={heading} />

      <div className="border-b border-slate-200/70 bg-white">
        <div className="container-page py-8">
          <Breadcrumbs
            items={
              filters.category
                ? [{ label: 'Products', to: '/products' }, { label: filters.category }]
                : [{ label: 'Products' }]
            }
          />
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">{heading}</h1>
          <p className="mt-2 text-sm text-slate-500">
            {loading && !data ? 'Loading products...' : `${pluralize(total, 'product')} found`}
          </p>
        </div>
      </div>

      <div className="container-page py-8 lg:grid lg:grid-cols-[250px_1fr] lg:gap-8">
        {/* Desktop filters */}
        <aside className="hidden lg:block" aria-label="Product filters">
          <div className="card sticky top-24 p-5">{filterPanel}</div>
        </aside>

        <section aria-label="Products">
          <div className="flex flex-col gap-3 sm:flex-row">
            <CatalogSearch key={filters.keyword} initialValue={filters.keyword} onSearch={(keyword) => updateFilters({ keyword })} />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(true)}
                className="btn btn-secondary flex-1 lg:hidden"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {activeFilters.length > 0 && <span className="badge bg-blue-600 text-white">{activeFilters.length}</span>}
              </button>
              <label htmlFor="sort" className="sr-only">
                Sort products
              </label>
              <select
                id="sort"
                value={filters.sort}
                onChange={(event) => updateFilters({ sort: event.target.value })}
                className="input flex-1 cursor-pointer sm:w-52 sm:flex-none"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    Sort: {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {activeFilters.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {activeFilters.map((filter) => (
                <FilterChip key={filter.key} label={filter.label} onRemove={() => updateFilters(filter.clear)} />
              ))}
              <button type="button" onClick={resetFilters} className="text-xs font-semibold text-slate-500 underline-offset-2 hover:text-slate-800 hover:underline">
                Clear all
              </button>
            </div>
          )}

          <div className="mt-6">{results}</div>
        </section>
      </div>

      {/* Mobile filter drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <div className="absolute inset-0 animate-fade-in bg-slate-900/50" onClick={() => setMobileFiltersOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-full max-w-xs animate-slide-in-left flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="text-lg font-bold text-slate-900">Filters</h2>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close filters"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-5">{filterPanel}</div>
            <div className="border-t border-slate-100 p-4">
              <button type="button" onClick={() => setMobileFiltersOpen(false)} className="btn btn-primary w-full">
                Show {pluralize(total, 'result')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
