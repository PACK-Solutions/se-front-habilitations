import { bootstrapApplication } from '@angular/platform-browser';
import { provideZoneChangeDetection, provideExperimentalZonelessChangeDetection } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import { definePreset } from '@primeng/themes';
import Lara from '@primeng/themes/lara';
import { MessageService, ConfirmationService } from 'primeng/api';
import { AppComponent } from './app/app.component';

// 🎨 Configuration personnalisée du thème Lara avec couleurs blue pour SE-FRONT-HABILITATION
const LarabluePreset = definePreset(Lara, {
  semantic: {
    primary: {
      50: '{blue.50}',
      100: '{blue.100}',
      200: '{blue.200}',
      300: '{blue.300}',
      400: '{blue.400}',
      500: '{blue.500}',
      600: '{blue.600}',
      700: '{blue.700}',
      800: '{blue.800}',
      900: '{blue.900}',
      950: '{blue.950}'
    }
  }
});

bootstrapApplication(AppComponent, {
  providers: [
    // ⚙️ Performances - Configuration Zone.js moderne avec eventCoalescing
    provideZoneChangeDetection({ eventCoalescing: true }),
    
    // 🎨 Animations asynchrones
    provideAnimationsAsync(),
    
    // 💉 Services globaux PrimeNG
    MessageService,
    ConfirmationService,
    
    // 🎨 Configuration PrimeNG
    providePrimeNG({
      theme: {
        preset: LarabluePreset,
        options: {
          prefix: 'p',
          darkModeSelector: '.p-dark',
          cssLayer: false
        }
      }
    })
  ]
});