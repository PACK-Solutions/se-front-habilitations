import { Component, input, output, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService } from 'primeng/api';
import { AuthorizationService } from '../../services/authorization.service';
import { 
  AuthorizationProfile, 
  EffectiveAuthorizationItem
} from '../../models/authorization.model';

interface GroupedAuthorization {
  profile: AuthorizationProfile;
  authorizations: EffectiveAuthorizationItem[];
  isDefault: boolean;
}

@Component({
  selector: 'app-authorization-list-display',
  standalone: true,
  imports: [
    FormsModule,
    ButtonModule,
    TagModule,
    TooltipModule,
  ],
  templateUrl: './authorization-list-display.component.html',
  styleUrl: './authorization-list-display.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuthorizationListDisplayComponent {
  // Injection de services
  public authService = inject(AuthorizationService);
  private confirmationService = inject(ConfirmationService);

  // Inputs
  groupedAuthorizations = input<GroupedAuthorization[]>([]);
  effectiveAuthorizations = input<EffectiveAuthorizationItem[]>([]);
  isLoading = input<boolean>(false);
  hasExplicitAuthorizations = input<boolean>(false);

  // Outputs
  deleteProfileHabilitations = output<{
    profileId: string;
    profileName: string;
  }>();

  // Méthodes
  onDeleteProfileHabilitations(profileId: string, profileName: string): void {
    this.confirmationService.confirm({
      message: `Êtes-vous sûr de vouloir supprimer l'habilitation du groupe "${profileName}" ?`,
      header: 'Confirmer la suppression du groupe',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Supprimer',
      rejectLabel: 'Annuler',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text p-button-secondary',
      accept: () => {
        this.deleteProfileHabilitations.emit({
          profileId,
          profileName
        });
      }
    });
  }

  // Méthodes utilitaires
  getProfileSeverity(profile: AuthorizationProfile): "success" | "info" | "warning" | "danger" | "secondary" | "contrast" | undefined {
    return this.authService.getProfileSeverity(profile);
  }

  formatProfileDescription(profile: AuthorizationProfile): string {
    return this.authService.getDynamicProfileDescription(profile);
  }
}