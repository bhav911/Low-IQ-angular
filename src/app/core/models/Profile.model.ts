import { quiz } from "./quiz.model";
import { Result } from "./result.model";
import { creatorStats, playerStats } from "./stat.model";
import { User } from "./User.model";

export interface Profile {
    user: User,
    quizzes: quiz[],
    playerStats?: playerStats,
    creatorStats?: creatorStats,
    quizStats?: {
        'easy': number,
        'medium': number,
        'hard': number,
    },
}