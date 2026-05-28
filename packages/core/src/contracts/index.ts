// Adapter contracts. Implementations live in packages/adapters/ and are
// wired into apps/web via a small DI / module map. Domain code never
// imports concrete implementations — only these interfaces.

export type * from './auth-provider.js';
export type * from './payment-provider.js';
export type * from './comms-provider.js';
export type * from './storage-provider.js';
export type * from './ai-provider.js';
export type * from './analytics-provider.js';
