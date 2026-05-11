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
import { Profile } from '../../../Models';

@Component({
  selector: 'app-profiles',
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
  templateUrl: './profiles.component.html',
  styleUrl: './profiles.component.scss'
})
export class ProfilesComponent implements OnInit {
  profiles = signal<Profile[]>([]);
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

  ngOnInit(): void { this.loadProfiles(); }

  loadProfiles(event?: any): void {
    this.loading.set(true);
    const page = event ? Math.ceil((event.first + 1) / this.pageSize) : 1;
    
    this.apiService.getProfiles(page, this.pageSize).subscribe({
      next: (res) => {
        this.profiles.set(res.data);
        this.totalCount.set(res.total ?? 0);
        this.loading.set(false);
        if (event) {
          this.first = event.first;
          this.pageSize = event.rows;
        }
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar perfiles' });
      }
    });
  }

  onPage(event: any): void { this.loadProfiles(event); }

  goToNewProfile(): void { this.router.navigate(['/admin/profiles/new']); }
  
  goToEditProfile(profile: Profile): void { this.router.navigate(['/admin/profiles/edit', profile.id]); }

  deleteProfile(profile: Profile): void {
    this.confirmationService.confirm({
      message: `¿Eliminar el perfil "${profile.name}"?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.apiService.deleteProfile(profile.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Perfil eliminado' });
            this.loadProfiles();
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar perfil' });
          }
        });
      }
    });
  }

  getActiveSeverity(isActive: boolean): 'success' | 'danger' {
    return isActive ? 'success' : 'danger';
  }
}
