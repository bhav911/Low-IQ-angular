import { Comment } from "./comment.model";

export interface quiz {
    creatorId: {
        username: string,
        _id: string
    },
    categoryId: {
        title: string,
        _id: string
    },
    _id?: string,
    isAttempted?: boolean,
    resultId?: string,
    requestId?: string,
    title: string,
    description: string,
    quizStatus: 'accepted' | 'pending' | 'rejected',
    questionCount: number,
    comments: Comment[],
    totalPoints: number,
    difficulty: 'easy' | 'medium' | 'hard',
    reaction: 'liked' | 'disliked' | null,
    questions: question[],
    meta?: {
        attempted: number;
        passed: number;
        liked: number;
        disliked: number;
        acceptanceRate: string
    },
}

export interface question {
    _id: string,
    question: string,
    questionImage: string | null,
    frontQuestionNumber?: number,
    options: option[]
    point: number
}

export interface option {
    _id: string,
    option: string,
    isCorrect: boolean
}