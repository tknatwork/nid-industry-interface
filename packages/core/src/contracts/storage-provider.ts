/**
 * StorageProvider — file storage adapter contract.
 *
 * Used for:
 * - Recruiter-uploaded JD attachments (transcoded to PDF/A on upload).
 * - GST invoices, payment receipts (PDF/A-2).
 * - Recruiter offer letters (recruiter-supplied, stored as PDF/A).
 * - Re-encoded portfolio thumbnails (WebP/AVIF) from the portfolio.nid.edu
 *   server-side ingest pipeline (Phase 6.7).
 *
 * Implementations: Vercel Blob (prototype), S3-compatible / MinIO (self-hosted production).
 */

export type StorageBucket =
  | 'jd-attachments'
  | 'invoices'
  | 'receipts'
  | 'offer-letters'
  | 'portfolio-thumbnails'
  | 'brochures'
  | 'recruiter-logos';

export interface StorageObject {
  readonly bucket: StorageBucket;
  readonly key: string;
  readonly contentType: string;
  readonly sizeBytes: number;
  readonly uploadedAt: Date;
  readonly checksum: string; // SHA-256
  readonly url: string; // CDN URL with appropriate cache headers
}

export interface UploadRequest {
  readonly bucket: StorageBucket;
  readonly key: string;
  readonly contentType: string;
  readonly data: Uint8Array | ReadableStream<Uint8Array>;
}

export interface StorageProvider {
  upload(req: UploadRequest): Promise<StorageObject>;
  get(bucket: StorageBucket, key: string): Promise<StorageObject | null>;
  delete(bucket: StorageBucket, key: string): Promise<{ deleted: true }>;
  signUrl(bucket: StorageBucket, key: string, expiresInSeconds: number): Promise<string>;
}
