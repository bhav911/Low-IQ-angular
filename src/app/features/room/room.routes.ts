import { Route } from '@angular/router';
import { lobbyGuard } from '../../core/guards/lobby.guard';
import { lobbyInProgressGuard } from '../../core/guards/lobbyInProgress.guard';
import { roomResultGuard } from '../../core/guards/roomResult.guard';

export const route: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./components/home/home.component').then(
        (mod) => mod.HomeComponent
      ),
  },
  {
    path: ':roomId',
    loadComponent: () =>
      import('./components/lobby/lobby.component').then(
        (mod) => mod.LobbyComponent
      ),
    canActivate: [lobbyGuard],
  },
  {
    path: ':roomId/join',
    loadComponent: () =>
      import('./components/join-room/join-room.component').then(
        (mod) => mod.JoinRoomComponent
      ),
  },
  {
    path: ':roomId/in-progress',
    loadComponent: () =>
      import('./components/quiz/quiz.component').then(
        (mod) => mod.QuizComponent
      ),
    canActivate: [lobbyInProgressGuard],
  },
  {
    path: ':roomId/scoreboard',
    loadComponent: () =>
      import('./components/scoreboard/scoreboard.component').then(
        (mod) => mod.ScoreboardComponent
      ),
    canActivate: [roomResultGuard],
  },
];
