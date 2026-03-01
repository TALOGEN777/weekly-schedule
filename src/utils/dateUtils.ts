export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const getStartOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  // Get Sunday of current week (day 0 = Sunday)
  const diff = d.getDate() - day;
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const getDaysOfWeek = (startDate: Date): Date[] => {
  const days: Date[] = [];
  // Get 5 working days starting from Sunday (day 0)
  for (let i = 0; i < 5; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    days.push(d);
  }
  return days;
};

export const formatDisplayDate = (date: Date): string => {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

export const getDayName = (date: Date): string => {
  return date.toLocaleDateString('en-US', { weekday: 'long' });
};

export const getCurrentWeekStart = (): Date => {
  return getStartOfWeek(new Date());
};
