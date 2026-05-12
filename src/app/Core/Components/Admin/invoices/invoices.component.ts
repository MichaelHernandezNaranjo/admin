import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { PaginatorModule } from 'primeng/paginator';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { ToolbarModule } from 'primeng/toolbar';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { MessageService } from 'primeng/api';
import { ApiService, AuthService } from '../../../Services';

@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule,
    InputNumberModule, SelectModule, PaginatorModule, ToastModule, TooltipModule,
    TagModule, ToolbarModule, CardModule, DividerModule
  ],
  providers: [MessageService],
  templateUrl: './invoices.component.html',
  styleUrl: './invoices.component.scss'
})
export class InvoicesComponent implements OnInit {
  view = signal<'list' | 'form' | 'detail'>('list');

  invoices = signal<any[]>([]);
  total = signal(0);
  pageSize = 10;
  selectedInvoice = signal<any>(null);

  customers = signal<any[]>([]);

  editingId: string | null = null;
  header: any = {};
  items: any[] = [];
  newItem: any = { quantity: 1, unitPrice: 0, discount: 0 };

  statusOptions = [
    { label: 'Pendiente', value: 0 },
    { label: 'Pagada', value: 1 },
    { label: 'Cancelada', value: 2 }
  ];

  constructor(public authService: AuthService, private apiService: ApiService, private messageService: MessageService) {}

  ngOnInit(): void {
    this.loadInvoices();
    this.loadCustomers();
  }

  loadInvoices(page = 1): void {
    this.apiService.getInvoices(page, this.pageSize).subscribe({
      next: (res: any) => { this.invoices.set(res.data); this.total.set(res.total ?? 0); }
    });
  }

  loadCustomers(): void {
    this.apiService.getCustomers(1, 1000).subscribe({ next: (res: any) => this.customers.set(res.data) });
  }

  onPageChange(event: any): void { this.pageSize = event.rows; this.loadInvoices(event.page + 1); }

  openNew(): void {
    this.editingId = null;
    this.header = {
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      taxRate: 16
    };
    this.items = [];
    this.newItem = { quantity: 1, unitPrice: 0, discount: 0 };
    this.apiService.getNextInvoiceNumber().subscribe({
      next: (res: any) => { this.header.invoiceNumber = res.nextNumber; }
    });
    this.view.set('form');
  }

  viewDetail(invoice: any): void {
    this.apiService.getInvoice(invoice.id).subscribe({
      next: (inv: any) => { this.selectedInvoice.set(inv); this.view.set('detail'); }
    });
  }

  backToList(): void { this.view.set('list'); this.loadInvoices(); }

  onCustomerChange(): void {
    const cust = this.customers().find(c => c.id === this.header.customerId);
    if (cust) {
      this.header.customerName = `${cust.name} ${cust.lastName || ''}`.trim();
      this.header.customerNit = cust.documentNumber || 'N/A';
      this.header.customerAddress = cust.address || '';
    }
  }

  addItem(): void {
    if (!this.newItem.productName || !this.newItem.quantity || this.newItem.unitPrice === undefined) {
      this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Complete descripción, cantidad y precio' });
      return;
    }
    this.items = [...this.items, { ...this.newItem }];
    this.newItem = { quantity: 1, unitPrice: 0, discount: 0 };
  }

  removeItem(idx: number): void { this.items = this.items.filter((_, i) => i !== idx); }

  itemTotal(item: any): number {
    const gross = item.unitPrice * item.quantity;
    const disc = item.discount > 0 ? gross * (item.discount / 100) : 0;
    return gross - disc;
  }

  subtotal(): number { return this.items.reduce((s, i) => s + this.itemTotal(i), 0); }

  taxAmount(): number { return this.subtotal() * ((this.header.taxRate || 0) / 100); }

  total2(): number { return this.subtotal() + this.taxAmount(); }

  save(): void {
    if (!this.header.customerName || !this.header.customerNit) {
      this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Complete los datos del cliente' });
      return;
    }
    if (this.items.length === 0) {
      this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Agregue al menos un item' });
      return;
    }
    const sub = this.subtotal();
    const tax = this.taxAmount();
    const payload = {
      invoiceNumber: this.header.invoiceNumber,
      customerId: this.header.customerId || '00000000-0000-0000-0000-000000000000',
      customerName: this.header.customerName,
      customerNit: this.header.customerNit,
      customerAddress: this.header.customerAddress || '',
      issueDate: new Date(this.header.date).toISOString(),
      dueDate: new Date(this.header.dueDate).toISOString(),
      subtotal: sub,
      discountAmount: 0,
      taxAmount: tax,
      total: sub + tax,
      items: this.items.map(i => ({
        productReferenceId: i.productReferenceId || null,
        referenceCode: i.referenceCode || '',
        productName: i.productName,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        discount: i.discount || 0
      }))
    };
    this.apiService.createInvoice(payload).subscribe({
      next: () => { this.messageService.add({ severity: 'success', summary: 'Factura creada', detail: '' }); this.backToList(); },
      error: (e: any) => this.messageService.add({ severity: 'error', summary: 'Error', detail: e.error?.message || 'Error al guardar' })
    });
  }

  updateStatus(id: string, status: number): void {
    const label = status === 1 ? 'marcar como Pagada' : 'cancelar';
    if (!confirm(`¿Desea ${label} esta factura?`)) return;
    this.apiService.updateInvoiceStatus(id, status).subscribe({
      next: () => { this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: '' }); this.loadInvoices(); if (this.view() === 'detail') this.viewDetail({ id }); },
      error: (e: any) => this.messageService.add({ severity: 'error', summary: 'Error', detail: e.error?.message || 'Error' })
    });
  }

  delete(id: string): void {
    if (!confirm('¿Eliminar esta factura?')) return;
    this.apiService.deleteInvoice(id).subscribe({
      next: () => { this.messageService.add({ severity: 'success', summary: 'Eliminada', detail: '' }); this.loadInvoices(); },
      error: (e: any) => this.messageService.add({ severity: 'error', summary: 'Error', detail: e.error?.message || 'Error' })
    });
  }

  statusSeverity(status: number): 'success' | 'danger' | 'warn' | 'secondary' | 'info' | 'contrast' {
    if (status === 1) return 'success';
    if (status === 2) return 'danger';
    return 'warn';
  }

  statusLabel(status: number): string {
    return ['Pendiente', 'Pagada', 'Cancelada'][status] ?? 'Pendiente';
  }
}
