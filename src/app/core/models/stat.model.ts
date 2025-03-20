export type playerStats = {
    quizzes: string[],
    attempted?: {
        easy: number,
        medium: number,
        hard: number
    },
    passed?: {
        easy: number,
        medium: number,
        hard: number
    },
    previewed?: {
        easy: number,
        medium: number,
        hard: number
    },
}

export type creatorStats = {
    accepted?: {
        easy: number,
        medium: number,
        hard: number
    },
    rejected?: {
        easy: number,
        medium: number,
        hard: number
    },
    pending?: {
        easy: number,
        medium: number,
        hard: number
    },
}