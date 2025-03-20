import { Component, HostListener, inject, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { NavigationBarComponent } from './core/components/navigation-bar/navigation-bar.component';
import { log } from 'console';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavigationBarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  private authService = inject(AuthService);
  loaded = false;
  showNavBar = true;
  wrapNavItems = false;

  @HostListener('click', ['$event'])
  bodyClicked($event: MouseEvent) {
    let element = $event.target as HTMLElement;
    const body = element.closest('.body');
    if (body) {
      this.wrapNavItems = true;
      setTimeout(() => {
        this.wrapNavItems = false;
      }, 10);
    }
  }

  constructor(private router: Router) {
    this.router.events.subscribe(() => {
      const url = router.url.substring(1).split('/');
      this.showNavBar = url[0] !== 'quiz' || url[2] !== 'attempt';
    });
  }

  ngOnInit(): void {
    this.authService.userValue.subscribe({
      next: () => {
        this.loaded = true;
      },
    });
  }
}
