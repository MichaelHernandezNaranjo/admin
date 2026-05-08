import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../Services';

export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const requiredProfiles = route.data['profiles'] as string[];

  if (!requiredProfiles || requiredProfiles.length === 0) {
    return true;
  }

  const hasProfile = requiredProfiles.some(profile => authService.hasProfile(profile));

  if (hasProfile) {
    return true;
  }

  router.navigate(['/admin/unauthorized']);
  return false;
};
