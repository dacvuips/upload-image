import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import FormData from "form-data";

const IMGUR_CLIENT_ID = process.env.IMGUR_CLIENT_ID || "62359ea6c1553bd";

// CORS Origins - you can set this in .env file as CORS_ORIGINS=origin1,origin2,origin3
const CORS_ORIGINS = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",")
  : ["https://xmmo.store", "https://storemmo.net"];

// Helper function to check if origin is allowed
function isOriginAllowed(origin: string): boolean {
  return CORS_ORIGINS.includes(origin) || CORS_ORIGINS.includes("*");
}

// Helper function to get CORS headers
function getCorsHeaders(origin?: string) {
  const allowedOrigin =
    origin && isOriginAllowed(origin) ? origin : CORS_ORIGINS[0];
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
      }
    );

    if (!response.data.success) {
      throw new Error(
        response.data.data?.error || "Failed to upload image to Imgur"
      );
    }

    const nextResponse = NextResponse.json(response.data);
    // Set CORS headers
    Object.entries(getCorsHeaders(origin || undefined)).forEach(
      ([key, value]) => {
        nextResponse.headers.set(key, value);
      }
    );
    return nextResponse;
  } catch (error) {
    console.error("Error uploading image:", error);
    const origin = request.headers.get("origin");
    const errorResponse = NextResponse.json(
      { message: "Error uploading image" },
      { status: 500 }
    );
    // Set CORS headers
    Object.entries(getCorsHeaders(origin || undefined)).forEach(
      ([key, value]) => {
        errorResponse.headers.set(key, value);
      }
    );
    return errorResponse;
  }
}
