import { Link } from 'react-router';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../utils/format';
import ProductImage from './ProductImage';
import Rating from './Rating';
import StockBadge from './StockBadge';

export default function ProductCard({ product }) {
  const { addToCart, getItemQuantity } = useCart();
  const outOfStock = product.stock <= 0;
  const quantityInCart = getItemQuantity(product._id);
  const productUrl = `/products/${product._id}`;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/[0.06]">
      <Link
        to={productUrl}
        tabIndex={-1}
        aria-hidden="true"
        className="relative block aspect-square overflow-hidden bg-gradient-to-b from-slate-50 to-slate-100"
      >
        <ProductImage
          src={product.image}
          alt=""
          loading="lazy"
          className={`h-full w-full object-cover transition duration-500 group-hover:scale-105 ${outOfStock ? 'opacity-50 grayscale' : ''}`}
        />
        {outOfStock ? (
          <span className="badge absolute top-3 left-3 bg-slate-900/85 text-white">Out of Stock</span>
        ) : (
          product.isFeatured && (
            <span className="badge absolute top-3 left-3 bg-white/90 text-blue-700 shadow-sm ring-1 ring-blue-600/10 backdrop-blur">
              Featured
            </span>
          )
        )}
        {quantityInCart > 0 && (
          <span className="badge absolute top-3 right-3 bg-blue-600 text-white shadow-sm">{quantityInCart} in cart</span>
        )}
      </Link>

      <div className="@container flex flex-1 flex-col p-3.5 sm:p-4">
        <p className="text-[11px] font-bold tracking-wider text-blue-600 uppercase">{product.category}</p>
        <h3 className="mt-1 line-clamp-2 min-h-10 text-sm leading-5 font-semibold text-slate-900 sm:text-[15px]">
          <Link to={productUrl} className="transition hover:text-blue-600">
            {product.name}
          </Link>
        </h3>
        <Rating value={product.rating} count={product.numReviews} className="mt-2" />

        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5 pt-3">
          <p className="text-lg font-extrabold text-slate-900">{formatPrice(product.price)}</p>
          <StockBadge stock={product.stock} />
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2 @3xs:grid-cols-2">
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => addToCart(product, 1)}
            disabled={outOfStock}
            aria-label={outOfStock ? `${product.name} is out of stock` : `Add ${product.name} to cart`}
          >
            <ShoppingCart className="h-4 w-4" aria-hidden="true" />
            {outOfStock ? 'Out of Stock' : 'Add to Cart'}
          </button>
          <Link to={productUrl} className="btn btn-secondary btn-sm">
            View Details
          </Link>
        </div>
      </div>
    </article>
  );
}
