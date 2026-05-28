// Adapter contracts. Implementations live in packages/adapters/ and are
// wired into apps/web via a small DI / module map. Domain code never
// imports concrete implementations — only these interfaces.

export type * from './auth-provider';
export type * from './payment-provider';
export type * from './comms-provider';
export type * from './storage-provider';
export type * from './ai-provider';
export type * from './analytics-provider';
