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
import { ToolbarModule } from 'primeng/toolbar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ApiService, AuthService } from '../../../Services';

interface InventoryTransfer {
  id: string;
  productId: string;
  productReferenceId?: string;
  product?: any;
  productReference?: any;
  sourceWarehouseId: string;
  sourceWarehouse?: any;
  targetWarehouseId: string;
  targetWarehouse?: any;
  quantity: number;
  reference: string;
  notes: string;
  status: string;
  createdAt: string;
}

@Component({
  selector: 'app-inventory-transfers',
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
    ToolbarModule,
    ConfirmDialogModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './inventory-transfers.component.html',
  styleUrl: './inventory-transfers.component.scss'
})
export class InventoryTransfersComponent implements OnInit {
  transfers = signal<InventoryTransfer[]>([]);
  products = signal<any[]>([]);
  productReferences = signal<any[]>([]);
  warehouses = signal<any[]>([]);
  totalCount = signal(0);
  pageSize = 10;
  showDialog = signal(false);
  formData: any = {};
  statuses = ['Pendiente', 'En tránsito', 'Completado', 'Cancelado'];

  constructor(private apiService: ApiService, public authService: AuthService, private messageService: MessageService, private confirmationService: ConfirmationService) {}

  ngOnInit(): void {
    this.loadTransfers();
    this.loadProducts();
    this.loadWarehouses();
  }
  
  onProductChange(productId: string): void {
    if (productId) {
      this.apiService.getProductReferences(productId).subscribe({
        next: (refs: any) => { 
          this.productReferences.set(refs); 
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

  loadTransfers(page = 1): void {
    this.apiService.getInventoryTransfers(page, this.pageSize).subscribe({
      next: (res: any) => { this.transfers.set(res.data); this.totalCount.set(res.total ?? 0); },
      error: () => { this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar traslados' }); }
    });
  }

  loadProducts(): void {
    this.apiService.getProducts(1, 100).subscribe({
      next: (res: any) => { this.products.set(res.data); }
    });
  }

  loadWarehouses(): void {
    this.apiService.getWarehouses(1, 100).subscribe({
      next: (res: any) => { this.warehouses.set(res.data); }
    });
  }

  onPageChange(event: any): void {
    this.pageSize = event.rows;
    this.loadTransfers(event.page + 1);
  }

  openDialog(): void {
    this.formData = { quantity: 1, status: 'Pendiente' };
    this.productReferences.set([]);
    this.showDialog.set(true);
  }

  closeDialog(): void {
    this.showDialog.set(false);
  }

  saveTransfer(): void {
    this.apiService.createInventoryTransfer(this.formData).subscribe({
      next: () => { this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Traslado registrado' }); this.closeDialog(); this.loadTransfers(); },
      error: () => { this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al registrar' }); }
    });
  }

  deleteTransfer(id: string): void {
    this.confirmationService.confirm({
      message: '¿Eliminar este traslado?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.apiService.deleteInventoryTransfer(id).subscribe({
          next: () => { this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Eliminado' }); this.loadTransfers(); },
          error: () => { this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar' }); }
        });
      }
    });
  }

  getStatusSeverity(status: string): 'success' | 'danger' | 'info' | 'warn' | 'secondary' {
    switch (status) {
      case 'Completado': return 'success';
      case 'Cancelado': return 'danger';
      case 'En tránsito': return 'info';
      default: return 'warn';
    }
  }
  
  getAttributeDisplay(reference: any): string {
    if (!reference.attributeValues || reference.attributeValues.length === 0) {
      return '';
    }
    return reference.attributeValues.map((av: any) => av.optionValue).join(', ');
  }
}
