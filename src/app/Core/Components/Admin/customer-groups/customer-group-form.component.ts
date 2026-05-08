import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { MessageService } from 'primeng/api';
import { ApiService } from '../../../Services';
import { CustomerGroup } from '../../../Models';

@Component({
  selector: 'app-customer-group-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    InputTextModule,
    TextareaModule,
    InputNumberModule,
    ButtonModule,
    ToastModule,
    CardModule
  ],
  providers: [MessageService],
  templateUrl: './customer-group-form.component.html',
  styleUrl: './customer-group-form.component.scss'
})
export class CustomerGroupFormComponent implements OnInit {
  editingGroup = signal<CustomerGroup | null>(null);
  formData: Partial<CustomerGroup> = { isActive: true, discountPercentage: 0 };
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
      this.loadGroup(id);
    }
  }

  loadGroup(id: string): void {
    this.isLoading.set(true);
    this.apiService.getCustomerGroup(id).subscribe({
      next: (res) => {
        const group = res.data || res;
        this.editingGroup.set(group);
        this.formData = { ...group };
        this.isLoading.set(false);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar grupo' });
        this.isLoading.set(false);
        this.router.navigate(['/admin/customer-groups']);
      }
    });
  }

  saveGroup(): void {
    if (!this.formData.name) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'El nombre es requerido' });
      return;
    }

    this.isLoading.set(true);
    
    if (this.editingGroup()) {
      this.apiService.updateCustomerGroup(this.editingGroup()!.id, this.formData).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Grupo actualizado' });
          this.router.navigate(['/admin/customer-groups']);
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al actualizar grupo' });
          this.isLoading.set(false);
        }
      });
    } else {
      this.apiService.createCustomerGroup(this.formData).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Grupo creado' });
          this.router.navigate(['/admin/customer-groups']);
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al crear grupo' });
          this.isLoading.set(false);
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/admin/customer-groups']);
  }
}
