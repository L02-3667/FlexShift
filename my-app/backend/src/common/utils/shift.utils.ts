export function hasTimeOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string,
) {
  const toMinutes = (value: string) => {
    const [hours, minutes] = value.split(':').map(Number);
    return hours * 60 + minutes;
  };

  return (
    toMinutes(startA) < toMinutes(endB) && toMinutes(startB) < toMinutes(endA)
  );
}

export function toDateOnly(value: Date | string) {
  return typeof value === 'string'
    ? value.slice(0, 10)
    : value.toISOString().slice(0, 10);
}
