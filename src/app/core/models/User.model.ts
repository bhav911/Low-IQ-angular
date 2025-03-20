import { Achievement } from './achievement.model';
import { Notification } from './notification.model';

export interface User {
  userId: string;
  username: string;
  name?: string;
  token: string;
  email?: string;
  emailVerified?: boolean;
  achievements: Achievement[];
  notifications: Notification[];
  phoneNumber?: string;
  role: string;
  profilePicture?: {
    link: string;
  };
}
