import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import FormData from "form-data";

const IMGUR_CLIENT_ID = process.env.IMGUR_CLIENT_ID || "62359ea6c1553bd";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get("image") as File;

    if (!imageFile) {
      const response = NextResponse.json(
        { error: "No image uploaded" },
        { status: 400 }
      );
      // Set CORS headers
      response.headers.set("Access-Control-Allow-Origin", "*"); // hoặc chỉ định origin cụ thể
      response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
      response.headers.set("Access-Control-Allow-Headers", "Content-Type");
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
    nextResponse.headers.set("Access-Control-Allow-Origin", "*"); // hoặc chỉ định origin cụ thể
    nextResponse.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    nextResponse.headers.set("Access-Control-Allow-Headers", "Content-Type");
    return nextResponse;
  } catch (error) {
    console.error("Error uploading image:", error);
    const errorResponse = NextResponse.json(
      { message: "Error uploading image" },
      { status: 500 }
    );
    // Set CORS headers
    errorResponse.headers.set("Access-Control-Allow-Origin", "*"); // hoặc chỉ định origin cụ thể
    errorResponse.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    errorResponse.headers.set("Access-Control-Allow-Headers", "Content-Type");
    return errorResponse;
  }
}
