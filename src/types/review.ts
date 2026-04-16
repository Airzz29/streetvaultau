export type ProductReview = {
  id: string;
  userId: string;
  orderId: string;
  orderItemId: string;
  productId: string;
  productName: string;
  rating: number;
  body: string;
  displayName: string | null;
  images: string[];
  status: "pending" | "approved" | "hidden";
  createdAt: string;
  updatedAt: string;
};

