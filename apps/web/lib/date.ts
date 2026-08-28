export function relativeDate(value: string | number) {
  const timestamp = typeof value === "number" ? value : new Date(value).getTime();
  const days = Math.round((timestamp - Date.now()) / 86_400_000);
  return new Intl.RelativeTimeFormat("fr", { numeric: "auto" }).format(days, "day");
}
