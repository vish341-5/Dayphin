const toRadians = (angle: number): number => (angle * Math.PI) / 180;

export const polarToCartesian = (
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number
): { x: number; y: number } => {
  const adjustedAngle = angleInDegrees - 90;
  const angleInRadians = toRadians(adjustedAngle);

  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
};

export const describeArc = (
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number
): string => {
  const normalizedEndAngle = endAngle <= startAngle ? startAngle + 0.01 : endAngle;
  const arcSweep = normalizedEndAngle - startAngle;
  const start = polarToCartesian(centerX, centerY, radius, startAngle);
  const end = polarToCartesian(centerX, centerY, radius, normalizedEndAngle);
  const largeArcFlag = arcSweep > 180 ? 1 : 0;

  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
};
