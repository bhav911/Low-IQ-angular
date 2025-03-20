import { Route } from "@angular/router";
import { QuizDetailsComponent } from "./components/quiz-details/quiz-details.component";
import { AlreadyAttempted } from "../../core/guards/alreadyAttempted.guard";

export const userRoute: Route[] = [
    {
        path: '',
        redirectTo: '/quizset',
        pathMatch: "full"
    },
    {
        path: ':quizId/details',
        loadComponent: () => import("./components/quiz-details/quiz-details.component").then(mod => mod.QuizDetailsComponent),
    },
    {
        path: ':quizId/attempt',
        loadComponent: () => import("./components/attempt-quiz/attempt-quiz.component").then(mod => mod.AttemptQuizComponent),
        canActivate: [AlreadyAttempted]
    },
]