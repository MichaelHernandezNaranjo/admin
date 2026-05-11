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
import { PriceList } from '../../../Models';

@Component({
  selector: 'app-price-lists',
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
  templateUrl: './price-lists.component.html',
  styleUrl: './price-lists.component.scss'
})
export class PriceListsComponent implements OnInit {
  priceLists = signal<PriceList[]>([]);
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

  ngOnInit(): void {
    this.loadPriceLists();
  }

  loadPriceLists(event?: any): void {
    this.loading.set(true);
    const page = event ? Math.ceil((event.first + 1) / this.pageSize) : 1;

    this.apiService.getPriceLists(page, this.pageSize).subscribe({
      next: (res) => {
        this.priceLists.set(res.data);
        this.totalCount.set(res.total ?? 0);
        this.loading.set(false);
        if (event) {
          this.first = event.first;
          this.pageSize = event.rows;
        }
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar listas de precios' });
      }
    });
  }

  onPage(event: any): void { this.loadPriceLists(event); }

  goToNewPriceList(): void { this.router.navigate(['/admin/price-lists/new']); }

  goToEditPriceList(priceList: PriceList): void { this.router.navigate(['/admin/price-lists/edit', priceList.id]); }

  deletePriceList(priceList: PriceList): void {
    this.confirmationService.confirm({
      message: `¿Eliminar la lista "${priceList.name}"?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.apiService.deletePriceList(priceList.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Lista eliminada' });
            this.loadPriceLists();
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar lista' });
          }
        });
      }
    });
  }

  getActiveSeverity(isActive: boolean): 'success' | 'danger' {
    return isActive ? 'success' : 'danger';
  }

  getDefaultSeverity(isDefault: boolean): 'success' | 'secondary' {
    return isDefault ? 'success' : 'secondary';
  }
}
