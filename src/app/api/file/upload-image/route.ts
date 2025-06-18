import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import FormData from "form-data";

const IMGUR_CLIENT_ID = process.env.IMGUR_CLIENT_ID || "62359ea6c1553bd";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get("image") as File;

    if (!imageFile) {
      return NextResponse.json({ error: "No image uploaded" }, { status: 400 });
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

    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Error uploading image:", error);
    return NextResponse.json(
      { message: "Error uploading image" },
      { status: 500 }
    );
  }
}
