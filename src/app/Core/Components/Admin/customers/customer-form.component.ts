import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { MessageService } from 'primeng/api';
import { ApiService } from '../../../Services';
import { Customer } from '../../../Models';

@Component({
  selector: 'app-customer-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    InputTextModule,
    ButtonModule,
    ToastModule,
    CardModule
  ],
  providers: [MessageService],
  templateUrl: './customer-form.component.html',
  styleUrl: './customer-form.component.scss'
})
export class CustomerFormComponent implements OnInit {
  editingCustomer = signal<Customer | null>(null);
  formData: Partial<Customer> = { isActive: true };
  isLoading = signal(false);

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute,
    private router: Router,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadCustomer(id);
    }
  }

  loadCustomer(id: string): void {
    this.isLoading.set(true);
    this.apiService.getCustomer(id).subscribe({
      next: (res) => {
        const customer = res.data || res;
        this.editingCustomer.set(customer);
        this.formData = { ...customer };
        this.isLoading.set(false);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar cliente' });
        this.isLoading.set(false);
        this.router.navigate(['/admin/customers']);
      }
    });
  }

  saveCustomer(): void {
    if (!this.formData.email || !this.formData.firstName || !this.formData.lastName) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'Email, nombre y apellido son requeridos' });
      return;
    }

    this.isLoading.set(true);
    
    if (this.editingCustomer()) {
      this.apiService.updateCustomer(this.editingCustomer()!.id, this.formData).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Cliente actualizado' });
          this.router.navigate(['/admin/customers']);
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al actualizar cliente' });
          this.isLoading.set(false);
        }
      });
    } else {
      this.apiService.createCustomer(this.formData).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Cliente creado' });
          this.router.navigate(['/admin/customers']);
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al crear cliente' });
          this.isLoading.set(false);
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/admin/customers']);
  }
}
