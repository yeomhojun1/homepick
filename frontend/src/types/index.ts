export type UserRole = 'customer' | 'worker';

export interface User {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  role: UserRole;
  fcmToken: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: number;
  name: string;
  iconUrl: string | null;
  sortOrder: number;
  isActive: boolean;
}

export type ServiceRequestStatus = 'open' | 'quoted' | 'booked' | 'completed' | 'cancelled';

export interface ServiceRequest {
  id: number;
  customerId: number;
  categoryId: number;
  title: string;
  description: string;
  address: string;
  imageUrls: string[];
  preferredDate: string | null;
  status: ServiceRequestStatus;
  customer?: User;
  category?: Category;
  createdAt: string;
  updatedAt: string;
}

export type QuoteStatus = 'pending' | 'accepted' | 'rejected';

export interface Quote {
  id: number;
  serviceRequestId: number;
  workerId: number;
  price: number;
  message: string;
  estimatedHours: number | null;
  status: QuoteStatus;
  worker?: User;
  createdAt: string;
  updatedAt: string;
}

export type BookingStatus = 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

export interface Booking {
  id: number;
  quoteId: number;
  serviceRequestId: number;
  customerId: number;
  workerId: number;
  scheduledAt: string;
  status: BookingStatus;
  serviceRequest?: ServiceRequest;
  worker?: User;
  customer?: User;
  quote?: Quote;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: number;
  bookingId: number;
  reviewerId: number;
  targetId: number;
  rating: number;
  comment: string | null;
  reviewer?: User;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  body: string;
  referenceId: number | null;
  referenceType: string | null;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  statusCode: number;
}
