import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config(); 

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    await fs.promises.unlink(localFilePath);

    return response;

  } catch (error) {
    console.error("Cloudinary Upload Error:", error);

    if (localFilePath && fs.existsSync(localFilePath)) {
      await fs.promises.unlink(localFilePath);
    }

    throw error;
  }
};


const deleteFromCloudinary = async (publicId, resource_type = "image") => {
  try {
    if (!publicId) return null;
        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: resource_type
        })

        return result;

  } catch (error) {
    console.error("Cloudinary Delete Error:", error);
    return null;
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };










