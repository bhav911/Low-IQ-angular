export interface creatorCategory {
    categoryId: string,
    categoryTitle: string,
    pendingPublish?: {
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
    icon: string
}