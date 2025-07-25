# SE-FRONT-HABILITATION
test bolt

## 📋 Description

**SE-FRONT-HABILITATION** - Application Angular standalone moderne pour la gestion des habilitations des gestionnaires par fiscalité. Cette application permet aux administrateurs de rechercher des gestionnaires et de gérer leurs autorisations pour différentes fiscalités avec des niveaux de profils spécifiques.

## 🏗️ Architecture

### Structure du projet
```
src/
├── app/
│   ├── components/           # Composants UI
│   │   ├── authorization-window/     # Composant principal
│   │   ├── header/                   # En-tête d'application
│   │   ├── manager-search/           # Recherche de gestionnaire
│   │   └── authorization-management/ # Gestion des autorisations
│   ├── models/              # Modèles de données
│   ├── services/            # Services métier
│   └── app.component.ts     # Composant racine
├── global_styles.css        # Styles globaux avec thème PrimeNG
└── main.ts                 # Point d'entrée avec configuration moderne
```

### Composants clés

- **AuthorizationWindowComponent** : Composant principal orchestrant l'affichage
- **ManagerSearchComponent** : Recherche et sélection des gestionnaires
- **AuthorizationManagementComponent** : Gestion des autorisations par fiscalité
- **AuthorizationService** : Service métier pour les opérations d'habilitation

## 🚀 Technologies utilisées

- **Angular 19** (standalone components)
- **PrimeNG 19** (composants UI)
- **RxJS** (gestion des flux de données)
- **TypeScript** (typage fort)
- **CSS modernes** (variables CSS, grid, flexbox)

### Patterns modernes Angular

- ✅ **Signals** pour la gestion d'état réactive
- ✅ **Standalone components** (pas de NgModules)
- ✅ **inject()** pour l'injection de dépendance
- ✅ **OnPush** change detection strategy
- ✅ **Nouveaux blocs de contrôle** (@if, @for, @switch)

## 🔧 Installation et développement

```bash
# Installation des dépendances
npm install

# Démarrage en mode développement
npm start

# Build de production
npm run build
```

## 🎯 Fonctionnalités

### Recherche de gestionnaires
- ✅ Recherche par nom, prénom, email ou identifiant SE
- ✅ Affichage des informations détaillées
- ✅ Filtrage en temps réel
- ✅ Gestion des états (actif/inactif)

### Gestion des autorisations
- ✅ Création d'autorisations par fiscalité
- ✅ Modification des niveaux de profil
- ✅ Suppression d'autorisations
- ✅ Visualisation des autorisations existantes

### Profils d'autorisation
- ✅ **Consultation** : Accès lecture seule
- ✅ **Intermédiaire** : Saisie jusqu'à 20.000€
- ✅ **Avancé** : Saisie jusqu'à 100.000€
- ✅ **Référent** : Toutes les saisies autorisées

### Fiscalités supportées
- ✅ PERP, PERIN, Article 83, Article 39 Pacte, Article 39, IFC

## 🔒 Règles métier

### Conditions d'autorisation
1. Un gestionnaire peut avoir une autorisation par fiscalité
2. Les montants sont vérifiés selon le profil assigné
3. Comportement par défaut : tous les droits ouverts si aucune autorisation

### Niveaux de profil
- **Consultation** : Visualisation uniquement
- **Intermédiaire** : Saisie ≤ 20.000€, interdite > 20.000€
- **Avancé** : Saisie ≤ 100.000€, interdite > 100.000€
- **Référent** : Toutes saisies autorisées

## 🔗 Points d'intégration requis

> ⚠️ **IMPORTANT** : Cette application contient des données mockées à des fins de démonstration. 
> Les développeurs doivent remplacer ces mocks par de vrais appels API.

### 1. Service Authorization (`src/app/services/authorization.service.ts`)

**Points critiques à modifier :**

#### `searchManagers()` - Ligne ~134
```typescript
// TODO: INTEGRATION - REMPLACER
return this.http.get<Manager[]>(`/api/managers/search`, { params })
```

#### `createAuthorization()` - Ligne ~195
```typescript
// TODO: INTEGRATION - REMPLACER
return this.http.post<AuthorizationResponse>(`/api/authorizations`, requestData)
```

#### `updateAuthorization()` - Ligne ~240
```typescript
// TODO: INTEGRATION - REMPLACER
return this.http.put<AuthorizationResponse>(`/api/authorizations/${id}`, requestData)
```

#### `deleteAuthorization()` - Ligne ~280
```typescript
// TODO: INTEGRATION - REMPLACER
return this.http.delete<AuthorizationResponse>(`/api/authorizations/${id}`)
```

### 2. Composant principal (`src/app/components/authorization-window/authorization-window.component.ts`)

**Gestion de la fermeture - Ligne ~95 :**
```typescript
// TODO: INTEGRATION - ADAPTER selon le contexte (iframe, route, modal...)
window.parent.postMessage({ action: 'close' }, '*'); // pour iframe
// ou this.router.navigate(['/dashboard']); // pour routing
```

### 3. Modèles de données (`src/app/models/authorization.model.ts`)

- Adapter les interfaces selon la structure des API réelles
- Ajouter les propriétés manquantes selon les besoins métier

## 🎨 Design et UX

### Thème
- **PrimeNG Lara** avec couleurs blue
- **Variables CSS** pour la cohérence
- **Google Fonts Inter** pour la typographie

### Responsive design
- **Mobile-first** approach
- **Breakpoints** : 480px, 768px, 1024px
- **Layout adaptatif** (grid → column)

### Accessibilité
- **Sémantique HTML** appropriée
- **ARIA labels** et descriptions
- **Focus management** pour clavier
- **Contrast ratios** conformes WCAG

## 🧪 Tests et validation

### Scénarios de test
1. **Recherche de gestionnaire** avec différents critères
2. **Création d'autorisation** avec validation
3. **Modification de profil** d'autorisation
4. **Suppression d'autorisation** avec confirmation
5. **Gestion des erreurs** réseau/API

### Données de test
- Modifier les données mockées dans `authorization.service.ts`
- Tester différents profils et fiscalités
- Vérifier les validations métier

## 📱 Intégration dans l'application parent

### Options d'intégration

1. **Route Angular** dans l'application principale
2. **Iframe** avec communication postMessage  
3. **Modal/Dialog** avec injection de données
4. **Micro-frontend** avec événements personnalisés

### Communication avec le parent
- **Fermeture** : Signaler la fermeture de l'interface
- **Notifications** : Succès/erreurs d'autorisation
- **Navigation** : Retour vers l'écran approprié

## 🐛 Support et maintenance

### Logs et monitoring
- Console logs pour le debugging
- Messages d'erreur utilisateur explicites
- Gestion des cas d'erreur réseau

### Performance
- **OnPush** change detection
- **Signals** pour la réactivité optimisée
- **Filtrage intelligent** des résultats

---

## 📞 Contact

Pour toute question sur l'intégration ou les adaptations nécessaires, consulter les commentaires `TODO: INTEGRATION` dans le code source.