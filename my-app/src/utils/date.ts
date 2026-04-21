const weekdayFormatter = new Intl.DateTimeFormat('vi-VN', {
  weekday: 'short',
});
const MINUTES_PER_DAY = 24 * 60;

function parseDateParts(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return { year, month, day };
}

function formatDateParts(year: number, month: number, day: number) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function toEpochDay(value: string) {
  const { year, month, day } = parseDateParts(value);
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
}

function buildAbsoluteShiftWindow(
  date: string,
  startTime: string,
  endTime: string,
) {
  const startMinutes = toMinutes(startTime);
  const endMinutes = toMinutes(endTime);
  const day = toEpochDay(date);
  const start = day * MINUTES_PER_DAY + startMinutes;
  const end =
    day * MINUTES_PER_DAY +
    endMinutes +
    (endMinutes <= startMinutes ? MINUTES_PER_DAY : 0);

  return {
    start,
    end,
  };
}

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

export function addCalendarDays(date: string, offset: number) {
  const { year, month, day } = parseDateParts(date);
  const next = new Date(Date.UTC(year, month - 1, day));
  next.setUTCDate(next.getUTCDate() + offset);

  return formatDateParts(
    next.getUTCFullYear(),
    next.getUTCMonth() + 1,
    next.getUTCDate(),
  );
}

export function getAdjacentDateStrings(date: string) {
  return [addCalendarDays(date, -1), date, addCalendarDays(date, 1)] as const;
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
  const left = buildAbsoluteShiftWindow('2000-01-01', startA, endA);
  const rightBase = buildAbsoluteShiftWindow('2000-01-01', startB, endB);
  const rightShifted = buildAbsoluteShiftWindow('2000-01-02', startB, endB);

  return (
    (left.start < rightBase.end && rightBase.start < left.end) ||
    (left.start < rightShifted.end && rightShifted.start < left.end)
  );
}

export function hasDateTimeOverlap(
  leftDate: string,
  leftStartTime: string,
  leftEndTime: string,
  rightDate: string,
  rightStartTime: string,
  rightEndTime: string,
) {
  const left = buildAbsoluteShiftWindow(leftDate, leftStartTime, leftEndTime);
  const right = buildAbsoluteShiftWindow(
    rightDate,
    rightStartTime,
    rightEndTime,
  );

  return left.start < right.end && right.start < left.end;
}

export function isShiftWindowChronologicallyValid(
  startTime: string,
  endTime: string,
) {
  return toMinutes(startTime) !== toMinutes(endTime);
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
