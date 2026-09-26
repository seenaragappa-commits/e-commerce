import ProductCard from './ProductCard';
import ProductCardSkeleton from './ProductCardSkeleton';

/**
 * Responsive grid of product cards.
 * Shows skeletons on the first load and dims the old results while new ones load.
 */
export default function ProductGrid({
  products,
  loading = false,
  skeletonCount = 8,
  columns = 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
}) {
  const gridClass = `grid gap-3 sm:gap-5 ${columns}`;

  if (loading && !products?.length) {
    return (
      <div className={gridClass} role="status" aria-label="Loading products">
        {Array.from({ length: skeletonCount }, (_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  return (
    <div className={`${gridClass} transition-opacity duration-200 ${loading ? 'pointer-events-none opacity-50' : ''}`} aria-busy={loading}>
      {products.map((product) => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  );
}
