import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { MultiSelectModule } from 'primeng/multiselect';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { MessageService } from 'primeng/api';
import { ApiService } from '../../../Services';
import { User, Profile } from '../../../Models';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    InputTextModule,
    PasswordModule,
    MultiSelectModule,
    ButtonModule,
    ToastModule,
    CardModule
  ],
  providers: [MessageService],
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.scss'
})
export class UserFormComponent implements OnInit {
  editingUser = signal<User | null>(null);
  profiles = signal<Profile[]>([]);
  formData: Partial<User & { profileIds?: string[] }> = { isActive: true, profileIds: [] };
  isLoading = signal(false);

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute,
    private router: Router,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadProfiles();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadUser(id);
    }
  }

  loadProfiles(): void {
    this.apiService.getProfiles(1, 100).subscribe({
      next: (res) => { this.profiles.set(res.data); },
      error: () => { }
    });
  }

  loadUser(id: string): void {
    this.isLoading.set(true);
    this.apiService.getUser(id).subscribe({
      next: (res) => {
        const user = res.data || res;
        this.editingUser.set(user);
        const profileIds = user.profiles?.length 
          ? this.profiles().filter(p => user.profiles!.includes(p.name)).map(p => p.id) 
          : [];
        this.formData = { ...user, profileIds };
        this.isLoading.set(false);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar usuario' });
        this.isLoading.set(false);
        this.router.navigate(['/admin/users']);
      }
    });
  }

  saveUser(): void {
    if (!this.formData.email || !this.formData.firstName || !this.formData.lastName) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'Email, nombre y apellido son requeridos' });
      return;
    }

    this.isLoading.set(true);
    const { profileIds, ...userData } = this.formData as any;
    
    if (this.editingUser()) {
      this.apiService.updateUser(this.editingUser()!.id, { ...userData, profileIds }).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Usuario actualizado' });
          this.router.navigate(['/admin/users']);
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al actualizar usuario' });
          this.isLoading.set(false);
        }
      });
    } else {
      this.apiService.createUser({ ...userData, profileIds }).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Usuario creado' });
          this.router.navigate(['/admin/users']);
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al crear usuario' });
          this.isLoading.set(false);
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/admin/users']);
  }
}
