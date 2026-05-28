export const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
  return `${displayHours}:${displayMinutes} ${ampm}`;
};

export const getNextCheckInTime = (currentTime: Date): Date => {
  const nextCheckIn = new Date(currentTime);
  nextCheckIn.setSeconds(0, 0);
  nextCheckIn.setMinutes(0);
  nextCheckIn.setHours(nextCheckIn.getHours() + 1);
  return nextCheckIn;
};

export const getMinutesUntilNextCheckIn = (currentTime: Date, nextCheckInTime: Date): number => {
  const differenceMs = nextCheckInTime.getTime() - currentTime.getTime();
  return Math.max(1, Math.ceil(differenceMs / 60000));
};
