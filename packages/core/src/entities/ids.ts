// Branded ID types — prevents accidental cross-type assignment at compile time
// (e.g. passing a StudentId where a RecruiterId is expected).

type Brand<T, B extends string> = T & { readonly __brand: B };

export type CampusId = Brand<string, 'CampusId'>;
export type DisciplineId = Brand<string, 'DisciplineId'>;
export type CycleId = Brand<string, 'CycleId'>;
export type RecruiterId = Brand<string, 'RecruiterId'>;
export type JdId = Brand<string, 'JdId'>;
export type StudentId = Brand<string, 'StudentId'>;
export type ApplicationId = Brand<string, 'ApplicationId'>;
export type ShortlistId = Brand<string, 'ShortlistId'>;
export type SlotId = Brand<string, 'SlotId'>;
export type OfferId = Brand<string, 'OfferId'>;
export type TokenId = Brand<string, 'TokenId'>; // pre-login recruiter application token

export const asCampusId = (s: string): CampusId => s as CampusId;
export const asDisciplineId = (s: string): DisciplineId => s as DisciplineId;
export const asCycleId = (s: string): CycleId => s as CycleId;
export const asRecruiterId = (s: string): RecruiterId => s as RecruiterId;
export const asJdId = (s: string): JdId => s as JdId;
export const asStudentId = (s: string): StudentId => s as StudentId;
