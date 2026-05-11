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

interface InventoryExit {
  id: string;
  productId: string;
  productReferenceId?: string;
  product?: any;
  productReference?: any;
  warehouseId: string;
  warehouse?: any;
  quantity: number;
  reason: string;
  reference: string;
  notes: string;
  createdAt: string;
}

@Component({
  selector: 'app-inventory-exits',
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
  templateUrl: './inventory-exits.component.html',
  styleUrl: './inventory-exits.component.scss'
})
export class InventoryExitsComponent implements OnInit {
  exits = signal<InventoryExit[]>([]);
  products = signal<any[]>([]);
  productReferences = signal<any[]>([]);
  warehouses = signal<any[]>([]);
  totalCount = signal(0);
  pageSize = 10;
  showDialog = signal(false);
  formData: any = {};
  reasons = ['Venta', 'Devolución a proveedor', 'Merma', 'Muestra', 'Dañado', 'Otro'];

  constructor(private apiService: ApiService, public authService: AuthService, private messageService: MessageService, private confirmationService: ConfirmationService) {}

  ngOnInit(): void {
    this.loadExits();
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
  loadExits(page = 1): void {
    this.apiService.getInventoryExits(page, this.pageSize).subscribe({
      next: (res: any) => { this.exits.set(res.data); this.totalCount.set(res.total ?? 0); },
      error: () => { this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar salidas' }); }
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
    this.loadExits(event.page + 1);
  }

  openDialog(): void {
    this.formData = { quantity: 1 };
    this.productReferences.set([]);
    this.showDialog.set(true);
  }

  closeDialog(): void {
    this.showDialog.set(false);
  }

  saveExit(): void {
    this.apiService.createInventoryExit(this.formData).subscribe({
      next: () => { this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Salida registrada' }); this.closeDialog(); this.loadExits(); },
      error: () => { this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al registrar' }); }
    });
  }

  deleteExit(id: string): void {
    this.confirmationService.confirm({
      message: '¿Eliminar esta salida?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.apiService.deleteInventoryExit(id).subscribe({
          next: () => { this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Eliminado' }); this.loadExits(); },
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
