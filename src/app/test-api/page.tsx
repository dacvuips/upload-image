"use client";

import { useState } from "react";

export default function TestApiPage() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch("/api/file/upload-image", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      console.error("Upload error:", error);
      setResult(JSON.stringify({ error: "Upload failed" }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const testHealth = async () => {
    try {
      const response = await fetch("/api/health");
      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      console.error("Health check error:", error);
      setResult(JSON.stringify({ error: "Health check failed" }, null, 2));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">API Test Page</h1>

        <div className="space-y-6">
          {/* Health Check */}
          <div className="border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-2">Health Check</h2>
            <button
              onClick={testHealth}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Test Health Endpoint
            </button>
          </div>

          <div className="border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-2">Image Upload</h2>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 mb-4"
            />
            <button
              onClick={handleUpload}
              disabled={!file || loading}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? "Uploading..." : "Upload Image"}
            </button>
          </div>

          {result && (
            <div className="border rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-2">Result</h2>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {result}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
