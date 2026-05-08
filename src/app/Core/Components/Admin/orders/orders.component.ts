import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { SelectModule } from 'primeng/select';
import { BadgeModule } from 'primeng/badge';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ApiService, AuthService } from '@core/Services';
import { Order } from '@core/Models';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    TagModule,
    ToastModule,
    ConfirmDialogModule,
    ToolbarModule,
    InputTextModule,
    InputGroupModule,
    InputGroupAddonModule,
    SelectModule,
    BadgeModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss'
})
export class OrdersComponent implements OnInit {
  orders = signal<Order[]>([]);
  totalRecords = signal(0);
  pendingCount = signal(0);
  loading = signal(false);
  first = 0;
  rows = 10;
  sortField = '';
  sortOrder: 'asc' | 'desc' = 'asc';
  searchTerm = '';
  selectedStatus: number | null = null;

  statusOptions = [
    { label: 'Todos', value: null },
    { label: 'Pendiente', value: 0 },
    { label: 'Confirmado', value: 1 },
    { label: 'Procesando', value: 2 },
    { label: 'Enviado', value: 3 },
    { label: 'Entregado', value: 4 },
    { label: 'Cancelado', value: 5 }
  ];

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.loadOrders();
    this.loadPendingCount();
  }

  goToNewOrder(): void {
    this.router.navigate(['/admin/orders/new']);
  }

  loadPendingCount(): void {
    this.apiService.getOrderPendingCount().subscribe({
      next: (res) => this.pendingCount.set(res.count),
      error: () => {}
    });
  }

  loadOrders(): void {
    this.loading.set(true);
    this.apiService.getOrders(1, this.rows, this.sortField, this.sortOrder, this.searchTerm, this.selectedStatus ?? undefined).subscribe({
      next: (res: any) => {
        this.orders.set(res.data);
        this.totalRecords.set(res.total ?? 0);
        this.loading.set(false);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar pedidos' });
        this.loading.set(false);
      }
    });
  }

  onSearch(): void { this.loadOrders(); }

  onSort(field: string): void {
    if (this.sortField === field) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortOrder = 'asc';
    }
    this.loadOrders();
  }

  getStatusSeverity(status: number | undefined): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | null {
    if (status === undefined) return 'warn';
    switch (status) {
      case 0: return 'warn';
      case 1: return 'info';
      case 2: return 'info';
      case 3: return 'success';
      case 4: return 'success';
      case 5: return 'danger';
      default: return 'warn';
    }
  }

  getStatusLabel(status: number): string {
    switch (status) {
      case 0: return 'Pendiente';
      case 1: return 'Confirmado';
      case 2: return 'Procesando';
      case 3: return 'Enviado';
      case 4: return 'Entregado';
      case 5: return 'Cancelado';
      default: return 'Desconocido';
    }
  }

  viewOrder(order: Order): void {
    this.router.navigate(['/admin/orders/detail', order.id]);
  }

  deleteOrder(order: Order): void {
    this.confirmationService.confirm({
      message: `¿Eliminar el pedido ${order.orderNumber}?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.apiService.deleteOrder(order.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Pedido eliminado' });
            this.loadOrders();
            this.loadPendingCount();
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se puede eliminar el pedido' });
          }
        });
      }
    });
  }

  onPageChange(event: any): void {
    this.rows = event.rows;
    this.first = event.first;
    this.loadOrders();
  }
}