import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { CheckboxModule } from 'primeng/checkbox';
import { TabsModule } from 'primeng/tabs';
import { MessageService } from 'primeng/api';
import { ApiService } from '../../../Services';
import { Category } from '../../../Models';
import { CategoryAttributesComponent } from './category-attributes/category-attributes.component';

@Component({
  selector: 'app-category-form',
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
    TabsModule,
    CategoryAttributesComponent
  ],
  providers: [MessageService],
  templateUrl: './category-form.component.html',
  styleUrl: './category-form.component.scss'
})
export class CategoryFormComponent implements OnInit {
  editingCategory = signal<Category | null>(null);
  formData: any = { isActive: true };
  isLoading = signal(false);

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute,
    private router: Router,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadCategory(id);
    }
  }

  loadCategory(id: string): void {
    this.isLoading.set(true);
    this.apiService.getCategory(id).subscribe({
      next: (res) => {
        const category = res.data || res;
        this.editingCategory.set(category);
        this.formData = { ...category };
        this.isLoading.set(false);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar categoría' });
        this.isLoading.set(false);
        this.router.navigate(['/admin/categories']);
      }
    });
  }

  saveCategory(): void {
    if (!this.formData.name) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'El nombre es requerido' });
      return;
    }

    this.isLoading.set(true);
    
    if (this.editingCategory()) {
      this.apiService.updateCategory(this.editingCategory()!.id, this.formData).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Categoría actualizada' });
          this.router.navigate(['/admin/categories']);
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al actualizar categoría' });
          this.isLoading.set(false);
        }
      });
    } else {
      this.apiService.createCategory(this.formData).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Categoría creada' });
          this.router.navigate(['/admin/categories']);
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al crear categoría' });
          this.isLoading.set(false);
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/admin/categories']);
  }
}
