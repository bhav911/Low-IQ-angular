import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map } from 'rxjs';
import { RoomService } from '../../features/room/_services/room.service';

export const lobbyGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const roomService = inject(RoomService);
  const roomId = route.paramMap.get('roomId');

  return authService.userValue.pipe(
    map((user) => {
      if (user && roomService.joinedRoom) {
        return true;
      }
      return router.createUrlTree(['/rooms', roomId, 'join']);
    })
  );
};
