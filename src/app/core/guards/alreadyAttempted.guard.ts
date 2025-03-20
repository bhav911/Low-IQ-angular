import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { inject } from '@angular/core';
import { QuizService } from '../services/quiz.service';
import { map, of, switchMap } from 'rxjs';

export const AlreadyAttempted: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const quizService = inject(QuizService);
  const router = inject(Router);
  const quizId = route.paramMap.get('quizId');

  return authService.userValue.pipe(
    switchMap((user) => {
      if (!user) {
        return of(router.createUrlTree(['/signup']));
      }

      if (user.role !== 'player') {
        return of(router.createUrlTree(['/quiz', quizId, 'details']));
      }

      return quizService.isQuizAttempted(quizId!).pipe(
        map((attempted: any) => {
          if (attempted.Success) {
            return router.createUrlTree(['/result', attempted.resultId]);
          }
          return true;
        })
      );
    })
  );
};
