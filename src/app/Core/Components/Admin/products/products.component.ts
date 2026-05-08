import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Subscription } from 'rxjs';
import { ApiService, AuthService } from '../../../Services';
import { Product } from '../../../Models';

@Component({
  selector: 'app-products',
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
    TooltipModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss'
})
export class ProductsComponent implements OnInit {
  products = signal<Product[]>([]);
  totalRecords = signal(0);
  loading = signal(false);
  first = 0;
  rows = 10;
  sortField = '';
  sortOrder: 'asc' | 'desc' = 'asc';
  searchTerm = '';
  private loadSubscription?: Subscription;
  private isLoadingData = false;
  private searchTimeout?: any;

  constructor(
    private apiService: ApiService,
    public authService: AuthService,
    private router: Router,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void { this.loadProducts(); }

  loadProducts(): void {
    if (this.isLoadingData) {
      return;
    }
    
    this.isLoadingData = true;
    this.loading.set(true);
    const page = Math.floor(this.first / this.rows) + 1;
    
    if (this.loadSubscription) {
      this.loadSubscription.unsubscribe();
    }
    
    this.loadSubscription = this.apiService.getProducts(page, this.rows, this.sortField, this.sortOrder, this.searchTerm).subscribe({
      next: (res) => {
        this.products.set(res.data);
        this.totalRecords.set(res.total ?? 0);
        this.loading.set(false);
        this.isLoadingData = false;
      },
      error: () => {
        this.loading.set(false);
        this.isLoadingData = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar productos' });
      }
    });
  }

  onPage(event: any): void {
    this.first = event.first;
    this.rows = event.rows;
    this.loadProducts();
  }

  onSort(event: any): void {
    this.sortField = event.field || '';
    this.sortOrder = event.order === 1 ? 'asc' : 'desc';
    this.first = 0;
    this.loadProducts();
  }

  onSearch(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.searchTimeout = setTimeout(() => {
      this.first = 0;
      this.loadProducts();
    }, 300);
  }

  goToNewProduct(): void { this.router.navigate(['/admin/products/new']); }
  
  goToEditProduct(product: Product): void { this.router.navigate(['/admin/products/edit', product.id]); }

  deleteProduct(product: Product): void {
    this.confirmationService.confirm({
      message: `¿Eliminar el producto "${product.name}"?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.apiService.deleteProduct(product.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Producto eliminado' });
            this.loadProducts();
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar producto' });
          }
        });
      }
    });
  }

  getSeverity(isActive: boolean): 'success' | 'danger' {
    return isActive ? 'success' : 'danger';
  }

  parseTags(tags: string | undefined): string[] {
    if (!tags) return [];
    try {
      const parsed = JSON.parse(tags);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
}
