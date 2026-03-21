import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import FormData from "form-data";

const IMGUR_CLIENT_ID = process.env.IMGUR_CLIENT_ID || "62359ea6c1553bd";

// CORS Origins — set CORS_ORIGINS=origin1,origin2 in .env to restrict; omit to allow any origin
const corsOriginsEnv = process.env.CORS_ORIGINS?.trim();
const CORS_ORIGINS: string[] | null = (() => {
  if (!corsOriginsEnv) return null;
  const list = corsOriginsEnv.split(",").map((s) => s.trim()).filter(Boolean);
  return list.length ? list : null;
})();

// Helper function to check if origin is allowed
function isOriginAllowed(origin: string): boolean {
  if (CORS_ORIGINS === null) return true;
  return CORS_ORIGINS.includes(origin) || CORS_ORIGINS.includes("*");
}

// Helper function to get CORS headers
function getCorsHeaders(origin?: string) {
  const allowedOrigin =
    CORS_ORIGINS === null
      ? (origin ?? "*")
      : origin && isOriginAllowed(origin)
        ? origin
        : CORS_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders(origin || undefined),
  });
}

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get("origin");
    const formData = await request.formData();
    const imageFile = formData.get("image") as File;

    if (!imageFile) {
      const response = NextResponse.json(
        { error: "No image uploaded" },
        { status: 400 }
      );
      // Set CORS headers
      Object.entries(getCorsHeaders(origin || undefined)).forEach(
        ([key, value]) => {
          response.headers.set(key, value);
        }
      );
      return response;
    }

    // Convert File to base64
    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString("base64");

    const imgurFormData = new FormData();
    imgurFormData.append("image", base64Image);
    imgurFormData.append("type", "base64");
    imgurFormData.append("title", "Simple upload");
    imgurFormData.append(
      "description",
      "This is a simple image upload in Imgur"
    );

    const response = await axios.post(
      "https://api.imgur.com/3/image",
      imgurFormData,
      {
        headers: {
          Authorization: `Client-ID ${IMGUR_CLIENT_ID}`,
          ...imgurFormData.getHeaders(),
        },
        // Let us handle non-2xx responses so we can surface Imgur's error payload.
        validateStatus: () => true,
      }
    );

    const payload = response.data ?? { success: false };
    const corsHeaders = getCorsHeaders(origin || undefined);

    const nextResponse = NextResponse.json(payload, {
      status: response.status || 200,
    });
    // Set CORS headers
    Object.entries(corsHeaders).forEach(
      ([key, value]) => {
        nextResponse.headers.set(key, value);
      }
    );

    // Imgur uses { success: false, data: { error: ... } } on failures.
    if (payload?.success !== true) {
      console.error("Imgur upload failed payload:", payload);
      return nextResponse;
    }

    return nextResponse;
  } catch (error) {
    console.error("Error uploading image:", error);
    const origin = request.headers.get("origin");
    const corsHeaders = getCorsHeaders(origin || undefined);

    // If this is an Axios error, try to forward Imgur's response body.
    if (axios.isAxiosError(error)) {
      const imgurStatus =
        typeof error.response?.status === "number"
          ? error.response.status
          : 500;
      const imgurData = error.response?.data;

      const errorResponse = NextResponse.json(
        {
          message: "Error uploading image",
          imgurStatus: imgurStatus === 500 ? undefined : imgurStatus,
          imgur: imgurData,
        },
        { status: imgurStatus }
      );
      // Set CORS headers
      Object.entries(corsHeaders).forEach(([key, value]) => {
        errorResponse.headers.set(key, value);
      });
      return errorResponse;
    }

    const errorResponse = NextResponse.json(
      { message: "Error uploading image" },
      { status: 500 }
    );
    // Set CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
      errorResponse.headers.set(key, value);
    });
    return errorResponse;
  }
}
