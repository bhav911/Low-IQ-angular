import { CommonModule } from '@angular/common';
import { Component, inject, input, OnInit } from '@angular/core';
import { AuthService } from '../../../../../core/services/auth.service';
import { Subject, takeUntil } from 'rxjs';
import { User } from '../../../../../core/models/User.model';
import { Router } from '@angular/router';
import { roomQuiz } from '../../../models/roomQuiz.mode';
import { RoomService } from '../../../_services/room.service';
import { PlayerTemplateComponent } from '../player-template/player-template.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, PlayerTemplateComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent implements OnInit {
  private authService = inject(AuthService);
  private roomService = inject(RoomService);
  private router = inject(Router);

  private destroy$ = new Subject<void>();

  quizData = input.required<roomQuiz>();
  result = input<boolean>();
  roomId = input.required<string>();
  room!: roomQuiz;
  user: User | undefined | null = undefined;
  sideBarOpened = false;
  openPlayersPanel = false;

  ngOnInit(): void {
    this.authService.userValue
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        this.user = user;
      });

    this.roomService.$result
      .pipe(takeUntil(this.destroy$))
      .subscribe((room) => {
        this.room = room!;
      });
  }

  redirectUser(route: string) {
    this.router.navigate([route], {
      replaceUrl: true,
    });
  }

  togglePlayersPanel() {
    this.openPlayersPanel = !this.openPlayersPanel;
  }

  openSidebar() {
    this.sideBarOpened = !this.sideBarOpened;
  }

  exitRoom() {
    this.roomService.leaveRoom(this.roomId());
    this.router.navigate(['/rooms'], {
      replaceUrl: true,
    });
  }

  backToLobby() {
    this.roomService.backToLobby();
    this.router.navigate(['/rooms', this.roomId()], {
      replaceUrl: true,
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
