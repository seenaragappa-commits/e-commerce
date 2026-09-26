import mongoose from 'mongoose';
import { ORDER_STATUS, ORDER_STATUSES, PAYMENT_METHODS, PAYMENT_STATUS, PAYMENT_STATUSES } from '../utils/constants.js';

// A snapshot of the product at the moment it was ordered. Name, image and
// price are copied so the order stays correct even if the product changes later.
const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    image: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
      validate: { validator: Number.isInteger, message: 'Quantity must be a whole number' },
    },
  },
  { _id: false },
);

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
  },
  { _id: false },
);

// Every status change is recorded so the tracking timeline can show dates.
const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, enum: ORDER_STATUSES, required: true },
    note: { type: String, trim: true, maxlength: 200 },
    date: { type: Date, default: Date.now },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    orderItems: {
      type: [orderItemSchema],
      validate: { validator: (items) => items.length > 0, message: 'An order must contain at least one item' },
    },
    shippingAddress: { type: shippingAddressSchema, required: true },
    paymentMethod: {
      type: String,
      required: [true, 'Payment method is required'],
      enum: { values: PAYMENT_METHODS, message: '"{VALUE}" is not a supported payment method' },
    },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: PAYMENT_STATUS.PENDING },
    paidAt: Date,
    itemsPrice: { type: Number, required: true, min: 0 },
    shippingPrice: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
    orderStatus: { type: String, enum: ORDER_STATUSES, default: ORDER_STATUS.PLACED, index: true },
    statusHistory: [statusHistorySchema],
    estimatedDelivery: Date,
    deliveredAt: Date,
    cancelledAt: Date,
  },
  { timestamps: true },
);

orderSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

const Order = mongoose.model('Order', orderSchema);

export default Order;
