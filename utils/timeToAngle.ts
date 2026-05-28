const MINUTES_IN_DAY = 24 * 60;

export const getMinutesIntoDay = (timestamp: number): number => {
  const date = new Date(timestamp);
  return date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60;
};

export const timeToAngle = (timestamp: number): number => {
  return (getMinutesIntoDay(timestamp) / MINUTES_IN_DAY) * 360;
};
