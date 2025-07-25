import { Component, input, inject, ChangeDetectionStrategy } from '@angular/core';
import { AuthorizationService } from '../../services/authorization.service';
import { Manager } from '../../models/authorization.model';

@Component({
  selector: 'app-manager-details-header',
  standalone: true,
  imports: [],
  templateUrl: './manager-details-header.component.html',
  styleUrl: './manager-details-header.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ManagerDetailsHeaderComponent {
  // Injection de services
  public authService = inject(AuthorizationService);

  // Input
  manager = input.required<Manager>();
}