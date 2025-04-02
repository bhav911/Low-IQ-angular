import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-player-template',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './player-template.component.html',
  styleUrl: './player-template.component.css',
})
export class PlayerTemplateComponent {
  player = input.required<{
    userId: string;
    isAdmin: boolean;
    username: string;
    profilePhoto: string;
    score?: number;
  }>();
}
