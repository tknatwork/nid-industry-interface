import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { TransportMode } from './types';

interface StoreState {
  /** recruiterId → transport preference */
  readonly transport: Record<string, TransportMode>;
}

function dataFilePath(): string {
  return resolve(process.cwd(), '.dev-data', 'interview-console.json');
}

function loadState(): StoreState {
  const file = dataFilePath();
  if (!existsSync(file)) return { transport: {} };
  try {
    const p = JSON.parse(readFileSync(file, 'utf8')) as Partial<StoreState>;
    return { transport: p.transport ?? {} };
  } catch {
    return { transport: {} };
  }
}

function persist(state: StoreState): void {
  const file = dataFilePath();
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(state, null, 2), 'utf8');
}

export function readTransport(recruiterId: string): TransportMode {
  return loadState().transport[recruiterId] ?? 'live';
}

export function writeTransport(recruiterId: string, mode: TransportMode): void {
  const state = loadState();
  persist({ transport: { ...state.transport, [recruiterId]: mode } });
}
