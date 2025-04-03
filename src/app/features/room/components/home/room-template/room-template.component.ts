import { Component, inject, input } from '@angular/core';
import { Room } from '../../../room.model';
import { RoomService } from '../../../_services/room.service';
import { Router } from '@angular/router';
import { LoadingSpinnerComponent } from '../../../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-room-template',
  imports: [LoadingSpinnerComponent],
  templateUrl: './room-template.component.html',
  styleUrl: './room-template.component.css',
})
export class RoomTemplateComponent {
  room = input<Room>();

  private roomService = inject(RoomService);
  private router = inject(Router);
  isFetching = false;

  ngOnInit(): void {
    this.roomService.catchErrors().subscribe((error: any) => {
      this.isFetching = false;
    });
  }

  async joinRoom() {
    this.isFetching = true;
    const room = await this.roomService.joinRoom(this.room()!.roomId);
    this.isFetching = false;
    if (room) {
      this.router.navigate(['/rooms', room.roomId]);
    }
  }
}
