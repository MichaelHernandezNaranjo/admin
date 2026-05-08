import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { ApiService } from '../../../Services';

interface DashboardStats {
  products: number;
  warehouses: number;
  customers: number;
  orders: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CardModule, ChartModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  stats = signal<DashboardStats>({ products: 0, warehouses: 0, customers: 0, orders: 0 });

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.apiService.getProducts(1, 1).subscribe({
      next: (response) => {
        this.stats.update(s => ({ ...s, products: response.total ?? 0 }));
      }
    });
    this.apiService.getWarehouses(1, 1).subscribe({
      next: (response) => {
        this.stats.update(s => ({ ...s, warehouses: response.total ?? 0 }));
      }
    });
    this.apiService.getCustomers(1, 1).subscribe({
      next: (response) => {
        this.stats.update(s => ({ ...s, customers: response.total ?? 0 }));
      }
    });
  }
}
