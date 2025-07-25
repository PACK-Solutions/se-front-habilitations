import { Component, input, output, signal, computed, inject, effect, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { MessageService, ConfirmationService } from 'primeng/api';
import { AuthorizationService } from '../../services/authorization.service';
import { ManagerDetailsHeaderComponent } from '../manager-details-header/manager-details-header.component';
import { AuthorizationCreationFormComponent } from '../authorization-creation-form/authorization-creation-form.component';
import { AuthorizationListDisplayComponent } from '../authorization-list-display/authorization-list-display.component';
import { 
  Manager, 
  AuthorizationProfile, 
  AuthorizationRequest,
  EffectiveAuthorizationItem
} from '../../models/authorization.model';

@Component({
  selector: 'app-authorization-management',
  standalone: true,
  imports: [
    FormsModule,
    DropdownModule,
    ManagerDetailsHeaderComponent,
    AuthorizationCreationFormComponent,
    AuthorizationListDisplayComponent
  ],
  templateUrl: './authorization-management.component.html',
  styleUrl: './authorization-management.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuthorizationManagementComponent implements OnInit {
  // Injection de services
  public authService = inject(AuthorizationService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  // Input
  manager = input.required<Manager>();

  // Signals locaux
  private isProcessing = signal<boolean>(false);

  // Computed signals
  availableProfiles = computed(() => {
    const allProfiles = this.authService.getAllProfiles();
    
    return allProfiles.sort((a, b) => {
      // Consultation en premier
      if (a.name === 'Consultation') return -1;
      if (b.name === 'Consultation') return 1;
      
      // Ordre décroissant par montant maximum (undefined = illimité = le plus élevé)
      const aAmount = a.maxAmount || Number.MAX_SAFE_INTEGER;
      const bAmount = b.maxAmount || Number.MAX_SAFE_INTEGER;
      return bAmount - aAmount;
    });
  });

  managerSummary = computed(() => this.authService.currentManagerSummary());
  effectiveAuthorizations = computed(() => this.authService.effectiveManagerAuthorizations());
  
  isLoading = computed(() => this.authService.loading() || this.isProcessing());
  
  // Indique s'il y a des autorisations explicites (non par défaut)
  hasExplicitAuthorizations = computed(() => {
    const effectiveAuths = this.effectiveAuthorizations();
    return effectiveAuths.some(auth => !auth.isDefault);
  });

  ngOnInit(): void {
    // Méthode requise par l'interface OnInit
  }

  // Computed pour grouper les autorisations par profil
  groupedAuthorizations = computed(() => {
    const effectiveAuths = this.effectiveAuthorizations();
    const groups = new Map<string, {
      profile: AuthorizationProfile;
      authorizations: any[];
      isDefault: boolean;
    }>();
    
    effectiveAuths.forEach(auth => {
      const profileId = auth.profile.id;
      if (!groups.has(profileId)) {
        groups.set(profileId, {
          profile: auth.profile,
          authorizations: [],
          isDefault: auth.isDefault || false
        });
      }
      groups.get(profileId)!.authorizations.push(auth);
    });
    
    return Array.from(groups.values()).sort((a, b) => {
      // Les autorisations par défaut (Consultation) en premier
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      
      // Pour les autorisations explicites, trier par hiérarchie de profil
      if (a.profile.name === 'Référent') return -1;
      if (b.profile.name === 'Référent') return 1;
      
      // Ordre décroissant par montant maximum
      const aAmount = a.profile.maxAmount || Number.MAX_SAFE_INTEGER;
      const bAmount = b.profile.maxAmount || Number.MAX_SAFE_INTEGER;
      return bAmount - aAmount;
    });
  });

  // Méthodes pour la création d'autorisation
  onCreateAuthorization(data: { profiles: AuthorizationProfile[] }): void {
    const { profiles } = data;
    
    if (profiles.length === 0) return;
    
    // Analyser si l'affectation va entraîner des suppressions
    const currentExplicitAuths = this.effectiveAuthorizations().filter(auth => !auth.isDefault);
    const exclusiveProfilesToAssign = profiles.filter(p => this.authService.isExclusiveProfile(p.id));
    const currentExclusiveAuths = currentExplicitAuths.filter(auth => this.authService.isExclusiveProfile(auth.profile.id));
    const currentNonExclusiveAuths = currentExplicitAuths.filter(auth => !this.authService.isExclusiveProfile(auth.profile.id));
    
    let willDeleteAuths = false;
    let deletionDetails: Array<{taxSystem: string, oldProfile: string, newProfile: string}> = [];
    
    if (exclusiveProfilesToAssign.length > 0) {
      // On affecte un profil exclusif -> supprimera toutes les autorisations existantes
      if (currentExplicitAuths.length > 0) {
        willDeleteAuths = true;
        currentExplicitAuths.forEach(auth => {
          deletionDetails.push({
            taxSystem: 'Prestations',
            oldProfile: auth.profile.name,
            newProfile: exclusiveProfilesToAssign[0].name
          });
        });
      }
    } else {
      // On affecte des profils non-exclusifs -> supprimera les profils exclusifs existants
      if (currentExclusiveAuths.length > 0) {
        willDeleteAuths = true;
        currentExclusiveAuths.forEach(auth => {
          deletionDetails.push({
            taxSystem: 'Prestations',
            oldProfile: auth.profile.name,
            newProfile: profiles.map(p => p.name).join(', ')
          });
        });
      }
    }
    
    if (willDeleteAuths) {
      // Afficher la confirmation de réaffectation
      const detailsHtml = deletionDetails.map(detail => `
        <div class="reassignment-detail-item">
          <div class="reassignment-tax-system">${detail.taxSystem}</div>
          <div class="reassignment-flow">
            <span class="reassignment-profile-source">${detail.oldProfile}</span>
            <span class="reassignment-arrow">→</span>
            <span class="reassignment-profile-target">${detail.newProfile}</span>
          </div>
        </div>
      `).join('');
      
      const message = `
        <div class="reassignment-confirmation-message">
          <p>Cette affectation va <strong>remplacer</strong> les groupes existants du gestionnaire :</p>
          <div class="reassignment-details-container">
            ${detailsHtml}
          </div>
          <p>Voulez-vous continuer ?</p>
        </div>
      `;
      
      this.confirmationService.confirm({
        message: message,
        header: 'Confirmer la réaffectation des groupes',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Réaffecter',
        rejectLabel: 'Annuler',
        acceptButtonStyleClass: 'p-button-warning',
        rejectButtonStyleClass: 'p-button-text p-button-secondary',
        accept: () => {
          this.executeAuthorizationAssignment(profiles);
        }
      });
    } else {
      // Pas de suppression nécessaire, procéder directement
      this.executeAuthorizationAssignment(profiles);
    }
  }
  
  private executeAuthorizationAssignment(profiles: AuthorizationProfile[]): void {
    this.isProcessing.set(true);
    
    this.authService.processAuthorizationAssignment(this.manager().id, profiles).subscribe({
      next: () => {
        if (profiles.length === 1) {
          this.messageService.add({
            severity: 'success',
            summary: 'Groupe affecté',
            detail: `Groupe "${profiles[0].name}" affecté avec succès`,
            life: 3000
          });
        } else {
          this.messageService.add({
            severity: 'success',
            summary: 'Groupes affectés',
            detail: `${profiles.length} groupes ont été affectés avec succès : ${profiles.map(p => p.name).join(', ')}`,
            life: 4000
          });
        }
        this.isProcessing.set(false);
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur d\'affectation',
          detail: error.message || 'Impossible d\'affecter les groupes',
          life: 4000
        });
        this.isProcessing.set(false);
      }
    });
  }
  
  // Méthodes pour la suppression d'autorisation
  onDeleteProfileHabilitations(data: { profileId: string; profileName: string }): void {
    const { profileId, profileName } = data;
    const profileAuths = this.effectiveAuthorizations()
      .filter(auth => auth.profile.id === profileId && !auth.isDefault);
      
    this.isProcessing.set(true);
    
    // Traiter les suppressions en séquence
    this.processDeleteRequests(profileAuths.map(auth => auth.authorization.id), 0, profileAuths.length);
  }
  
  private processDeleteRequests(authIds: string[], index: number, totalCount: number, onComplete?: () => void): void {
    if (index >= authIds.length) {
      // Toutes les suppressions ont été traitées
      if (totalCount > 0) {
        this.messageService.add({
          severity: 'success',
          summary: 'Groupe supprimé',
          detail: `Groupe supprimé avec succès`,
          life: 3000
        });
      }
      
      if (onComplete) {
        onComplete();
      } else {
        this.isProcessing.set(false);
      }
      return;
    }

    const authId = authIds[index];
    this.authService.deleteAuthorization(authId).subscribe({
      next: () => {
        // Passer à la suppression suivante
        this.processDeleteRequests(authIds, index + 1, totalCount, onComplete);
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur de suppression',
          detail: error.message || 'Impossible de supprimer le groupe',
          life: 4000
        });
        this.isProcessing.set(false);
      }
    });
  }
}