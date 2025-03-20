import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ResultService } from '../../features/result/_services/result.service';
import { filter, map, of, switchMap, tap } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const resultGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const resultService = inject(ResultService);
  const authService = inject(AuthService);

  const green = route.paramMap.get('green');
  console.log(green);

  if (green) {
    return true;
  }

  return authService.$user.pipe(
    filter((u) => u !== undefined),
    switchMap((user) => {
      if (!user) {
        router.navigate(['/signup']);
        return of(false);
      }
      return resultService.canProceedToResult(route.params['resultId']).pipe(
        map((data: any) => {
          if (data.Success) {
            return true;
          } else {
            router.navigate(['/result/confirm', route.params['resultId']], {
              state: { quizId: data.resultId },
            });
            return false;
          }
        })
      );
    })
  );
};
