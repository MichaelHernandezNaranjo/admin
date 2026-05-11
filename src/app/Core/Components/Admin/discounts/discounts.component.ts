import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToolbarModule } from 'primeng/toolbar';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ApiService, AuthService } from '../../../Services';
import { Discount } from '../../../Models';

@Component({
  selector: 'app-discounts',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    TagModule,
    ToolbarModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './discounts.component.html',
  styleUrl: './discounts.component.scss'
})
export class DiscountsComponent implements OnInit {
  discounts = signal<Discount[]>([]);
  totalCount = signal(0);
  pageSize = 10;
  loading = signal(false);
  first = 0;

  constructor(
    private apiService: ApiService,
    public authService: AuthService,
    private router: Router,
    private messageService: MessageService
  ) {}

  ngOnInit(): void { this.loadDiscounts(); }

  loadDiscounts(event?: any): void {
    this.loading.set(true);
    const page = event ? Math.ceil((event.first + 1) / this.pageSize) : 1;

    this.apiService.getDiscounts(page, this.pageSize).subscribe({
      next: (res) => {
        this.discounts.set(res.data);
        this.totalCount.set(res.total ?? 0);
        this.loading.set(false);
        if (event) {
          this.first = event.first;
          this.pageSize = event.rows;
        }
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar descuentos' });
      }
    });
  }

  onPage(event: any): void { this.loadDiscounts(event); }

  goToNewDiscount(): void { this.router.navigate(['/admin/discounts/new']); }

  goToEditDiscount(discount: Discount): void { this.router.navigate(['/admin/discounts/edit', discount.id]); }

  deleteDiscount(discount: Discount): void {
    if (!confirm(`¿Eliminar el descuento "${discount.name}"?`)) return;
    this.apiService.deleteDiscount(discount.id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Descuento eliminado' });
        this.loadDiscounts();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar descuento' });
      }
    });
  }

  getStatusSeverity(d: Discount): 'success' | 'warn' | 'danger' {
    if (!d.isActive) return 'danger';
    const now = new Date();
    const start = new Date(d.startDate);
    const end = new Date(d.endDate);
    if (now >= start && now <= end) return 'success';
    return 'warn';
  }

  getStatusLabel(d: Discount): string {
    if (!d.isActive) return 'Inactivo';
    const now = new Date();
    const start = new Date(d.startDate);
    const end = new Date(d.endDate);
    if (now < start) return 'Futuro';
    if (now > end) return 'Expirado';
    return 'Activo';
  }

  getScopeLabel(d: Discount): string {
    if (d.applyToAllProducts) return 'Todos';
    const prods = d.productIds?.length ?? 0;
    const cats = d.categoryIds?.length ?? 0;
    const parts = [];
    if (prods > 0) parts.push(`${prods} prod.`);
    if (cats > 0) parts.push(`${cats} cat.`);
    return parts.length > 0 ? parts.join(' / ') : 'Sin asignar';
  }

  getTypeLabel(d: Discount): string {
    return d.type === 'Percentage' ? `${d.value}%` : `$${d.value}`;
  }
}
