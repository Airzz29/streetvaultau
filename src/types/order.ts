import { CartItem } from "@/types/product";

export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "pending_fulfillment"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export type Order = {
  id: string;
  stripeSessionId: string;
  userId: string | null;
  customerEmail: string | null;
  customerName: string | null;
  shippingAddress: {
    firstName: string;
    lastName: string;
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    stateRegion: string;
    postcode: string;
    country: string;
    phone: string | null;
  } | null;
  discountCode: string | null;
  discountAmountAUD: number;
  paymentStatus: "unpaid" | "paid" | "failed";
  fulfillmentStatus: "pending" | "shipped" | "delivered";
  trackingCode: string | null;
  shippingEmailSentAt?: string | null;
  deliveredEmailSentAt?: string | null;
  subtotalAUD: number;
  shippingAUD: number;
  revenueAUD: number;
  costTotalAUD: number;
  profitAUD: number;
  status: OrderStatus;
  items: CartItem[];
  createdAt: string;
  updatedAt: string;
};
