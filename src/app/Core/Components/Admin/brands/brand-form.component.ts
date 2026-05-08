import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { CheckboxModule } from 'primeng/checkbox';
import { FileUploadModule } from 'primeng/fileupload';
import { MessageService } from 'primeng/api';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../../Services';
import { Brand } from '../../../Models';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-brand-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    InputTextModule,
    TextareaModule,
    ButtonModule,
    ToastModule,
    CheckboxModule,
    FileUploadModule,
  ],
  providers: [MessageService],
  templateUrl: './brand-form.component.html',
  styleUrl: './brand-form.component.scss'
})
export class BrandFormComponent implements OnInit {
  editingBrand = signal<Brand | null>(null);
  formData: any = { isActive: true };
  isLoading = signal(false);
  isUploading = signal(false);
  logoPreview = signal<string | null>(null);

  readonly BACKEND_URL = environment.backendUrl;

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute,
    private router: Router,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadBrand(id);
    }
  }

  loadBrand(id: string): void {
    this.isLoading.set(true);
    this.apiService.getBrand(id).subscribe({
      next: (res) => {
        const brand = (res as any).data || res;
        this.editingBrand.set(brand);
        this.formData = { ...brand };
        if (brand.logoUrl) {
          this.logoPreview.set(this.getLogoUrl(brand.logoUrl));
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar marca' });
        this.isLoading.set(false);
        this.router.navigate(['/admin/brands']);
      }
    });
  }

  async onFileSelected(event: any): Promise<void> {
    const file: File = event.files?.[0];
    if (!file) return;

    this.isUploading.set(true);
    try {
      const result = await firstValueFrom(this.apiService.uploadBrandLogo(file));
      this.formData.logoUrl = result.url;
      this.logoPreview.set(this.getLogoUrl(result.url));
      this.messageService.add({ severity: 'success', summary: 'Logo cargado', detail: 'El logo se subió correctamente' });
    } catch {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al subir el logo' });
    } finally {
      this.isUploading.set(false);
    }
  }

  removeLogo(): void {
    this.formData.logoUrl = null;
    this.logoPreview.set(null);
  }

  getLogoUrl(logoUrl: string): string {
    if (!logoUrl) return '';
    if (logoUrl.startsWith('http')) return logoUrl;
    return `${this.BACKEND_URL}${logoUrl}`;
  }

  saveBrand(): void {
    if (!this.formData.name) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'El nombre es requerido' });
      return;
    }

    this.isLoading.set(true);
    const payload = {
      name: this.formData.name,
      description: this.formData.description,
      logoUrl: this.formData.logoUrl,
      isActive: this.formData.isActive
    };

    if (this.editingBrand()) {
      this.apiService.updateBrand(this.editingBrand()!.id, payload).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Marca actualizada' });
          this.router.navigate(['/admin/brands']);
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al actualizar marca' });
          this.isLoading.set(false);
        }
      });
    } else {
      this.apiService.createBrand(payload).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Marca creada' });
          this.router.navigate(['/admin/brands']);
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al crear marca' });
          this.isLoading.set(false);
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/admin/brands']);
  }
}
