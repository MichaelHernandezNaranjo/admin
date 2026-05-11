import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToolbarModule } from 'primeng/toolbar';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ApiService, AuthService } from '../../../Services';
import { Tax } from '../../../Models';

@Component({
  selector: 'app-taxes',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    TagModule,
    ToolbarModule,
    ToastModule,
    ConfirmDialogModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './taxes.component.html',
  styleUrl: './taxes.component.scss'
})
export class TaxesComponent implements OnInit {
  taxes = signal<Tax[]>([]);
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

  ngOnInit(): void { this.loadTaxes(); }

  loadTaxes(event?: any): void {
    this.loading.set(true);
    const page = event ? Math.ceil((event.first + 1) / this.pageSize) : 1;
    
    this.apiService.getTaxes(page, this.pageSize).subscribe({
      next: (res) => {
        this.taxes.set(res.data);
        this.totalCount.set(res.total ?? 0);
        this.loading.set(false);
        if (event) {
          this.first = event.first;
          this.pageSize = event.rows;
        }
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar impuestos' });
      }
    });
  }

  onPage(event: any): void { this.loadTaxes(event); }

  goToNewTax(): void { this.router.navigate(['/admin/taxes/new']); }
  
  goToEditTax(tax: Tax): void { this.router.navigate(['/admin/taxes/edit', tax.id]); }

  deleteTax(tax: Tax): void {
    this.confirmationService.confirm({
      message: `¿Eliminar el impuesto "${tax.name}"?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.apiService.deleteTax(tax.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Impuesto eliminado' });
            this.loadTaxes();
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar impuesto' });
          }
        });
      }
    });
  }

  getDefaultSeverity(isDefault: boolean): 'success' | 'secondary' {
    return isDefault ? 'success' : 'secondary';
  }

  getActiveSeverity(isActive: boolean): 'success' | 'danger' {
    return isActive ? 'success' : 'danger';
  }
}
