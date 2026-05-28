// @nid/core — pure domain logic entrypoint
//
// Exposes:
// - contracts/  — adapter interfaces (AuthProvider, PaymentProvider, etc.)
// - entities/   — domain entity types (Cycle, Recruiter, JD, ...)
// - rules/      — pure business logic (eligibility, stipend, health score)

export * from './contracts/index';
export * from './entities/index';
export * from './rules/index';
