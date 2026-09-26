import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ArrowLeft, ChevronDown, ImageIcon, Save, Star } from 'lucide-react';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import ErrorState from '../../components/ErrorState';
import InputField from '../../components/InputField';
import PageTitle from '../../components/PageTitle';
import ProductImage from '../../components/ProductImage';
import Rating from '../../components/Rating';
import { PageLoader, Spinner } from '../../components/Spinner';
import { useToast } from '../../context/ToastContext';
import useFetch from '../../hooks/useFetch';
import { createProduct, getProduct, updateProduct } from '../../services/productService';
import { CATEGORIES, LOW_STOCK_THRESHOLD } from '../../utils/constants';
import { formatDate } from '../../utils/format';
import { getErrorMessage, getFieldErrors } from '../../utils/getErrorMessage';

// Product illustrations that ship with the app (client/public/images/products).
const BUNDLED_IMAGES = [
  'wireless-headphones',
  'smart-watch',
  'bluetooth-speaker',
  'smartphone',
  'gaming-mouse',
  'mechanical-keyboard',
  'game-controller',
  'running-shoes',
  'travel-backpack',
  'aviator-sunglasses',
  'laptop-stand',
  'usb-c-hub',
  'fitness-band',
  'desk-lamp',
  'coffee-mug-set',
  'wall-clock',
].map((slug) => `/images/products/${slug}.svg`);

const EMPTY_PRODUCT = {
  name: '',
  description: '',
  price: '',
  stock: '',
  rating: '',
  category: '',
  image: '',
  isFeatured: false,
};

const toFormValues = (product) => ({
  name: product.name,
  description: product.description,
  price: String(product.price),
  stock: String(product.stock),
  rating: String(product.rating ?? 0),
  category: product.category,
  image: product.image,
  isFeatured: product.isFeatured,
});

