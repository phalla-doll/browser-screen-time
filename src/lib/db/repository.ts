import { db, type Visit } from "./db"

export type NewVisit = Omit<Visit, "id">

export interface DurationBucket {
  key: string
  duration: number
}

export function addVisit(visit: NewVisit): Promise<number> {
  return db.visits.add(visit)
}

export function updateVisit(
  id: number,
  changes: Partial<Omit<Visit, "id">>
): Promise<number> {
  return db.visits.update(id, changes)
}

export function deleteVisit(id: number): Promise<void> {
  return db.visits.delete(id)
}

// Visits whose start falls within [from, to), ordered chronologically.
export function getVisitsBetween(from: number, to: number): Promise<Visit[]> {
  return db.visits.where("startTs").between(from, to, true, false).sortBy("startTs")
}

export function getVisitsForDay(date: Date): Promise<Visit[]> {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return getVisitsBetween(start.getTime(), end.getTime())
}

function bucketBy(
  visits: Visit[],
  keyOf: (v: Visit) => string
): DurationBucket[] {
  const totals = new Map<string, number>()
  for (const visit of visits) {
    totals.set(keyOf(visit), (totals.get(keyOf(visit)) ?? 0) + visit.duration)
  }
  return [...totals.entries()]
    .map(([key, duration]) => ({ key, duration }))
    .sort((a, b) => b.duration - a.duration)
}

export async function timePerDomain(
  from: number,
  to: number
): Promise<DurationBucket[]> {
  return bucketBy(await getVisitsBetween(from, to), (v) => v.domain)
}

export async function timePerCategory(
  from: number,
  to: number
): Promise<DurationBucket[]> {
  return bucketBy(await getVisitsBetween(from, to), (v) => v.category)
}
