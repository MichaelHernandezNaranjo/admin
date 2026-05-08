import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { FloatLabelModule } from 'primeng/floatlabel';
import { ToastModule } from 'primeng/toast';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { TabsModule } from 'primeng/tabs';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { FileUploadModule } from 'primeng/fileupload';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../../Services';
import { Product } from '../../../Models';
import { environment } from '../../../../../environments/environment';
import { ProductReferencesComponent } from './product-references/product-references.component';

// ── Local interfaces ──────────────────────────────────────────────────────────

interface ImageAttribute {
  definitionId: string;
  definitionName: string;
  optionId: string;
  optionValue: string;
}

interface ProductImage {
  url: string;
  attributes: ImageAttribute[];
}

interface AttributeDefinitionOption {
  optionId: string;
  value: string;
}

interface AttributeDefinitionDef {
  definitionId: string;
  name: string;
  options: AttributeDefinitionOption[];
}

// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    InputTextModule,
    TextareaModule,
    InputNumberModule,
    ButtonModule,
    FloatLabelModule,
    ToastModule,
    CheckboxModule,
    SelectModule,
    TabsModule,
    AutoCompleteModule,
    FileUploadModule,
    TooltipModule,
    DialogModule,
    ProductReferencesComponent
  ],
  providers: [MessageService],
  templateUrl: './product-form.component.html',
  styleUrl: './product-form.component.scss'
})
export class ProductFormComponent implements OnInit {
  editingProduct = signal<Product | null>(null);
  formData: any = { isActive: true };
  isLoading = signal(false);
  isUploading = signal(false);
  categories: any[] = [];
  brands: any[] = [];

  readonly BACKEND_URL = environment.backendUrl;

  // ── Gallery ──────────────────────────────────────────────────────────────
  productImages: ProductImage[] = [];

  // ── Attribute dialog ─────────────────────────────────────────────────────
  showAttributeDialog = false;
  editingImageIndex = -1;
  imageAttributeDefs: AttributeDefinitionDef[] = [];
  /** map: definitionId → selected optionId (or null to clear) */
  selectedAttributeValues: Record<string, string | null> = {};

