import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environment/environment';
import { Room } from '../../features/room/room.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket!: Socket;

  constructor() {
    this.socket = io(environment.backendUrl);
    this.socket.on('connect', () => {
      console.log(
        this.socket.connected
          ? 'Socket connected'
          : 'Failed to connect the socket'
      );
    });
  }

  emitEvent(event_name: string, payload: any) {
    return new Promise<any>((res, rej) => {
      this.socket.emit(event_name, payload, (response: any) => {
        if (response?.error) {
          rej(response.error);
        } else {
          res(response);
        }
      });
    });
  }

  listenForEvent(eventName: string) {
    return new Observable((observer) => {
      this.socket.on(eventName, (data: any) => {        
        if (data?.error) {
          observer.error(data.error);
        } else {
          observer.next(data);
        }
      });

      return () => {
        this.socket.off(eventName);
      };
    });
  }

  removeEventListner(eventName: string) {
    this.socket.off(eventName);
  }
}
