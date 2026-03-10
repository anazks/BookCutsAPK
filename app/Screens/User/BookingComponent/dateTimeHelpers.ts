// utils/dateTimeHelpers.ts

export const parseTime = (timeStr: string): string => {
  timeStr = timeStr.trim().toLowerCase();
  const match = timeStr.match(/(\d+)([ap]m)/);
  if (!match) return '09:00';
  let hour = parseInt(match[1], 10);
  const modifier = match[2];
  if (modifier === 'pm' && hour !== 12) hour += 12;
  if (modifier === 'am' && hour === 12) hour = 0;
  return `${hour.toString().padStart(2, '0')}:00`;
};

export const timeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

export const minutesToTime = (totalMinutes: number): string => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

export const addMinutesToTime = (timeStr: string, minutesToAdd: number): string => {
  const totalMin = timeToMinutes(timeStr) + minutesToAdd;
  return minutesToTime(totalMin);
};

export const formatLocalDate = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};