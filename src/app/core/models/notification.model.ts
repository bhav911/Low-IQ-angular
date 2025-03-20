export interface Notification {
  _id: string;
  userId: string;
  content: string;
  hasSeen: boolean;
  iconLink: string;
  type: string;
  navigationRoute: string;
  createdAt: string;
}
