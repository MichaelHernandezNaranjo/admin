import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AvatarModule } from 'primeng/avatar';
import { RippleModule } from 'primeng/ripple';
import { ScrollerModule } from 'primeng/scroller';
import { AuthService } from '../../../Services';

interface FlatMenuItem {
  type: 'header' | 'item' | 'separator';
  label?: string;
  icon?: string;
  routerLink?: string;
  permission?: string;
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AvatarModule,
    RippleModule,
    ScrollerModule
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent {
  menuItems = signal<FlatMenuItem[]>([]);
  currentSection = signal('Dashboard');

  private routeMap: { [key: string]: string } = {
    '/admin/dashboard': 'Dashboard',
    '/admin/products': 'Productos',
    '/admin/categories': 'Categorías',
    '/admin/warehouses': 'Almacenes',
    '/admin/inventory-entries': 'Entradas',
    '/admin/inventory-exits': 'Salidas',
    '/admin/inventory-transfers': 'Traslados',
    '/admin/inventory': 'Inventario',
    '/admin/price-lists': 'Listas de Precios',
    '/admin/customers': 'Clientes',
    '/admin/customer-groups': 'Grupos de Clientes',
    '/admin/discounts': 'Descuentos',
    '/admin/taxes': 'Impuestos',
    '/admin/users': 'Usuarios',
    '/admin/orders': 'Pedidos',
    '/admin/profiles': 'Perfiles',
    '/admin/products/new': 'Nuevo Producto',
    '/admin/products/edit': 'Editar Producto',
    '/admin/products/references': 'Referencias',
    '/admin/categories/new': 'Nueva Categoría',
    '/admin/categories/edit': 'Editar Categoría',
    '/admin/categories/attributes': 'Atributos',
    '/admin/brands/new': 'Nueva Marca',
    '/admin/brands/edit': 'Editar Marca'
  };

  constructor(public authService: AuthService, private router: Router) {
    this.buildMenu();
    this.updateCurrentSection();
    this.router.events.subscribe(() => this.updateCurrentSection());
  }

  updateCurrentSection(): void {
    const url = this.router.url;
    let section = 'Dashboard';
    for (const [route, label] of Object.entries(this.routeMap)) {
      if (url.includes(route)) {
        section = label;
        break;
      }
    }
    this.currentSection.set(section);
  }

  buildMenu(): void {
    const items: FlatMenuItem[] = [];

    items.push({ type: 'separator' });

    const sections = [
      { label: 'Principal', items: this.filterItems([
        { label: 'Dashboard', icon: 'pi pi-home', routerLink: '/admin/dashboard' }
      ]) },
      { label: 'Catálogo', items: this.filterItems([
        { label: 'Productos', icon: 'pi pi-box', routerLink: '/admin/products', permission: 'products.read' },
        { label: 'Categorías', icon: 'pi pi-tag', routerLink: '/admin/categories', permission: 'products.read' },
        { label: 'Marcas', icon: 'pi pi-bookmark', routerLink: '/admin/brands', permission: 'products.read' },
        { label: 'Almacenes', icon: 'pi pi-warehouse', routerLink: '/admin/warehouses', permission: 'warehouses.read' }
      ]) },
      { label: 'Operaciones', items: this.filterItems([
        { label: 'Pedidos', icon: 'pi pi-shopping-cart', routerLink: '/admin/orders', permission: 'orders.read' },
        { label: 'Mensajes de Contacto', icon: 'pi pi-envelope', routerLink: '/admin/contact-messages' },
        { label: 'Entradas', icon: 'pi pi-plus-circle', routerLink: '/admin/inventory-entries', permission: 'inventory.entries.read' },
        { label: 'Salidas', icon: 'pi pi-minus-circle', routerLink: '/admin/inventory-exits', permission: 'inventory.exits.read' },
        { label: 'Traslados', icon: 'pi pi-arrows-h', routerLink: '/admin/inventory-transfers', permission: 'inventory.transfers.read' }
      ]) },
      { label: 'Reportes', items: this.filterItems([
        { label: 'Inventario', icon: 'pi pi-file', routerLink: '/admin/inventory', permission: 'inventory.read' }
      ]) },
      { label: 'Comercial', items: this.filterItems([
        { label: 'Listas de Precios', icon: 'pi pi-tag', routerLink: '/admin/price-lists', permission: 'pricelists.read' },
        { label: 'Clientes', icon: 'pi pi-users', routerLink: '/admin/customers', permission: 'customers.read' },
        { label: 'Grupos de Clientes', icon: 'pi pi-users', routerLink: '/admin/customer-groups', permission: 'customergroups.read' }
      ]) },
      { label: 'Finanzas', items: this.filterItems([
        { label: 'Descuentos', icon: 'pi pi-percent', routerLink: '/admin/discounts', permission: 'discounts.read' },
        { label: 'Impuestos', icon: 'pi pi-receipt', routerLink: '/admin/taxes', permission: 'taxes.read' }
      ]) },
      { label: 'Sistema', items: this.filterItems([
        { label: 'Usuarios', icon: 'pi pi-user', routerLink: '/admin/users', permission: 'users.read' },
        { label: 'Perfiles', icon: 'pi pi-shield', routerLink: '/admin/profiles', permission: 'profiles.read' }
      ]) }
    ];

    sections.forEach(section => {
      if (section.items.length > 0) {
        items.push({ type: 'header', label: section.label });
        section.items.forEach(item => {
          items.push({ type: 'item', ...item });
        });
      }
    });

    items.push({ type: 'separator' });

    this.menuItems.set(items);
  }

  filterItems(items: any[]): any[] {
    return items.filter(item => !item.permission || this.hasPermission(item.permission));
  }

  hasPermission(permission: string): boolean {
    return this.authService.hasPermission(permission);
  }

  getUserName(): string {
    return `${this.authService.user()?.firstName || ''} ${this.authService.user()?.lastName || ''}`.trim() || 'Usuario';
  }

  getUserRole(): string {
    return this.authService.user()?.email || 'Admin';
  }

  getUserAvatar(): string {
    const first = this.authService.user()?.firstName?.[0] || '';
    const last = this.authService.user()?.lastName?.[0] || '';
    return (first + last).toUpperCase() || 'U';
  }

  logout(): void {
    this.authService.logout();
  }
}
