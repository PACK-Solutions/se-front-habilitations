// Models pour la gestion des habilitations

export enum BusinessDomain {
  PRESTATIONS = 'prestations',
  RENTES = 'rentes', 
  DECES = 'deces'
}

export interface Manager {
  id: string;
  firstName: string;
  lastName: string;
  seIdentifier: string; // Identifiant SE
  login: string; // Identifiant/login (première lettre prénom + nom)
  email: string; // Adresse email
  createdDate: Date;
}

export interface AuthorizationProfile {
  id: string;
  name: string;
  description: string;
  maxAmount?: number; // Montant maximum autorisé (undefined = illimité)
  canCreate: boolean;
  canModify: boolean;
  canCancel: boolean;
  canView: boolean;
}

export interface ManagerAuthorization {
  id: string;
  managerId: string;
  profileId: string;
  businessDomain: BusinessDomain; // Nouveau : domaine métier concerné
  createdDate: Date;
  createdBy: string;
  modifiedDate?: Date;
  modifiedBy?: string;
  isActive: boolean;
}

export interface ManagerAuthorizationDetails {
  manager: Manager;
  authorization: ManagerAuthorization;
  profile: AuthorizationProfile;
}

export interface AuthorizationSummary {
  manager: Manager;
  authorizations: Array<{
    profile: AuthorizationProfile;
    authorization: ManagerAuthorization;
    isDefault?: boolean; // Indique si c'est une autorisation par défaut
  }>;
}

// Interfaces pour les opérations

export interface AuthorizationRequest {
  managerId: string;
  profileId: string;
}

export interface AuthorizationUpdateRequest {
  authorizationId: string;
  profileId: string;
}

export interface AuthorizationResponse {
  success: boolean;
  message?: string;
  authorization?: ManagerAuthorizationDetails;
}

// Types pour les filtres de recherche

export interface ManagerSearchFilters {
  searchTerm?: string; // Pour rechercher par nom, prénom ou identifiant SE
  isActive?: boolean;
  hasAuthorizations?: boolean;
  profileId?: string;
}

export interface AuthorizationSearchFilters {
  managerId?: string;
  profileId?: string;
  isActive?: boolean;
}

// Énumérations

export enum ProfileLevel {
  CONSULTATION = 'consultation',
  INTERMEDIATE = 'intermediate',
  INTERMEDIATE_PERO = 'intermediate_pero',
  ADVANCED = 'advanced',
  REFERENT = 'referent'
}

// Constantes métier

export const AUTHORIZATION_PROFILES: Record<ProfileLevel, AuthorizationProfile> = {
  [ProfileLevel.CONSULTATION]: {
    id: 'prof_consultation',
    name: 'Consultation',
    description: 'Consultation seule - Accès lecture uniquement',
    maxAmount: undefined,
    canCreate: false,
    canModify: false,
    canCancel: false,
    canView: true
  },
  [ProfileLevel.INTERMEDIATE]: {
    id: 'prof_intermediate',
    name: 'Intermédiaire',
    description: 'Saisie autorisée jusqu\'à 20.000€ brut',
    maxAmount: 20000,
    canCreate: true,
    canModify: true,
    canCancel: true,
    canView: true
  },
  [ProfileLevel.INTERMEDIATE_PERO]: {
    id: 'prof_intermediate_pero',
    name: 'Intermédiaire PERO',
    description: 'Saisie autorisée jusqu\'à 20.000€ brut',
    maxAmount: 20000,
    canCreate: true,
    canModify: true,
    canCancel: true,
    canView: true
  },
  [ProfileLevel.ADVANCED]: {
    id: 'prof_advanced',
    name: 'Avancé',
    description: 'Saisie autorisée jusqu\'à 100.000€ brut',
    maxAmount: 100000,
    canCreate: true,
    canModify: true,
    canCancel: true,
    canView: true
  },
  [ProfileLevel.REFERENT]: {
    id: 'prof_referent',
    name: 'Référent',
    description: 'Toutes les saisies de prestation autorisées',
    maxAmount: undefined,
    canCreate: true,
    canModify: true,
    canCancel: true,
    canView: true
  }
};

// Interface pour les éléments d'autorisation effectifs
export interface EffectiveAuthorizationItem {
  authorization: ManagerAuthorization;
  profile: AuthorizationProfile;
  isDefault?: boolean;
}
