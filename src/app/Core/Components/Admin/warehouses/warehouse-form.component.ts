import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { MessageService } from 'primeng/api';
import { ApiService } from '../../../Services';
import { Warehouse } from '../../../Models';

@Component({
  selector: 'app-warehouse-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    InputTextModule,
    CheckboxModule,
    ButtonModule,
    ToastModule,
    CardModule
  ],
  providers: [MessageService],
  templateUrl: './warehouse-form.component.html',
  styleUrl: './warehouse-form.component.scss'
})
export class WarehouseFormComponent implements OnInit {
  editingWarehouse = signal<Warehouse | null>(null);
  formData: Partial<Warehouse> = { isActive: true, isMain: false };
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
      this.loadWarehouse(id);
    }
  }

  loadWarehouse(id: string): void {
    this.isLoading.set(true);
    this.apiService.getWarehouse(id).subscribe({
      next: (res) => {
        const warehouse = res.data || res;
        this.editingWarehouse.set(warehouse);
        this.formData = { ...warehouse };
        this.isLoading.set(false);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar almacén' });
        this.isLoading.set(false);
        this.router.navigate(['/admin/warehouses']);
      }
    });
  }

  saveWarehouse(): void {
    if (!this.formData.name) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'El nombre es requerido' });
      return;
    }

    this.isLoading.set(true);
    
    if (this.editingWarehouse()) {
      this.apiService.updateWarehouse(this.editingWarehouse()!.id, this.formData).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Almacén actualizado' });
          this.router.navigate(['/admin/warehouses']);
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al actualizar almacén' });
          this.isLoading.set(false);
        }
      });
    } else {
      this.apiService.createWarehouse(this.formData).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Almacén creado' });
          this.router.navigate(['/admin/warehouses']);
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al crear almacén' });
          this.isLoading.set(false);
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/admin/warehouses']);
  }
}
