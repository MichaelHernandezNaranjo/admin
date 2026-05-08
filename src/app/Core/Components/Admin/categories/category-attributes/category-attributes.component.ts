import { Component, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ApiService } from '@core/Services';
import { AttributeDefinition, AttributeOption } from '@core/Models';

@Component({
  selector: 'app-category-attributes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    DialogModule,
    SelectModule,
    CheckboxModule,
    TagModule,
    ToastModule,
    ConfirmDialogModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './category-attributes.component.html',
  styleUrl: './category-attributes.component.scss'
})
export class CategoryAttributesComponent implements OnInit {
  @Input() categoryId!: string;
  
  attributes = signal<AttributeDefinition[]>([]);
  isLoading = signal(false);
  
  showAttributeDialog = false;
  showOptionDialog = false;
  editingAttribute = signal<AttributeDefinition | null>(null);
  editingOption = signal<AttributeOption | null>(null);
  selectedAttribute = signal<AttributeDefinition | null>(null);
  
  attributeForm: any = { name: '', dataType: 'Text', isRequired: false };
  optionForm: any = { value: '' };
  
  dataTypes = [
    { label: 'Texto', value: 'Text' },
    { label: 'Número', value: 'Number' },
    { label: 'Booleano', value: 'Boolean' }
  ];
  
  expandedRows = signal<any>({});

  constructor(
    private apiService: ApiService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    if (!this.categoryId) {
      const id = this.route.snapshot.paramMap.get('categoryId');
      if (id) {
        this.categoryId = id;
      }
    }
    if (this.categoryId) {
      this.loadAttributes();
    }
  }

  loadAttributes(): void {
    if (!this.categoryId) return;
    
    this.isLoading.set(true);
    this.apiService.getAttributeDefinitions(this.categoryId).subscribe({
      next: (data) => {
        this.attributes.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar atributos' });
        this.isLoading.set(false);
      }
    });
  }

  openAttributeDialog(attribute?: AttributeDefinition): void {
    if (attribute) {
      this.editingAttribute.set(attribute);
      this.attributeForm = {
        name: attribute.name,
        dataType: attribute.dataType === 0 ? 'Text' : attribute.dataType === 1 ? 'Number' : 'Boolean',
        isRequired: attribute.isRequired
      };
    } else {
      this.editingAttribute.set(null);
      this.attributeForm = { name: '', dataType: 'Text', isRequired: false };
    }
    this.showAttributeDialog = true;
  }

  closeAttributeDialog(): void {
    this.showAttributeDialog = false;
    this.editingAttribute.set(null);
  }

  saveAttribute(): void {
    if (!this.attributeForm.name?.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'El nombre es requerido' });
      return;
    }

    this.isLoading.set(true);
    
    const dataTypeMap: Record<string, number> = {
      'Text': 0,
      'Number': 1,
      'Boolean': 2
    };
    
    const data: any = {
      categoryId: this.categoryId,
      name: this.attributeForm.name,
      dataType: dataTypeMap[this.attributeForm.dataType] ?? 0,
      isRequired: this.attributeForm.isRequired
    };

    const request = this.editingAttribute()
      ? this.apiService.updateAttributeDefinition(this.editingAttribute()!.id, data)
      : this.apiService.createAttributeDefinition(data);

    request.subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: `Atributo ${this.editingAttribute() ? 'actualizado' : 'creado'}` });
        this.closeAttributeDialog();
        this.loadAttributes();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al guardar atributo' });
        this.isLoading.set(false);
      }
    });
  }

  deleteAttribute(attribute: AttributeDefinition): void {
    if (confirm(`¿Eliminar el atributo "${attribute.name}" y todas sus opciones?`)) {
      this.apiService.deleteAttributeDefinition(attribute.id).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Atributo eliminado' });
          this.loadAttributes();
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar atributo' });
        }
      });
    }
  }

  openOptionDialog(attribute: AttributeDefinition, option?: AttributeOption): void {
    this.selectedAttribute.set(attribute);
    if (option) {
      this.editingOption.set(option);
      this.optionForm = { value: option.value };
    } else {
      this.editingOption.set(null);
      this.optionForm = { value: '' };
    }
    this.showOptionDialog = true;
  }

  closeOptionDialog(): void {
    this.showOptionDialog = false;
    this.editingOption.set(null);
    this.selectedAttribute.set(null);
  }

  saveOption(): void {
    if (!this.optionForm.value?.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'El valor es requerido' });
      return;
    }

    this.isLoading.set(true);
    const attributeId = this.selectedAttribute()!.id;

    const request = this.editingOption()
      ? this.apiService.updateAttributeOption(this.editingOption()!.id, { value: this.optionForm.value })
      : this.apiService.addAttributeOption(attributeId, { value: this.optionForm.value });

    request.subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: `Opción ${this.editingOption() ? 'actualizada' : 'creada'}` });
        this.closeOptionDialog();
        this.loadAttributes();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al guardar opción' });
        this.isLoading.set(false);
      }
    });
  }

  deleteOption(option: AttributeOption): void {
    if (confirm(`¿Eliminar la opción "${option.value}"?`)) {
      this.apiService.deleteAttributeOption(option.id).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Opción eliminada' });
          this.loadAttributes();
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar opción' });
        }
      });
    }
  }

  isAttributeInherited(attribute: AttributeDefinition): boolean {
    return attribute.isInherited === true;
  }

  getOptionsArray(options?: AttributeOption[]): AttributeOption[] {
    return options || [];
  }
}