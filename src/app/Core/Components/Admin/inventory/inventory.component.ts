import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { PaginatorModule } from 'primeng/paginator';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { ApiService } from '../../../Services';
import { Inventory, Product, Warehouse } from '../../../Models';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    PaginatorModule,
    ToastModule,
    TooltipModule
  ],
  providers: [MessageService],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.scss'
})
export class InventoryComponent implements OnInit {
  inventories = signal<Inventory[]>([]);
  allInventories = signal<Inventory[]>([]);
  products = signal<Product[]>([]);
  warehouses = signal<Warehouse[]>([]);
  totalCount = signal(0);
  pageSize = 10;

  selectedWarehouseId = signal<string>('');
  selectedProductId = signal<string>('');
  sortBy = signal<string>('product');
  sortOrder = signal<'asc' | 'desc'>('asc');
  searchTerm = signal<string>('');

  sortOptions = [
    { label: 'Producto', value: 'product' },
    { label: 'SKU', value: 'sku' },
    { label: 'Almacén', value: 'warehouse' },
    { label: 'Cantidad', value: 'quantity' }
  ];

  constructor(private apiService: ApiService, private messageService: MessageService) {}
  
  ngOnInit(): void { 
    this.loadProducts();
    this.loadWarehouses();
    this.loadInventories();
  }

  loadProducts(): void {
    this.apiService.getProducts(1, 1000).subscribe({
      next: (res) => { this.products.set(res.data); }
    });
  }

  loadWarehouses(): void {
    this.apiService.getWarehouses(1, 100).subscribe({
      next: (res) => { this.warehouses.set(res.data); }
    });
  }

  loadInventories(): void {
    this.apiService.getInventories(1, 1000).subscribe({
      next: (res) => { 
        this.allInventories.set(res.data);
        this.applyFilters();
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.allInventories()];

    if (this.selectedWarehouseId()) {
      filtered = filtered.filter(i => i.warehouseId === this.selectedWarehouseId());
    }

    if (this.selectedProductId()) {
      filtered = filtered.filter(i => i.productId === this.selectedProductId());
    }

    if (this.searchTerm()) {
      const term = this.searchTerm().toLowerCase();
      filtered = filtered.filter(i => 
        i.product?.name?.toLowerCase().includes(term) ||
        (i.product as any)?.productCode?.toLowerCase().includes(term) ||
        i.warehouse?.name?.toLowerCase().includes(term)
      );
    }

    filtered.sort((a, b) => {
      let valA: any, valB: any;
      switch (this.sortBy()) {
        case 'product': valA = a.product?.name || ''; valB = b.product?.name || ''; break;
        case 'warehouse': valA = a.warehouse?.name || ''; valB = b.warehouse?.name || ''; break;
        case 'quantity': valA = a.quantity; valB = b.quantity; break;
        case 'sku': valA = (a.product as any)?.productCode || ''; valB = (b.product as any)?.productCode || ''; break;
        default: valA = a.product?.name || ''; valB = b.product?.name || '';
      }
      
      if (typeof valA === 'string') {
        return this.sortOrder() === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return this.sortOrder() === 'asc' ? valA - valB : valB - valA;
    });

    this.totalCount.set(filtered.length);
    
    const start = 0;
    const end = this.pageSize;
    this.inventories.set(filtered.slice(start, end));
  }

  onPageChange(event: any): void { 
    this.pageSize = event.rows;
    this.applyFilters();
  }

  onWarehouseChange(): void { this.applyFilters(); }
  onProductChange(): void { this.applyFilters(); }
  onSearchChange(): void { this.applyFilters(); }

  onSortChange(): void {
    this.sortOrder.update(v => v === 'asc' ? 'desc' : 'asc');
    this.applyFilters();
  }

  clearFilters(): void {
    this.selectedWarehouseId.set('');
    this.selectedProductId.set('');
    this.searchTerm.set('');
    this.sortBy.set('product');
    this.sortOrder.set('asc');
    this.applyFilters();
  }

  exportToExcel(): void {
    let data = [...this.allInventories()];
    
    if (this.selectedWarehouseId()) {
      data = data.filter(i => i.warehouseId === this.selectedWarehouseId());
    }
    if (this.selectedProductId()) {
      data = data.filter(i => i.productId === this.selectedProductId());
    }

    const headers = ['SKU', 'Producto', 'Bodega', 'Cantidad', 'Stock Mínimo', 'Reservado'];
    const rows = data.map((i: any) => [
      i.product?.productCode || '',
      i.product?.name || '',
      i.warehouse?.name || '',
      i.quantity,
      i.minStock || 0,
      i.reservedQuantity || 0
    ]);

    let csv = headers.join(',') + '\n';
    rows.forEach((row: any[]) => {
      csv += row.map((cell: any) => `"${cell}"`).join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `inventario_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Inventario exportado' });
  }
}
