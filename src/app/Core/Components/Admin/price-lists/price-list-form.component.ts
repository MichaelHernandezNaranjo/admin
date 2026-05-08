import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { TabsModule } from 'primeng/tabs';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { MessageService } from 'primeng/api';
import { ApiService } from '../../../Services';
import { PriceList } from '../../../Models';

@Component({
  selector: 'app-price-list-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    InputTextModule,
    InputNumberModule,
    TextareaModule,
    CheckboxModule,
    ButtonModule,
    ToastModule,
    CardModule,
    TabsModule,
    TableModule,
    DialogModule,
    AutoCompleteModule
  ],
  providers: [MessageService],
  templateUrl: './price-list-form.component.html',
  styleUrl: './price-list-form.component.scss'
})
export class PriceListFormComponent implements OnInit {
  editingPriceList = signal<PriceList | null>(null);
  formData: Partial<PriceList> = { isActive: true, isDefault: false };
  isLoading = signal(false);

  // Product management
  priceListProducts = signal<any[]>([]);
  showProductDialog = false;
  selectedReference: any = null;
  filteredReferences: any[] = [];
  newProductPrice: number = 0;

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute,
    private router: Router,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadPriceList(id);
      this.loadPriceListProducts(id);
    }
  }

  loadPriceList(id: string): void {
    this.isLoading.set(true);
    this.apiService.getPriceList(id).subscribe({
      next: (res) => {
        const priceList = res.data || res;
        this.editingPriceList.set(priceList);
        this.formData = { ...priceList };
        this.isLoading.set(false);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar lista de precios' });
        this.isLoading.set(false);
        this.router.navigate(['/admin/price-lists']);
      }
    });
  }

  savePriceList(): void {
    if (!this.formData.name) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'El nombre es requerido' });
      return;
    }

    this.isLoading.set(true);
    
    if (this.editingPriceList()) {
      this.apiService.updatePriceList(this.editingPriceList()!.id, this.formData).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Lista de precios actualizada' });
          this.router.navigate(['/admin/price-lists']);
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al actualizar lista de precios' });
          this.isLoading.set(false);
        }
      });
    } else {
      this.apiService.createPriceList(this.formData).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Lista de precios creada' });
          this.router.navigate(['/admin/price-lists']);
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al crear lista de precios' });
          this.isLoading.set(false);
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/admin/price-lists']);
  }

  searchReferences(event: any): void {
    const query = event.query;
    this.apiService.searchProductReferences(query, 50).subscribe({
      next: (refs) => {
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

  loadPriceListProducts(priceListId: string): void {
    this.apiService.getPriceListProducts(priceListId).subscribe({
      next: (products) => this.priceListProducts.set(products),
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar productos' });
      }
    });
  }

  openAddProductDialog(): void {
    if (!this.editingPriceList()) {
      this.messageService.add({ severity: 'warn', summary: 'Aviso', detail: 'Guarda la lista de precios primero' });
      return;
    }
    this.selectedReference = null;
    this.newProductPrice = 0;
    this.showProductDialog = true;
  }

  addProductToPriceList(): void {
    if (!this.selectedReference || !this.newProductPrice || this.newProductPrice <= 0) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'Selecciona una referencia y precio válido' });
      return;
    }

    const priceListId = this.editingPriceList()!.id;
    this.apiService.addProductToPriceList(priceListId, this.selectedReference.id, this.newProductPrice).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Referencia agregada' });
        this.loadPriceListProducts(priceListId);
        this.showProductDialog = false;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al agregar referencia' });
      }
    });
  }

  removeProductFromPriceList(itemId: string): void {
    if (!confirm('¿Eliminar esta referencia de la lista de precios?')) return;

    const priceListId = this.editingPriceList()!.id;
    this.apiService.deletePriceListItem(priceListId, itemId).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Referencia eliminada' });
        this.loadPriceListProducts(priceListId);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar referencia' });
      }
    });
  }

  getAttributeDisplay(item: any): string {
    if (!item.attributeValues || item.attributeValues.length === 0) {
      return '';
    }
    return item.attributeValues.map((av: any) => av.optionValue).join(', ');
  }
}
