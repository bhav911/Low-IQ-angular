import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { map } from "rxjs";
import { AuthService } from "../services/auth.service";

export const UserAuthGuard: CanActivateFn = (route, segment) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    return authService.userValue.pipe(
        map((user) => {
            if (!user) {
                return router.createUrlTree(['/signup']);
            }
            return true;
        })
    );
}