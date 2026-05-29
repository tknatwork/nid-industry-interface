import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { Slot, SlotAssignment } from './types';

interface StoreState {
  readonly slots: Record<string, Slot>;
  readonly assignments: readonly SlotAssignment[];
  readonly counter: number;
}

function dataFilePath(): string {
  return resolve(process.env['VERCEL'] ? '/tmp/nid-dev-data' : resolve(process.cwd(), '.dev-data'), 'slot-booking.json');
}

function loadState(): StoreState {
  const file = dataFilePath();
  if (!existsSync(file)) return seedInitialState();
  try {
    const p = JSON.parse(readFileSync(file, 'utf8')) as Partial<StoreState>;
    // Normalize assignments persisted before `interviewers` existed.
    const assignments = (p.assignments ?? []).map((a) => ({
      ...a,
      interviewers: a.interviewers ?? [],
    }));
    return { slots: p.slots ?? {}, assignments, counter: p.counter ?? 0 };
  } catch {
    return seedInitialState();
  }
}

function persist(state: StoreState): void {
  const file = dataFilePath();
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(state, null, 2), 'utf8');
}

/** Admin-published slots across the two interview days for Spring 2026. */
function seedInitialState(): StoreState {
  const slots: Record<string, Slot> = {};
  const make = (n: number, day: string, startTime: string, endTime: string): Slot => ({
    id: `slot_${n.toString().padStart(4, '0')}`,
    cycleId: 'cycle_spring_2026',
    day,
    startTime,
    endTime,
    capacity: 4,
    status: 'open',
  });
  const seeded = [
    make(1, '2026-06-01', '10:00', '12:00'),
    make(2, '2026-06-01', '13:00', '15:00'),
    make(3, '2026-06-01', '15:00', '17:00'),
    make(4, '2026-06-02', '10:00', '12:00'),
    make(5, '2026-06-02', '13:00', '15:00'),
    make(6, '2026-06-02', '15:00', '17:00'),
  ];
  for (const s of seeded) slots[s.id] = s;
  // Seed one assignment so the interview-day "During" queue and the
  // recruiter↔coordinator sync demo work out of the box (Round 2 §P/§Q). The
  // recruiter (Acme) has already shortlisted Aanya Roy (stu_0005) against the
  // published jd_00001, so book her into the first slot with an expected
  // interviewer. Without an assignment, buildInterviewDayView falls back to the
  // sandboxed DEMO day until a slot is booked, which makes the "open both
  // consoles and watch the queue sync" demo look broken.
  const assignments: SlotAssignment[] = [
    {
      jdId: 'jd_00001',
      slotId: 'slot_0001',
      studentId: 'stu_0005',
      interviewers: ['Rhea Nair · Hiring Manager'],
      assignedAt: '2026-05-28T10:00:00.000Z',
    },
  ];
  const state: StoreState = { slots, assignments, counter: 6 };
  persist(state);
  return state;
}

export function publishSlotRecord(slot: Omit<Slot, 'id' | 'status'>): Slot {
  const state = loadState();
  const n = state.counter + 1;
  const record: Slot = { ...slot, id: `slot_${n.toString().padStart(4, '0')}`, status: 'open' };
  persist({ ...state, slots: { ...state.slots, [record.id]: record }, counter: n });
  return record;
}

export function listSlots(cycleId: string): readonly Slot[] {
  return Object.values(loadState().slots)
    .filter((s) => s.cycleId === cycleId)
    .sort((a, b) => a.day.localeCompare(b.day) || a.startTime.localeCompare(b.startTime));
}

export function getSlot(slotId: string): Slot | null {
  return loadState().slots[slotId] ?? null;
}

export function assignmentsForSlot(slotId: string): readonly SlotAssignment[] {
  return loadState().assignments.filter((a) => a.slotId === slotId);
}

export function assignmentsForJd(jdId: string): readonly SlotAssignment[] {
  return loadState().assignments.filter((a) => a.jdId === jdId);
}

export function upsertAssignment(entry: SlotAssignment): { ok: boolean; reason?: string } {
  const state = loadState();
  const slot = state.slots[entry.slotId];
  if (!slot) return { ok: false, reason: 'Slot not found' };

  // Remove any existing assignment for this (jd, student) — one slot per student per JD.
  const withoutStudent = state.assignments.filter(
    (a) => !(a.jdId === entry.jdId && a.studentId === entry.studentId),
  );

  // Capacity check against the target slot (excluding this student).
  const occupants = withoutStudent.filter((a) => a.slotId === entry.slotId).length;
  if (occupants >= slot.capacity) {
    return { ok: false, reason: `Slot is at capacity (${slot.capacity})` };
  }

  persist({ ...state, assignments: [...withoutStudent, entry] });
  return { ok: true };
}

export function removeAssignment(jdId: string, studentId: string): void {
  const state = loadState();
  persist({
    ...state,
    assignments: state.assignments.filter((a) => !(a.jdId === jdId && a.studentId === studentId)),
  });
}

/** Set the expected interviewers on an existing (jd, student) assignment. */
export function setInterviewers(
  jdId: string,
  studentId: string,
  interviewers: readonly string[],
): { ok: boolean; reason?: string } {
  const state = loadState();
  const existing = state.assignments.find((a) => a.jdId === jdId && a.studentId === studentId);
  if (!existing) return { ok: false, reason: 'No slot booked for this candidate' };
  persist({
    ...state,
    assignments: state.assignments.map((a) =>
      a.jdId === jdId && a.studentId === studentId ? { ...a, interviewers } : a,
    ),
  });
  return { ok: true };
}
