import { Component, ChangeDetectionStrategy } from '@angular/core';
import { AuthorizationWindowComponent } from './components/authorization-window/authorization-window.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [AuthorizationWindowComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
}