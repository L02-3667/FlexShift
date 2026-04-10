const weekdayFormatter = new Intl.DateTimeFormat('vi-VN', {
  weekday: 'short',
});

export function pad(value: number) {
  return value.toString().padStart(2, '0');
}

export function formatDateInput(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function formatIsoTimestamp(date: Date = new Date()) {
  return date.toISOString();
}

export function addDays(baseDate: Date, offset: number) {
  const next = new Date(baseDate);
  next.setDate(next.getDate() + offset);
  return next;
}

export function toMinutes(time: string) {
  const [hours = '0', minutes = '0'] = time.split(':');
  return Number(hours) * 60 + Number(minutes);
}

export function hasTimeOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string,
) {
  return (
    toMinutes(startA) < toMinutes(endB) && toMinutes(startB) < toMinutes(endA)
  );
}

export function compareDateTime(
  leftDate: string,
  leftStartTime: string,
  rightDate: string,
  rightStartTime: string,
) {
  const left = `${leftDate}T${leftStartTime}:00`;
  const right = `${rightDate}T${rightStartTime}:00`;
  return left.localeCompare(right);
}

export function formatDisplayDate(date: string) {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return `${weekdayFormatter.format(parsed)}, ${pad(parsed.getDate())}/${pad(parsed.getMonth() + 1)}/${parsed.getFullYear()}`;
}

export function formatDateTimeLabel(
  date: string,
  startTime: string,
  endTime: string,
) {
  return `${formatDisplayDate(date)}, ${startTime} - ${endTime}`;
}

export function isUpcoming(date: string, endTime: string) {
  const now = new Date();
  const target = new Date(`${date}T${endTime}:00`);
  return target.getTime() >= now.getTime();
}
