export type PlanType = 'FREE' | 'PRO' | 'PREMIUM';

export interface SubscriptionPlan {
  id?: number | string;
  name: PlanType | string;
  price: number;
  currency: string;
  billingCycle: string;
  description: string;
  durationInDays?: number;
  maxProjects?: number;
  maxBids?: number;
  active?: boolean;
  features?: string[];
  isPopular?: boolean;
  isCurrent?: boolean;
  color?: string;
  icon?: string;
}

export type SubscriptionStatus = 'PENDING' | 'ACTIVE' | 'CANCELLED' | 'EXPIRED';
export type PaymentCurrency = 'TND' | 'USD' | 'EUR';
export type PaymentMethod = 'CARD' | 'PAYPAL' | 'MOBILE' | 'BANK_TRANSFER';
export type MobileProvider = 'D17' | 'Flouci' | 'Konnect';

export interface Subscription {
  id?: number;
  plan?: SubscriptionPlan;
  priceAtPurchase: number;
  duration?: number;
  startDate: Date | string;
  endDate: Date | string;
  status: SubscriptionStatus;
  user?: any;
}

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface Payment {
  id?: number;
  subscription?: any;
  amount: number;
  amountOriginalTnd?: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionDate?: Date | string;
  transactionRef?: string;
  lastFourDigits?: string;
  cardholderName?: string;
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
  paypalEmail?: string;
  mobileProvider?: MobileProvider;
  mobilePhone?: string;
  mobileTransactionCode?: string;
  bankName?: string;
  rib?: string;
  accountHolder?: string;
  transferReference?: string;
  promoCode?: string;
  discountAmountTnd?: number;
}

export interface PaymentResponse {
  success: boolean;
  message: string;
  paymentId?: string;
  transactionId?: string;
  transactionRef?: string;
}

export interface PaymentPayload {
  planId: string;
  amount: number;
  currency: PaymentCurrency;
  paymentMethod: 'card' | 'paypal' | 'mobile' | 'bank_transfer';
  userId: string;
  transactionRef?: string;
  promoCode?: string;
  metadata?: Record<string, unknown>;
}
