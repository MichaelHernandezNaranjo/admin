export interface BreadcrumbMap {
  [route: string]: string;
}

export const BREADCRUMB_LABEL_MAP: BreadcrumbMap = {
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
  '/admin/invoices': 'Facturas',
  '/admin/profiles': 'Perfiles',
  '/admin/brands': 'Marcas',
  '/admin/contact-messages': 'Mensajes'
};

export const EDIT_LABELS: { [key: string]: string } = {
  '/admin/products': 'Editar Producto',
  '/admin/categories': 'Editar Categoría',
  '/admin/brands': 'Editar Marca',
  '/admin/warehouses': 'Editar Almacén',
  '/admin/orders': 'Editar Pedido',
  '/admin/customers': 'Editar Cliente',
  '/admin/customer-groups': 'Editar Grupo',
  '/admin/discounts': 'Editar Descuento',
  '/admin/taxes': 'Editar Impuesto',
  '/admin/users': 'Editar Usuario',
  '/admin/profiles': 'Editar Perfil',
  '/admin/price-lists': 'Editar Lista'
};

export const NEW_LABELS: { [key: string]: string } = {
  '/admin/products': 'Nuevo Producto',
  '/admin/categories': 'Nueva Categoría',
  '/admin/brands': 'Nueva Marca',
  '/admin/warehouses': 'Nuevo Almacén',
  '/admin/orders': 'Nuevo Pedido',
  '/admin/customers': 'Nuevo Cliente',
  '/admin/customer-groups': 'Nuevo Grupo',
  '/admin/discounts': 'Nuevo Descuento',
  '/admin/taxes': 'Nuevo Impuesto',
  '/admin/users': 'Nuevo Usuario',
  '/admin/profiles': 'Nuevo Perfil',
  '/admin/price-lists': 'Nueva Lista'
};

export const SUB_LABELS: { [key: string]: string } = {
  '/admin/products/references': 'Referencias',
  '/admin/categories/attributes': 'Atributos'
};