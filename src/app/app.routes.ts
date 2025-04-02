import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/component/login/login.component';
import { SignupComponent } from './features/auth/component/signup/signup.component';
import { ResetPasswordComponent } from './features/auth/component/reset-password/reset-password.component';
import { signedInGuard } from './core/guards/signedIn.guard';
import { DashboardComponent } from './features/Home/dashboard/dashboard.component';
import { UnauthorizedComponent } from './shared/components/unauthorized/unauthorized.component';
import { AdminAuthGuard } from './core/guards/adminAuth.guard';
import { CreatorAuthGuard } from './core/guards/creatorAuth.guard';
import { passwordTokenGuard } from './core/guards/passwordToken.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [signedInGuard],
  },
  {
    path: 'reset-password',
    component: ResetPasswordComponent,
  },
  {
    path: 'reset-password/:token',
    component: ResetPasswordComponent,
    canActivate: [passwordTokenGuard],
  },
  {
    path: 'signup',
    component: SignupComponent,
    canActivate: [signedInGuard],
  },
  {
    path: 'profile',
    loadChildren: () =>
      import('./features/profile/profile.routes').then((mod) => mod.route),
  },
  {
    path: 'home',
    component: DashboardComponent,
  },
  {
    path: 'rooms',
    loadChildren: () =>
      import('./features/room/room.routes').then((mod) => mod.route),
  },
  {
    path: 'quizset',
    loadComponent: () =>
      import('./features/quiz/components/quiz-list/quiz-list.component').then(
        (mod) => mod.QuizListComponent
      ),
  },
  {
    path: 'quiz-list/:categoryId',
    loadComponent: () =>
      import(
        './features/category/components/category-Info/category.component'
      ).then((mod) => mod.CategoryComponent),
  },
  {
    path: 'quiz',
    loadChildren: () =>
      import('./features/quiz/quiz.routes').then((mod) => mod.userRoute),
  },
  {
    path: 'result',
    loadChildren: () =>
      import('./features/result/result.routes').then((mod) => mod.route),
  },
  {
    path: 'creator',
    loadChildren: () =>
      import('./features/creator/creator.routes').then((mod) => mod.adminRoute),
    canActivate: [CreatorAuthGuard],
  },
  {
    path: 'admin/iq-login',
    loadComponent: () =>
      import('./features/admin/components/login/login.component').then(
        (mod) => mod.LoginComponent
      ),
  },
  {
    path: 'admin',
    loadChildren: () =>
      import('./features/admin/admin.routes').then((mod) => mod.route),
    canActivate: [AdminAuthGuard],
  },
  {
    path: 'unauthorized',
    component: UnauthorizedComponent,
  },
  {
    path: '**',
    component: UnauthorizedComponent,
    pathMatch: 'prefix',
  },
];
