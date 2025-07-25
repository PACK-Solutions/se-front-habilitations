import { Component, input, output, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { TagModule } from 'primeng/tag';
import { AuthorizationService } from '../../services/authorization.service';
import { 
  AuthorizationProfile,
  EffectiveAuthorizationItem
} from '../../models/authorization.model';
import { CheckboxChangeEvent } from 'primeng/checkbox';

@Component({
  selector: 'app-authorization-creation-form',
  standalone: true,
  imports: [
    FormsModule,
    ButtonModule,
    CheckboxModule,
    TagModule
  ],
  templateUrl: './authorization-creation-form.component.html',
  styleUrl: './authorization-creation-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuthorizationCreationFormComponent {
  // Injection de services
  public authService = inject(AuthorizationService);

  // Inputs
  availableProfiles = input<AuthorizationProfile[]>([]);
  isLoading = input<boolean>(false);
  hasExplicitAuthorizations = input<boolean>(false);
  currentAuthorizations = input<EffectiveAuthorizationItem[]>([]);

  // Outputs
  createAuthorizationRequest = output<{
    profiles: AuthorizationProfile[];
  }>();

  // Signals locaux
  private _selectedProfiles = signal<AuthorizationProfile[]>([]);
  private _selectedProfilesMap = signal<Record<string, boolean>>({});

  // Computed signals
  selectedProfiles = this._selectedProfiles.asReadonly();
  selectedProfilesMap = this._selectedProfilesMap.asReadonly();

  canCreateAuthorization = computed(() => 
    this._selectedProfiles().length > 0 && 
    !this.isLoading()
  );

  // Computed pour déterminer les profils disponibles
  availableProfilesComputed = computed(() => {
    const allProfiles = this.availableProfiles();
    const currentAuths = this.currentAuthorizations();
    
    // Extraire les IDs des profils déjà attribués (y compris par défaut)
    const assignedProfileIds = new Set(
      currentAuths
        .map(auth => auth.profile.id)
    );
    
    // Filtrer les profils pour exclure ceux déjà attribués
    return allProfiles.filter(profile => !assignedProfileIds.has(profile.id));
  });

  // Méthodes
  onCreateAuthorization(): void {
    const profiles = this._selectedProfiles();
    
    if (profiles.length === 0) return;

    this.createAuthorizationRequest.emit({
      profiles
    });

    this.resetForm();
  }

  onProfileSelectionChange(profile: AuthorizationProfile, event: CheckboxChangeEvent): void {
    const isSelected = event.checked;
    const currentProfiles = this._selectedProfiles();
    const currentMap = { ...this._selectedProfilesMap() };
    
    // Règle d'exclusivité : 
    // - Consultation et Référent sont exclusifs avec tout
    // - Les autres profils sont cumulatifs entre eux, mais exclusifs avec Consultation et Référent
    const isFullyExclusive = this.authService.isExclusiveProfile(profile.id);
    const isCumulative = !this.authService.isExclusiveProfile(profile.id);
    
    if (isSelected) {
      if (isFullyExclusive) {
        // Si on sélectionne Consultation ou Référent, désélectionner tous les autres
        this._selectedProfiles.set([profile]);
        const newMap: Record<string, boolean> = {};
        this.availableProfilesComputed().forEach(p => {
          newMap[p.id] = p.id === profile.id;
        });
        this._selectedProfilesMap.set(newMap);
      } else if (isCumulative) {
        // Si on sélectionne un profil cumulatif, désélectionner les profils exclusifs
        const filteredProfiles = currentProfiles.filter(p => !this.authService.isExclusiveProfile(p.id));
        
        // Ajouter le nouveau profil s'il n'est pas déjà présent
        if (!filteredProfiles.find(p => p.id === profile.id)) {
          filteredProfiles.push(profile);
        }
        
        this._selectedProfiles.set(filteredProfiles);
        
        // Mettre à jour la map
        const newMap = { ...currentMap };
        // Désélectionner les profils exclusifs
        this.availableProfilesComputed().forEach(p => {
          if (this.authService.isExclusiveProfile(p.id)) {
            newMap[p.id] = false;
          }
        });
        // Sélectionner le profil actuel
        newMap[profile.id] = true;
        this._selectedProfilesMap.set(newMap);
      }
    } else {
      // Retirer le profil
      this._selectedProfiles.set(currentProfiles.filter(p => p.id !== profile.id));
      currentMap[profile.id] = false;
      this._selectedProfilesMap.set(currentMap);
    }
  }

  toggleProfile(profile: AuthorizationProfile): void {
    const currentMap = this._selectedProfilesMap();
    const isCurrentlySelected = currentMap[profile.id] || false;
    
    // Créer un événement simulé avec les bonnes propriétés
    const mockEvent = {
      checked: !isCurrentlySelected,
      originalEvent: undefined
    } as CheckboxChangeEvent;
    
    this.onProfileSelectionChange(profile, mockEvent);
  }

  isProfileSelected(profile: AuthorizationProfile): boolean {
    return this._selectedProfilesMap()[profile.id] || false;
  }
  private resetForm(): void {
    this._selectedProfiles.set([]);
    this._selectedProfilesMap.set({});
  }

  getProfileSeverity(profile: AuthorizationProfile): "success" | "info" | "warning" | "danger" | "secondary" | "contrast" | undefined {
    return this.authService.getProfileSeverity(profile);
  }

  formatProfileDescription(profile: AuthorizationProfile): string {
    return this.authService.getDynamicProfileDescription(profile);
  }
}