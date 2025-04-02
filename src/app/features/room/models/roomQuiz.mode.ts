export interface roomQuiz {
  title: string;
  questionCount: number;
  difficulty: 'easy' | 'medium' | 'hard';
  questions: question[];
  score?: number;
  totalPoints: number;
  players: {
    userId: string;
    isAdmin: boolean;
    username: string;
    profilePhoto: string;
    score?: number;
  }[];
}

export interface question {
  _id: string;
  question: string;
  questionImage?: string | null;
  options: option[];
  userSelectedOption?: string;
  // expiresAt: number;
  point: number;
}

export interface option {
  _id: string;
  option: string;
  isCorrect: boolean;
}
