export interface Product {
  id: string;
  name: string;
  productCode: string;
  description: string;
  categoryId: string | null;
  categoryName: string | null;
  brandId: string | null;
  brandName: string | null;
  price: number;
  discountedPrice?: number | null;
  isActive: boolean;
  imageUrl?: string;
  images?: string;
  tags?: string;
  referenceCount?: number;
  mainReferenceId?: string;
  references?: ProductReference[];
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  parentCategoryId?: string;
  parentCategory?: Category;
  icon?: string;
  createdAt: string;
  updatedAt: string;
}

export type AttributeDataType = 'Text' | 'Number' | 'Boolean';

export interface AttributeDefinition {
  id: string;
  categoryId: string;
  name: string;
  dataType: number | AttributeDataType;
  isRequired: boolean;
  displayOrder: number;
  isInherited?: boolean;
  options?: AttributeOption[];
  createdAt: string;
  updatedAt: string;
}

export interface AttributeOption {
  id: string;
  attributeDefinitionId: string;
  value: string;
  displayOrder: number;
  createdAt: string;
}

export interface ProductReference {
  id: string;
  productId: string;
  productName?: string;
  referenceCode: string;
  price: number;
  barcode?: string;
  imageUrl?: string;
  isActive: boolean;
  attributeValues?: ReferenceAttributeValue[];
  inventory?: ReferenceInventoryInfo;
  createdAt: string;
  updatedAt: string;
}

export interface ReferenceAttributeValue {
  id: string;
  productReferenceId: string;
  attributeDefinitionId: string;
  attributeName?: string;
  attributeOptionId: string;
  optionValue?: string;
  createdAt: string;
}

export interface ReferenceInventoryInfo {
  quantity: number;
  minStock: number;
  warehouseId: string;
  warehouseName?: string;
}

export interface Brand {
  id: string;
  name: string;
  description: string;
  logoUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  isMain: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Inventory {
  id: string;
  productId: string;
  product?: Product;
  warehouseId: string;
  warehouse?: Warehouse;
  quantity: number;
  minStock: number;
  maxStock: number;
  reservedQuantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface PriceList {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PriceListItem {
  id: string;
  priceListId: string;
  productId: string;
  product?: Product;
  price: number;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  customerGroupId?: string;
  customerGroup?: CustomerGroup;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerGroup {
  id: string;
  name: string;
  description: string;
  discountPercentage: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerAddress {
  id: string;
  customerId: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Discount {
  id: string;
  name: string;
  description: string;
  type: 'Percentage' | 'FixedAmount';
  value: number;
  startDate: string;
  endDate: string;
  couponCode?: string;
  applyToAllProducts: boolean;
  isActive: boolean;
  productIds?: string[];
  categoryIds?: string[];
  products?: { productId: string; productName?: string }[];
  categories?: { categoryId: string; categoryName?: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface DiscountCalculation {
  originalPrice: number;
  discountedPrice: number;
  discountAmount: number;
  discountName?: string;
  discountType?: string;
  hasDiscount: boolean;
}

export interface Tax {
  id: string;
  name: string;
  rate: number;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  password?: string;
  profiles: string[];
}

export interface Profile {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
}

export type OrderStatus = 'Pending' | 'Confirmed' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';

export interface Order {
  id: string;
  customerId: string;
  customer?: Customer;
  orderNumber: string;
  orderDate: string;
  status: number;
  statusName?: OrderStatus;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  notes?: string;
  warehouseId?: string;
  warehouse?: Warehouse;
  items?: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  product?: Product;
  productReferenceId?: string;
  productReference?: ProductReference;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  errors?: string[];
}

export interface PagedResponse<T> {
  data: T[];
  total?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
}

export interface CreateUpdateRequest<T> {
  id?: string;
  data: T;
}
