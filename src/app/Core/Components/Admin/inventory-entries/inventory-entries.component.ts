import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { PaginatorModule } from 'primeng/paginator';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ApiService, AuthService } from '../../../Services';

interface InventoryEntry {
  id: string;
  productId: string;
  productReferenceId?: string;
  product?: any;
  productReference?: any;
  warehouseId: string;
  warehouse?: any;
  quantity: number;
  supplier: string;
  reference: string;
  notes: string;
  createdAt: string;
}

@Component({
  selector: 'app-inventory-entries',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    TextareaModule,
    SelectModule,
    PaginatorModule,
    DialogModule,
    ToastModule,
    TooltipModule,
    TagModule,
    ConfirmDialogModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './inventory-entries.component.html',
  styleUrl: './inventory-entries.component.scss'
})
export class InventoryEntriesComponent implements OnInit {
  entries = signal<InventoryEntry[]>([]);
  products = signal<any[]>([]);
  productReferences = signal<any[]>([]);
  warehouses = signal<any[]>([]);
  totalCount = signal(0);
  pageSize = 10;
  showDialog = signal(false);
  formData: any = {};
  isEditing = signal(false);

  constructor(private apiService: ApiService, public authService: AuthService, private messageService: MessageService, private confirmationService: ConfirmationService) {}

  ngOnInit(): void {
    this.loadEntries();
    this.loadProducts();
    this.loadWarehouses();
  }

  loadEntries(page = 1): void {
    this.apiService.getInventoryEntries(page, this.pageSize).subscribe({
      next: (res: any) => { this.entries.set(res.data); this.totalCount.set(res.total ?? 0); },
      error: () => { this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar entradas' }); }
    });
  }

  loadProducts(): void {
    this.apiService.getProducts(1, 100).subscribe({
      next: (res: any) => { this.products.set(res.data); }
    });
  }
  
  onProductChange(productId: string): void {
    if (productId) {
      this.apiService.getProductReferences(productId).subscribe({
        next: (refs: any) => { 
          this.productReferences.set(refs); 
          // Reset productReferenceId when product changes
          this.formData.productReferenceId = null;
        },
        error: () => { 
          this.productReferences.set([]); 
          this.formData.productReferenceId = null;
        }
      });
    } else {
      this.productReferences.set([]);
      this.formData.productReferenceId = null;
    }
  }

  loadWarehouses(): void {
    this.apiService.getWarehouses(1, 100).subscribe({
      next: (res: any) => { this.warehouses.set(res.data); }
    });
  }

  onPageChange(event: any): void {
    this.pageSize = event.rows;
    this.loadEntries(event.page + 1);
  }

  openDialog(): void {
    this.isEditing.set(false);
    this.formData = { quantity: 1 };
    this.productReferences.set([]);
    this.showDialog.set(true);
  }

  closeDialog(): void {
    this.showDialog.set(false);
  }

  saveEntry(): void {
    this.apiService.createInventoryEntry(this.formData).subscribe({
      next: () => { this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Entrada registrada' }); this.closeDialog(); this.loadEntries(); },
      error: () => { this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al registrar' }); }
    });
  }

  deleteEntry(id: string): void {
    this.confirmationService.confirm({
      message: '¿Eliminar esta entrada?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.apiService.deleteInventoryEntry(id).subscribe({
          next: () => { this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Eliminado' }); this.loadEntries(); },
          error: () => { this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar' }); }
        });
      }
    });
  }
  
  getAttributeDisplay(reference: any): string {
    if (!reference.attributeValues || reference.attributeValues.length === 0) {
      return '';
    }
    return reference.attributeValues.map((av: any) => av.optionValue).join(', ');
  }
}
