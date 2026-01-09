// src/lib/adherence.ts
import { sydneyKey } from "./datesSydney";

export function computeStreak(trainedDays: Set<string>, today: Date, maxLookbackDays = 365) {
  let streak = 0;

  for (let i = 0; i < maxLookbackDays; i++) {
    const d = new Date(today);
    d.setUTCDate(today.getUTCDate() - i);

    const key = sydneyKey(d);
    if (trainedDays.has(key)) streak++;
    else break;
  }

  return streak;
}

export function computeWeekCount(trainedDays: Set<string>, weekStart: Date) {
  let count = 0;

  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setUTCDate(weekStart.getUTCDate() + i);
    if (trainedDays.has(sydneyKey(d))) count++;
  }

  return count;
}
