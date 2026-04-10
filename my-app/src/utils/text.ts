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

  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(parsed);
}
