import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { TabsModule } from 'primeng/tabs';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { TagModule } from 'primeng/tag';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService } from 'primeng/api';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../../Services';
import { Discount, Category } from '../../../Models';

@Component({
  selector: 'app-discount-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    InputTextModule,
    TextareaModule,
    InputNumberModule,
    SelectModule,
    DatePickerModule,
    ButtonModule,
    ToastModule,
    CardModule,
    TabsModule,
    ToggleSwitchModule,
    AutoCompleteModule,
    TagModule,
    CheckboxModule
  ],
  providers: [MessageService],
  templateUrl: './discount-form.component.html',
  styleUrl: './discount-form.component.scss'
})
export class DiscountFormComponent implements OnInit {
  editingDiscount = signal<Discount | null>(null);
  isLoading = signal(false);

  // Form fields
  name = '';
  description = '';
  type: 'Percentage' | 'FixedAmount' = 'Percentage';
  value = 0;
  startDate: Date = new Date();
  endDate: Date = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  couponCode = '';
  applyToAllProducts = false;
  isActive = true;

  // Assigned products
  assignedProducts: { id: string; name: string; productCode: string }[] = [];
  productSuggestions: any[] = [];
  productSearchText = '';

  // Assigned categories
  allCategories: Category[] = [];
  assignedCategoryIds: string[] = [];

  discountTypes = [
    { label: 'Porcentaje (%)', value: 'Percentage' },
    { label: 'Monto fijo ($)', value: 'FixedAmount' }
  ];

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute,
    private router: Router,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadDiscount(id);
    }
  }

  loadCategories(): void {
    this.apiService.getCategories(1, 200).subscribe({
      next: (res) => { this.allCategories = res.data; },
      error: () => {}
    });
  }

  loadDiscount(id: string): void {
    this.isLoading.set(true);
    this.apiService.getDiscount(id).subscribe({
      next: (d: any) => {
        this.editingDiscount.set(d);
        this.name = d.name;
        this.description = d.description ?? '';
        this.type = d.type ?? 'Percentage';
        this.value = d.value ?? 0;
        this.startDate = new Date(d.startDate);
        this.endDate = new Date(d.endDate);
        this.couponCode = d.couponCode ?? '';
        this.applyToAllProducts = d.applyToAllProducts ?? false;
        this.isActive = d.isActive ?? true;

        // Load assigned products details
        if (d.products && d.products.length > 0) {
          this.assignedProducts = d.products.map((p: any) => ({
            id: p.productId,
            name: p.productName ?? '',
            productCode: ''
          }));
        }

        this.assignedCategoryIds = d.categoryIds ?? [];
        this.isLoading.set(false);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar descuento' });
        this.isLoading.set(false);
        this.router.navigate(['/admin/discounts']);
      }
    });
  }

  searchProducts(event: any): void {
    const query = event.query ?? '';
    this.apiService.getProducts(1, 20, undefined, undefined, query).subscribe({
      next: (res) => {
        this.productSuggestions = res.data.map(p => ({
          id: p.id,
          name: p.name,
          productCode: p.productCode,
          displayLabel: `${p.productCode} — ${p.name}`
        }));
      },
      error: () => { this.productSuggestions = []; }
    });
  }

  onProductSelected(event: any): void {
    const item = event.value ?? event;
    if (item && item.id && !this.assignedProducts.find(p => p.id === item.id)) {
      this.assignedProducts.push({ id: item.id, name: item.name, productCode: item.productCode });
    }
    this.productSearchText = '';
  }

  removeProduct(id: string): void {
    this.assignedProducts = this.assignedProducts.filter(p => p.id !== id);
  }

  isCategorySelected(catId: string): boolean {
    return this.assignedCategoryIds.includes(catId);
  }

  toggleCategory(catId: string): void {
    if (this.isCategorySelected(catId)) {
      this.assignedCategoryIds = this.assignedCategoryIds.filter(id => id !== catId);
    } else {
      this.assignedCategoryIds = [...this.assignedCategoryIds, catId];
    }
  }

  getProductSuggestionLabel(item: any): string {
    return item?.displayLabel ?? '';
  }

  async saveDiscount(): Promise<void> {
    if (!this.name.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'El nombre es requerido' });
      return;
    }

    this.isLoading.set(true);

    const payload = {
      name: this.name.trim(),
      description: this.description,
      type: this.type,
      value: this.value,
      startDate: this.startDate.toISOString(),
      endDate: this.endDate.toISOString(),
      couponCode: this.couponCode.trim() || null,
      applyToAllProducts: this.applyToAllProducts,
      isActive: this.isActive,
      productIds: this.applyToAllProducts ? [] : this.assignedProducts.map(p => p.id),
      categoryIds: this.applyToAllProducts ? [] : this.assignedCategoryIds
    };

    try {
      if (this.editingDiscount()) {
        await firstValueFrom(this.apiService.updateDiscount(this.editingDiscount()!.id, payload));
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Descuento actualizado' });
      } else {
        await firstValueFrom(this.apiService.createDiscount(payload));
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Descuento creado' });
      }
      setTimeout(() => this.router.navigate(['/admin/discounts']), 800);
    } catch {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al guardar descuento' });
      this.isLoading.set(false);
    }
  }

  goBack(): void {
    this.router.navigate(['/admin/discounts']);
  }
}
