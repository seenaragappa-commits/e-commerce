import { CUSTOMER_CANCELLABLE_STATUSES, ORDER_FLOW } from './constants';
import { formatShortDate } from './format';

/** Date of the most recent history entry with the given status. */
const getStatusDate = (order, status) => {
  const history = order.statusHistory ?? [];
  for (let index = history.length - 1; index >= 0; index -= 1) {
    if (history[index].status === status) return history[index].date;
  }
  return undefined;
};

/**
 * The steps shown by the tracking timeline:
 *  - "done"      ✓ steps the order has already passed
 *  - "current"   ● the step the order is at right now
 *  - "upcoming"  ○ steps still to come
 *  - "cancelled" shown in red instead of the remaining steps
 */
export const buildTimelineSteps = (order) => {
  if (order.orderStatus === 'Cancelled') {
    // The last normal step the order reached before it was cancelled.
    const reachedIndexes = (order.statusHistory ?? [])
      .map((entry) => ORDER_FLOW.indexOf(entry.status))
      .filter((index) => index >= 0);
    const lastReachedIndex = reachedIndexes.length ? Math.max(...reachedIndexes) : 0;

    return [
      ...ORDER_FLOW.slice(0, lastReachedIndex + 1).map((status) => ({
        status,
        state: 'done',
        date: getStatusDate(order, status),
      })),
      { status: 'Cancelled', state: 'cancelled', date: order.cancelledAt ?? getStatusDate(order, 'Cancelled') },
    ];
  }

  const currentIndex = Math.max(0, ORDER_FLOW.indexOf(order.orderStatus));
  const isDelivered = order.orderStatus === 'Delivered';

  return ORDER_FLOW.map((status, index) => {
    let state = 'upcoming';
    if (index < currentIndex || (isDelivered && index === currentIndex)) state = 'done';
    else if (index === currentIndex) state = 'current';
    return { status, state, date: getStatusDate(order, status) };
  });
};

/** 0-100, how far the order has progressed (used by the small progress bars). */
export const getOrderProgress = (order) => {
  if (order.orderStatus === 'Cancelled') return 100;
  const index = ORDER_FLOW.indexOf(order.orderStatus);
  return Math.round(((Math.max(index, 0) + 1) / ORDER_FLOW.length) * 100);
};

export const canCustomerCancel = (order) => CUSTOMER_CANCELLABLE_STATUSES.includes(order.orderStatus);

/** Delivered and Cancelled orders never change again. */
export const isFinalStatus = (status) => status === 'Delivered' || status === 'Cancelled';

// Note: the statuses an admin may set next come from the API (order.allowedStatuses),
// so the status rules live in one place - the server.

/** A friendly one-line description of where the order is. */
export const getTrackingMessage = (order) => {
  const eta = order.estimatedDelivery ? formatShortDate(order.estimatedDelivery) : null;
  switch (order.orderStatus) {
    case 'Order Placed':
      return 'We have received your order and will confirm it shortly.';
    case 'Confirmed':
      return 'Your order is confirmed and will be packed soon.';
    case 'Processing':
      return 'Your items are being packed at our warehouse.';
    case 'Shipped':
      return eta ? `Your order is on its way. Expected delivery: ${eta}.` : 'Your order is on its way.';
    case 'Out for Delivery':
      return 'Your order is out for delivery and will arrive today.';
    case 'Delivered':
      return `Delivered on ${formatShortDate(order.deliveredAt ?? getStatusDate(order, 'Delivered'))}. Enjoy your purchase!`;
    case 'Cancelled':
      return 'This order was cancelled. Any items have been returned to stock.';
    default:
      return '';
  }
};
