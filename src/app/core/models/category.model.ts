export interface category {
    _id: string,
    creatorId?: string,
    title: string,
    meta?: {
        'easy': number,
        'medium': number,
        'hard': number
    },
    playerStats?: {
        attempted: {
            'easy': number,
            'medium': number,
            'hard': number
        }
    },
    creatorStats?: {
        pending?: {
            'easy': number | undefined,
            'medium': number | undefined,
            'hard': number | undefined
        },
        accepted?: {
            'easy': number | undefined,
            'medium': number | undefined,
            'hard': number | undefined
        },
        rejected?: {
            'easy': number | undefined,
            'medium': number | undefined,
            'hard': number | undefined
        },
    },
    icon?: string
}