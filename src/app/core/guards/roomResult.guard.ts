import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { RoomService } from '../../features/room/_services/room.service';

export const roomResultGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const roomService = inject(RoomService);
  const roomId = route.paramMap.get('roomId');

  return authService.userValue.pipe(
    map((user) => {
      if (
        user &&
        roomService.joinedRoom &&
        roomService.inProgressQuiz &&
        roomService.roomResult
      ) {
        return true;
      }
      return router.createUrlTree(['/rooms', roomId, 'join']);
    })
  );
};
