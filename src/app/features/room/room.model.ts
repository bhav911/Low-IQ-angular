export interface Room {
  roomId: string;
  title: string;
  difficulty: string;
  max_participants: number;
  currentPlayers: number;
  questionCount: number;
  isPrivate: boolean;
  adminId: string;
  password?: string;
  players: {
    userId: string;
    isAdmin: boolean;
    username: string;
    profilePhoto: string;
  }[];
  status: 'in-lobby' | 'in-progress' | 'finished';
}
