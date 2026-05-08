import { Component, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ApiService } from '@core/Services';
import { ProductReference, AttributeDefinition, AttributeOption } from '@core/Models';

@Component({
  selector: 'app-product-references',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    DialogModule,
    SelectModule,
    TagModule,
    ToastModule,
    ConfirmDialogModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './product-references.component.html',
  styleUrl: './product-references.component.scss'
})
export class ProductReferencesComponent implements OnInit {
  @Input() productId!: string;
  @Input() categoryId?: string;
  
  references = signal<ProductReference[]>([]);
  attributes = signal<AttributeDefinition[]>([]);
  isLoading = signal(false);
  
  showReferenceDialog = false;
  editingReference = signal<ProductReference | null>(null);
  
  referenceForm: any = {
    referenceCode: '',
    price: 0,
    barcode: '',
    attributeValues: [] as { attributeDefinitionId: string; attributeOptionId: string }[]
  };
  
  selectedAttributeOptions: Record<string, string> = {};

  constructor(
    private apiService: ApiService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    if (this.productId) {
      this.loadReferences();
    }
    if (this.categoryId) {
      this.loadAttributes();
    }
  }

  loadReferences(): void {
    if (!this.productId) return;
    
    this.isLoading.set(true);
    this.apiService.getProductReferences(this.productId).subscribe({
      next: (data) => {
        this.references.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar referencias' });
        this.isLoading.set(false);
      }
    });
  }

  loadAttributes(): void {
    if (!this.categoryId) return;
    
    this.apiService.getAttributeDefinitions(this.categoryId).subscribe({
      next: (data) => {
        this.attributes.set(data);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar atributos' });
      }
    });
  }

  openReferenceDialog(reference?: ProductReference): void {
    if (reference) {
      this.editingReference.set(reference);
      this.referenceForm = {
        referenceCode: reference.referenceCode,
        price: reference.price,
        barcode: reference.barcode || '',
        attributeValues: reference.attributeValues?.map(av => ({
          attributeDefinitionId: av.attributeDefinitionId,
          attributeOptionId: av.attributeOptionId
        })) || []
      };
      this.selectedAttributeOptions = {};
      reference.attributeValues?.forEach(av => {
        this.selectedAttributeOptions[av.attributeDefinitionId] = av.attributeOptionId;
      });
    } else {
      this.editingReference.set(null);
      this.referenceForm = {
        referenceCode: '',
        price: 0,
        barcode: '',
        attributeValues: []
      };
      this.selectedAttributeOptions = {};
    }
    this.showReferenceDialog = true;
  }

  closeReferenceDialog(): void {
    this.showReferenceDialog = false;
    this.editingReference.set(null);
  }

  onAttributeOptionChange(attributeId: string, optionId: string): void {
    this.selectedAttributeOptions[attributeId] = optionId;
    this.updateAttributeValues();
  }

  updateAttributeValues(): void {
    this.referenceForm.attributeValues = [];
    Object.entries(this.selectedAttributeOptions).forEach(([attributeId, optionId]) => {
      if (optionId) {
        this.referenceForm.attributeValues.push({
          attributeDefinitionId: attributeId,
          attributeOptionId: optionId
        });
      }
    });
  }

  saveReference(): void {
    if (!this.referenceForm.referenceCode?.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Validacion', detail: 'El codigo de referencia es requerido' });
      return;
    }

    this.updateAttributeValues();

    if (this.referenceForm.attributeValues.length === 0) {
      this.messageService.add({ severity: 'warn', summary: 'Validacion', detail: 'Debe seleccionar al menos un valor de atributo' });
      return;
    }

    const attributeOptionIds = this.referenceForm.attributeValues.map((av: any) => av.attributeOptionId);
    const excludeId = this.editingReference()?.id;

    this.isLoading.set(true);
    
    this.apiService.validateReferenceCombination(
      this.productId, 
      attributeOptionIds, 
      excludeId
    ).subscribe({
      next: (validation) => {
        if (!validation.isValid) {
          this.messageService.add({ severity: 'warn', summary: 'Validacion', detail: 'Ya existe una referencia con la misma combinacion de atributos' });
          this.isLoading.set(false);
          return;
        }

        this.saveReferenceToApi();
      },
      error: () => {
        this.saveReferenceToApi();
      }
    });
  }

  private saveReferenceToApi(): void {
    const data = {
      productId: this.productId,
      referenceCode: this.referenceForm.referenceCode,
      price: this.referenceForm.price || 0,
      barcode: this.referenceForm.barcode || null,
      attributeValues: this.referenceForm.attributeValues
    };

    const request = this.editingReference()
      ? this.apiService.updateProductReference(this.editingReference()!.id, data)
      : this.apiService.createProductReference(data);

    request.subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Exito', detail: `Referencia ${this.editingReference() ? 'actualizada' : 'creada'}` });
        this.closeReferenceDialog();
        this.loadReferences();
      },
      error: (err) => {
        const message = err?.error?.message || 'Error al guardar referencia';
        this.messageService.add({ severity: 'error', summary: 'Error', detail: message });
        this.isLoading.set(false);
      }
    });
  }

  deleteReference(reference: ProductReference): void {
    this.confirmationService.confirm({
      message: `¿Eliminar la referencia "${reference.referenceCode}"?`,
      header: 'Confirmar eliminacion',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.apiService.deleteProductReference(reference.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Exito', detail: 'Referencia eliminada' });
            this.loadReferences();
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar referencia' });
          }
        });
      }
    });
  }

  getAttributeOptions(attributeId: string): AttributeOption[] {
    const attr = this.attributes().find(a => a.id === attributeId);
    return attr?.options || [];
  }

  getSelectedOptionId(attributeId: string): string | undefined {
    return this.selectedAttributeOptions[attributeId];
  }

  formatAttributeValues(values: any[]): string {
    if (!values || values.length === 0) return '-';
    return values.map(v => v.optionValue).filter(Boolean).join(', ');
  }

  getStockStatus(quantity: number, minStock: number): 'success' | 'warning' | 'danger' {
    if (quantity === 0) return 'danger';
    if (quantity <= minStock) return 'warning';
    return 'success';
  }
}
