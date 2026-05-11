import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToolbarModule } from 'primeng/toolbar';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputTextModule } from 'primeng/inputtext';
import { PaginatorModule } from 'primeng/paginator';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ApiService, AuthService } from '../../../Services';
import { Customer } from '../../../Models';

@Component({
  selector: 'app-customers',
  standalone: true,
imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    TagModule,
    ToolbarModule,
    ToastModule,
    ConfirmDialogModule,
    InputTextModule,
    PaginatorModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './customers.component.html',
  styleUrl: './customers.component.scss'
})
export class CustomersComponent implements OnInit {
  customers = signal<Customer[]>([]);
  totalCount = signal(0);
  pageSize = 10;
  loading = signal(false);
  first = 0;

  constructor(
    private apiService: ApiService,
    public authService: AuthService,
    private router: Router,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void { this.loadCustomers(); }

  loadCustomers(event?: any): void {
    this.loading.set(true);
    const page = event ? Math.ceil((event.first + 1) / this.pageSize) : 1;
    
    this.apiService.getCustomers(page, this.pageSize).subscribe({
      next: (res) => {
        this.customers.set(res.data);
        this.totalCount.set(res.total ?? 0);
        this.loading.set(false);
        if (event) {
          this.first = event.first;
          this.pageSize = event.rows;
        }
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar clientes' });
      }
    });
  }

  onPage(event: any): void { this.loadCustomers(event); }

  goToNewCustomer(): void { this.router.navigate(['/admin/customers/new']); }
  
  goToEditCustomer(customer: Customer): void { this.router.navigate(['/admin/customers/edit', customer.id]); }

  deleteCustomer(customer: Customer): void {
    this.confirmationService.confirm({
      message: `¿Eliminar el cliente "${customer.firstName} ${customer.lastName}"?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.apiService.deleteCustomer(customer.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Cliente eliminado' });
            this.loadCustomers();
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar cliente' });
          }
        });
      }
    });
  }

  getActiveSeverity(isActive: boolean): 'success' | 'danger' {
    return isActive ? 'success' : 'danger';
  }
}
