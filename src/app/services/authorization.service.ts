import { Injectable, signal, computed } from '@angular/core';
import { forkJoin } from 'rxjs';
import { 
  Manager, 
  AuthorizationProfile, 
  ManagerAuthorization, 
  ManagerAuthorizationDetails, 
  AuthorizationSummary,
  AuthorizationRequest,
  AuthorizationUpdateRequest,
  AuthorizationResponse,
  ManagerSearchFilters,
  BusinessDomain,
  AUTHORIZATION_PROFILES,
  ProfileLevel,
  EffectiveAuthorizationItem
} from '../models/authorization.model';
import { Observable, of, delay, throwError } from 'rxjs';
import { tap, takeUntil, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthorizationService {
  // Signals pour l'état de l'application
  private managers = signal<Manager[]>([]);
  private authorizations = signal<ManagerAuthorization[]>([]);
  private selectedManager = signal<Manager | null>(null);
  private isLoading = signal<boolean>(false);
  private searchTerm = signal<string>('');

  // Computed signals
  readonly allManagers = this.managers.asReadonly();
  readonly allAuthorizations = this.authorizations.asReadonly();
  readonly currentManager = this.selectedManager.asReadonly();
  readonly loading = this.isLoading.asReadonly();
  readonly currentSearchTerm = this.searchTerm.asReadonly();

  // Computed pour les managers filtrés
  readonly filteredManagers = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.managers();
    
    return this.managers().filter(manager =>
      manager.firstName.toLowerCase().includes(term) ||
      manager.lastName.toLowerCase().includes(term) ||
      manager.seIdentifier.toLowerCase().includes(term) ||
      manager.login.toLowerCase().includes(term) ||
      manager.email.toLowerCase().includes(term)
    );
  });

  // Computed pour les autorisations du manager sélectionné
  readonly currentManagerAuthorizations = computed(() => {
    const manager = this.selectedManager();
    if (!manager) return [];

    // Filtrer uniquement les autorisations pour les Prestations
    return this.authorizations().filter(auth => 
      auth.managerId === manager.id && 
      auth.isActive &&
      auth.businessDomain === BusinessDomain.PRESTATIONS
    );
  });

  // Computed pour les autorisations effectives (explicites + par défaut)
  readonly effectiveManagerAuthorizations = computed(() => {
    const manager = this.selectedManager();
    if (!manager) return [];

    const explicitAuths = this.currentManagerAuthorizations();
    const consultationProfile = this.getConsultationProfile();
    
    if (explicitAuths.length > 0) {
      // Il y a des autorisations explicites
      return explicitAuths.map(auth => ({
        authorization: auth,
        profile: this.getProfileById(auth.profileId),
        isDefault: false
      }));
    } else {
      // Aucune autorisation explicite, utiliser Consultation par défaut
      const defaultAuth: ManagerAuthorization = {
        id: `default_${manager.id}`,
        managerId: manager.id,
        profileId: consultationProfile.id,
        businessDomain: BusinessDomain.PRESTATIONS,
        createdDate: new Date(),
        createdBy: 'system_default',
        isActive: true
      };
      
      return [{
        authorization: defaultAuth,
        profile: consultationProfile,
        isDefault: true
      }];
    }
  });

  // Computed pour le résumé d'autorisation du manager sélectionné
  readonly currentManagerSummary = computed((): AuthorizationSummary | null => {
    const manager = this.selectedManager();
    if (!manager) return null;

    const effectiveAuths = this.effectiveManagerAuthorizations();
    const authorizations = effectiveAuths.map(auth => ({
      authorization: auth.authorization,
      profile: auth.profile,
      isDefault: auth.isDefault
    }));

    return {
      manager,
      authorizations
    };
  });

  constructor() {
    this.initializeMockData();
  }

  // Initialisation des données mockées
  private initializeMockData(): void {
    // Managers mockés
    const mockManagers: Manager[] = [
      {
        id: 'mgr_001',
        firstName: 'Marie',
        lastName: 'Dupont',
        seIdentifier: 'SE001',
        login: 'mdupont',
        email: 'mdupont@pack-solutions.com',
        createdDate: new Date('2023-01-15'),
      },
      {
        id: 'mgr_002',
        firstName: 'Jean',
        lastName: 'Martin',
        seIdentifier: 'SE002',
        login: 'jmartin',
        email: 'jmartin@pack-solutions.com',
        createdDate: new Date('2023-02-10'),
      },
      {
        id: 'mgr_003',
        firstName: 'Sophie',
        lastName: 'Bernard',
        seIdentifier: 'SE003',
        login: 'sbernard',
        email: 'sbernard@pack-solutions.com',
        createdDate: new Date('2023-03-20'),
      },
      {
        id: 'mgr_004',
        firstName: 'Pierre',
        lastName: 'Dubois',
        seIdentifier: 'SE004',
        login: 'pdubois',
        email: 'pdubois@pack-solutions.com',
        createdDate: new Date('2023-04-05'),
      },
      {
        id: 'mgr_005',
        firstName: 'Catherine',
        lastName: 'Moreau',
        seIdentifier: 'SE005',
        login: 'cmoreau',
        email: 'cmoreau@pack-solutions.com',
        createdDate: new Date('2023-05-12'),
      },
      {
        id: 'mgr_006',
        firstName: 'David',
        lastName: 'Leroy',
        seIdentifier: 'SE006',
        login: 'dleroy',
        email: 'dleroy@pack-solutions.com',
        createdDate: new Date('2023-06-20'),
      },
      {
        id: 'mgr_007',
        firstName: 'Nathalie',
        lastName: 'Petit',
        seIdentifier: 'SE007',
        login: 'npetit',
        email: 'npetit@pack-solutions.com',
        createdDate: new Date('2023-07-15'),
      },
      {
        id: 'mgr_008',
        firstName: 'Laurent',
        lastName: 'Roux',
        seIdentifier: 'SE008',
        login: 'lroux',
        email: 'lroux@pack-solutions.com',
        createdDate: new Date('2023-08-10'),
      },
      {
        id: 'mgr_009',
        firstName: 'Isabelle',
        lastName: 'Fontaine',
        seIdentifier: 'SE009',
        login: 'ifontaine',
        email: 'ifontaine@pack-solutions.com',
        createdDate: new Date('2023-09-05'),
      },
      {
        id: 'mgr_010',
        firstName: 'Thomas',
        lastName: 'Garnier',
        seIdentifier: 'SE010',
        login: 'tgarnier',
        email: 'tgarnier@pack-solutions.com',
        createdDate: new Date('2023-10-12'),
      }
    ];

    // Autorisations mockées
    const mockAuthorizations: ManagerAuthorization[] = [
      {
        id: 'auth_001',
        managerId: 'mgr_001',
        profileId: 'prof_intermediate',
        businessDomain: BusinessDomain.PRESTATIONS,
        createdDate: new Date('2023-01-20'),
        createdBy: 'admin_001',
        isActive: true
      },
      {
        id: 'auth_002',
        managerId: 'mgr_002',
        profileId: 'prof_referent',
        businessDomain: BusinessDomain.PRESTATIONS,
        createdDate: new Date('2023-02-20'),
        createdBy: 'admin_001',
        isActive: true
      },
      {
        id: 'auth_003',
        managerId: 'mgr_003',
        profileId: 'prof_advanced',
        businessDomain: BusinessDomain.PRESTATIONS,
        createdDate: new Date('2023-03-25'),
        createdBy: 'admin_001',
        isActive: true
      }
    ];

    this.managers.set(mockManagers);
    this.authorizations.set(mockAuthorizations);
  }

  // Méthodes de recherche
  searchManagers(filters: ManagerSearchFilters): Observable<Manager[]> {
    this.isLoading.set(true);
    
    return of(this.filteredManagers()).pipe(
      delay(300),
      tap(() => this.isLoading.set(false))
    );
  }

  updateSearchTerm(term: string): void {
    this.searchTerm.set(term);
  }

  selectManager(manager: Manager): void {
    this.selectedManager.set(manager);
  }

  clearManagerSelection(): void {
    this.selectedManager.set(null);
  }

  // Méthodes de gestion des autorisations
  createAuthorization(request: AuthorizationRequest): Observable<AuthorizationResponse> {
    this.isLoading.set(true);

    // Vérifier si une autorisation active existe déjà pour ce gestionnaire ET ce profil spécifique
    const existingAuth = this.authorizations().find(auth => 
      auth.managerId === request.managerId && 
      auth.profileId === request.profileId &&
      auth.isActive &&
      auth.businessDomain === BusinessDomain.PRESTATIONS
    );

    let wasReassigned = false;
    
    if (existingAuth) {
      // Si le même profil existe déjà, ne pas créer de doublon
      this.isLoading.set(false);
      return throwError(() => new Error(`Le gestionnaire possède déjà le groupe "${this.getProfileById(request.profileId).name}"`));
    }

    // Créer la nouvelle autorisation
    const newAuth: ManagerAuthorization = {
      id: `auth_${Date.now()}`,
      managerId: request.managerId,
      profileId: request.profileId,
      businessDomain: BusinessDomain.PRESTATIONS,
      createdDate: new Date(),
      createdBy: 'admin_current',
      isActive: true
    };

    const newAuthorizations = [...this.authorizations(), newAuth];
    this.authorizations.set(newAuthorizations);

    const successMessage = 'Groupe affecté avec succès';

    return of({
      success: true,
      message: successMessage,
      authorization: {
        manager: this.getManagerById(request.managerId),
        authorization: newAuth,
        profile: this.getProfileById(request.profileId)
      }
    }).pipe(
      delay(500),
      tap(() => this.isLoading.set(false))
    );
  }

  updateAuthorization(request: AuthorizationUpdateRequest): Observable<AuthorizationResponse> {
    this.isLoading.set(true);

    const authIndex = this.authorizations().findIndex(auth => auth.id === request.authorizationId);
    if (authIndex === -1) {
      this.isLoading.set(false);
      return throwError(() => new Error('Groupe non trouvé'));
    }

    const updatedAuth = {
      ...this.authorizations()[authIndex],
      profileId: request.profileId,
      modifiedDate: new Date(), 
      modifiedBy: 'admin_current'
    };

    const newAuthorizations = [...this.authorizations()];
    newAuthorizations[authIndex] = updatedAuth;
    this.authorizations.set(newAuthorizations);
    
    return of({
      success: true,
      message: 'Groupe mis à jour avec succès',
      authorization: {
        manager: this.getManagerById(updatedAuth.managerId),
        authorization: updatedAuth,
        profile: this.getProfileById(updatedAuth.profileId)
      }
    }).pipe(
      delay(500),
      tap(() => this.isLoading.set(false))
    );
  }

  deleteAuthorization(authorizationId: string): Observable<AuthorizationResponse> {
    this.isLoading.set(true);

    const authIndex = this.authorizations().findIndex(auth => auth.id === authorizationId);
    if (authIndex === -1) {
      this.isLoading.set(false);
      return throwError(() => new Error('Groupe non trouvé'));
    }

    const updatedAuth = {
      ...this.authorizations()[authIndex],
      isActive: false,
      modifiedDate: new Date(), 
      modifiedBy: 'admin_current'
    };

    const newAuthorizations = [...this.authorizations()];
    newAuthorizations[authIndex] = updatedAuth;
    this.authorizations.set(newAuthorizations);
    
    return of({
      success: true,
      message: 'Groupe supprimé avec succès'
    }).pipe(
      delay(500),
      tap(() => this.isLoading.set(false))
    );
  }

  // Méthodes utilitaires
  getManagerById(managerId: string): Manager {
    const manager = this.managers().find(manager => manager.id === managerId);
    if (!manager) {
      throw new Error(`Manager avec l'ID ${managerId} non trouvé`);
    }
    return manager;
  }

  isExclusiveProfile(profileId: string): boolean {
    return profileId === 'prof_consultation' || profileId === 'prof_referent';
  }

  processAuthorizationAssignment(managerId: string, profilesToAssign: AuthorizationProfile[]): Observable<AuthorizationResponse> {
    this.isLoading.set(true);

    // Récupérer les autorisations explicites actuelles (non par défaut)
    const currentExplicitAuths = this.authorizations().filter(auth => 
      auth.managerId === managerId && 
      auth.isActive &&
      auth.businessDomain === BusinessDomain.PRESTATIONS
    );

    // Identifier les profils exclusifs dans l'affectation
    const exclusiveProfilesToAssign = profilesToAssign.filter(p => this.isExclusiveProfile(p.id));
    const nonExclusiveProfilesToAssign = profilesToAssign.filter(p => !this.isExclusiveProfile(p.id));

    // Identifier les profils exclusifs actuels
    const currentExclusiveAuths = currentExplicitAuths.filter(auth => this.isExclusiveProfile(auth.profileId));
    const currentNonExclusiveAuths = currentExplicitAuths.filter(auth => !this.isExclusiveProfile(auth.profileId));

    let authsToDelete: string[] = [];
    let profilesToCreate: AuthorizationProfile[] = [];

    // Logique de réaffectation
    if (exclusiveProfilesToAssign.length > 0) {
      // On affecte un profil exclusif -> supprimer TOUTES les autorisations existantes
      authsToDelete = currentExplicitAuths.map(auth => auth.id);
      profilesToCreate = exclusiveProfilesToAssign; // Seul le profil exclusif sera créé
    } else {
      // On affecte des profils non-exclusifs
      if (currentExclusiveAuths.length > 0) {
        // Le gestionnaire a un profil exclusif -> le supprimer
        authsToDelete = currentExclusiveAuths.map(auth => auth.id);
      }
      
      // Filtrer les profils à créer pour éviter les doublons
      const currentNonExclusiveProfileIds = new Set(currentNonExclusiveAuths.map(auth => auth.profileId));
      profilesToCreate = nonExclusiveProfilesToAssign.filter(p => !currentNonExclusiveProfileIds.has(p.id));
    }

    // Vérifier qu'il y a au moins une action à effectuer
    if (authsToDelete.length === 0 && profilesToCreate.length === 0) {
      this.isLoading.set(false);
      return throwError(() => new Error('Aucune modification nécessaire - les groupes sélectionnés sont déjà affectés'));
    }

    // Exécuter les suppressions puis les créations
    const deleteObservables = authsToDelete.map(authId => 
      this.deleteAuthorizationInternal(authId)
    );

    const createObservables = profilesToCreate.map(profile => 
      this.createAuthorizationInternal({ managerId, profileId: profile.id })
    );

    // Exécuter toutes les opérations
    const allOperations = [...deleteObservables, ...createObservables];
    
    if (allOperations.length === 0) {
      this.isLoading.set(false);
      return of({
        success: true,
        message: 'Aucune modification nécessaire'
      });
    }

    return forkJoin(allOperations).pipe(
      map((results: AuthorizationResponse[]) => {
        // Transformer le tableau de résultats en une seule réponse
        const deletedCount = authsToDelete.length;
        const createdCount = profilesToCreate.length;
        
        let message: string;
        if (deletedCount > 0 && createdCount > 0) {
          message = `${deletedCount} groupe(s) supprimé(s) et ${createdCount} groupe(s) affecté(s) avec succès`;
        } else if (createdCount > 0) {
          message = `${createdCount} groupe(s) affecté(s) avec succès`;
        } else {
          message = `${deletedCount} groupe(s) supprimé(s) avec succès`;
        }
        
        return {
          success: true,
          message: message
        };
      }),
      delay(500),
      tap(() => {
        this.isLoading.set(false);
        // Forcer la réévaluation des autorisations effectives
        const manager = this.selectedManager();
        if (manager) {
          this.selectManager(manager);
        }
      })
    );
  }

  private createAuthorizationInternal(request: AuthorizationRequest): Observable<AuthorizationResponse> {
    // Version interne sans loading et sans vérification de doublons
    const newAuth: ManagerAuthorization = {
      id: `auth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      managerId: request.managerId,
      profileId: request.profileId,
      businessDomain: BusinessDomain.PRESTATIONS,
      createdDate: new Date(),
      createdBy: 'admin_current',
      isActive: true
    };

    const newAuthorizations = [...this.authorizations(), newAuth];
    this.authorizations.set(newAuthorizations);

    return of({
      success: true,
      message: 'Groupe créé',
      authorization: {
        manager: this.getManagerById(request.managerId),
        authorization: newAuth,
        profile: this.getProfileById(request.profileId)
      }
    });
  }

  private deleteAuthorizationInternal(authorizationId: string): Observable<AuthorizationResponse> {
    // Version interne sans loading
    const authIndex = this.authorizations().findIndex(auth => auth.id === authorizationId);
    if (authIndex === -1) {
      return throwError(() => new Error('Groupe non trouvé'));
    }

    const updatedAuth = {
      ...this.authorizations()[authIndex],
      isActive: false,
      modifiedDate: new Date(), 
      modifiedBy: 'admin_current'
    };

    const newAuthorizations = [...this.authorizations()];
    newAuthorizations[authIndex] = updatedAuth;
    this.authorizations.set(newAuthorizations);
    
    return of({
      success: true,
      message: 'Groupe supprimé'
    });
  }

  getDynamicProfiles(): AuthorizationProfile[] {
    // Lire les montants depuis localStorage
    const savedAdvanced = localStorage.getItem('group-advanced-amount');
    const savedIntermediate = localStorage.getItem('group-intermediate-amount');
    const savedIntermediatePERO = localStorage.getItem('group-intermediate-pero-amount');
    
    const advancedAmount = savedAdvanced ? this.parseAmount(savedAdvanced) : 100000;
    const intermediateAmount = savedIntermediate ? this.parseAmount(savedIntermediate) : 20000;
    const intermediatePEROAmount = savedIntermediatePERO ? this.parseAmount(savedIntermediatePERO) : 20000;
    
    // Retourner les profils avec les montants mis à jour
    return [
      AUTHORIZATION_PROFILES[ProfileLevel.CONSULTATION],
      {
        ...AUTHORIZATION_PROFILES[ProfileLevel.INTERMEDIATE],
        maxAmount: intermediateAmount,
        description: `Saisie autorisée jusqu'à ${this.formatAmount(intermediateAmount)} brut`
      },
      {
        ...AUTHORIZATION_PROFILES[ProfileLevel.INTERMEDIATE_PERO],
        maxAmount: intermediatePEROAmount,
        description: `Saisie autorisée jusqu'à ${this.formatAmount(intermediatePEROAmount)} brut`
      },
      {
        ...AUTHORIZATION_PROFILES[ProfileLevel.ADVANCED],
        maxAmount: advancedAmount,
        description: `Saisie autorisée jusqu'à ${this.formatAmount(advancedAmount)} brut`
      },
      AUTHORIZATION_PROFILES[ProfileLevel.REFERENT]
    ];
  }

  getProfileById(profileId: string): AuthorizationProfile {
    const profile = this.getDynamicProfiles().find(profile => profile.id === profileId);
    if (!profile) {
      throw new Error(`Profil avec l'ID ${profileId} non trouvé`);
    }
    return profile;
  }

  getAllProfiles(): AuthorizationProfile[] {
    return this.getDynamicProfiles();
  }

  getConsultationProfile(): AuthorizationProfile {
    return AUTHORIZATION_PROFILES[ProfileLevel.CONSULTATION];
  }

  // Méthodes de formatage
  formatManagerName(manager: Manager): string {
    return `${manager.firstName} ${manager.lastName}`;
  }

  formatManagerDetails(manager: Manager): string {
    return `${this.formatManagerName(manager)} (${manager.seIdentifier})`;
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  formatDateTime(date: Date): string {
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Méthodes de validation métier
  canManagerCreatePrestation(managerId: string, amount: number): boolean {
    const auth = this.authorizations().find(auth => 
      auth.managerId === managerId && 
      auth.isActive &&
      auth.businessDomain === BusinessDomain.PRESTATIONS
    );
    
    if (!auth) return true; // Comportement par défaut : consultation seule
    
    const profile = this.getProfileById(auth.profileId);
    
    if (!profile.canCreate) return false;
    if (profile.maxAmount && amount > profile.maxAmount) return false;
    
    return true;
  }

  setLoadingState(loading: boolean): void {
    this.isLoading.set(loading);
  }

  // Méthodes pour gérer les domaines métier
  getCurrentBusinessDomain(): BusinessDomain {
    return BusinessDomain.PRESTATIONS; // Pour cette version, toujours Prestations
  }
  
  getBusinessDomainLabel(domain: BusinessDomain): string {
    switch (domain) {
      case BusinessDomain.PRESTATIONS:
        return 'Prestations';
      case BusinessDomain.RENTES:
        return 'Rentes';
      case BusinessDomain.DECES:
        return 'Décès';
      default:
        return 'Inconnu';
    }
  }

  parseAmount(value: string): number {
    // Supprimer tous les caractères non numériques sauf le point et la virgule
    const cleanValue = value.replace(/[^\d.,]/g, '');
    
    // Remplacer la virgule par un point pour la conversion
    const normalizedValue = cleanValue.replace(',', '.');
    
    // Convertir en nombre
    const amount = parseFloat(normalizedValue);
    
    // Retourner 0 si la conversion échoue
    return isNaN(amount) ? 0 : amount;
  }

  getProfileSeverity(profile: AuthorizationProfile): "success" | "info" | "warning" | "danger" | "secondary" | "contrast" | undefined {
    // Traitement spécial pour le profil Consultation
    if (profile.id === 'prof_consultation') return 'info';
    
    // Autres profils sans création
    if (!profile.canCreate) return 'secondary';
    
    // Profils avec montant illimité (Référent)
    if (!profile.maxAmount) return 'success';
    
    // Profils avec montant limité
    if (profile.maxAmount <= 20000) return 'warning';
    return 'info';
  }

  getDynamicProfileDescription(profile: AuthorizationProfile): string {
    // Pour les profils avec montant, utiliser les valeurs dynamiques
    if (profile.id === 'prof_intermediate') {
      const savedAmount = localStorage.getItem('group-intermediate-amount');
      const amount = savedAmount ? this.parseAmount(savedAmount) : 20000;
      return `Saisie autorisée jusqu'à ${this.formatAmount(amount)} brut`;
    }
    
    if (profile.id === 'prof_intermediate_pero') {
      const savedAmount = localStorage.getItem('group-intermediate-pero-amount');
      const amount = savedAmount ? this.parseAmount(savedAmount) : 20000;
      return `Saisie autorisée jusqu'à ${this.formatAmount(amount)} brut`;
    }
    
    if (profile.id === 'prof_advanced') {
      const savedAmount = localStorage.getItem('group-advanced-amount');
      const amount = savedAmount ? this.parseAmount(savedAmount) : 100000;
      return `Saisie autorisée jusqu'à ${this.formatAmount(amount)} brut`;
    }
    
    // Pour les autres profils, utiliser la description statique
    return profile.description;
  }
}