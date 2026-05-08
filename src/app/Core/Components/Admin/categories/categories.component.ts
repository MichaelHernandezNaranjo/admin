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
import { Category } from '../../../Models';

@Component({
  selector: 'app-categories',
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
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.scss'
})
export class CategoriesComponent implements OnInit {
  categories = signal<Category[]>([]);
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

  ngOnInit(): void { this.loadCategories(); }

  loadCategories(): void {
    if (this.isLoadingData) {
      return;
    }
    
    this.isLoadingData = true;
    this.loading.set(true);
    
    if (this.loadSubscription) {
      this.loadSubscription.unsubscribe();
    }
    
    this.loadSubscription = this.apiService.getCategories(1, this.rows, this.sortField, this.sortOrder, this.searchTerm).subscribe({
      next: (res) => {
        this.categories.set(res.data);
        this.totalRecords.set(res.total ?? 0);
        this.loading.set(false);
        this.isLoadingData = false;
      },
      error: () => {
        this.loading.set(false);
        this.isLoadingData = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar categorías' });
      }
    });
  }

  onSort(event: any): void {
    this.sortField = event.field || '';
    this.sortOrder = event.order === 1 ? 'asc' : 'desc';
    this.loadCategories();
  }

  onSearch(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.searchTimeout = setTimeout(() => {
      this.loadCategories();
    }, 300);
  }

  goToNewCategory(): void { this.router.navigate(['/admin/categories/new']); }
  
  goToEditCategory(category: Category): void { this.router.navigate(['/admin/categories/edit', category.id]); }

  deleteCategory(category: Category): void {
    this.confirmationService.confirm({
      message: `¿Eliminar la categoría "${category.name}"?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.apiService.deleteCategory(category.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Categoría eliminada' });
            this.loadCategories();
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar categoría' });
          }
        });
      }
    });
  }

  getSeverity(isActive: boolean): 'success' | 'danger' {
    return isActive ? 'success' : 'danger';
  }
}
