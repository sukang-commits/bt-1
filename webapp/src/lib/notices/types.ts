import type { NoticeRow } from "@/types/database";

export type NoticeWithReadState = NoticeRow & {
  isRead: boolean;
  isOverdue: boolean;
};

export type NoticeAckStats = {
  targetCount: number;
  ackCount: number;
  rate: number;
  readers: { profileId: string; name: string; readAt: string }[];
  nonReaders: { profileId: string; name: string }[];
};
