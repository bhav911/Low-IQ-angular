import { inject, Injectable } from '@angular/core';
import { User } from '../../../core/models/User.model';
import { AuthService } from '../../../core/services/auth.service';
import { BehaviorSubject, filter, Observable } from 'rxjs';
import { SocketService } from '../../../core/services/socket.service';
import { Room } from '../room.model';
import { roomQuiz } from '../models/roomQuiz.mode';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class RoomService {
  private router = inject(Router);

  private authService = inject(AuthService);
  private socketService = inject(SocketService);

  private user: User | null = null;
  private _joinedRoom = new BehaviorSubject<Room | null>(null);
  $joinedRoom = this._joinedRoom.asObservable();
  private _quiz = new BehaviorSubject<roomQuiz | null>(null);
  $quiz = this._quiz.asObservable();
  private _result = new BehaviorSubject<roomQuiz | null>(null);
  $result = this._result.asObservable();
  private _publicRooms = new BehaviorSubject<Room[]>([]);
  $publicRooms = this._publicRooms.asObservable();

  constructor() {
    this.authService.$user
      .pipe(filter((u) => u !== undefined))
      .subscribe(async (user) => {
        this.user = user;
      });
  }

  get joinedRoom() {
    return this._joinedRoom.value;
  }

  get inProgressQuiz() {
    return this._quiz.value;
  }

  get roomResult() {
    return this._result.value;
  }

  //find if _joinedRoom in newPlyerJoins and leaves is the criminal
  async newPlayerJoins() {
    this.socketService.listenForEvent('playerJoined').subscribe({
      next: (player: any) => {
        const currentPlayers = player.currentPlayers;
        player.currentPlayers = undefined;

        const currentRoomState = this._joinedRoom.value;
        if (!currentRoomState) return;

        const updatedRoom = {
          ...currentRoomState,
          currentPlayers: currentPlayers,
          players: [...currentRoomState.players, player],
        };

        this._joinedRoom.next(updatedRoom);
      },
      error: (err) => console.error('Socket error:', err),
    });
  }

  async playerLeaves() {
    this.socketService.listenForEvent('playerLeft').subscribe({
      next: (data: any) => {
        const currentPlayers = data.currentPlayers;
        const userId = data.userId;
        const newAdminId = data.nextAdmin;

        const currentRoomState = this._joinedRoom.value;

        if (newAdminId) {
          let player = currentRoomState?.players.find(
            (p) => p.userId === newAdminId
          );
          if (player) {
            player.isAdmin = true;
            currentRoomState!.adminId = newAdminId;
          }
        }

        const currentResult = { ...this.roomResult! };
        const userSubmissionStatus = currentResult.players?.find(
          (u) => u.userId === userId
        );
        if (userSubmissionStatus?.score === undefined) {
          currentResult.players = currentResult.players?.filter(
            (u) => u.userId !== userId
          );

          this._result.next(currentResult);
        }

        if (!currentRoomState) return;

        const updatedRoom = {
          ...currentRoomState,
          currentPlayers: currentPlayers,
          players: [
            ...currentRoomState.players.filter((p) => p.userId !== userId),
          ],
        };

        this._joinedRoom.next(updatedRoom);
      },
      error: (err) => console.error('Socket error:', err),
    });
  }

  async quizStarted() {
    this.socketService.listenForEvent('quizStarted').subscribe((quiz: any) => {
      const updatedRoom = {
        ...this.joinedRoom,
        status: 'in-progress',
        questionCount: +quiz.questionCount,
        difficulty: quiz.difficulty,
      };
      this._joinedRoom.next(updatedRoom as Room);

      let totalPoints = 0;
      quiz.questions.forEach((question: any) => {
        totalPoints += question.point;
      });
      quiz.totalPoints = totalPoints;
      quiz.questionCount = +quiz.questionCount;
      this._quiz.next(quiz as roomQuiz);
      quiz.players =
        this.joinedRoom?.players.map((player) => ({ ...player })) || [];
      this._result.next(quiz as roomQuiz);
      this.otherPlayerQuizSubmission().subscribe();
      this.quizFinished();
      this.router.navigate(['/rooms', this.joinedRoom?.roomId, 'in-progress'], {
        replaceUrl: true,
      });
    });
  }

  async fetchInitialRooms() {
    const rooms = await this.socketService.emitEvent('fetchRooms', null);
    this._publicRooms.next(rooms);
    this.fetchNewRooms();
  }

  async fetchNewRooms() {
    this.socketService.listenForEvent('newRoom').subscribe({
      next: (newRoom: any) => {
        const updatedRooms = [newRoom, ...this._publicRooms.value];
        this._publicRooms.next(updatedRooms);
      },
      error: (err) => console.error('Socket error:', err),
    });
  }

  async createRoom(
    title: string,
    difficulty: string,
    max_participants: number,
    question_count: number,
    isPrivate: boolean
  ) {
    const createdRoom: Room = await this.socketService.emitEvent('createRoom', {
      title,
      difficulty,
      max_participants,
      question_count,
      isPrivate,
      adminId: this.user?.userId,
    });
    this._joinedRoom.next(createdRoom);
    this.quizStarted();
    this.newPlayerJoins();
    this.playerLeaves();
    return createdRoom;
  }

  async joinRoom(roomId: string, password?: string) {
    const joinedRoom: Room = await this.socketService.emitEvent('joinRoom', {
      roomId,
      password,
      userId: this.user?.userId,
    });
    this._joinedRoom.next(joinedRoom);
    this.quizStarted();
    this.newPlayerJoins();
    this.playerLeaves();
    return joinedRoom;
  }

  async submitQuiz(roomId: string, userAnswers: {}) {
    const { scoreCard, score } = await this.socketService.emitEvent(
      'quizSubmitted',
      {
        roomId,
        userId: this.user?.userId,
        userAnswers,
      }
    );    
    const currentQuiz = { ...this.inProgressQuiz! };

    currentQuiz.questions.forEach((question) => {
      const userValue = scoreCard.find(
        (it: any) => it.questionId === question._id
      );
      if (userValue) {
        question.userSelectedOption = userValue.optionId;
        const correctOption = question.options.find(
          (op) => op._id === userValue.correctOptionId
        );
        correctOption!.isCorrect = true;
      }
    });

    const currentRoom = this.joinedRoom;
    const player = currentRoom?.players.find(
      (p) => p.userId === this.user?.userId
    );
    if (!player) {
      return;
    }

    const currentUser = this.roomResult?.players.find(
      (u) => u.userId == this.user?.userId
    );
    currentUser!.score = score;
    currentQuiz.score = score;
    currentQuiz.players = [...this.roomResult?.players!];
    currentQuiz.players.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    this._result.next(currentQuiz);
    return true;
  }

  quizFinished() {
    this.socketService.listenForEvent('quizFinished').subscribe(() => {
      let currectRoom = { ...this.joinedRoom! };
      currectRoom.status = 'in-lobby';
      this._joinedRoom.next(currectRoom);
    });
  }

  otherPlayerQuizSubmission() {
    let playerdetail: any = {};

    return new Observable((observer) => {
      this.socketService.listenForEvent('quizSubmitted').subscribe({
        next: ({ userId, score }: any) => {
          const result = { ...this.roomResult! };
          const player = result?.players.find((p) => p.userId === userId);
          if (!player) {
            return;
          }

          playerdetail = { ...player, score };

          player.score = score;
          result.players.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
          this._result.next(result);
          observer.next(playerdetail);
        },
      });
    });
  }

  leaveRoom(roomId?: string) {
    if (!this.joinedRoom) {
      return;
    }
    this.socketService.emitEvent('leaveRoom', {
      roomId: roomId || this.joinedRoom?.roomId,
      userId: this.user?.userId,
    });
    this._joinedRoom.next(null);
    this._publicRooms.next([]);
    this._quiz.next(null);
    this._result.next(null);
    this.socketService.removeEventListner('playerJoined');
    this.socketService.removeEventListner('playerLeft');
    this.socketService.removeEventListner('quizSubmitted');
    this.socketService.removeEventListner('quizStarted');
  }

  backToLobby() {
    this._quiz.next(null);
    this._result.next(null);
    this.socketService.removeEventListner('quizSubmitted');
  }

  startQuiz(difficulty: string, questionCount: number) {
    this.socketService.emitEvent('startQuiz', {
      roomId: this.joinedRoom?.roomId,
      userId: this.user?.userId,
      difficulty,
      questionCount,
    });
  }

  catchErrors() {
    return this.socketService.listenForEvent('error');
  }
}