// A full http(s) URL or a path on this site, e.g. /images/products/mug.svg (same rule as the server).
const IMAGE_URL_REGEX = /^(https?:\/\/[^\s/$.?#][^\s]*|\/[^\s/][^\s]*)$/i;

// Mirrors the server-side validation (server/utils/validators.js). The server checks everything again.
const validateProduct = (form) => {
  const errors = {};
  const name = form.name.trim();
  const description = form.description.trim();
  const price = Number(form.price);
  const stock = Number(form.stock);
  const rating = Number(form.rating);

  if (name.length < 2) errors.name = 'Product name must be at least 2 characters';
  else if (name.length > 120) errors.name = 'Keep the name under 120 characters';
  if (description.length < 10) errors.description = 'Description must be at least 10 characters';
  else if (description.length > 2000) errors.description = 'Keep the description under 2000 characters';
  if (form.price.trim() === '' || !Number.isFinite(price)) errors.price = 'Enter a price';
  else if (price < 0.01) errors.price = 'Price must be greater than 0';
  else if (price > 1000000) errors.price = 'Price cannot exceed 1,000,000';
  if (form.stock.trim() === '' || !Number.isInteger(stock)) errors.stock = 'Stock must be a whole number';
  else if (stock < 0) errors.stock = 'Stock cannot be negative';
  else if (stock > 100000) errors.stock = 'Stock cannot exceed 100,000';
  if (form.rating.trim() !== '' && (!Number.isFinite(rating) || rating < 0 || rating > 5)) {
    errors.rating = 'Rating must be between 0 and 5';
  }
  if (!CATEGORIES.includes(form.category)) errors.category = 'Choose a category';
  if (!form.image.trim()) errors.image = 'Add an image URL or pick one of the bundled images';
  else if (!IMAGE_URL_REGEX.test(form.image.trim())) errors.image = 'Use a full http(s):// URL or a path starting with "/"';
  return errors;
};

function ProductForm({ initialValues, submitLabel, onSubmit }) {
  const toast = useToast();
  const [form, setForm] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(!initialValues.image);

  const setField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setField(name, type === 'checkbox' ? checked : value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = validateProduct(form);
    setErrors(validationErrors);
    const firstInvalidField = Object.keys(validationErrors)[0];
    if (firstInvalidField) {
      document.getElementById(firstInvalidField)?.focus();
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        stock: Number(form.stock),
        rating: form.rating.trim() === '' ? 0 : Number(form.rating),
        category: form.category,
        image: form.image.trim(),
        isFeatured: form.isFeatured,
      });
    } catch (error) {
      setErrors(getFieldErrors(error));
      toast.error(getErrorMessage(error));
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
      <section className="@container card space-y-5 p-5 sm:p-7" aria-labelledby="details-heading">
        <h2 id="details-heading" className="text-lg font-bold text-slate-900">
          Product details
        </h2>

        <InputField label="Product name" name="name" value={form.name} onChange={handleChange} error={errors.name} placeholder="e.g. Wireless Noise-Cancelling Headphones" />

        <InputField
          as="textarea"
          rows={6}
          label="Description"
          name="description"
          value={form.description}
          onChange={handleChange}
          error={errors.description}
          hint={`${form.description.length} / 2000 characters`}
          placeholder="What makes this product great?"
        />

        <div className="grid gap-5 @lg:grid-cols-3">
          <InputField label="Price (USD)" name="price" type="number" min="0.01" step="0.01" inputMode="decimal" value={form.price} onChange={handleChange} error={errors.price} placeholder="0.00" hint="Must be greater than 0" />
          <InputField label="Units in stock" name="stock" type="number" min="0" step="1" inputMode="numeric" value={form.stock} onChange={handleChange} error={errors.stock} placeholder="0" hint={`${LOW_STOCK_THRESHOLD} or fewer = low stock`} />
          <InputField label="Rating (0-5)" name="rating" type="number" min="0" max="5" step="0.1" inputMode="decimal" value={form.rating} onChange={handleChange} error={errors.rating} placeholder="0.0" hint="Leave empty for no rating" />
        </div>

        <InputField as="select" label="Category" name="category" value={form.category} onChange={handleChange} error={errors.category} className="cursor-pointer">
          <option value="">Choose a category...</option>
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </InputField>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4 transition hover:bg-slate-50">
          <input type="checkbox" name="isFeatured" checked={form.isFeatured} onChange={handleChange} className="mt-0.5 h-4 w-4 cursor-pointer accent-blue-600" />
          <span>
            <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
              Featured product
            </span>
            <span className="mt-0.5 block text-xs text-slate-500">Featured products are shown on the home page.</span>
          </span>
        </label>
      </section>

      <div className="space-y-6">
        <section className="card p-5 sm:p-6" aria-labelledby="image-heading">
          <h2 id="image-heading" className="text-lg font-bold text-slate-900">
            Product image
          </h2>
          <div className="mx-auto mt-4 aspect-square w-full max-w-xs overflow-hidden rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100 ring-1 ring-slate-200/70 xl:max-w-none">
            {/* Only preview addresses that pass validation (never e.g. "javascript:" URLs). */}
            {IMAGE_URL_REGEX.test(form.image.trim()) ? (
              <ProductImage key={form.image} src={form.image.trim()} alt="Product preview" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-400">
                <ImageIcon className="h-10 w-10" aria-hidden="true" />
                <p className="text-sm">{form.image.trim() ? 'Enter a valid image URL to see a preview' : 'No image selected'}</p>
              </div>
            )}
          </div>

          <InputField
            className="mt-4"
            label="Image URL"
            name="image"
            value={form.image}
            onChange={handleChange}
            error={errors.image}
            placeholder="https://... or /images/products/..."
            hint="Paste any image URL, or choose a bundled image below."
          />

          <button
            type="button"
            onClick={() => setGalleryOpen((value) => !value)}
            className="mt-4 flex w-full items-center justify-between rounded-xl px-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
            aria-expanded={galleryOpen}
          >
            Choose a bundled image
            <ChevronDown className={`h-4 w-4 transition ${galleryOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
          </button>
          {galleryOpen && (
            <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-8 xl:grid-cols-4">
              {BUNDLED_IMAGES.map((path) => {
                const selected = form.image === path;
                return (
                  <button
                    key={path}
                    type="button"
                    onClick={() => setField('image', path)}
                    aria-pressed={selected}
                    aria-label={`Use ${path.split('/').pop().replace('.svg', '').replaceAll('-', ' ')} image`}
                    className={`overflow-hidden rounded-xl bg-slate-50 ring-2 transition ${selected ? 'ring-blue-600' : 'ring-transparent hover:ring-slate-300'}`}
                  >
                    <img src={path} alt="" className="aspect-square w-full object-cover" loading="lazy" />
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end xl:flex-col-reverse">
          <Link to="/admin/products" className="btn btn-secondary">
            Cancel
          </Link>
          <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
            {saving ? <Spinner className="h-5 w-5" /> : <Save className="h-5 w-5" aria-hidden="true" />}
            {saving ? 'Saving...' : submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}

function BackLink() {
  return (
    <Link to="/admin/products" className="btn btn-secondary">
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      All products
    </Link>
  );
}

function CreateProduct() {
  const navigate = useNavigate();
  const toast = useToast();

  const handleCreate = async (values) => {
    const product = await createProduct(values);
    toast.success(`"${product.name}" was added to the catalog`);
    navigate('/admin/products');
  };

  return (
    <div className="space-y-6">
      <PageTitle title="Add product" />
      <AdminPageHeader title="Add product" description="Create a new product for the catalog." actions={<BackLink />} />
      <ProductForm initialValues={EMPTY_PRODUCT} submitLabel="Create product" onSubmit={handleCreate} />
    </div>
  );
}

function EditProduct({ id }) {
  const navigate = useNavigate();
  const toast = useToast();
  const { data: product, loading, error, reload } = useFetch(() => getProduct(id), `admin-product:${id}`);

  if (loading) return <PageLoader label="Loading product..." />;
  if (error || !product) return <ErrorState title="Product not available" message={error} onRetry={reload} />;

  const handleUpdate = async (values) => {
    const updated = await updateProduct(id, values);
    toast.success(`"${updated.name}" was updated`);
    navigate('/admin/products');
  };

  return (
    <div className="space-y-6">
      <PageTitle title={`Edit ${product.name}`} />
      <AdminPageHeader title="Edit product" description={`Last updated ${formatDate(product.updatedAt)}`} actions={<BackLink />} />
      <div className="card flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3 text-sm text-slate-500">
        <span>
          Product code <span className="font-mono font-semibold text-slate-900 uppercase">#{product._id.slice(-8)}</span>
        </span>
        <span className="flex items-center gap-2">
          Customer rating <Rating value={product.rating} count={product.numReviews} />
        </span>
        <span>Added {formatDate(product.createdAt)}</span>
      </div>
      <ProductForm initialValues={toFormValues(product)} submitLabel="Save changes" onSubmit={handleUpdate} />
    </div>
  );
}

export default function AdminProductFormPage() {
  const { id } = useParams();
  // The key makes sure the form starts fresh when switching between products.
  return id ? <EditProduct key={id} id={id} /> : <CreateProduct />;
}
