import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import { getProduct } from '../services/productService';
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE, STORAGE_KEYS } from '../utils/constants';
import { formatPrice } from '../utils/format';
import { readJSON, writeJSON } from '../utils/storage';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const CartContext = createContext(null);

const roundMoney = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

// The product details we keep for every line in the cart.
const toCartItem = (product, quantity) => ({
  _id: product._id,
  name: product.name,
  image: product.image,
  category: product.category,
  price: product.price,
  stock: product.stock,
  quantity,
});

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { product, quantity } = action;
      const existing = state.find((item) => item._id === product._id);
      if (existing) {
        return state.map((item) =>
          item._id === product._id ? toCartItem(product, Math.min(item.quantity + quantity, product.stock)) : item,
        );
      }
      return [...state, toCartItem(product, Math.min(quantity, product.stock))];
    }

    case 'UPDATE_QUANTITY':
      return state.map((item) =>
        item._id === action.id ? { ...item, quantity: Math.max(1, Math.min(action.quantity, item.stock)) } : item,
      );

    case 'REMOVE_ITEM':
      return state.filter((item) => item._id !== action.id);

    // action.updates = { [productId]: freshProduct | null }  (null = product no longer exists)
    case 'SYNC_PRODUCTS':
      return state.flatMap((item) => {
        if (!(item._id in action.updates)) return [item];
        const product = action.updates[item._id];
        if (!product || product.stock <= 0) return [];
        return [toCartItem(product, Math.min(item.quantity, product.stock))];
      });

    case 'CLEAR_CART':
      return [];

    default:
      return state;
  }
}

// Load the saved cart from localStorage (ignoring anything malformed).
const loadCart = () => {
  const saved = readJSON(STORAGE_KEYS.cart, []);
  if (!Array.isArray(saved)) return [];
  return saved.filter(
    (item) => item && typeof item._id === 'string' && Number.isFinite(item.price) && Number.isInteger(item.quantity) && item.quantity > 0,
  );
};

export function CartProvider({ children }) {
  const [cartItems, dispatch] = useReducer(cartReducer, undefined, loadCart);
  const toast = useToast();
  const { user } = useAuth();

  // Persist the cart so it survives page reloads.
  const latestItems = useRef(cartItems);
  useEffect(() => {
    writeJSON(STORAGE_KEYS.cart, cartItems);
    latestItems.current = cartItems;
  }, [cartItems]);

  // Empty the cart when the user logs out, so the next person starts fresh.
  const previousUser = useRef(user);
  useEffect(() => {
    if (previousUser.current && !user) dispatch({ type: 'CLEAR_CART' });
    previousUser.current = user;
  }, [user]);

  const addToCart = useCallback(
    (product, quantity = 1) => {
      if (product.stock <= 0) {
        toast.error(`"${product.name}" is out of stock`);
        return false;
      }

      const alreadyInCart = cartItems.find((item) => item._id === product._id)?.quantity ?? 0;
      const canAdd = product.stock - alreadyInCart;
      if (canAdd <= 0) {
        toast.error(`You already have all ${product.stock} available units of "${product.name}" in your cart`);
        return false;
      }

      const quantityToAdd = Math.min(quantity, canAdd);
      dispatch({ type: 'ADD_ITEM', product, quantity: quantityToAdd });

      if (quantityToAdd < quantity) {
        toast.info(`Only ${quantityToAdd} more could be added - that is all we have in stock`);
      } else {
        toast.success(`${quantityToAdd > 1 ? `${quantityToAdd} x ` : ''}"${product.name}" added to your cart`);
      }
      return true;
    },
    [cartItems, toast],
  );

  const updateQuantity = useCallback((id, quantity) => dispatch({ type: 'UPDATE_QUANTITY', id, quantity }), []);
  const removeFromCart = useCallback((id) => dispatch({ type: 'REMOVE_ITEM', id }), []);
  const clearCart = useCallback(() => dispatch({ type: 'CLEAR_CART' }), []);

  /** Asks the server for the current price and stock of every cart item and updates the cart. */
  const refreshCartItems = useCallback(async () => {
    const items = latestItems.current;
    if (items.length === 0) return;

    const results = await Promise.allSettled(items.map((item) => getProduct(item._id)));
    const updates = {};
    const messages = [];

    results.forEach((result, index) => {
      const item = items[index];

      if (result.status === 'rejected') {
        // 404 = product was deleted. Other errors (e.g. offline): keep the item unchanged.
        if (result.reason?.response?.status === 404) {
          updates[item._id] = null;
          messages.push(`"${item.name}" is no longer available and was removed from your cart.`);
        }
        return;
      }

      const product = result.value;
      updates[item._id] = product;

      if (product.stock <= 0) {
        messages.push(`"${product.name}" is now out of stock and was removed from your cart.`);
      } else if (product.stock < item.quantity) {
        messages.push(`Only ${product.stock} of "${product.name}" left - your quantity was updated.`);
      }
      if (product.price !== item.price) {
        messages.push(`The price of "${product.name}" is now ${formatPrice(product.price)}.`);
      }
    });

    dispatch({ type: 'SYNC_PRODUCTS', updates });
    messages.forEach((message) => toast.info(message));
  }, [toast]);

  /**
   * Refreshes price and stock of every item (used by the cart and checkout pages):
   * removes products that were deleted or sold out and lowers quantities above the stock.
   * A call made while a refresh is already running shares it, so a message is never shown
   * twice (React's development mode runs page effects twice).
   */
  const syncInProgress = useRef(null);
  const syncCart = useCallback(() => {
    syncInProgress.current ??= refreshCartItems().finally(() => {
      syncInProgress.current = null;
    });
    return syncInProgress.current;
  }, [refreshCartItems]);

  const totals = useMemo(() => {
    const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = roundMoney(cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0));
    const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
    return { itemCount, subtotal, shipping, total: roundMoney(subtotal + shipping) };
  }, [cartItems]);

  const getItemQuantity = useCallback(
    (id) => cartItems.find((item) => item._id === id)?.quantity ?? 0,
    [cartItems],
  );

  const value = useMemo(
    () => ({
      cartItems,
      ...totals,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      syncCart,
      getItemQuantity,
    }),
    [cartItems, totals, addToCart, updateQuantity, removeFromCart, clearCart, syncCart, getItemQuantity],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside <CartProvider>');
  return context;
};
