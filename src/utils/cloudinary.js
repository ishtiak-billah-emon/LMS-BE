import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Extracts the Cloudinary public id (including folder) from a delivery URL.
const extractPublicId = (url) => {
  const match = url.match(
    /\/upload\/(?:v\d+\/)?(.+)\.(?:jpg|jpeg|png|gif|webp|avif|svg|bmp|ico)$/i
  );
  if (match) return match[1];
  return url.split("/").pop().split(".")[0];
};

const uploadOnCloudinary = async (localFilePath) => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  try {
    if (!localFilePath) return null;

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      folder: "tutor-time/avatars",
    });

    // Remove the locally saved temporary file after a successful upload.
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }

    return response;
  } catch (error) {
    // Clean up the temp file if the upload failed.
    if (localFilePath && fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    return null;
  }
};

const deleteFromCloudinary = async (imageUrl) => {
  if (!imageUrl) return;

  try {
    const publicId = extractPublicId(imageUrl);
    if (publicId) {
      await cloudinary.uploader.destroy(publicId);
    }
  } catch (error) {
    // console.log("Cloudinary delete error:", error);
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };
