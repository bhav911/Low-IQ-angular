import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { map } from "rxjs";
import { AuthService } from "../services/auth.service";

export const AdminAuthGuard: CanActivateFn = (route, segment) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    return authService.userValue
        .pipe(
            map((user) => {
                if (user && user.role === 'admin') {
                    return true;
                }
                return router.createUrlTree(['/home']);
            })
        )
}