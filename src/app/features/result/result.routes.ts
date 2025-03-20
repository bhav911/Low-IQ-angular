import { Route } from '@angular/router';
import { UserAuthGuard } from '../../core/guards/userAuth.guard';
import { QuizResultComponent } from './components/quiz-result/quiz-result.component';
import { ConfirmationPopupComponent } from './components/confirmation-popup/confirmation-popup.component';
import { resultGuard } from '../../core/guards/result.guard';

export const route: Route[] = [
  {
    path: ':resultId',
    component: QuizResultComponent,
    canActivate: [resultGuard],
  },
  {
    path: 'confirm/:resultId',
    component: ConfirmationPopupComponent,
  },
];
