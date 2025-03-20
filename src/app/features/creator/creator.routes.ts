import { Route } from "@angular/router";

export const adminRoute: Route[] = [
    {
        path: 'quiz',
        children: [
            {
                path: '',
                redirectTo: './quizset',
                pathMatch: "full"
            },
            {
                path: 'quizset',
                loadComponent: () => import('./components/quiz/quiz-list/quiz-list.component').then(mod => mod.creatorQuizListComponent),
            },
            {
                path: 'create-quiz',
                loadComponent: () => import('./components/quiz/create-quiz/create-quiz.component').then(mod => mod.CreateQuizComponent),
            },
            {
                path: ':quizId/view',
                loadComponent: () => import('./components/quiz/view-quiz/view-quiz.component').then(mod => mod.ViewQuizComponent),
            },
            {
                path: ':quizId/edit',
                loadComponent: () => import('./components/quiz/create-quiz/create-quiz.component').then(mod => mod.CreateQuizComponent),
            }
        ]
    },
    {
        path: 'request-list',
        loadComponent: () => import('./components/request/publishing-requests/publishing-requests.component').then(mod => mod.PublishingRequestsComponent)
    }
]