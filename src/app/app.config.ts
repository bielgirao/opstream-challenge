import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { mockBackendInterceptor } from './core/mock-backend';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // The mock backend answers /api/* in the browser; remove it to talk to a real server.
    provideHttpClient(withFetch(), withInterceptors([mockBackendInterceptor])),
  ],
};
