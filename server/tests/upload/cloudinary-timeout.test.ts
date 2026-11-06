import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Writable } from "node:stream";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const uploadStreamMock = vi.fn();
const apiResourceMock = vi.fn();

vi.mock("cloudinary", () => ({
  v2: {
    config: vi.fn(),
    url: vi.fn(),
    api: {
      resource: (...args: unknown[]) => apiResourceMock(...args),
    },
    uploader: {
      upload_stream: (...args: unknown[]) => uploadStreamMock(...args),
      destroy: vi.fn(),
    },
  },
}));

process.env.CLOUDINARY_CLOUD_NAME = "demo";
process.env.CLOUDINARY_API_KEY = "test-key";
process.env.CLOUDINARY_API_SECRET = "test-secret";

const { uploadImageFileToCloudinary, CLOUDINARY_UPLOAD_TIMEOUT_MS } = await import(
  "../../src/lib/cloudinary.ts"
);
const { AppError } = await import("../../src/common/errors/AppError.ts");

type UploadCallback = (error: unknown, result?: unknown) => void;

const uploadResult = (publicId: string) => ({
  public_id: publicId,
  secure_url: `https://res.cloudinary.com/demo/image/upload/${publicId}.jpg`,
  url: `http://res.cloudinary.com/demo/image/upload/${publicId}.jpg`,
});

const consumingStream = () => new Writable({ write(_chunk, _enc, cb) { cb(); } });

const dir = mkdtempSync(join(tmpdir(), "cloudinary-timeout-"));
const filePath = join(dir, "image.png");
writeFileSync(filePath, "not-a-real-image-but-piping-is-all-that-matters");

beforeEach(() => {
  uploadStreamMock.mockReset();
  apiResourceMock.mockReset();
});

afterAll(() => {
  vi.unstubAllEnvs();
});

describe("uploadImageFileToCloudinary timeout handling", () => {
  it("honors the per-upload timeout option instead of the fixed default", async () => {
    // Stream never invokes its completion callback, forcing the wrapper timer to fire.
    uploadStreamMock.mockImplementation(() => consumingStream());
    // Reconcile cannot confirm the asset, so the timeout stays a failure.
    apiResourceMock.mockRejectedValue({ error: { message: "Resource not found", http_code: 404 } });

    const started = Date.now();
    const error = await uploadImageFileToCloudinary(filePath, { timeout: 50 }).catch(
      (err) => err
    );
    const elapsed = Date.now() - started;

    // The option must be forwarded to the Cloudinary SDK (single source of truth).
    expect(uploadStreamMock).toHaveBeenCalled();
    for (const [options] of uploadStreamMock.mock.calls) {
      expect((options as { timeout?: number }).timeout).toBe(50);
    }

    // Regression guard: with the old fixed 20s/60s default this would never resolve this fast.
    expect(elapsed).toBeLessThan(5_000);
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).statusCode).toBe(504);

    // Timeout is transient, so it is retried CLOUDINARY_MAX_ATTEMPTS times.
    expect(uploadStreamMock).toHaveBeenCalledTimes(3);
  });

  it("falls back to the configured default timeout when none is provided", async () => {
    uploadStreamMock.mockImplementation(
      (_options: unknown, callback: UploadCallback) => {
        const stream = consumingStream();
        setImmediate(() => callback(null, uploadResult("defaultid")));
        return stream;
      }
    );

    await uploadImageFileToCloudinary(filePath);

    const [options] = uploadStreamMock.mock.calls[0] as [{ timeout?: number }];
    expect(options.timeout).toBe(CLOUDINARY_UPLOAD_TIMEOUT_MS);
  });
});

describe("uploadImageFileToCloudinary idempotency", () => {
  it("uses one fixed public_id across all retry attempts", async () => {
    uploadStreamMock.mockImplementation(() => consumingStream());
    apiResourceMock.mockRejectedValue({ error: { message: "Resource not found", http_code: 404 } });

    await uploadImageFileToCloudinary(filePath, { timeout: 50 }).catch(() => undefined);

    const ids = uploadStreamMock.mock.calls.map(
      ([options]) => (options as { public_id?: string }).public_id
    );
    expect(ids).toHaveLength(3);
    expect(new Set(ids).size).toBe(1);
    expect(ids[0]).toMatch(/^[a-z0-9]{20}$/);
    // Retrying the same id must overwrite rather than create duplicates.
    for (const [options] of uploadStreamMock.mock.calls) {
      expect((options as { overwrite?: boolean }).overwrite).toBe(true);
    }
  });

  it("treats a timed-out upload as success when the asset actually landed", async () => {
    // Upload times out, but reconcile finds the asset -> no duplicate, no error.
    uploadStreamMock.mockImplementation(() => consumingStream());
    apiResourceMock.mockResolvedValue({
      public_id: "landedasset12345678",
      secure_url: "https://res.cloudinary.com/demo/image/upload/landed.jpg",
      url: "http://res.cloudinary.com/demo/image/upload/landed.jpg",
      bytes: 123,
      format: "jpg",
    });

    const result = await uploadImageFileToCloudinary(filePath, { timeout: 50 });

    expect(result.public_id).toBe("landedasset12345678");
    // Reconcile succeeded on the first attempt, so we must NOT retry/duplicate.
    expect(uploadStreamMock).toHaveBeenCalledTimes(1);
    expect(apiResourceMock).toHaveBeenCalledTimes(1);
  });

  it("reconciles by the same public_id it uploaded with", async () => {
    uploadStreamMock.mockImplementation(() => consumingStream());
    apiResourceMock.mockResolvedValue({
      public_id: "x",
      secure_url: "u",
      url: "u",
      bytes: 1,
      format: "jpg",
    });

    await uploadImageFileToCloudinary(filePath, { timeout: 50 });

    const uploadedId = (uploadStreamMock.mock.calls[0] as [{ public_id?: string }])[0].public_id;
    expect(apiResourceMock).toHaveBeenCalledWith(uploadedId, { resource_type: "image" });
  });
});
