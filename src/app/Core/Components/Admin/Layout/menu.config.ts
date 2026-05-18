export interface MenuItem {
  label: string;
  icon: string;
  routerLink: string;
  permission?: string;
}

export interface MenuSection {
  label: string;
  icon: string;
  items: MenuItem[];
  permission?: string;
}

export const MENU_SECTIONS: MenuSection[] = [
  {
    label: 'Principal',
    icon: 'pi pi-home',
    items: [
      { label: 'Dashboard', icon: 'pi pi-home', routerLink: '/admin/dashboard' }
    ]
  },
  {
    label: 'Catálogo',
    icon: 'pi pi-th-large',
    items: [
      { label: 'Productos', icon: 'pi pi-box', routerLink: '/admin/products', permission: 'products.read' },
      { label: 'Categorías', icon: 'pi pi-tag', routerLink: '/admin/categories', permission: 'products.read' },
      { label: 'Marcas', icon: 'pi pi-bookmark', routerLink: '/admin/brands', permission: 'products.read' },
      { label: 'Almacenes', icon: 'pi pi-warehouse', routerLink: '/admin/warehouses', permission: 'warehouses.read' }
    ]
  },
  {
    label: 'Operaciones',
    icon: 'pi pi-bolt',
    items: [
      { label: 'Pedidos', icon: 'pi pi-shopping-cart', routerLink: '/admin/orders', permission: 'orders.read' },
      { label: 'Facturas', icon: 'pi pi-receipt', routerLink: '/admin/invoices', permission: 'invoices.read' },
      { label: 'Mensajes de Contacto', icon: 'pi pi-envelope', routerLink: '/admin/contact-messages' },
      { label: 'Entradas', icon: 'pi pi-plus-circle', routerLink: '/admin/inventory-entries', permission: 'inventory.entries.read' },
      { label: 'Salidas', icon: 'pi pi-minus-circle', routerLink: '/admin/inventory-exits', permission: 'inventory.exits.read' },
      { label: 'Traslados', icon: 'pi pi-arrows-h', routerLink: '/admin/inventory-transfers', permission: 'inventory.transfers.read' }
    ]
  },
  {
    label: 'Reportes',
    icon: 'pi pi-chart-bar',
    items: [
      { label: 'Inventario', icon: 'pi pi-file', routerLink: '/admin/inventory', permission: 'inventory.read' }
    ]
  },
  {
    label: 'Comercial',
    icon: 'pi pi-tag',
    items: [
      { label: 'Listas de Precios', icon: 'pi pi-tag', routerLink: '/admin/price-lists', permission: 'pricelists.read' },
      { label: 'Clientes', icon: 'pi pi-users', routerLink: '/admin/customers', permission: 'customers.read' },
      { label: 'Grupos de Clientes', icon: 'pi pi-users', routerLink: '/admin/customer-groups', permission: 'customergroups.read' }
    ]
  },
  {
    label: 'Finanzas',
    icon: 'pi pi-wallet',
    items: [
      { label: 'Descuentos', icon: 'pi pi-percent', routerLink: '/admin/discounts', permission: 'discounts.read' },
      { label: 'Impuestos', icon: 'pi pi-receipt', routerLink: '/admin/taxes', permission: 'taxes.read' }
    ]
  },
  {
    label: 'Sistema',
    icon: 'pi pi-cog',
    items: [
      { label: 'Usuarios', icon: 'pi pi-user', routerLink: '/admin/users', permission: 'users.read' },
      { label: 'Perfiles', icon: 'pi pi-shield', routerLink: '/admin/profiles', permission: 'profiles.read' }
    ]
  }
];

export function filterMenuSections(
  sections: MenuSection[],
  hasPermission: (perm: string) => boolean
): MenuSection[] {
  return sections
    .map(section => ({
      ...section,
      items: section.items.filter(
        item => !item.permission || hasPermission(item.permission)
      )
    }))
    .filter(section => section.items.length > 0);
}