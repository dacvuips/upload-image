import axios from "axios";
import { Request, Response } from "express";
import FormData from "form-data";
import multer from "multer";

const upload = multer();

const IMGUR_CLIENT_ID = process.env.IMGUR_CLIENT_ID || "62359ea6c1553bd";

export default [
  {
    method: "post",
    path: "/api/file/upload-image",
    midd: [upload.single("image")],
    action: async (req: Request, res: Response) => {
      try {
        const imageFile = req.file;
        console.log(imageFile);
        if (!imageFile) {
          return res.status(400).json({ error: "No image uploaded" });
        }

        const formData = new FormData();
        formData.append("image", imageFile.buffer.toString("base64"));
        formData.append("type", "base64");
        formData.append("title", "Simple upload");
        formData.append("description", "This is a simple image upload in Imgur");

        console.log("formData", formData);
        const response = await axios.post("https://api.imgur.com/3/image", formData, {
          headers: {
            Authorization: `Client-ID ${IMGUR_CLIENT_ID}`,
            ...formData.getHeaders(),
          },
        });

        console.log("response", response);

        if (!response.data.success) {
          throw new Error(response.data.data?.error || "Failed to upload image to Imgur");
        }

        return res.status(200).json(response.data);
      } catch (error) {
        console.error("Error uploading image:", error);

        return res.status(500).json({ message: "Error uploading image" });
      }
    },
  },
];
