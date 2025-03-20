export type Achievement = {
  _id: string;
  title: string;
  description: string;
  quizToComplete: number;
  lockedDescription: string;
  secondPersonDescription: string;
  iconUrl: string;
  lockedIconUrl: string;
  isUnlocked: boolean;
  meta: {
    claimedOn: string;
    createdAt: string;
  };
};
