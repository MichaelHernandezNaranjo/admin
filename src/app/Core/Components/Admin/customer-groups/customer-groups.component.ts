import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ApiService, AuthService } from '../../../Services';
import { CustomerGroup, Customer } from '../../../Models';

@Component({
  selector: 'app-customer-groups',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    TagModule,
    ToastModule,
    ConfirmDialogModule,
    DialogModule,
    SelectModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './customer-groups.component.html',
  styleUrl: './customer-groups.component.scss'
})
export class CustomerGroupsComponent implements OnInit {
  groups = signal<CustomerGroup[]>([]);
  allCustomers = signal<Customer[]>([]);
  totalCount = signal(0);
  pageSize = 10;
  loading = signal(false);
  first = 0;

  showCustomersDialog = signal(false);
  editingGroup = signal<CustomerGroup | null>(null);
  groupCustomers = signal<Customer[]>([]);
  availableCustomers = signal<Customer[]>([]);
  selectedCustomerId = signal<string>('');

  constructor(
    private apiService: ApiService,
    public authService: AuthService,
    private router: Router,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void { 
    this.loadGroups(); 
    this.loadAllCustomers();
  }
  
  loadGroups(event?: any): void {
    this.loading.set(true);
    const page = event ? Math.ceil((event.first + 1) / this.pageSize) : 1;
    
    this.apiService.getCustomerGroups(page, this.pageSize).subscribe({
      next: (res) => { 
        this.groups.set(res.data); 
        this.totalCount.set(res.total ?? 0);
        this.loading.set(false);
        if (event) {
          this.first = event.first;
          this.pageSize = event.rows;
        }
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar grupos' });
      }
    }); 
  }
  
  loadAllCustomers(): void {
    this.apiService.getCustomers(1, 1000).subscribe({
      next: (res) => { this.allCustomers.set(res.data); }
    });
  }
  
  onPage(event: any): void { this.loadGroups(event); }
  
  goToNewGroup(): void { this.router.navigate(['/admin/customer-groups/new']); }
  
  goToEditGroup(group: CustomerGroup): void { this.router.navigate(['/admin/customer-groups/edit', group.id]); }

  deleteGroup(group: CustomerGroup): void {
    this.confirmationService.confirm({
      message: `¿Eliminar el grupo "${group.name}"?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.apiService.deleteCustomerGroup(group.id).subscribe({ 
          next: () => { 
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Grupo eliminado' }); 
            this.loadGroups(); 
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar grupo' });
          }
        }); 
      }
    });
  }
  
  openCustomersDialog(group: CustomerGroup): void {
    this.editingGroup.set(group);
    this.loadGroupCustomers(group.id);
    this.showCustomersDialog.set(true);
  }
  
  closeCustomersDialog(): void { 
    this.showCustomersDialog.set(false);
    this.editingGroup.set(null);
    this.groupCustomers.set([]);
    this.selectedCustomerId.set('');
  }
  
  loadGroupCustomers(groupId: string): void {
    this.apiService.getGroupCustomers(groupId).subscribe({
      next: (res) => {
        this.groupCustomers.set(res.data);
        this.updateAvailableCustomers();
      }
    });
  }
  
  updateAvailableCustomers(): void {
    const groupCustomerIds = this.groupCustomers().map(c => c.id);
    this.availableCustomers.set(this.allCustomers().filter(c => !groupCustomerIds.includes(c.id)));
  }
  
  addCustomerToGroup(): void {
    const customerId = this.selectedCustomerId();
    if (!customerId) return;
    
    this.apiService.addCustomerToGroup(this.editingGroup()!.id, customerId).subscribe({
      next: (customer) => {
        this.groupCustomers.update(list => [...list, customer as Customer]);
        this.selectedCustomerId.set('');
        this.updateAvailableCustomers();
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Cliente agregado al grupo' });
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al agregar cliente' });
      }
    });
  }
  
  removeCustomerFromGroup(customer: Customer): void {
    this.confirmationService.confirm({
      message: `¿Quitar a ${customer.firstName} ${customer.lastName} de este grupo?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.apiService.removeCustomerFromGroup(this.editingGroup()!.id, customer.id).subscribe({
          next: () => {
            this.groupCustomers.update(list => list.filter(c => c.id !== customer.id));
            this.availableCustomers.update(list => [...list, customer]);
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Cliente removido del grupo' });
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al remover cliente' });
          }
        });
      }
    });
  }

  getActiveSeverity(isActive: boolean): 'success' | 'danger' {
    return isActive ? 'success' : 'danger';
  }
}
