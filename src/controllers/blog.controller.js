import { AsyncHandler } from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Blog } from "../models/blog.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import {
  bumpCacheVersion,
  deleteCache,
  getCachedJson,
  getCacheVersion,
  setCachedJson,
} from "../utils/cache.js";

const invalidateBlogCache = async (slugs = []) => {
  await Promise.all([
    deleteCache(slugs.map((slug) => `lms:blog:public:${slug}`)),
    bumpCacheVersion("blog-catalog"),
  ]);
};

const generateSlug = (title) => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const parseTags = (tags) => {
  if (Array.isArray(tags)) return tags;

  if (typeof tags === "string") {
    try {
      const parsedTags = JSON.parse(tags);
      return Array.isArray(parsedTags) ? parsedTags : [tags];
    } catch {
      return tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
    }
  }

  return [];
};

export const getAllBlogs = AsyncHandler(async (req, res) => {
  const { page = 1, limit = 12, search, tag, featured } = req.query;

  const filter = { status: "published" };

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { content: { $regex: search, $options: "i" } },
      { excerpt: { $regex: search, $options: "i" } },
    ];
  }

  if (tag) {
    filter.tags = { $in: [tag] };
  }

  if (featured === "true") {
    filter.isFeatured = true;
  }

  const skip = (Number(page) - 1) * Number(limit);

  const canCache = !search;
  const version = canCache ? await getCacheVersion("blog-catalog") : null;
  const cacheKey = canCache
    ? `lms:blog:catalog:v${version}:page:${page}:limit:${limit}:tag:${encodeURIComponent(tag || "")}:featured:${featured || ""}`
    : null;
  const cached = cacheKey ? await getCachedJson(cacheKey) : null;
  if (cached) {
    return res.status(200).json(
      new ApiResponse(200, cached, "Blogs fetched successfully.")
    );
  }

  const blogs = await Blog.find(filter)
    .populate("author", "fullName")
    .sort({ publishedAt: -1, createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .lean();

  const total = await Blog.countDocuments(filter);

  const result = {
    blogs,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / Number(limit)),
  };
  if (cacheKey) await setCachedJson(cacheKey, result, 300);
  return res.status(200).json(new ApiResponse(200, result, "Blogs fetched successfully."));
});

export const getBlogBySlug = AsyncHandler(async (req, res) => {
  const { slug } = req.params;
  const cacheKey = `lms:blog:public:${slug}`;
  const cached = await getCachedJson(cacheKey);
  if (cached) {
    return res.status(200).json(
      new ApiResponse(200, cached, "Blog fetched successfully.")
    );
  }

  const blog = await Blog.findOne({ slug, status: "published" })
    .populate("author", "fullName email")
    .lean();

  if (!blog) {
    return res.status(404).json(
      new ApiResponse(404, null, "Blog not found")
    );
  }

  await setCachedJson(cacheKey, blog, 600);

  return res.status(200).json(
    new ApiResponse(200, blog, "Blog fetched successfully.")
  );
});

export const createBlog = AsyncHandler(async (req, res) => {
  const { title, content, excerpt, thumbnail, tags, status } = req.body;

  if (!title || !content) {
    return res.status(400).json(
      new ApiResponse(400, null, "Title and content are required")
    );
  }

  let slug = generateSlug(title);

  const existingBlog = await Blog.findOne({ slug });
  if (existingBlog) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  const thumbnailFile = req.files?.thumbnail?.[0];
  const uploadedThumbnail = thumbnailFile
    ? await uploadOnCloudinary(thumbnailFile.path)
    : null;

  if (thumbnailFile && !uploadedThumbnail?.secure_url) {
    return res.status(500).json(
      new ApiResponse(500, null, "Failed to upload blog thumbnail")
    );
  }

  const blog = await Blog.create({
    title,
    slug,
    content,
    excerpt: excerpt || "",
    thumbnail: uploadedThumbnail?.secure_url || thumbnail || "",
    tags: parseTags(tags),
    status: status || "draft",
    author: req.user._id,
    publishedAt: status === "published" ? new Date() : null,
  });

  const populatedBlog = await Blog.findById(blog._id).populate(
    "author",
    "fullName email"
  );
  await invalidateBlogCache([blog.slug]);

  return res
    .status(201)
    .json(new ApiResponse(201, populatedBlog, "Blog created successfully."));
});

