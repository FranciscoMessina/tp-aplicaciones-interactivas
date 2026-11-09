// "en-CA" escribe la fecha como AAAA-MM-DD, el mismo formato que se guarda.
const argentinaDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Argentina/Buenos_Aires",
});

/** El dia de calendario en Argentina ("2026-11-09"). */
export function argentinaDay(date = new Date()): string {
  return argentinaDate.format(date);
}

/** Suma (o resta) dias a una fecha AAAA-MM-DD. */
export function addDays(day: string, days: number): string {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
