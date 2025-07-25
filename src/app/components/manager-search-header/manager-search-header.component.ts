import { Component, input, output, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { AuthorizationService } from '../../services/authorization.service';
import { Manager } from '../../models/authorization.model';
import { AutoCompleteCompleteEvent, AutoCompleteSelectEvent } from 'primeng/autocomplete';

@Component({
  selector: 'app-manager-search-header',
  standalone: true,
  imports: [
    FormsModule,
    AutoCompleteModule
  ],
  templateUrl: './manager-search-header.component.html',
  styleUrl: './manager-search-header.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ManagerSearchHeaderComponent {
  // Injection de services
  public authService = inject(AuthorizationService);

  // Inputs
  searchInputValue = input<string>('');
  suggestions = input<Manager[]>([]);
  isLoading = input<boolean>(false);

  // Outputs
  completeMethod = output<AutoCompleteCompleteEvent>();
  selectFromSuggestion = output<AutoCompleteSelectEvent>();
  inputChange = output<void>();
  clearSearch = output<void>();

  // Signal local pour le modèle
  private _searchValue = signal<string>('');

  // Computed pour synchroniser avec l'input
  constructor() {
    // Synchroniser avec l'input parent
    this._searchValue.set(this.searchInputValue());
  }

  // Getters/Setters pour ngModel
  get searchValue(): string {
    return this._searchValue();
  }

  set searchValue(value: string) {
    this._searchValue.set(value);
  }

  onSuggest(event: AutoCompleteCompleteEvent): void {
    this.completeMethod.emit(event);
  }

  onSelectFromSuggestion(event: AutoCompleteSelectEvent): void {
    this.selectFromSuggestion.emit(event);
  }

  onInputChange(): void {
    this.inputChange.emit();
  }

  onClearSearch(): void {
    this._searchValue.set('');
    this.clearSearch.emit();
  }
}