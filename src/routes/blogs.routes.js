import { Router } from "express";
import {
  getAllBlogs,
  getBlogBySlug,
  createBlog,
  updateBlog,
  deleteBlog,
  getTeacherBlogs,
  getBlogById,
  toggleBlogFeatured,
  uploadBlogImage,
} from "../controllers/blog.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

const uploadBlogThumbnail = upload.fields([
  {
    name: "thumbnail",
    maxCount: 1,
  },
]);

// Public routes
router.get("/", getAllBlogs);
router.get("/slug/:slug", getBlogBySlug);

// Teacher routes
router.get("/teacher/my-blogs", verifyJWT, authorizeRoles("teacher"), getTeacherBlogs);

router.post(
  "/upload-image",
  verifyJWT,
  authorizeRoles("teacher"),
  upload.single("image"),
  uploadBlogImage
);

router.post(
  "/create",
  verifyJWT,
  authorizeRoles("teacher"),
  uploadBlogThumbnail,
  createBlog
);

router.get("/:blogId", verifyJWT, authorizeRoles("teacher"), getBlogById);

router.patch(
  "/:blogId",
  verifyJWT,
  authorizeRoles("teacher"),
  uploadBlogThumbnail,
  updateBlog
);

router.delete("/:blogId", verifyJWT, authorizeRoles("teacher"), deleteBlog);

router.patch(
  "/:blogId/featured",
  verifyJWT,
  authorizeRoles("teacher", "admin"),
  toggleBlogFeatured
);

export default router;
