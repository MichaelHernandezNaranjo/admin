import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { MessageService } from 'primeng/api';
import { ApiService } from '../../../Services';
import { Tax } from '../../../Models';

@Component({
  selector: 'app-tax-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    InputTextModule,
    InputNumberModule,
    CheckboxModule,
    ButtonModule,
    ToastModule,
    CardModule
  ],
  providers: [MessageService],
  templateUrl: './tax-form.component.html',
  styleUrl: './tax-form.component.scss'
})
export class TaxFormComponent implements OnInit {
  editingTax = signal<Tax | null>(null);
  formData: Partial<Tax> = { isActive: true, isDefault: false, rate: 0 };
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
      this.loadTax(id);
    }
  }

  loadTax(id: string): void {
    this.isLoading.set(true);
    this.apiService.getTax(id).subscribe({
      next: (res) => {
        const tax = res.data || res;
        this.editingTax.set(tax);
        this.formData = { ...tax };
        this.isLoading.set(false);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar impuesto' });
        this.isLoading.set(false);
        this.router.navigate(['/admin/taxes']);
      }
    });
  }

  saveTax(): void {
    if (!this.formData.name) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'El nombre es requerido' });
      return;
    }

    this.isLoading.set(true);
    
    if (this.editingTax()) {
      this.apiService.updateTax(this.editingTax()!.id, this.formData).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Impuesto actualizado' });
          this.router.navigate(['/admin/taxes']);
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al actualizar impuesto' });
          this.isLoading.set(false);
        }
      });
    } else {
      this.apiService.createTax(this.formData).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Impuesto creado' });
          this.router.navigate(['/admin/taxes']);
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al crear impuesto' });
          this.isLoading.set(false);
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/admin/taxes']);
  }
}
