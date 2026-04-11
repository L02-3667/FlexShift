const MINUTES_PER_DAY = 24 * 60;

function toMinutes(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

function toEpochDay(value: Date | string) {
  const date =
    typeof value === 'string'
      ? new Date(`${value.slice(0, 10)}T00:00:00.000Z`)
      : new Date(
          Date.UTC(
            value.getUTCFullYear(),
            value.getUTCMonth(),
            value.getUTCDate(),
          ),
        );

  return Math.floor(date.getTime() / 86_400_000);
}

function buildAbsoluteShiftWindow(
  date: Date | string,
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
  leftDate: Date | string,
  leftStartTime: string,
  leftEndTime: string,
  rightDate: Date | string,
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

export function getConflictWindowBounds(date: Date | string) {
  const base =
    typeof date === 'string'
      ? new Date(`${date.slice(0, 10)}T00:00:00.000Z`)
      : new Date(
          Date.UTC(
            date.getUTCFullYear(),
            date.getUTCMonth(),
            date.getUTCDate(),
          ),
        );
  const start = new Date(base);
  const end = new Date(base);

  start.setUTCDate(start.getUTCDate() - 1);
  end.setUTCDate(end.getUTCDate() + 2);

  return {
    start,
    end,
  };
}

export function toDateOnly(value: Date | string) {
  return typeof value === 'string'
    ? value.slice(0, 10)
    : value.toISOString().slice(0, 10);
}
