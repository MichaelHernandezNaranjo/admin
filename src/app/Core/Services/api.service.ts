import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, PagedResponse, Product, Category, Brand, Warehouse, Inventory, PriceList, Customer, CustomerGroup, Discount, DiscountCalculation, Tax, User, Profile, Permission, AttributeDefinition, AttributeOption, ProductReference, Order } from '../Models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getProducts(page = 1, pageSize = 10, sortField?: string, sortOrder?: 'asc' | 'desc', search?: string, options?: {
    categoryId?: string;
    brandId?: string;
    minPrice?: number;
    maxPrice?: number;
    onlyOffers?: boolean;
    onlyActive?: boolean;
  }): Observable<PagedResponse<Product>> {
    const pageNum = Number.isNaN(page) ? 1 : page;
    const pageSizeNum = Number.isNaN(pageSize) ? 10 : pageSize;
    let params = new HttpParams()
      .set('page', pageNum.toString())
      .set('pageSize', pageSizeNum.toString());
    if (sortField) {
      params = params.set('sortField', sortField);
      params = params.set('sortOrder', sortOrder || 'asc');
    }
    if (search && search.trim()) params = params.set('search', search.trim());
    if (options?.categoryId) params = params.set('categoryId', options.categoryId);
    if (options?.brandId) params = params.set('brandId', options.brandId);
    if (options?.minPrice != null) params = params.set('minPrice', options.minPrice.toString());
    if (options?.maxPrice != null) params = params.set('maxPrice', options.maxPrice.toString());
    if (options?.onlyOffers) params = params.set('onlyOffers', 'true');
    if (options?.onlyActive === false) params = params.set('onlyActive', 'false');
    return this.http.get<PagedResponse<Product>>(`${this.API_URL}/products`, { params });
  }

  getProduct(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.API_URL}/products/${id}`);
  }

  createProduct(product: Partial<Product>): Observable<ApiResponse<Product>> {
    return this.http.post<ApiResponse<Product>>(`${this.API_URL}/products`, product);
  }

  updateProduct(id: string, product: Partial<Product>): Observable<ApiResponse<Product>> {
    return this.http.put<ApiResponse<Product>>(`${this.API_URL}/products/${id}`, product);
  }

  deleteProduct(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/products/${id}`);
  }

  getCategories(page = 1, pageSize = 50, sortField?: string, sortOrder?: 'asc' | 'desc', search?: string): Observable<PagedResponse<Category>> {
    const pageNum = Number.isNaN(page) ? 1 : page;
    const pageSizeNum = Number.isNaN(pageSize) ? 50 : pageSize;
    let params = new HttpParams()
      .set('page', pageNum.toString())
      .set('pageSize', pageSizeNum.toString());
    if (sortField) {
      params = params.set('sortField', sortField);
      params = params.set('sortOrder', sortOrder || 'asc');
    }
    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }
    return this.http.get<PagedResponse<Category>>(`${this.API_URL}/categories`, { params });
  }

  getCategory(id: string): Observable<ApiResponse<Category>> {
    return this.http.get<ApiResponse<Category>>(`${this.API_URL}/categories/${id}`);
  }

  createCategory(category: any): Observable<Category> {
    return this.http.post<Category>(`${this.API_URL}/categories`, category);
  }

  updateCategory(id: string, category: any): Observable<Category> {
    return this.http.put<Category>(`${this.API_URL}/categories/${id}`, category);
  }

  deleteCategory(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/categories/${id}`);
  }

  getCategoriesDropdown(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/categories/dropdown`);
  }

  // Brands
  getBrands(page = 1, pageSize = 50, sortField?: string, sortOrder?: 'asc' | 'desc', search?: string): Observable<PagedResponse<Brand>> {
    const pageNum = Number.isNaN(page) ? 1 : page;
    const pageSizeNum = Number.isNaN(pageSize) ? 50 : pageSize;
    let params = new HttpParams()
      .set('page', pageNum.toString())
      .set('pageSize', pageSizeNum.toString());
    if (sortField) {
      params = params.set('sortField', sortField);
      params = params.set('sortOrder', sortOrder || 'asc');
    }
    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }
    return this.http.get<PagedResponse<Brand>>(`${this.API_URL}/brands`, { params });
  }

  getBrand(id: string): Observable<ApiResponse<Brand>> {
    return this.http.get<ApiResponse<Brand>>(`${this.API_URL}/brands/${id}`);
  }

  getBrandsDropdown(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/brands/dropdown`);
  }

  createBrand(brand: any): Observable<Brand> {
    return this.http.post<Brand>(`${this.API_URL}/brands`, brand);
  }

  updateBrand(id: string, brand: any): Observable<Brand> {
    return this.http.put<Brand>(`${this.API_URL}/brands/${id}`, brand);
  }

  deleteBrand(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/brands/${id}`);
  }

  uploadBrandLogo(file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.http.post<{ url: string }>(`${this.API_URL}/brands/upload-logo`, formData);
  }

  uploadProductImage(file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.http.post<{ url: string }>(`${this.API_URL}/products/upload-image`, formData);
  }

  getProductImageAttributes(productId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/products/${productId}/image-attributes`);
  }

  getWarehouses(page = 1, pageSize = 10): Observable<PagedResponse<Warehouse>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    return this.http.get<PagedResponse<Warehouse>>(`${this.API_URL}/warehouses`, { params });
  }

  getWarehouse(id: string): Observable<ApiResponse<Warehouse>> {
    return this.http.get<ApiResponse<Warehouse>>(`${this.API_URL}/warehouses/${id}`);
  }

  createWarehouse(warehouse: Partial<Warehouse>): Observable<ApiResponse<Warehouse>> {
    return this.http.post<ApiResponse<Warehouse>>(`${this.API_URL}/warehouses`, warehouse);
  }

  updateWarehouse(id: string, warehouse: Partial<Warehouse>): Observable<ApiResponse<Warehouse>> {
    return this.http.put<ApiResponse<Warehouse>>(`${this.API_URL}/warehouses/${id}`, warehouse);
  }

  deleteWarehouse(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/warehouses/${id}`);
  }

  getInventories(page = 1, pageSize = 10): Observable<PagedResponse<Inventory>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    return this.http.get<PagedResponse<Inventory>>(`${this.API_URL}/inventories`, { params });
  }

  getInventory(id: string): Observable<ApiResponse<Inventory>> {
    return this.http.get<ApiResponse<Inventory>>(`${this.API_URL}/inventories/${id}`);
  }

  createInventory(inventory: Partial<Inventory>): Observable<ApiResponse<Inventory>> {
    return this.http.post<ApiResponse<Inventory>>(`${this.API_URL}/inventories`, inventory);
  }

  updateInventory(id: string, inventory: Partial<Inventory>): Observable<ApiResponse<Inventory>> {
    return this.http.put<ApiResponse<Inventory>>(`${this.API_URL}/inventories/${id}`, inventory);
  }

  deleteInventory(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/inventories/${id}`);
  }

  getPriceLists(page = 1, pageSize = 10): Observable<PagedResponse<PriceList>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    return this.http.get<PagedResponse<PriceList>>(`${this.API_URL}/pricelists`, { params });
  }

  getPriceList(id: string): Observable<ApiResponse<PriceList>> {
    return this.http.get<ApiResponse<PriceList>>(`${this.API_URL}/pricelists/${id}`);
  }

  createPriceList(priceList: Partial<PriceList>): Observable<ApiResponse<PriceList>> {
    return this.http.post<ApiResponse<PriceList>>(`${this.API_URL}/pricelists`, priceList);
  }

  updatePriceList(id: string, priceList: Partial<PriceList>): Observable<ApiResponse<PriceList>> {
    return this.http.put<ApiResponse<PriceList>>(`${this.API_URL}/pricelists/${id}`, priceList);
  }

  deletePriceList(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/pricelists/${id}`);
  }

  getPriceListProducts(priceListId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/pricelists/${priceListId}/products`);
  }

  addProductToPriceList(priceListId: string, productReferenceId: string, price: number): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/pricelists/${priceListId}/products`, { productReferenceId, price });
  }

  removeProductFromPriceList(priceListId: string, productReferenceId: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/pricelists/${priceListId}/products/${productReferenceId}`);
  }

  addPriceListItem(priceListId: string, item: any): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/pricelists/${priceListId}/items`, item);
  }

  updatePriceListItem(priceListId: string, itemId: string, item: any): Observable<any> {
    return this.http.put<any>(`${this.API_URL}/pricelists/${priceListId}/items/${itemId}`, item);
  }

  deletePriceListItem(priceListId: string, itemId: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/pricelists/${priceListId}/items/${itemId}`);
  }

  getCustomers(page = 1, pageSize = 10): Observable<PagedResponse<Customer>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    return this.http.get<PagedResponse<Customer>>(`${this.API_URL}/customers`, { params });
  }

  getCustomer(id: string): Observable<ApiResponse<Customer>> {
    return this.http.get<ApiResponse<Customer>>(`${this.API_URL}/customers/${id}`);
  }

  createCustomer(customer: Partial<Customer>): Observable<ApiResponse<Customer>> {
    return this.http.post<ApiResponse<Customer>>(`${this.API_URL}/customers`, customer);
  }

  updateCustomer(id: string, customer: Partial<Customer>): Observable<ApiResponse<Customer>> {
    return this.http.put<ApiResponse<Customer>>(`${this.API_URL}/customers/${id}`, customer);
  }

  deleteCustomer(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/customers/${id}`);
  }

  getCustomerGroups(page = 1, pageSize = 10): Observable<PagedResponse<CustomerGroup>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    return this.http.get<PagedResponse<CustomerGroup>>(`${this.API_URL}/customergroups`, { params });
  }

  getCustomerGroup(id: string): Observable<ApiResponse<CustomerGroup>> {
    return this.http.get<ApiResponse<CustomerGroup>>(`${this.API_URL}/customergroups/${id}`);
  }

  createCustomerGroup(group: Partial<CustomerGroup>): Observable<ApiResponse<CustomerGroup>> {
    return this.http.post<ApiResponse<CustomerGroup>>(`${this.API_URL}/customergroups`, group);
  }

  updateCustomerGroup(id: string, group: Partial<CustomerGroup>): Observable<ApiResponse<CustomerGroup>> {
    return this.http.put<ApiResponse<CustomerGroup>>(`${this.API_URL}/customergroups/${id}`, group);
  }

  deleteCustomerGroup(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/customergroups/${id}`);
  }

  getGroupCustomers(groupId: string): Observable<PagedResponse<Customer>> {
    return this.http.get<PagedResponse<Customer>>(`${this.API_URL}/customergroups/${groupId}/customers`);
  }

  addCustomerToGroup(groupId: string, customerId: string): Observable<Customer> {
    return this.http.post<Customer>(`${this.API_URL}/customergroups/${groupId}/customers`, { customerId });
  }

  removeCustomerFromGroup(groupId: string, customerId: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/customergroups/${groupId}/customers/${customerId}`);
  }

  getDiscounts(page = 1, pageSize = 10, isActive?: boolean): Observable<PagedResponse<Discount>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    if (isActive !== undefined) params = params.set('isActive', isActive.toString());
    return this.http.get<PagedResponse<Discount>>(`${this.API_URL}/discounts`, { params });
  }

  getDiscount(id: string): Observable<Discount> {
    return this.http.get<Discount>(`${this.API_URL}/discounts/${id}`);
  }

  createDiscount(discount: any): Observable<Discount> {
    return this.http.post<Discount>(`${this.API_URL}/discounts`, discount);
  }

  updateDiscount(id: string, discount: any): Observable<Discount> {
    return this.http.put<Discount>(`${this.API_URL}/discounts/${id}`, discount);
  }

  deleteDiscount(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/discounts/${id}`);
  }

  calculateDiscount(productId: string, categoryId?: string, couponCode?: string, basePrice?: number): Observable<DiscountCalculation> {
    let params = new HttpParams().set('productId', productId);
    if (categoryId) params = params.set('categoryId', categoryId);
    if (couponCode) params = params.set('couponCode', couponCode);
    if (basePrice != null) params = params.set('basePrice', basePrice.toString());
    return this.http.get<DiscountCalculation>(`${this.API_URL}/discounts/calculate`, { params });
  }

  getTaxes(page = 1, pageSize = 10): Observable<PagedResponse<Tax>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    return this.http.get<PagedResponse<Tax>>(`${this.API_URL}/taxes`, { params });
  }

  getTax(id: string): Observable<ApiResponse<Tax>> {
    return this.http.get<ApiResponse<Tax>>(`${this.API_URL}/taxes/${id}`);
  }

  createTax(tax: Partial<Tax>): Observable<ApiResponse<Tax>> {
    return this.http.post<ApiResponse<Tax>>(`${this.API_URL}/taxes`, tax);
  }

  updateTax(id: string, tax: Partial<Tax>): Observable<ApiResponse<Tax>> {
    return this.http.put<ApiResponse<Tax>>(`${this.API_URL}/taxes/${id}`, tax);
  }

  deleteTax(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/taxes/${id}`);
  }

  getUsers(page = 1, pageSize = 10): Observable<PagedResponse<User>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    return this.http.get<PagedResponse<User>>(`${this.API_URL}/users`, { params });
  }

  getUser(id: string): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.API_URL}/users/${id}`);
  }

  createUser(user: Partial<User>): Observable<ApiResponse<User>> {
    return this.http.post<ApiResponse<User>>(`${this.API_URL}/users`, user);
  }

  updateUser(id: string, user: Partial<User>): Observable<ApiResponse<User>> {
    return this.http.put<ApiResponse<User>>(`${this.API_URL}/users/${id}`, user);
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/users/${id}`);
  }

  getProfiles(page = 1, pageSize = 10): Observable<PagedResponse<Profile>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    return this.http.get<PagedResponse<Profile>>(`${this.API_URL}/profiles`, { params });
  }

  getProfile(id: string): Observable<ApiResponse<Profile>> {
    return this.http.get<ApiResponse<Profile>>(`${this.API_URL}/profiles/${id}`);
  }

  createProfile(profile: Partial<Profile>): Observable<ApiResponse<Profile>> {
    return this.http.post<ApiResponse<Profile>>(`${this.API_URL}/profiles`, profile);
  }

  updateProfile(id: string, profile: Partial<Profile>): Observable<ApiResponse<Profile>> {
    return this.http.put<ApiResponse<Profile>>(`${this.API_URL}/profiles/${id}`, profile);
  }

  deleteProfile(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/profiles/${id}`);
  }

  getPermissions(): Observable<ApiResponse<Permission[]>> {
    return this.http.get<ApiResponse<Permission[]>>(`${this.API_URL}/permissions`);
  }

  // Inventory Entries
  getInventoryEntries(page = 1, pageSize = 10): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    return this.http.get<any>(`${this.API_URL}/inventory-entries`, { params });
  }

  createInventoryEntry(entry: any): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/inventory-entries`, entry);
  }

  deleteInventoryEntry(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/inventory-entries/${id}`);
  }

  // Inventory Exits
  getInventoryExits(page = 1, pageSize = 10): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    return this.http.get<any>(`${this.API_URL}/inventory-exits`, { params });
  }

  createInventoryExit(exit: any): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/inventory-exits`, exit);
  }

  deleteInventoryExit(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/inventory-exits/${id}`);
  }

  // Inventory Transfers
  getInventoryTransfers(page = 1, pageSize = 10): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    return this.http.get<any>(`${this.API_URL}/inventory-transfers`, { params });
  }

  createInventoryTransfer(transfer: any): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/inventory-transfers`, transfer);
  }

  deleteInventoryTransfer(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/inventory-transfers/${id}`);
  }

  // Attribute Definitions
  getAttributeDefinitions(categoryId: string, includeInherited = true): Observable<AttributeDefinition[]> {
    let params = new HttpParams().set('includeInherited', includeInherited.toString());
    return this.http.get<AttributeDefinition[]>(`${this.API_URL}/attributedefinitions/category/${categoryId}`, { params });
  }

  getAttributeDefinition(id: string): Observable<AttributeDefinition> {
    return this.http.get<AttributeDefinition>(`${this.API_URL}/attributedefinitions/${id}`);
  }

  createAttributeDefinition(attribute: Partial<AttributeDefinition>): Observable<AttributeDefinition> {
    return this.http.post<AttributeDefinition>(`${this.API_URL}/attributedefinitions`, attribute);
  }

  updateAttributeDefinition(id: string, attribute: Partial<AttributeDefinition>): Observable<AttributeDefinition> {
    return this.http.put<AttributeDefinition>(`${this.API_URL}/attributedefinitions/${id}`, attribute);
  }

  deleteAttributeDefinition(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/attributedefinitions/${id}`);
  }

  addAttributeOption(attributeId: string, option: { value: string }): Observable<AttributeOption> {
    return this.http.post<AttributeOption>(`${this.API_URL}/attributedefinitions/${attributeId}/options`, option);
  }

  updateAttributeOption(optionId: string, option: { value?: string; displayOrder?: number }): Observable<AttributeOption> {
    return this.http.put<AttributeOption>(`${this.API_URL}/attributedefinitions/options/${optionId}`, option);
  }

  deleteAttributeOption(optionId: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/attributedefinitions/options/${optionId}`);
  }

  // Product References
  searchProductReferences(query?: string, limit: number = 20): Observable<any[]> {
    let params = new HttpParams().set('limit', limit.toString());
    if (query) {
      params = params.set('query', query);
    }
    return this.http.get<any[]>(`${this.API_URL}/productreferences/search`, { params });
  }

  getProductReferences(productId: string): Observable<ProductReference[]> {
    return this.http.get<ProductReference[]>(`${this.API_URL}/productreferences/product/${productId}`);
  }

  getProductReference(id: string): Observable<ProductReference> {
    return this.http.get<ProductReference>(`${this.API_URL}/productreferences/${id}`);
  }

  createProductReference(reference: any): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/productreferences`, reference);
  }

  updateProductReference(id: string, reference: any): Observable<any> {
    return this.http.put<any>(`${this.API_URL}/productreferences/${id}`, reference);
  }

  deleteProductReference(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/productreferences/${id}`);
  }

  validateReferenceCombination(productId: string, attributeOptionIds: string[], excludeReferenceId?: string): Observable<{ isValid: boolean }> {
    let params = new HttpParams().set('productId', productId);
    attributeOptionIds.forEach(id => {
      params = params.append('attributeOptionIds', id);
    });
    if (excludeReferenceId) {
      params = params.set('excludeReferenceId', excludeReferenceId);
    }
    return this.http.get<{ isValid: boolean }>(`${this.API_URL}/productreferences/validate-combination`, { params });
  }

  getProductReferencesDropdown(productId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/productreferences/dropdown/${productId}`);
  }

  // Reference Inventories
  getReferenceInventory(referenceId: string): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/referenceinventories/reference/${referenceId}`);
  }

  createUpdateReferenceInventory(inventory: any): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/referenceinventories`, inventory);
  }

  adjustReferenceInventory(referenceId: string, warehouseId: string, adjustment: number): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/referenceinventories/adjust`, {
      productReferenceId: referenceId,
      warehouseId,
      adjustment
    });
  }

  getOrders(page = 1, pageSize = 10, sortField?: string, sortOrder?: 'asc' | 'desc', search?: string, status?: number): Observable<PagedResponse<Order>> {
    const pageNum = Number.isNaN(page) ? 1 : page;
    const pageSizeNum = Number.isNaN(pageSize) ? 10 : pageSize;
    let params = new HttpParams()
      .set('page', pageNum.toString())
      .set('pageSize', pageSizeNum.toString());
    if (sortField) {
      params = params.set('sortField', sortField);
      params = params.set('sortOrder', sortOrder || 'asc');
    }
    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }
    if (status !== undefined && status !== null) {
      params = params.set('status', status.toString());
    }
    return this.http.get<PagedResponse<Order>>(`${this.API_URL}/orders`, { params });
  }

  getOrder(id: string): Observable<Order> {
    return this.http.get<Order>(`${this.API_URL}/orders/${id}`);
  }

  createOrder(order: Partial<Order>): Observable<Order> {
    return this.http.post<Order>(`${this.API_URL}/orders`, order);
  }

  updateOrderStatus(id: string, status: number, notes?: string): Observable<any> {
    return this.http.put<any>(`${this.API_URL}/orders/${id}/status`, { status, notes });
  }

  getOrderPendingCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.API_URL}/orders/pending-count`);
  }

  deleteOrder(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/orders/${id}`);
  }

  // Storefront endpoints (public)
  storefrontCheckout(payload: {
    firstName: string; lastName?: string; email: string; phone: string;
    address: string; neighborhood?: string; notes?: string;
    paymentMethod: 'CashOnDelivery' | 'Nequi';
    paymentReference?: string;
    items: { referenceId: string; quantity: number; unitPrice: number }[];
  }): Observable<{ orderNumber: string; total: number; paymentMethod: string; status: string }> {
    return this.http.post<any>(`${this.API_URL}/storefront/checkout`, payload);
  }

  storefrontGetOrder(orderNumber: string): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/storefront/orders/${orderNumber}`);
  }

  storefrontUploadVoucher(file: File): Observable<{ url: string }> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<{ url: string }>(`${this.API_URL}/storefront/upload-voucher`, form);
  }

  // Contact Messages
  submitContactMessage(payload: { name: string; email: string; subject?: string; message: string }): Observable<any> {
    return this.http.post(`${this.API_URL}/contact-messages`, payload);
  }

  getContactMessages(params?: { unreadOnly?: boolean; page?: number; pageSize?: number }): Observable<{ items: any[]; total: number }> {
    let query = '';
    if (params) {
      const parts: string[] = [];
      if (params.unreadOnly) parts.push('unreadOnly=true');
      if (params.page) parts.push(`page=${params.page}`);
      if (params.pageSize) parts.push(`pageSize=${params.pageSize}`);
      if (parts.length) query = '?' + parts.join('&');
    }
    return this.http.get<{ items: any[]; total: number }>(`${this.API_URL}/contact-messages${query}`);
  }

  getContactMessagesUnreadCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.API_URL}/contact-messages/unread-count`);
  }

  markContactMessageRead(id: string): Observable<any> {
    return this.http.patch(`${this.API_URL}/contact-messages/${id}/read`, {});
  }

  markAllContactMessagesRead(): Observable<any> {
    return this.http.patch(`${this.API_URL}/contact-messages/read-all`, {});
  }

  deleteContactMessage(id: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/contact-messages/${id}`);
  }
}
