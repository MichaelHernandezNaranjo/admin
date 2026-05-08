import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { MessageService } from 'primeng/api';
import { ApiService } from '../../../Services';
import { Profile, Permission } from '../../../Models';

interface PermissionGroup {
  name: string;
  permissions: Permission[];
}

@Component({
  selector: 'app-profile-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    InputTextModule,
    CheckboxModule,
    ButtonModule,
    ToastModule,
    CardModule
  ],
  providers: [MessageService],
  templateUrl: './profile-form.component.html',
  styleUrl: './profile-form.component.scss'
})
export class ProfileFormComponent implements OnInit {
  editingProfile = signal<Profile | null>(null);
  permissions = signal<Permission[]>([]);
  formName = '';
  formDescription = '';
  formIsActive = true;
  formPermissions: string[] = [];
  isLoading = signal(false);

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute,
    private router: Router,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadPermissions();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadProfile(id);
    }
  }

  get permissionGroups(): PermissionGroup[] {
    const groups: { [key: string]: Permission[] } = {};
    this.permissions().forEach(perm => {
      const groupName = perm.resource || 'Otros';
      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(perm);
    });
    return Object.keys(groups).sort().map(name => ({ name, permissions: groups[name] }));
  }

  loadPermissions(): void {
    this.apiService.getPermissions().subscribe({
      next: (res) => { this.permissions.set(res.data); },
      error: () => { }
    });
  }

  loadProfile(id: string): void {
    this.isLoading.set(true);
    this.apiService.getProfile(id).subscribe({
      next: (res) => {
        const profile = res.data || res;
        this.editingProfile.set(profile);
        this.formName = profile.name || '';
        this.formDescription = profile.description || '';
        this.formIsActive = profile.isActive;
        this.formPermissions = [...(profile.permissions || [])];
        this.isLoading.set(false);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar perfil' });
        this.isLoading.set(false);
        this.router.navigate(['/admin/profiles']);
      }
    });
  }

  isPermissionSelected(name: string): boolean {
    return this.formPermissions.includes(name);
  }

  onPermissionChange(name: string, checked: boolean): void {
    if (checked) {
      if (!this.formPermissions.includes(name)) {
        this.formPermissions.push(name);
      }
    } else {
      const idx = this.formPermissions.indexOf(name);
      if (idx > -1) {
        this.formPermissions.splice(idx, 1);
      }
    }
  }

  saveProfile(): void {
    if (!this.formName) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'El nombre es requerido' });
      return;
    }

    this.isLoading.set(true);
    const data: any = {
      name: this.formName,
      description: this.formDescription,
      isActive: this.formIsActive,
      permissions: this.formPermissions
    };

    if (this.editingProfile()) {
      this.apiService.updateProfile(this.editingProfile()!.id, data).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Perfil actualizado' });
          this.router.navigate(['/admin/profiles']);
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al actualizar perfil' });
          this.isLoading.set(false);
        }
      });
    } else {
      this.apiService.createProfile(data).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Perfil creado' });
          this.router.navigate(['/admin/profiles']);
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al crear perfil' });
          this.isLoading.set(false);
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/admin/profiles']);
  }
}
