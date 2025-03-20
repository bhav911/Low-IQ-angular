import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map } from 'rxjs';

export const passwordTokenGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  const token = route.paramMap.get('token');

  if (!token) {
    return router.createUrlTree(['/home']);
  }

  return authService.validatePasswordResetToken(token).pipe(
    map((userId: any) => {
      if (userId) {
        route.data = { ...route.data, userId };
        return true;
      } else {
        route.data = { ...route.data, failedValidation: true };
      }
      return router.createUrlTree(['/home']);
    })
  );
};
