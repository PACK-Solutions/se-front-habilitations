import { Component, input, output, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { PaginatorModule } from 'primeng/paginator';
import { AuthorizationService } from '../../services/authorization.service';
import { Manager } from '../../models/authorization.model';
import { TableRowSelectEvent } from 'primeng/table';
import { PaginatorState } from 'primeng/paginator';

@Component({
  selector: 'app-manager-list',
  standalone: true,
  imports: [
    ButtonModule,
    TableModule,
    TagModule,
    ProgressSpinnerModule,
    PaginatorModule
  ],
  templateUrl: './manager-list.component.html',
  styleUrl: './manager-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ManagerListComponent {
  // Injection de services
  public authService = inject(AuthorizationService);

  // Inputs
  filteredManagers = input<Manager[]>([]);
  isLoading = input<boolean>(false);
  searchTerm = input<string>('');
  shouldShowResults = input<boolean>(true);
  mobileFirst = input<number>(0);
  mobileRows = input<number>(8);

  // Outputs
  rowSelect = output<TableRowSelectEvent>();
  selectManager = output<Manager>();
  pageChange = output<PaginatorState>();

  // Computed signals
  hasResults = computed(() => this.filteredManagers().length > 0);
  showNoResults = computed(() => 
    this.searchTerm().length > 0 && !this.hasResults() && !this.isLoading()
  );
  
  // Computed pour les données paginées en mobile
  paginatedMobileManagers = computed(() => {
    const managers = this.filteredManagers();
    const first = this.mobileFirst();
    const rows = this.mobileRows();
    return managers.slice(first, first + rows);
  });

  onRowSelectHandler(event: TableRowSelectEvent): void {
    this.rowSelect.emit(event);
  }

  onSelectManager(manager: Manager): void {
    this.selectManager.emit(manager);
  }
  
  onMobilePageChange(event: PaginatorState): void {
    this.pageChange.emit(event);
  }
}