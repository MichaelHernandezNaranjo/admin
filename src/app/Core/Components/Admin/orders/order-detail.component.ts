import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { MessageService } from 'primeng/api';
import { ApiService } from '../../../Services/api.service';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export interface OrderDetail {
  id: string;
  orderNumber: string;
  orderDate: string;
  status: number;
  statusName: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  notes?: string;
  couponCode?: string;
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  paymentMethod?: string;
  shippingAddress?: string;
  paymentReference?: string;
  warehouseName?: string;
  items: OrderDetailItem[];
}

export interface OrderDetailItem {
  id: string;
  productReferenceId: string;
  productName?: string;
  referenceCode?: string;
  attributeValues?: { attributeName?: string; optionValue?: string }[];
  quantity: number;
  unitPrice: number;
  discount: number;
  discountedUnitPrice: number;
  total: number;
}

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ButtonModule, TagModule, ToastModule, DialogModule, TextareaModule],
  providers: [MessageService],
  templateUrl: './order-detail.component.html',
  styleUrl: './order-detail.component.scss'
})
export class OrderDetailComponent implements OnInit {
  readonly BACKEND_URL = environment.backendUrl;

  order = signal<OrderDetail | null>(null);
  loading = signal(true);
  saving = signal(false);

  confirmDialogVisible = signal(false);
  pendingAction = signal<{ status: number; label: string; icon: string; severity: string } | null>(null);
  actionNotes = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private toast: MessageService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.router.navigate(['/admin/orders']); return; }
    this.loadOrder(id);
  }

  async loadOrder(id: string) {
    this.loading.set(true);
    try {
      const data = await firstValueFrom(this.api.getOrder(id));
      this.order.set(data as unknown as OrderDetail);
    } catch {
      this.toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el pedido' });
    } finally {
      this.loading.set(false);
    }
  }

  // ─── Status helpers ───────────────────────────────────────────────
  getStatusSeverity(status: number): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (status) {
      case 0: return 'warn';
      case 1: return 'info';
      case 2: return 'info';
      case 3: return 'success';
      case 4: return 'success';
      case 5: return 'danger';
      default: return 'secondary';
    }
  }

  getStatusLabel(status: number): string {
    const map: Record<number, string> = { 0: 'Pendiente', 1: 'Confirmado', 2: 'Procesando', 3: 'Enviado', 4: 'Entregado', 5: 'Cancelado' };
    return map[status] ?? 'Desconocido';
  }

  getPaymentMethodLabel(pm?: string): string {
    if (!pm) return '—';
    return pm === 'CashOnDelivery' ? 'Contra entrega' : pm === 'Nequi' ? 'Nequi' : pm;
  }

  getVoucherUrl(ref?: string): string {
    if (!ref) return '';
    return ref.startsWith('http') ? ref : `${this.BACKEND_URL}${ref}`;
  }

  // ─── Acciones disponibles según estado ─────────────────────────
  getNextActions(status: number): { status: number; label: string; icon: string; severity: string }[] {
    switch (status) {
      case 0: return [
        { status: 1, label: 'Confirmar pedido',      icon: 'pi pi-check',       severity: 'success' },
        { status: 5, label: 'Cancelar pedido',        icon: 'pi pi-times',       severity: 'danger'  },
      ];
      case 1: return [
        { status: 2, label: 'Marcar en preparación', icon: 'pi pi-wrench',      severity: 'info'    },
        { status: 5, label: 'Cancelar pedido',        icon: 'pi pi-times',       severity: 'danger'  },
      ];
      case 2: return [
        { status: 3, label: 'Marcar como enviado',   icon: 'pi pi-truck',       severity: 'info'    },
        { status: 5, label: 'Cancelar pedido',        icon: 'pi pi-times',       severity: 'danger'  },
      ];
      case 3: return [
        { status: 4, label: 'Marcar como entregado', icon: 'pi pi-home',        severity: 'success' },
      ];
      default: return [];
    }
  }

  // ─── Stepper ───────────────────────────────────────────────────
  readonly steps = [
    { status: 0, label: 'Pendiente',    icon: 'pi pi-clock'         },
    { status: 1, label: 'Confirmado',   icon: 'pi pi-check-circle'  },
    { status: 2, label: 'Preparando',   icon: 'pi pi-wrench'        },
    { status: 3, label: 'Enviado',      icon: 'pi pi-truck'         },
    { status: 4, label: 'Entregado',    icon: 'pi pi-home'          },
  ];

  stepState(stepStatus: number, currentStatus: number): 'done' | 'active' | 'pending' | 'cancelled' {
    if (currentStatus === 5) return stepStatus === 0 ? 'done' : 'cancelled';
    if (stepStatus < currentStatus) return 'done';
    if (stepStatus === currentStatus) return 'active';
    return 'pending';
  }

  // ─── Cambio de estado ──────────────────────────────────────────
  requestAction(action: { status: number; label: string; icon: string; severity: string }) {
    this.pendingAction.set(action);
    this.actionNotes = '';
    this.confirmDialogVisible.set(true);
  }

  async confirmAction() {
    const action = this.pendingAction();
    const order = this.order();
    if (!action || !order) return;

    this.saving.set(true);
    try {
      const updated = await firstValueFrom(
        this.api.updateOrderStatus(order.id, action.status, this.actionNotes || undefined)
      );
      this.order.update(o => o ? { ...o, status: updated.status, statusName: updated.statusName } : o);
      this.toast.add({ severity: 'success', summary: 'Actualizado', detail: `Estado cambiado a "${this.getStatusLabel(updated.status)}"` });
      this.confirmDialogVisible.set(false);
    } catch (err: any) {
      const msg = err?.error?.message ?? 'No se pudo cambiar el estado';
      this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
    } finally {
      this.saving.set(false);
    }
  }

  goBack() { this.router.navigate(['/admin/orders']); }
}
