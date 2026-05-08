import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Subscription } from 'rxjs';
import { ApiService, AuthService } from '../../../Services';
import { Brand } from '../../../Models';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-brands',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    TagModule,
    ToastModule,
    ConfirmDialogModule,
    InputTextModule,
    InputGroupModule,
    InputGroupAddonModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './brands.component.html',
  styleUrl: './brands.component.scss'
})
export class BrandsComponent implements OnInit {
  brands = signal<Brand[]>([]);
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

  ngOnInit(): void { this.loadBrands(); }

  loadBrands(): void {
    if (this.isLoadingData) {
      return;
    }
    
    this.isLoadingData = true;
    this.loading.set(true);
    
    if (this.loadSubscription) {
      this.loadSubscription.unsubscribe();
    }
    
    this.loadSubscription = this.apiService.getBrands(1, this.rows, this.sortField, this.sortOrder, this.searchTerm).subscribe({
      next: (res) => {
        this.brands.set(res.data);
        this.totalRecords.set(res.total ?? 0);
        this.loading.set(false);
        this.isLoadingData = false;
      },
      error: () => {
        this.loading.set(false);
        this.isLoadingData = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar marcas' });
      }
    });
  }

  onSort(event: any): void {
    this.sortField = event.sortField || '';
    this.sortOrder = event.sortOrder === 1 ? 'asc' : 'desc';
    this.loadBrands();
  }

  onSearch(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.searchTimeout = setTimeout(() => {
      this.loadBrands();
    }, 300);
  }

  goToNewBrand(): void { this.router.navigate(['/admin/brands/new']); }
  
  goToEditBrand(brand: Brand): void { this.router.navigate(['/admin/brands/edit', brand.id]); }

  deleteBrand(brand: Brand): void {
    this.confirmationService.confirm({
      message: `¿Eliminar la marca "${brand.name}"?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.apiService.deleteBrand(brand.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Marca eliminada' });
            this.loadBrands();
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar marca' });
          }
        });
      }
    });
  }

  getSeverity(isActive: boolean): 'success' | 'danger' {
    return isActive ? 'success' : 'danger';
  }

  getLogoUrl(logoUrl: string | undefined): string {
    if (!logoUrl) return '';
    if (logoUrl.startsWith('http')) return logoUrl;
    return `${environment.backendUrl}${logoUrl}`;
  }
}
