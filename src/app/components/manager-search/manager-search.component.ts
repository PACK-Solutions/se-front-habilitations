import { Component, output, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { ManagerSearchHeaderComponent } from '../manager-search-header/manager-search-header.component';
import { ManagerListComponent } from '../manager-list/manager-list.component';
import { AuthorizationService } from '../../services/authorization.service';
import { 
  Manager, 
  AuthorizationProfile
} from '../../models/authorization.model';
import { AutoCompleteCompleteEvent, AutoCompleteSelectEvent } from 'primeng/autocomplete';
import { PaginatorState } from 'primeng/paginator';
import { TableRowSelectEvent } from 'primeng/table';

@Component({
  selector: 'app-manager-search',
  standalone: true,
  imports: [
    FormsModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    ManagerSearchHeaderComponent,
    ManagerListComponent
  ],
  templateUrl: './manager-search.component.html',
  styleUrl: './manager-search.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ManagerSearchComponent {
  // Injection de services
  public authService = inject(AuthorizationService);
  private messageService = inject(MessageService);

  // Outputs
  managerSelected = output<Manager>();

  // Signals locaux
  private searchInput = signal<string>('');
  private showResults = signal<boolean>(true); // Afficher la table par défaut
  private _suggestions = signal<Manager[]>([]);
  private showGroupsView = signal<boolean>(false);
  private advancedAmount = signal<string>('100 000€');
  private intermediateAmount = signal<string>('20 000€');
  private intermediatePEROAmount = signal<string>('20 000€');
  
  // Signal pour indiquer si les valeurs ont été modifiées
  public hasUnsavedChanges = signal<boolean>(false);
  public isSaving = signal<boolean>(false);
  
  // Signals pour la pagination mobile
  public mobileFirst = signal<number>(0);
  public mobileRows = signal<number>(8);

  // Computed signals
  searchTerm = computed(() => this.searchInput());
  isLoading = computed(() => this.authService.loading());
  filteredManagers = computed(() => this.authService.filteredManagers());
  suggestions = computed(() => this._suggestions());
  hasResults = computed(() => this.filteredManagers().length > 0);
  showNoResults = computed(() => 
    this.searchTerm().length > 0 && !this.hasResults() && !this.isLoading()
  );
  isGroupsViewActive = computed(() => this.showGroupsView());
  
  // Computed pour les données paginées en mobile
  paginatedMobileManagers = computed(() => {
    const managers = this.filteredManagers();
    const first = this.mobileFirst();
    const rows = this.mobileRows();
    return managers.slice(first, first + rows);
  });
  
  // Computed pour les boutons de sauvegarde
  canSave = computed(() => this.hasUnsavedChanges() && !this.isSaving());
  isLoadingSave = computed(() => this.isSaving());
  
  // Computed pour tous les profils disponibles
  allProfiles = computed(() => this.authService.getAllProfiles());

  constructor() {
    // Charger tous les gestionnaires au démarrage
    this.authService.updateSearchTerm('');
    
    // Charger les valeurs sauvegardées depuis localStorage
    this.loadSavedValues();
  }
  
  private loadSavedValues(): void {
    const savedAdvanced = localStorage.getItem('group-advanced-amount');
    const savedIntermediate = localStorage.getItem('group-intermediate-amount');
    const savedIntermediatePERO = localStorage.getItem('group-intermediate-pero-amount');
    
    if (savedAdvanced) {
      this.advancedAmount.set(savedAdvanced);
    }
    if (savedIntermediate) {
      this.intermediateAmount.set(savedIntermediate);
    }
    if (savedIntermediatePERO) {
      this.intermediatePEROAmount.set(savedIntermediatePERO);
    }
  }

  onSuggest(event: AutoCompleteCompleteEvent): void {
    const query = event.query.toLowerCase();
    if (query.length >= 2) {
      // Filtrer tous les managers pour les suggestions
      const allManagers = this.authService.allManagers();
      const filtered = allManagers.filter(manager =>
        manager.firstName.toLowerCase().includes(query) ||
        manager.lastName.toLowerCase().includes(query) ||
        manager.seIdentifier.toLowerCase().includes(query) ||
        manager.login.toLowerCase().includes(query) ||
        manager.email.toLowerCase().includes(query)
      );
      this._suggestions.set(filtered);
    } else {
      this._suggestions.set([]);
    }
  }

  onSelectFromSuggestion(event: AutoCompleteSelectEvent): void {
    const manager = event.value;
    if (!manager) return;
    
    // Sélectionner directement le gestionnaire depuis l'autocomplétion
    this.managerSelected.emit(manager);
    this.showResults.set(true);
  }

  onRowSelectHandler(event: TableRowSelectEvent): void {
    if (event.data && !Array.isArray(event.data)) {
      this.onSelectManager(event.data);
    }
  }

  onSearch(): void {
    const term = this.searchInput().trim();
    this.authService.updateSearchTerm(term);
    this.showResults.set(true);
  }

  onInputChange(): void {
    // Recherche en temps réel si plus de 2 caractères
    const term = this.searchInput().trim();
    this.authService.updateSearchTerm(term);
  }

  onSelectManager(manager: Manager): void {
    this.managerSelected.emit(manager);
  }

  onClearSearch(): void {
    this.searchInput.set('');
    this.authService.updateSearchTerm('');
    this.showResults.set(true);
    this.resetMobilePagination();
  }
  
  onMobilePageChange(event: PaginatorState): void {
    this.mobileFirst.set(event.first ?? 0);
    this.mobileRows.set(event.rows ?? 8);
  }
  
  private resetMobilePagination(): void {
    this.mobileFirst.set(0);
  }

  // Méthodes pour la gestion des groupes
  onShowGroupsView(): void {
    this.showGroupsView.set(true);
  }

  onBackToSearch(): void {
    this.showGroupsView.set(false);
  }

  // Getters/Setters pour les montants
  get advancedAmountValue(): string {
    return this.advancedAmount();
  }

  set advancedAmountValue(value: string) {
    this.advancedAmount.set(value);
    this.hasUnsavedChanges.set(true);
  }

  get intermediateAmountValue(): string {
    return this.intermediateAmount();
  }

  set intermediateAmountValue(value: string) {
    this.intermediateAmount.set(value);
    this.hasUnsavedChanges.set(true);
  }

  get intermediatePEROAmountValue(): string {
    return this.intermediatePEROAmount();
  }

  set intermediatePEROAmountValue(value: string) {
    this.intermediatePEROAmount.set(value);
    this.hasUnsavedChanges.set(true);
  }
  
  // Méthode pour sauvegarder les modifications
  onSaveGroupChanges(): void {
    this.isSaving.set(true);
    
    // Simuler un délai de sauvegarde
    setTimeout(() => {
      // Sauvegarder dans localStorage
      localStorage.setItem('group-advanced-amount', this.advancedAmount());
      localStorage.setItem('group-intermediate-amount', this.intermediateAmount());
      localStorage.setItem('group-intermediate-pero-amount', this.intermediatePEROAmount());
      
      // Réinitialiser les flags
      this.hasUnsavedChanges.set(false);
      this.isSaving.set(false);
      
      // Afficher le message de succès
      this.messageService.add({
        severity: 'success',
        summary: 'Modifications sauvegardées',
        detail: 'Les montants des profils d\'habilitation ont été mis à jour avec succès',
        life: 3000
      });
    }, 800);
  }
  
  // Méthode pour annuler les modifications
  onCancelGroupChanges(): void {
    // Recharger les valeurs depuis localStorage
    this.loadSavedValues();
    this.hasUnsavedChanges.set(false);
    
    this.messageService.add({
      severity: 'info',
      summary: 'Modifications annulées',
      detail: 'Les valeurs ont été restaurées',
      life: 2000
    });
  }

  // Méthodes utilitaires pour l'affichage dynamique
  getProfileSeverity(profile: AuthorizationProfile): "success" | "info" | "warning" | "danger" | "secondary" | "contrast" | undefined {
    return this.authService.getProfileSeverity(profile);
  }

  formatProfileDescription(profile: AuthorizationProfile): string {
    return this.authService.getDynamicProfileDescription(profile);
  }

  isProfileConfigurable(profile: AuthorizationProfile): boolean {
    return profile.id === 'prof_intermediate' || 
           profile.id === 'prof_intermediate_pero' || 
           profile.id === 'prof_advanced';
  }

  getProfileInputType(profile: AuthorizationProfile): 'intermediate' | 'intermediate_pero' | 'advanced' | null {
    if (profile.id === 'prof_intermediate') {
      return 'intermediate';
    }
    if (profile.id === 'prof_intermediate_pero') {
      return 'intermediate_pero';
    }
    if (profile.id === 'prof_advanced') {
      return 'advanced';
    }
    return null;
  }

  // Accesseurs pour le template
  get searchInputValue(): string {
    return this.searchInput();
  }

  set searchInputValue(value: string) {
    this.searchInput.set(value);
  }

  get shouldShowResults(): boolean {
    return this.showResults();
  }
}