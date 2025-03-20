import { Route } from "@angular/router";

export const route: Route[] = [
    {
        path: '',
        redirectTo: 'request-list',
        pathMatch: 'full'
    },
    {
        path: 'request-list',
        loadComponent: () => import('./components/request-list/request-list.component').then(mod => mod.RequestListComponent)
    },
    {
        path: 'quiz/:quizId/details',
        loadComponent: () => import('../quiz/components/quiz-details/quiz-details.component').then(mod => mod.QuizDetailsComponent)
    },
    {
        path: 'quiz/:quizId/view',
        loadComponent: () => import('../creator/components/quiz/view-quiz/view-quiz.component').then(mod => mod.ViewQuizComponent)
    }
]