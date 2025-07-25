import { Component, OnInit, OnDestroy, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { Subject } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { HeaderComponent } from '../header/header.component';
import { ManagerSearchComponent } from '../manager-search/manager-search.component';
import { AuthorizationManagementComponent } from '../authorization-management/authorization-management.component';
import { AuthorizationService } from '../../services/authorization.service';
import { Manager } from '../../models/authorization.model';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DividerModule } from 'primeng/divider';

@Component({
  selector: 'app-authorization-window',
  standalone: true,
  imports: [
    ButtonModule,
    HeaderComponent,
    ManagerSearchComponent,
    AuthorizationManagementComponent,
    ToastModule,
    ConfirmDialogModule,
    DividerModule
  ],
  templateUrl: './authorization-window.component.html',
  styleUrl: './authorization-window.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuthorizationWindowComponent implements OnInit, OnDestroy {
  // Injection de services
  private authService = inject(AuthorizationService);

  // Signals pour l'état du composant
  private selectedManager = signal<Manager | null>(null);
  private showManagement = signal<boolean>(false);

  // Gestion des subscriptions
  private destroy$ = new Subject<void>();

  // Computed signals
  get currentManager(): Manager | null {
    return this.selectedManager();
  }

  get shouldShowManagement(): boolean {
    return this.showManagement();
  }

  ngOnInit(): void {
    // Initialisation si nécessaire
    this.authService.setLoadingState(false);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.authService.clearManagerSelection();
  }

  onManagerSelected(manager: Manager): void {
    this.selectedManager.set(manager);
    this.authService.selectManager(manager);
    this.showManagement.set(true);
  }

  onBackToSearch(): void {
    this.selectedManager.set(null);
    this.authService.clearManagerSelection();
    this.showManagement.set(false);
  }

  /**
   * TODO: INTEGRATION - POINT CRITIQUE
   * ================================
   * Cette méthode doit être adaptée selon le mode d'intégration :
   * 
   * 1. Si l'app est dans une iframe :
   *    window.parent.postMessage({ action: 'close' }, '*');
   * 
   * 2. Si l'app est une route de l'application principale :
   *    this.router.navigate(['/dashboard']) ou window.history.back();
   * 
   * 3. Si l'app est un modal/dialog :
   *    this.dialogRef.close() ou émettre un événement de fermeture
   * 
   * 4. Si l'app est une micro-frontend :
   *    Émettre un événement personnalisé ou appeler une fonction de callback
   */
  onCloseWindow(): void {
    // Implémenter la logique de fermeture selon le contexte d'intégration
  }
}