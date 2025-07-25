import { Component, output, input, ChangeDetectionStrategy } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [ButtonModule, TooltipModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent {
  // Inputs pour personnaliser le header
  title = input<string>('Habilitations Prestations');
  buttonLabel = input<string>('Fermer');
  buttonIcon = input<string>('pi pi-times');
  tooltipText = input<string>('Fermer la fenêtre');
  showButton = input<boolean>(true);
  
  // Signal de sortie pour fermer la fenêtre
  closeWindow = output<void>();

  onClose(): void {
    this.closeWindow.emit();
  }
}