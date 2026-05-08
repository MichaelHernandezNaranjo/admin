import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { BadgeModule } from 'primeng/badge';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';
import { ApiService } from '../../../Services/api.service';
import { firstValueFrom } from 'rxjs';

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

@Component({
  selector: 'app-contact-messages',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule, TagModule, ToastModule, BadgeModule, DialogModule],
  providers: [MessageService],
  templateUrl: './contact-messages.component.html',
  styleUrl: './contact-messages.component.scss'
})
export class ContactMessagesComponent implements OnInit {
  messages = signal<ContactMessage[]>([]);
  total = signal(0);
  loading = signal(false);
  pageSize = 20;
  first = 0;

  selectedMessage = signal<ContactMessage | null>(null);
  dialogVisible = signal(false);

  constructor(private api: ApiService, private toast: MessageService) {}

  ngOnInit() { this.load(); }

  load(event?: any) {
    this.loading.set(true);
    const page = event ? Math.ceil((event.first + 1) / this.pageSize) : 1;
    this.api.getContactMessages({ page, pageSize: this.pageSize }).subscribe({
      next: (res) => {
        this.messages.set(res.items);
        this.total.set(res.total);
        if (event) { this.first = event.first; this.pageSize = event.rows; }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los mensajes' });
      }
    });
  }

  async openMessage(msg: ContactMessage) {
    this.selectedMessage.set(msg);
    this.dialogVisible.set(true);
    if (!msg.isRead) {
      try {
        await firstValueFrom(this.api.markContactMessageRead(msg.id));
        this.messages.update(list => list.map(m => m.id === msg.id ? { ...m, isRead: true } : m));
      } catch { /* silencioso */ }
    }
  }

  closeDialog() { this.dialogVisible.set(false); this.selectedMessage.set(null); }

  async markAllRead() {
    try {
      await firstValueFrom(this.api.markAllContactMessagesRead());
      this.messages.update(list => list.map(m => ({ ...m, isRead: true })));
      this.toast.add({ severity: 'success', summary: 'Listo', detail: 'Todos los mensajes marcados como leídos' });
    } catch {
      this.toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar' });
    }
  }

  async deleteMessage(msg: ContactMessage) {
    if (!confirm(`¿Eliminar el mensaje de "${msg.name}"?`)) return;
    try {
      await firstValueFrom(this.api.deleteContactMessage(msg.id));
      this.messages.update(list => list.filter(m => m.id !== msg.id));
      this.total.update(t => t - 1);
      if (this.selectedMessage()?.id === msg.id) this.closeDialog();
      this.toast.add({ severity: 'success', summary: 'Eliminado', detail: 'Mensaje eliminado' });
    } catch {
      this.toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar' });
    }
  }

  unreadCount() { return this.messages().filter(m => !m.isRead).length; }

  subjectLabel(subject?: string) {
    const map: Record<string, string> = {
      pedido: 'Estado de mi pedido',
      cambio: 'Cambio o devolución',
      pago: 'Problema con el pago',
      producto: 'Consulta sobre un producto',
      otro: 'Otro'
    };
    return subject ? (map[subject] ?? subject) : '—';
  }
}
