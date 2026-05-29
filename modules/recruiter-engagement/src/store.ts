import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { Meeting, MeetingSlot, PptBooking, PptWindow } from './types';

interface StoreState {
  readonly pptWindows: readonly PptWindow[];
  readonly pptBookings: readonly PptBooking[];
  readonly meetingSlots: readonly MeetingSlot[];
  readonly meetings: readonly Meeting[];
  readonly counter: number;
}

function dataFilePath(): string {
  return resolve(process.env['VERCEL'] ? '/tmp/nid-dev-data' : resolve(process.cwd(), '.dev-data'), 'recruiter-engagement.json');
}

function seedInitialState(): StoreState {
  const SPRING = 'cycle_spring_2026';
  const pptWindows: PptWindow[] = [
    { id: 'ppt_w1', cycleId: SPRING, day: '2026-05-26', startTime: '11:00', endTime: '12:00', mode: 'virtual', campus: 'Ahmedabad', status: 'open' },
    { id: 'ppt_w2', cycleId: SPRING, day: '2026-05-27', startTime: '15:00', endTime: '16:00', mode: 'on-campus', campus: 'Bengaluru', status: 'open' },
    { id: 'ppt_w3', cycleId: SPRING, day: '2026-05-28', startTime: '10:00', endTime: '11:00', mode: 'virtual', campus: 'Gandhinagar', status: 'open' },
  ];
  const meetingSlots: MeetingSlot[] = [
    { id: 'mtg_s1', placementHead: 'Sujitha Nair', campus: 'Ahmedabad', day: '2026-05-25', time: '14:00', status: 'open' },
    { id: 'mtg_s2', placementHead: 'Sujitha Nair', campus: 'Ahmedabad', day: '2026-05-25', time: '16:00', status: 'open' },
    { id: 'mtg_s3', placementHead: 'Placement Head', campus: 'Bengaluru', day: '2026-05-26', time: '11:00', status: 'open' },
  ];
  return { pptWindows, pptBookings: [], meetingSlots, meetings: [], counter: 0 };
}

function loadState(): StoreState {
  const file = dataFilePath();
  if (!existsSync(file)) return seedInitialState();
  try {
    const p = JSON.parse(readFileSync(file, 'utf8')) as Partial<StoreState>;
    const seed = seedInitialState();
    return {
      pptWindows: p.pptWindows ?? seed.pptWindows,
      pptBookings: p.pptBookings ?? [],
      meetingSlots: p.meetingSlots ?? seed.meetingSlots,
      meetings: p.meetings ?? [],
      counter: p.counter ?? 0,
    };
  } catch {
    return seedInitialState();
  }
}

function persist(state: StoreState): void {
  const file = dataFilePath();
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(state, null, 2), 'utf8');
}

export function listPptWindows(cycleId: string): readonly PptWindow[] {
  return loadState().pptWindows.filter((w) => w.cycleId === cycleId);
}
export function listPptBookings(recruiterId: string): readonly PptBooking[] {
  return loadState().pptBookings.filter((b) => b.recruiterId === recruiterId);
}
export function listMeetingSlots(): readonly MeetingSlot[] {
  return loadState().meetingSlots;
}
export function listMeetings(recruiterId: string): readonly Meeting[] {
  return loadState().meetings.filter((m) => m.recruiterId === recruiterId);
}

export function insertPptBooking(b: Omit<PptBooking, 'id' | 'bookedAt'>): PptBooking {
  const s = loadState();
  const n = s.counter + 1;
  const booking: PptBooking = { ...b, id: `ppt_b_${n}`, bookedAt: new Date().toISOString() };
  persist({
    ...s,
    counter: n,
    pptBookings: [...s.pptBookings, booking],
    pptWindows: s.pptWindows.map((w) => (w.id === b.windowId ? { ...w, status: 'booked' } : w)),
  });
  return booking;
}

export function insertMeeting(m: Omit<Meeting, 'id' | 'scheduledAt'>): Meeting {
  const s = loadState();
  const n = s.counter + 1;
  const meeting: Meeting = { ...m, id: `mtg_${n}`, scheduledAt: new Date().toISOString() };
  persist({
    ...s,
    counter: n,
    meetings: [...s.meetings, meeting],
    meetingSlots: s.meetingSlots.map((sl) => (sl.id === m.slotId ? { ...sl, status: 'booked' } : sl)),
  });
  return meeting;
}

/** Admin opens a new PPT window (the supply recruiters book). */
export function insertPptWindow(w: Omit<PptWindow, 'id' | 'status'>): PptWindow {
  const s = loadState();
  const n = s.counter + 1;
  const window: PptWindow = { ...w, id: `ppt_w_${n}`, status: 'open' };
  persist({ ...s, counter: n, pptWindows: [...s.pptWindows, window] });
  return window;
}

/** Admin opens a new placement-head meeting slot. */
export function insertMeetingSlot(sl: Omit<MeetingSlot, 'id' | 'status'>): MeetingSlot {
  const s = loadState();
  const n = s.counter + 1;
  const slot: MeetingSlot = { ...sl, id: `mtg_s_${n}`, status: 'open' };
  persist({ ...s, counter: n, meetingSlots: [...s.meetingSlots, slot] });
  return slot;
}

export function pptWindowById(id: string): PptWindow | null {
  return loadState().pptWindows.find((w) => w.id === id) ?? null;
}
export function meetingSlotById(id: string): MeetingSlot | null {
  return loadState().meetingSlots.find((s) => s.id === id) ?? null;
}
