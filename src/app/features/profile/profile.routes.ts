import { Route } from "@angular/router";
import { ViewProfileComponent } from "./components/view-profile/view-profile.component";
import { LayoutComponent } from "./components/layout/layout.component";
import { UserAuthGuard } from "../../core/guards/userAuth.guard";
import { EditProfileComponent } from "./components/edit-profile/edit-profile.component";

export const route: Route[] = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: '',
        component: EditProfileComponent,
        canActivate: [UserAuthGuard]
      },
      {
        path: ':username',
        component: ViewProfileComponent
      }
    ]
  }
]