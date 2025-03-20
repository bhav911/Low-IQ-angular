import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { AuthService } from "../../../core/services/auth.service";
import { User } from "../../../core/models/User.model";


@Injectable({
    providedIn: 'root'
})
export class AdminService {

    private httpClient = inject(HttpClient);
    private authService = inject(AuthService)
    private user: User | null | undefined = undefined

    constructor() {
        this.authService.userValue
            .subscribe(user => {
                this.user = user;
            })
    }


}