  // ── Tags ─────────────────────────────────────────────────────────────────
  selectedTags: string[] = [];
  tagSuggestions: string[] = [];

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute,
    private router: Router,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadBrands();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadProduct(id);
    }
  }

  // ── Loaders ───────────────────────────────────────────────────────────────

  loadCategories(): void {
    this.apiService.getCategoriesDropdown().subscribe({
      next: (res) => {
        this.categories = res.map((c: any) => ({ label: c.name, value: c.id }));
      },
      error: () => console.error('Error loading categories')
    });
  }

  loadBrands(): void {
    this.apiService.getBrandsDropdown().subscribe({
      next: (res) => {
        this.brands = res.map((b: any) => ({ label: b.name, value: b.id }));
      },
      error: () => console.error('Error loading brands')
    });
  }

  loadProduct(id: string): void {
    this.isLoading.set(true);
    this.apiService.getProduct(id).subscribe({
      next: (res) => {
        const product = (res as any).data || res;
        this.editingProduct.set(product);
        this.formData = { ...product };

        // Parse images — support both old (string[]) and new (ProductImage[]) format
        if (product.images) {
          try {
            const parsed = JSON.parse(product.images);
            if (Array.isArray(parsed) && parsed.length > 0) {
              if (typeof parsed[0] === 'string') {
                // Legacy format: convert to new
                this.productImages = parsed.map((url: string) => ({ url, attributes: [] }));
              } else {
                this.productImages = parsed as ProductImage[];
              }
            } else {
              this.productImages = [];
            }
          } catch {
            this.productImages = [];
          }
        } else {
          this.productImages = [];
        }

        // Parse tags
        if (product.tags) {
          try { this.selectedTags = JSON.parse(product.tags); } catch { this.selectedTags = []; }
        } else {
          this.selectedTags = [];
        }

        // Load attribute definitions for the product's category
        if (product.categoryId) {
          this.loadImageAttributes(product.id);
        }

        this.isLoading.set(false);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar producto' });
        this.isLoading.set(false);
        this.router.navigate(['/admin/products']);
      }
    });
  }

  loadImageAttributes(productId: string): void {
    this.apiService.getProductImageAttributes(productId).subscribe({
      next: (defs) => { this.imageAttributeDefs = defs; },
      error: () => { this.imageAttributeDefs = []; }
    });
  }

  // ── Gallery actions ───────────────────────────────────────────────────────

  async onImagesSelected(event: any): Promise<void> {
    const files: File[] = event.files;
    if (!files || files.length === 0) return;

    this.isUploading.set(true);
    let uploaded = 0;
    let failed = 0;

    for (const file of files) {
      try {
        const result = await firstValueFrom(this.apiService.uploadProductImage(file));
        this.productImages = [...this.productImages, { url: result.url, attributes: [] }];
        uploaded++;
      } catch {
        failed++;
      }
    }

    this.isUploading.set(false);

    if (uploaded > 0) {
      this.messageService.add({
        severity: 'success',
        summary: 'Imágenes cargadas',
        detail: `${uploaded} imagen${uploaded > 1 ? 'es subidas' : ' subida'} correctamente`
      });
    }
    if (failed > 0) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: `${failed} imagen${failed > 1 ? 'es no pudieron' : ' no pudo'} subirse` });
    }
  }

  removeImage(index: number): void {
    this.productImages = this.productImages.filter((_, i) => i !== index);
  }

  setMainImage(index: number): void {
    if (index === 0) return;
    const imgs = [...this.productImages];
    const [selected] = imgs.splice(index, 1);
    imgs.unshift(selected);
    this.productImages = imgs;
    this.messageService.add({ severity: 'info', summary: 'Imagen principal', detail: 'La imagen fue movida al inicio' });
  }

  // ── Attribute dialog ──────────────────────────────────────────────────────

  openAttributeDialog(index: number): void {
    this.editingImageIndex = index;
    // Initialise selects from existing attributes on the image
    this.selectedAttributeValues = {};
    for (const def of this.imageAttributeDefs) {
      const existing = this.productImages[index].attributes.find(a => a.definitionId === def.definitionId);
      this.selectedAttributeValues[def.definitionId] = existing ? existing.optionId : null;
    }
    this.showAttributeDialog = true;
  }

  saveImageAttributes(): void {
    const img = this.productImages[this.editingImageIndex];
    const newAttributes: ImageAttribute[] = [];

    for (const def of this.imageAttributeDefs) {
      const optionId = this.selectedAttributeValues[def.definitionId];
      if (optionId) {
        const option = def.options.find(o => o.optionId === optionId);
        if (option) {
          newAttributes.push({
            definitionId: def.definitionId,
            definitionName: def.name,
            optionId: option.optionId,
            optionValue: option.value
          });
        }
      }
    }

    this.productImages = this.productImages.map((item, i) =>
      i === this.editingImageIndex ? { ...item, attributes: newAttributes } : item
    );

    this.showAttributeDialog = false;
    this.editingImageIndex = -1;
  }

  closeAttributeDialog(): void {
    this.showAttributeDialog = false;
    this.editingImageIndex = -1;
  }

  getAttributeOptions(definitionId: string): { label: string; value: string }[] {
    const def = this.imageAttributeDefs.find(d => d.definitionId === definitionId);
    return def ? def.options.map(o => ({ label: o.value, value: o.optionId })) : [];
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  getImageUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${this.BACKEND_URL}${url}`;
  }

  // ── Tags ─────────────────────────────────────────────────────────────────

  searchTags(event: any): void {
    const query = (event.query || '').trim();
    this.tagSuggestions = query ? [query] : [];
  }

  // ── Save ─────────────────────────────────────────────────────────────────

  saveProduct(): void {
    if (!this.formData.productCode || !this.formData.name) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'Código y Nombre son requeridos' });
      return;
    }

    this.isLoading.set(true);

    const imagesJson = this.productImages.length > 0 ? JSON.stringify(this.productImages) : null;

    const payload = {
      productCode: this.formData.productCode,
      name: this.formData.name,
      description: this.formData.description || null,
      categoryId: this.formData.categoryId || null,
      brandId: this.formData.brandId || null,
      imageUrl: this.productImages.length > 0 ? this.productImages[0].url : undefined,
      images: imagesJson ?? undefined,
      isActive: this.formData.isActive ?? true,
      tags: this.selectedTags.length > 0 ? JSON.stringify(this.selectedTags) : undefined
    };

    if (this.editingProduct()) {
      this.apiService.updateProduct(this.editingProduct()!.id, payload).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Producto actualizado' });
          this.router.navigate(['/admin/products']);
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al actualizar producto' });
          this.isLoading.set(false);
        }
      });
    } else {
      this.apiService.createProduct(payload).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Producto creado' });
          this.router.navigate(['/admin/products']);
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al crear producto' });
          this.isLoading.set(false);
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/admin/products']);
  }

  goToReferences(): void {
    if (this.editingProduct()) {
      this.router.navigate(['/admin/products/references', this.editingProduct()!.id]);
    }
  }
}
