export function joinInlineText(
  parts: Array<string | null | undefined>,
  separator = ' | ',
) {
  return parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(separator);
}

export function formatIsoDateTime(
  value: string | null | undefined,
  locale = 'vi-VN',
) {
  if (!value) {
    return '';
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  const hours = parsed.getHours().toString().padStart(2, '0');
  const minutes = parsed.getMinutes().toString().padStart(2, '0');

  const day = parsed.getDate();
  const month = parsed.getMonth() + 1;
  const year = parsed.getFullYear().toString().slice(-2);

  return `${hours}:${minutes} ${day}/${month}/${year}`;
}
