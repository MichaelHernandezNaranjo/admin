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
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { ToolbarModule } from 'primeng/toolbar';
import { CardModule } from 'primeng/card';
import { MessageService } from 'primeng/api';
import { ApiService, AuthService } from '../../../Services';

@Component({
  selector: 'app-inventory-exits',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule,
    InputNumberModule, TextareaModule, SelectModule, PaginatorModule,
    ToastModule, TooltipModule, TagModule, ToolbarModule, CardModule
  ],
  providers: [MessageService],
  templateUrl: './inventory-exits.component.html',
  styleUrl: './inventory-exits.component.scss'
})
export class InventoryExitsComponent implements OnInit {
  view = signal<'list' | 'form'>('list');

  batches = signal<any[]>([]);
  total = signal(0);
  pageSize = 10;

  products = signal<any[]>([]);
  productReferences = signal<any[]>([]);
  warehouses = signal<any[]>([]);

  editingId: string | null = null;
  header: any = {};
  items: any[] = [];
  newItem: any = { quantity: 1 };

  reasonOptions = [
    { label: 'Ajuste', value: 'Ajuste' },
    { label: 'Daño / Merma', value: 'Daño' },
    { label: 'Devolución a proveedor', value: 'Devolución' },
    { label: 'Consumo interno', value: 'Consumo' },
    { label: 'Otro', value: 'Otro' }
  ];

  constructor(public authService: AuthService, private apiService: ApiService, private messageService: MessageService) {}

  ngOnInit(): void {
    this.loadBatches();
    this.loadProducts();
    this.loadWarehouses();
  }

  loadBatches(page = 1): void {
    this.apiService.getInventoryExits(page, this.pageSize).subscribe({
      next: (res: any) => { this.batches.set(res.data); this.total.set(res.total ?? 0); }
    });
  }

  loadProducts(): void {
    this.apiService.getProducts(1, 1000).subscribe({ next: (res: any) => this.products.set(res.data) });
  }

  loadWarehouses(): void {
    this.apiService.getWarehouses(1, 100).subscribe({ next: (res: any) => this.warehouses.set(res.data) });
  }

  onPageChange(event: any): void { this.pageSize = event.rows; this.loadBatches(event.page + 1); }

  openNew(): void {
    this.editingId = null;
    this.header = { date: new Date().toISOString().split('T')[0] };
    this.items = [];
    this.newItem = { quantity: 1 };
    this.productReferences.set([]);
    this.view.set('form');
  }

  openEdit(batch: any): void {
    this.apiService.getInventoryExitBatch(batch.id).subscribe({
      next: (b: any) => {
        this.editingId = b.id;
        this.header = {
          warehouseId: b.warehouse?.id,
          reason: b.reason,
          reference: b.reference,
          notes: b.notes,
          date: b.date?.split('T')[0]
        };
        this.items = b.items.map((i: any) => ({
          productId: i.productId,
          productReferenceId: i.productReferenceId,
          quantity: i.quantity,
          productName: i.product?.name,
          refCode: i.productReference?.referenceCode
        }));
        this.productReferences.set([]);
        this.view.set('form');
      }
    });
  }

  backToList(): void { this.view.set('list'); this.loadBatches(); }

  onProductChange(): void {
    this.newItem.productReferenceId = null;
    if (this.newItem.productId) {
      this.apiService.getProductReferences(this.newItem.productId).subscribe({
        next: (refs: any) => this.productReferences.set(refs),
        error: () => this.productReferences.set([])
      });
    } else {
      this.productReferences.set([]);
    }
  }

  addItem(): void {
    if (!this.newItem.productId || !this.newItem.quantity) {
      this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Seleccione un producto y cantidad' });
      return;
    }
    const prod = this.products().find(p => p.id === this.newItem.productId);
    const ref = this.productReferences().find(r => r.id === this.newItem.productReferenceId);
    this.items = [...this.items, {
      productId: this.newItem.productId,
      productReferenceId: this.newItem.productReferenceId ?? null,
      quantity: this.newItem.quantity,
      productName: prod?.name,
      refCode: ref?.referenceCode
    }];
    this.newItem = { quantity: 1 };
    this.productReferences.set([]);
  }

  removeItem(idx: number): void { this.items = this.items.filter((_, i) => i !== idx); }

  save(): void {
    if (!this.header.warehouseId || !this.header.reason) {
      this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Bodega y motivo son requeridos' });
      return;
    }
    if (this.items.length === 0) {
      this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Agregue al menos un item' });
      return;
    }
    const payload = {
      warehouseId: this.header.warehouseId,
      reason: this.header.reason,
      reference: this.header.reference || null,
      notes: this.header.notes || null,
      date: this.header.date ? new Date(this.header.date).toISOString() : new Date().toISOString(),
      items: this.items.map(i => ({ productId: i.productId, productReferenceId: i.productReferenceId || null, quantity: i.quantity }))
    };
    const req = this.editingId
      ? this.apiService.updateInventoryExit(this.editingId, payload)
      : this.apiService.createInventoryExit(payload);
    req.subscribe({
      next: () => { this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Lote guardado como borrador' }); this.backToList(); },
      error: (e: any) => this.messageService.add({ severity: 'error', summary: 'Error', detail: e.error?.message || 'Error al guardar' })
    });
  }

  confirm(id: string): void {
    if (!confirm('¿Confirmar esta salida? Se descontará del inventario.')) return;
    this.apiService.confirmInventoryExit(id).subscribe({
      next: () => { this.messageService.add({ severity: 'success', summary: 'Confirmado', detail: 'Inventario actualizado' }); this.loadBatches(); },
      error: (e: any) => this.messageService.add({ severity: 'error', summary: 'Error', detail: e.error?.message || 'Error al confirmar' })
    });
  }

  cancel(id: string): void {
    if (!confirm('¿Cancelar este lote?')) return;
    this.apiService.cancelInventoryExit(id).subscribe({
      next: () => { this.messageService.add({ severity: 'success', summary: 'Cancelado', detail: '' }); this.loadBatches(); },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error' })
    });
  }

  delete(id: string): void {
    if (!confirm('¿Eliminar este lote?')) return;
    this.apiService.deleteInventoryExit(id).subscribe({
      next: () => { this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: '' }); this.loadBatches(); },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error' })
    });
  }

  statusSeverity(status: string): string {
    if (status === 'Confirmado') return 'success';
    if (status === 'Cancelado') return 'danger';
    return 'warn';
  }
}
