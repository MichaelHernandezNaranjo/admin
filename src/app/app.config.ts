import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';
import { definePreset } from '@primeng/themes';
import { routes } from './app.routes';
import { authInterceptor } from './Core/Interceptors';

const AppPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50:  '#fef2f2',  100: '#fee2e2', 200: '#fecaca', 300: '#fca5a5',
      400: '#f87171',  500: '#ef4444', 600: '#dc2626', 700: '#b91c1c',
      800: '#991b1b',  900: '#7f1d1d', 950: '#450a0a'
    },
    focusRing: { width: '2px', style: 'solid', color: '{primary.500}', offset: '0px' }
  }
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimations(),
    providePrimeNG({
      theme: {
        preset: AppPreset,
        options: { prefix: 'p', darkModeSelector: false, cssLayer: false }
      }
    })
  ]
};
