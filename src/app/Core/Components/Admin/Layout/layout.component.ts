import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AvatarModule } from 'primeng/avatar';
import { RippleModule } from 'primeng/ripple';
import { ScrollerModule } from 'primeng/scroller';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../../Services';
import { BreadcrumbComponent, BreadcrumbItem } from '../Breadcrumb/breadcrumb.component';

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
    ScrollerModule,
    ButtonModule,
    BreadcrumbComponent
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent {
  menuItems = signal<FlatMenuItem[]>([]);
  currentSection = signal('Dashboard');
  sidebarCollapsed = signal(false);
  mobileMenuOpen = signal(false);
  breadcrumbItems = signal<BreadcrumbItem[]>([]);

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
    '/admin/brands': 'Marcas',
    '/admin/contact-messages': 'Mensajes',
    '/admin/products/new': 'Nuevo Producto',
    '/admin/products/edit': 'Editar Producto',
    '/admin/products/references': 'Referencias',
    '/admin/categories/new': 'Nueva Categoría',
    '/admin/categories/edit': 'Editar Categoría',
    '/admin/categories/attributes': 'Atributos',
    '/admin/brands/new': 'Nueva Marca',
    '/admin/brands/edit': 'Editar Marca'
  };

  private sectionParents: { [key: string]: string } = {
    '/admin/products': '/admin/products',
    '/admin/categories': '/admin/categories',
    '/admin/brands': '/admin/brands',
    '/admin/warehouses': '/admin/warehouses',
    '/admin/orders': '/admin/orders',
    '/admin/customers': '/admin/customers',
    '/admin/customer-groups': '/admin/customer-groups',
    '/admin/discounts': '/admin/discounts',
    '/admin/taxes': '/admin/taxes',
    '/admin/users': '/admin/users',
    '/admin/profiles': '/admin/profiles',
    '/admin/price-lists': '/admin/price-lists',
    '/admin/inventory': '/admin/inventory',
    '/admin/inventory-entries': '/admin/inventory-entries',
    '/admin/inventory-exits': '/admin/inventory-exits',
    '/admin/inventory-transfers': '/admin/inventory-transfers'
  };

  private sectionParentLabels: { [key: string]: string } = {
    '/admin/products': 'Productos',
    '/admin/categories': 'Categorías',
    '/admin/brands': 'Marcas',
    '/admin/warehouses': 'Almacenes',
    '/admin/orders': 'Pedidos',
    '/admin/customers': 'Clientes',
    '/admin/customer-groups': 'Grupos de Clientes',
    '/admin/discounts': 'Descuentos',
    '/admin/taxes': 'Impuestos',
    '/admin/users': 'Usuarios',
    '/admin/profiles': 'Perfiles',
    '/admin/price-lists': 'Listas de Precios',
    '/admin/inventory': 'Inventario',
    '/admin/inventory-entries': 'Entradas',
    '/admin/inventory-exits': 'Salidas',
    '/admin/inventory-transfers': 'Traslados'
  };

  constructor(public authService: AuthService, private router: Router) {
    this.buildMenu();
    this.updateCurrentSection();
    this.router.events.subscribe(() => this.updateCurrentSection());
  }

  toggleSidebar(): void {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      this.mobileMenuOpen.set(!this.mobileMenuOpen());
    } else {
      this.sidebarCollapsed.set(!this.sidebarCollapsed());
    }
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
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
    this.generateBreadcrumb(url);
  }

  generateBreadcrumb(url: string): void {
    const items: BreadcrumbItem[] = [];
    const pathSegments = url.split('/').filter(s => s);

    if (pathSegments.length >= 2 && pathSegments[0] === 'admin') {
      const section = '/' + pathSegments[1];

      if (this.sectionParentLabels[section]) {
        items.push({
          label: this.sectionParentLabels[section],
          routerLink: this.sectionParents[section]
        });
      }

      const currentLabel = this.routeMap[section];
      if (currentLabel && section !== url) {
        let lastPart = '';
        if (url.includes('/new')) {
          lastPart = 'Nuevo';
          if (currentLabel === 'Productos') lastPart = 'Nuevo Producto';
          if (currentLabel === 'Categorías') lastPart = 'Nueva Categoría';
          if (currentLabel === 'Marcas') lastPart = 'Nueva Marca';
          if (currentLabel === 'Almacenes') lastPart = 'Nuevo Almacén';
          if (currentLabel === 'Pedidos') lastPart = 'Nuevo Pedido';
          if (currentLabel === 'Clientes') lastPart = 'Nuevo Cliente';
          if (currentLabel === 'Grupos de Clientes') lastPart = 'Nuevo Grupo';
          if (currentLabel === 'Descuentos') lastPart = 'Nuevo Descuento';
          if (currentLabel === 'Impuestos') lastPart = 'Nuevo Impuesto';
          if (currentLabel === 'Usuarios') lastPart = 'Nuevo Usuario';
          if (currentLabel === 'Perfiles') lastPart = 'Nuevo Perfil';
          if (currentLabel === 'Listas de Precios') lastPart = 'Nueva Lista';
        } else if (url.includes('/edit/')) {
          lastPart = 'Editar';
          if (currentLabel === 'Productos') lastPart = 'Editar Producto';
          if (currentLabel === 'Categorías') lastPart = 'Editar Categoría';
          if (currentLabel === 'Marcas') lastPart = 'Editar Marca';
          if (currentLabel === 'Almacenes') lastPart = 'Editar Almacén';
          if (currentLabel === 'Pedidos') lastPart = 'Editar Pedido';
          if (currentLabel === 'Clientes') lastPart = 'Editar Cliente';
          if (currentLabel === 'Grupos de Clientes') lastPart = 'Editar Grupo';
          if (currentLabel === 'Descuentos') lastPart = 'Editar Descuento';
          if (currentLabel === 'Impuestos') lastPart = 'Editar Impuesto';
          if (currentLabel === 'Usuarios') lastPart = 'Editar Usuario';
          if (currentLabel === 'Perfiles') lastPart = 'Editar Perfil';
          if (currentLabel === 'Listas de Precios') lastPart = 'Editar Lista';
        } else if (url.includes('/references/')) {
          lastPart = 'Referencias';
        } else if (url.includes('/attributes/')) {
          lastPart = 'Atributos';
        } else if (url.includes('/detail/')) {
          lastPart = 'Detalle';
        }

        if (lastPart) {
          items.push({ label: lastPart });
        }
      } else if (section === url) {
        // Already added parent, don't add again
      }
    }

    this.breadcrumbItems.set(items);
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
