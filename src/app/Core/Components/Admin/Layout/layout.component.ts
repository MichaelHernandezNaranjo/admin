import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AvatarModule } from 'primeng/avatar';
import { RippleModule } from 'primeng/ripple';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../../Services';
import { BreadcrumbComponent, BreadcrumbItem } from '../Breadcrumb/breadcrumb.component';
import { MENU_SECTIONS, filterMenuSections, MenuSection } from './menu.config';
import { BREADCRUMB_LABEL_MAP, EDIT_LABELS, NEW_LABELS, SUB_LABELS } from './breadcrumb.config';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, AvatarModule, RippleModule, ButtonModule, BreadcrumbComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent {
  menuSections = signal<MenuSection[]>([]);
  expandedSections = signal<Set<string>>(new Set());
  sidebarVisible = signal(true);
  breadcrumbItems = signal<BreadcrumbItem[]>([]);

  constructor(public authService: AuthService, private router: Router) {
    this.buildMenu();
    this.updateBreadcrumb();
    this.router.events.subscribe(() => this.updateBreadcrumb());
  }

  private buildMenu(): void {
    const filtered = filterMenuSections(MENU_SECTIONS, (p) => this.authService.hasPermission(p));
    this.menuSections.set(filtered);
    const expanded = new Set<string>();
    filtered.forEach(s => expanded.add(s.label));
    this.expandedSections.set(expanded);
  }

  toggleSidebar(): void {
    this.sidebarVisible.set(!this.sidebarVisible());
  }

  closeSidebar(): void {
    this.sidebarVisible.set(false);
  }

  openSidebar(): void {
    this.sidebarVisible.set(true);
  }

  onMenuItemClick(): void {
    if (window.innerWidth < 992) {
      this.sidebarVisible.set(false);
    }
  }

  toggleSection(label: string): void {
    const current = new Set(this.expandedSections());
    if (current.has(label)) {
      current.delete(label);
    } else {
      current.add(label);
    }
    this.expandedSections.set(current);
  }

  isSectionExpanded(label: string): boolean {
    return this.expandedSections().has(label);
  }

  private updateBreadcrumb(): void {
    const url = this.router.url;
    const items: BreadcrumbItem[] = [];
    const pathSegments = url.split('/').filter(Boolean);

    if (pathSegments.length < 2 || pathSegments[0] !== 'admin') {
      this.breadcrumbItems.set([]);
      return;
    }

    const sectionPath = '/' + pathSegments[1];

    if (BREADCRUMB_LABEL_MAP[sectionPath]) {
      items.push({ label: BREADCRUMB_LABEL_MAP[sectionPath], routerLink: sectionPath });
    }

    if (sectionPath !== url) {
      let lastPart = '';
      if (url.includes('/new')) {
        lastPart = NEW_LABELS[sectionPath] || 'Nuevo';
      } else if (url.includes('/edit/')) {
        lastPart = EDIT_LABELS[sectionPath] || 'Editar';
      } else if (SUB_LABELS[url]) {
        lastPart = SUB_LABELS[url];
      }
      if (lastPart) items.push({ label: lastPart });
    }

    this.breadcrumbItems.set(items);
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