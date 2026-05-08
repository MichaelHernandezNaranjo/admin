import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { ApiService } from '@core/Services';
import { Order, Customer } from '@core/Models';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-order-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    InputTextModule,
    TextareaModule,
    ButtonModule,
    SelectModule,
    InputNumberModule,
    AutoCompleteModule,
    TableModule,
    TagModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './order-form.component.html',
  styleUrl: './order-form.component.scss'
})
export class OrderFormComponent implements OnInit {
  editingOrder = signal<Order | null>(null);
  isLoading = signal(false);
  addingItem = signal(false);
  
  formData: any = {
    customerId: null,
    warehouseId: null,
    priceListId: null,
    couponCode: '',
    notes: '',
    items: []
  };
  
  customers = signal<Customer[]>([]);
  warehouses = signal<any[]>([]);
  priceLists = signal<any[]>([]);

  // Cache de precios de la lista activa: referenceId → price
  private priceListCache: Map<string, number> = new Map();
  private priceListCachedId: string | null = null;

  // AutoComplete for product references
  selectedReference: any = null;
  filteredReferences: any[] = [];
  selectedQuantity = 1;

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute,
    private router: Router,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadCustomers();
    this.loadWarehouses();
    this.loadPriceLists();
    
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadOrder(id);
    }
  }

  loadCustomers(): void {
    this.apiService.getCustomers(1, 100).subscribe({
      next: (res) => this.customers.set(res.data)
    });
  }

  loadPriceLists(): void {
    this.apiService.getPriceLists(1, 100).subscribe({
      next: (res) => this.priceLists.set(res.data)
    });
  }
  
  searchReferences(event: any): void {
    const query = event.query;
    this.apiService.searchProductReferences(query, 50).subscribe({
      next: (refs) => {
        // Agregar propiedad displayLabel para mostrar en el input
        this.filteredReferences = refs.map((ref: any) => {
          const attributes = ref.attributeValues && ref.attributeValues.length > 0
            ? ref.attributeValues.map((av: any) => av.optionValue).join(', ')
            : '';
          
          return {
            ...ref,
            displayLabel: `${ref.productName} - ${ref.referenceCode}${attributes ? ' (' + attributes + ')' : ''}`
          };
        });
      },
      error: () => {
        this.filteredReferences = [];
      }
    });
  }

  loadWarehouses(): void {
    this.apiService.getWarehouses().subscribe({
      next: (res: any) => this.warehouses.set(res.data || [])
    });
  }

  loadOrder(id: string): void {
    this.isLoading.set(true);
    this.apiService.getOrder(id).subscribe({
      next: (order) => {
        this.editingOrder.set(order);
        this.formData = {
          customerId: order.customerId,
          warehouseId: order.warehouseId,
          notes: order.notes || '',
          items: order.items?.map((item: any) => ({
            productReferenceId: item.productReferenceId,
            productName: item.productName,
            referenceCode: item.referenceCode,
            attributeDisplay: this.getAttributeDisplay(item),
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount || 0,
            total: item.total
          })) || []
        };
        this.isLoading.set(false);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar pedido' });
        this.isLoading.set(false);
      }
    });
  }

  async addItem(): Promise<void> {
    if (!this.selectedReference || !this.selectedQuantity || this.selectedQuantity < 1) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'Selecciona una referencia y cantidad' });
      return;
    }

    const existingIndex = this.formData.items.findIndex((i: any) => i.productReferenceId === this.selectedReference.id);
    if (existingIndex >= 0) {
      const existing = this.formData.items[existingIndex];
      existing.quantity += this.selectedQuantity;
      existing.total = existing.quantity * existing.discountedUnitPrice;
      this.selectedReference = null;
      this.selectedQuantity = 1;
      return;
    }

    this.addingItem.set(true);
    try {
    const ref = this.selectedReference;
    const qty = this.selectedQuantity;
    const productId = ref.productId;
    const coupon = this.formData.couponCode?.trim() || undefined;
    const attributeDisplay = this.getAttributeDisplay(ref);

    // Precio + descuento en paralelo
    const [unitPrice, calc] = await Promise.all([
      this.getPriceForReference(ref.id),
      firstValueFrom(this.apiService.calculateDiscount(productId, undefined, coupon, ref.price || 0)
        .pipe()).catch(() => null)
    ]);

    // Si el precio de lista difiere del precio base del producto, recalcular descuento con el precio real
    let discount = 0;
    let discountName: string | null = null;
    if (calc && calc.hasDiscount) {
      // Si el descuento es porcentual, aplicarlo al unitPrice real
      // El backend ya devolvió el discountAmount sobre ref.price; si el unitPrice es distinto, recalcular proporcionalmente
      if (calc.discountType === 'Percentage' && ref.price > 0) {
        const pct = calc.discountAmount / ref.price;
        discount = Math.round(unitPrice * pct * 100) / 100;
      } else {
        discount = calc.discountAmount;
      }
      discountName = calc.discountName ?? null;
    }

    const discountedUnitPrice = unitPrice - discount;

    this.formData.items.push({
      productReferenceId: ref.id,
      productId,
      productName: ref.productName,
      referenceCode: ref.referenceCode,
      attributeDisplay,
      quantity: qty,
      basePrice: ref.price || unitPrice,
      unitPrice,
      discount,
      discountedUnitPrice,
      discountName,
      total: qty * discountedUnitPrice
    });

    this.selectedReference = null;
    this.selectedQuantity = 1;
    } finally {
      this.addingItem.set(false);
    }
  }

  async getPriceListPrices(): Promise<Map<string, number>> {
    const id = this.formData.priceListId;
    if (!id) return new Map();
    if (this.priceListCachedId === id) return this.priceListCache;
    try {
      const products = await firstValueFrom(this.apiService.getPriceListProducts(id));
      this.priceListCache = new Map(products.map((p: any) => [p.productReferenceId, p.price]));
      this.priceListCachedId = id;
    } catch {
      this.priceListCache = new Map();
      this.priceListCachedId = id;
    }
    return this.priceListCache;
  }

  async getPriceForReference(referenceId: string): Promise<number> {
    const prices = await this.getPriceListPrices();
    if (prices.has(referenceId)) return prices.get(referenceId)!;
    return this.selectedReference?.price || 0;
  }

  async onPriceListChange(newPriceListId: string | null): Promise<void> {
    // Invalidar cache para forzar recarga con la nueva lista
    this.priceListCachedId = null;
    this.priceListCache = new Map();

    if (this.formData.items.length === 0) return;

    // Cargar precios de la nueva lista (1 sola llamada, cacheada)
    let priceListPrices: Map<string, number> = new Map();
    if (newPriceListId) {
      priceListPrices = await this.getPriceListPrices();
    }

    const coupon = this.formData.couponCode?.trim() || undefined;

    // Recalcular todos los items en paralelo
    await Promise.all(this.formData.items.map(async (item: any) => {
      if (item.basePrice == null) item.basePrice = item.unitPrice;

      const unitPrice = priceListPrices.has(item.productReferenceId)
        ? priceListPrices.get(item.productReferenceId)!
        : (item.basePrice ?? item.unitPrice);

      item.unitPrice = unitPrice;

      try {
        const calc = await firstValueFrom(this.apiService.calculateDiscount(item.productId, undefined, coupon, unitPrice));
        if (calc.hasDiscount) {
          const discount = calc.discountType === 'Percentage' && item.basePrice > 0
            ? Math.round(unitPrice * (calc.discountAmount / item.basePrice) * 100) / 100
            : calc.discountAmount;
          item.discount = discount;
          item.discountedUnitPrice = unitPrice - discount;
          item.discountName = calc.discountName ?? null;
        } else {
          item.discount = 0;
          item.discountedUnitPrice = unitPrice;
          item.discountName = null;
        }
      } catch {
        item.discount = 0;
        item.discountedUnitPrice = unitPrice;
        item.discountName = null;
      }

      item.total = item.quantity * item.discountedUnitPrice;
    }));
  }

  removeItem(index: number): void {
    this.formData.items.splice(index, 1);
  }

  getSubtotal(): number {
    return this.formData.items.reduce((sum: number, item: any) => sum + (item.unitPrice * item.quantity), 0);
  }

  getDiscountTotal(): number {
    return this.formData.items.reduce((sum: number, item: any) => sum + ((item.discount || 0) * item.quantity), 0);
  }

  getTaxAmount(): number {
    return (this.getSubtotal() - this.getDiscountTotal()) * 0.16;
  }

  getTotal(): number {
    return this.getSubtotal() - this.getDiscountTotal() + this.getTaxAmount();
  }

  saveOrder(): void {
    if (!this.formData.customerId) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'Selecciona un cliente' });
      return;
    }

    if (this.formData.items.length === 0) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'Agrega al menos un producto' });
      return;
    }

    this.isLoading.set(true);

    const orderData = {
      customerId: this.formData.customerId,
      warehouseId: this.formData.warehouseId,
      priceListId: this.formData.priceListId || null,
      couponCode: this.formData.couponCode?.trim() || null,
      notes: this.formData.notes,
      items: this.formData.items.map((item: any) => ({
        productReferenceId: item.productReferenceId,
        quantity: item.quantity
      }))
    };

    if (this.editingOrder()) {
      // Update - pending for backend implementation
      this.messageService.add({ severity: 'info', summary: 'Info', detail: 'Edición de pedidos en desarrollo' });
      this.isLoading.set(false);
    } else {
      this.apiService.createOrder(orderData).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Pedido creado' });
          this.router.navigate(['/admin/orders']);
        },
        error: (err) => {
          const errorMsg = err.error?.message || 'Error al crear pedido';
          this.messageService.add({ severity: 'error', summary: 'Error', detail: errorMsg });
          this.isLoading.set(false);
        }
      });
    }
  }
  
  getAttributeDisplay(reference: any): string {
    if (!reference.attributeValues || reference.attributeValues.length === 0) {
      return '';
    }
    return reference.attributeValues.map((av: any) => av.optionValue).join(', ');
  }

  getSelectedReferenceDisplay(reference: any): string {
    if (!reference) return '';
    
    let display = `${reference.productName} - ${reference.referenceCode}`;
    
    const attributes = this.getAttributeDisplay(reference);
    if (attributes) {
      display += ` (${attributes})`;
    }
    
    return display;
  }

  goBack(): void {
    this.router.navigate(['/admin/orders']);
  }
}