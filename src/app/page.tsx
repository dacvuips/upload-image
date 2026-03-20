"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type HealthState = { status: "idle" | "loading" | "ok" | "error"; message?: string };

type UploadStatus = "queued" | "uploading" | "success" | "error";

type UploadResult = {
  key: string;
  fileName: string;
  status: UploadStatus;
  link?: string;
  error?: string;
};

function fileKey(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

export default function Home() {
  const [health, setHealth] = useState<HealthState>({ status: "idle" });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [results, setResults] = useState<Record<string, UploadResult>>({});
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setHealth({ status: "loading" });

    fetch("/api/health")
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (!res.ok || json?.status !== "OK") {
          throw new Error(json?.message || "Health check failed");
        }
        if (!cancelled) setHealth({ status: "ok" });
      })
      .catch((e) => {
        if (!cancelled) setHealth({ status: "error", message: e?.message || "Unknown error" });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const previews = useMemo(() => {
    return selectedFiles.map((file) => ({
      key: fileKey(file),
      file,
      url: URL.createObjectURL(file),
    }));
  }, [selectedFiles]);

  useEffect(() => {
    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [previews]);

  function onPickFiles(list: FileList | null) {
    if (!list) return;
    const files = Array.from(list).filter((f) => f.type.startsWith("image/"));
    setSelectedFiles(files);

    const nextResults: Record<string, UploadResult> = {};
    for (const f of files) {
      const key = fileKey(f);
      nextResults[key] = {
        key,
        fileName: f.name,
        status: "queued",
      };
    }
    setResults(nextResults);
  }

  async function uploadOne(file: File) {
    const key = fileKey(file);

    setResults((prev) => ({
      ...prev,
      [key]: {
        key,
        fileName: file.name,
        status: "uploading",
      },
    }));

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch("/api/file/upload-image", {
        method: "POST",
        body: formData,
      });

      const json = await res.json().catch(() => ({}));

      // Imgur response shape: { success: boolean, data: { link, ... }, status: number }
      if (!res.ok || json?.success !== true) {
        const msg =
          json?.data?.error ||
          json?.data?.message ||
          json?.imgur?.data?.error ||
          json?.imgur?.data?.message ||
          json?.imgur?.error ||
          json?.message ||
          `Upload failed (HTTP ${res.status})`;
        throw new Error(typeof msg === "string" ? msg : "Upload failed");
      }

      const link = json?.data?.link as string | undefined;

      setResults((prev) => ({
        ...prev,
        [key]: {
          key,
          fileName: file.name,
          status: "success",
          link,
        },
      }));
    } catch (e) {
      const message = e instanceof Error ? e.message : "Upload error";
      setResults((prev) => ({
        ...prev,
        [key]: {
          key,
          fileName: file.name,
          status: "error",
          error: message,
        },
      }));
    }
  }

  async function uploadAll() {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    try {
      // Upload song song để nhanh hơn; mỗi ảnh tự xử lý lỗi của nó.
      await Promise.all(selectedFiles.map((f) => uploadOne(f)));
    } finally {
      setUploading(false);
    }
  }

  const total = selectedFiles.length;
  const successCount = Object.values(results).filter((r) => r.status === "success").length;
  const errorCount = Object.values(results).filter((r) => r.status === "error").length;

  return (
    <div className="min-h-screen p-8 pb-20 font-[family-name:var(--font-geist-sans)]">
      <main className="max-w-4xl mx-auto flex flex-col gap-8">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Image src="/next.svg" alt="Next.js" width={34} height={34} />
            <div>
              <div className="text-xl font-semibold">Upload ảnh</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                {health.status === "loading" && "Đang kiểm tra server..."}
                {health.status === "ok" && "Server sẵn sàng"}
                {health.status === "error" && `Server lỗi: ${health.message}`}
                {health.status === "idle" && "Chờ..."}
              </div>
            </div>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-300">
            {total > 0 ? (
              <span>
                {successCount} thành công / {total} ảnh
                {errorCount > 0 ? ` • ${errorCount} lỗi` : ""}
              </span>
            ) : (
              <span>Chọn ảnh để bắt đầu</span>
            )}
          </div>
        </div>

        <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-black/20 p-5 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div
              className={`flex flex-col items-center justify-center text-center gap-3 cursor-pointer rounded-lg px-4 py-8 transition-colors border border-dashed ${
                dragActive
                  ? "border-blue-500 bg-blue-50/80 dark:bg-blue-950/40"
                  : "border-gray-200 dark:border-gray-800 bg-transparent"
              } w-full md:w-[420px] min-h-[220px]`}
              onDragOver={(e) => {
                e.preventDefault();
                if (uploading) return;
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                if (uploading) return;
                onPickFiles(e.dataTransfer.files);
              }}
            >
              <label className="flex flex-col items-center gap-3 cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => onPickFiles(e.target.files)}
                  className="hidden"
                  disabled={uploading}
                />
                <span className="rounded-lg border border-gray-200 dark:border-gray-800 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  {dragActive ? "Thả ảnh để upload" : "Chọn nhiều ảnh"}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  PNG/JPG/GIF/...
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Kéo thả ảnh vào đây hoặc bấm để chọn
                </span>
              </label>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedFiles([]);
                  setResults({});
                }}
                disabled={uploading || selectedFiles.length === 0}
                className="rounded-lg border border-gray-200 dark:border-gray-800 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                Xóa
              </button>
              <button
                type="button"
                onClick={uploadAll}
                disabled={uploading || selectedFiles.length === 0}
                className="rounded-lg bg-gray-900 text-white px-4 py-2 hover:opacity-90 transition-opacity disabled:opacity-50 dark:bg-white dark:text-black"
              >
                {uploading ? "Đang upload..." : "Upload lên Imgur"}
              </button>
            </div>
          </div>

          {previews.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {previews.map((p) => {
                const r = results[p.key];
                return (
                  <div
                    key={p.key}
                    className="rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900"
                  >
                    <div className="aspect-[4/3] bg-gray-100 dark:bg-gray-900">
                      <img
                        src={p.url}
                        alt={p.file.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-3">
                      <div className="text-xs font-medium truncate" title={p.file.name}>
                        {p.file.name}
                      </div>
                      <div className="mt-2 text-xs">
                        {r?.status === "queued" && (
                          <span className="text-gray-500 dark:text-gray-400">Chờ...</span>
                        )}
                        {r?.status === "uploading" && (
                          <span className="text-blue-600 dark:text-blue-400">Đang upload...</span>
                        )}
                        {r?.status === "success" && (
                          <span className="text-green-600 dark:text-green-400 font-medium">
                            Thành công
                          </span>
                        )}
                        {r?.status === "error" && (
                          <span className="text-red-600 dark:text-red-400 font-medium">Lỗi</span>
                        )}
                      </div>
                      {r?.status === "success" && r.link && (
                        <div className="mt-2">
                          <a
                            href={r.link}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-blue-600 dark:text-blue-400 underline break-all"
                          >
                            {r.link}
                          </a>
                          <div className="mt-2">
                            <button
                              type="button"
                              className="rounded-md border border-gray-200 dark:border-gray-800 px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                              onClick={async () => {
                                try {
                                  await navigator.clipboard.writeText(r.link || "");
                                } catch {
                                  // ignore
                                }
                              }}
                            >
                              Copy link
                            </button>
                          </div>
                        </div>
                      )}
                      {r?.status === "error" && r.error && (
                        <div className="mt-2 text-[11px] text-red-600 dark:text-red-400 break-words">
                          {r.error}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {previews.length === 0 && (
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Chưa có ảnh nào. Chọn nhiều ảnh ở nút bên trên rồi bấm <b>Upload lên Imgur</b>.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