export const uploadBlogImage = AsyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json(new ApiResponse(400, null, "An image file is required"));
  }

  const uploadedImage = await uploadOnCloudinary(req.file.path);
  if (!uploadedImage?.secure_url) {
    return res.status(500).json(new ApiResponse(500, null, "Failed to upload blog image"));
  }

  return res.status(201).json(
    new ApiResponse(201, { url: uploadedImage.secure_url }, "Blog image uploaded successfully.")
  );
});

export const updateBlog = AsyncHandler(async (req, res) => {
  const { blogId } = req.params;
  const { title, content, excerpt, thumbnail, tags, status } = req.body;

  const blog = await Blog.findById(blogId);
  const oldSlug = blog?.slug;

  if (!blog) {
    return res.status(404).json(
      new ApiResponse(404, null, "Blog not found")
    );
  }

  if (blog.author.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    return res.status(403).json(
      new ApiResponse(403, null, "Not authorized to update this blog")
    );
  }

  if (title && title !== blog.title) {
    blog.title = title;
    let newSlug = generateSlug(title);
    const existingBlog = await Blog.findOne({ slug: newSlug, _id: { $ne: blogId } });
    if (existingBlog) {
      newSlug = `${newSlug}-${Date.now().toString(36)}`;
    }
    blog.slug = newSlug;
  }

  const thumbnailFile = req.files?.thumbnail?.[0];
  const uploadedThumbnail = thumbnailFile
    ? await uploadOnCloudinary(thumbnailFile.path)
    : null;

  if (thumbnailFile && !uploadedThumbnail?.secure_url) {
    return res.status(500).json(
      new ApiResponse(500, null, "Failed to upload blog thumbnail")
    );
  }

  if (content !== undefined) blog.content = content;
  if (excerpt !== undefined) blog.excerpt = excerpt;
  if (uploadedThumbnail?.secure_url) blog.thumbnail = uploadedThumbnail.secure_url;
  else if (thumbnail !== undefined) blog.thumbnail = thumbnail;
  if (tags !== undefined) blog.tags = parseTags(tags);

  if (status && status !== blog.status) {
    blog.status = status;
    if (status === "published" && !blog.publishedAt) {
      blog.publishedAt = new Date();
    }
  }

  await blog.save();
  await invalidateBlogCache([oldSlug, blog.slug]);

  const updatedBlog = await Blog.findById(blog._id).populate(
    "author",
    "fullName email"
  );

  return res.status(200).json(
    new ApiResponse(200, updatedBlog, "Blog updated successfully.")
  );
});

export const deleteBlog = AsyncHandler(async (req, res) => {
  const { blogId } = req.params;

  const blog = await Blog.findById(blogId);

  if (!blog) {
    return res.status(404).json(
      new ApiResponse(404, null, "Blog not found")
    );
  }

  if (blog.author.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    return res.status(403).json(
      new ApiResponse(403, null, "Not authorized to delete this blog")
    );
  }

  await Blog.findByIdAndDelete(blogId);
  await invalidateBlogCache([blog.slug]);

  return res.status(200).json(
    new ApiResponse(200, null, "Blog deleted successfully.")
  );
});

export const getTeacherBlogs = AsyncHandler(async (req, res) => {
  const { page = 1, limit = 12, search } = req.query;

  const filter = { author: req.user._id };

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { content: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const blogs = await Blog.find(filter)
    .populate("author", "fullName")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await Blog.countDocuments(filter);

  return res.status(200).json(
    new ApiResponse(200, {
      blogs,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    }, "Teacher blogs fetched successfully.")
  );
});

export const getBlogById = AsyncHandler(async (req, res) => {
  const { blogId } = req.params;

  const blog = await Blog.findById(blogId)
    .populate("author", "fullName email");

  if (!blog) {
    return res.status(404).json(
      new ApiResponse(404, null, "Blog not found")
    );
  }

  return res.status(200).json(
    new ApiResponse(200, blog, "Blog fetched successfully.")
  );
});

export const toggleBlogFeatured = AsyncHandler(async (req, res) => {
  const { blogId } = req.params;

  const blog = await Blog.findById(blogId);

  if (!blog) {
    return res.status(404).json(
      new ApiResponse(404, null, "Blog not found")
    );
  }

  blog.isFeatured = !blog.isFeatured;
  await blog.save();
  await invalidateBlogCache([blog.slug]);

  return res.status(200).json(
    new ApiResponse(200, blog, `Blog ${blog.isFeatured ? "featured" : "unfeatured"} successfully.`)
  );
});
