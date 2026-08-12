import { Router } from "express";
import { catchAsync } from "../lib/catch-async.js";
import { sendCreated, sendDeleted, sendSuccess } from "../lib/response.js";
import { protect, restrictTo } from "../middleware/auth.js";
import * as categoryService from "../services/category/category.service.js";

const router = Router();

router.get(
  "/",
  catchAsync(async (req, res) => {
    const result = await categoryService.getCategories({
      page: Number(req.query.page),
      limit: Number(req.query.limit),
      search: String(req.query.search || ""),
    });
    sendSuccess(res, 200, "Categories retrieved successfully.", result);
  }),
);

router.get(
  "/:id",
  catchAsync(async (req, res) => {
    const category = await categoryService.getCategoryById(String(req.params.id));
    sendSuccess(res, 200, "Category retrieved successfully.", category);
  }),
);

router.post(
  "/",
  protect,
  restrictTo("Admin"),
  catchAsync(async (req, res) => {
    const category = await categoryService.createCategory(req.body);
    sendCreated(res, "Category created successfully.", category);
  }),
);

router.patch(
  "/:id",
  protect,
  restrictTo("Admin"),
  catchAsync(async (req, res) => {
    const category = await categoryService.updateCategory(String(req.params.id), req.body);
    sendSuccess(res, 200, "Category updated successfully.", category);
  }),
);

router.delete(
  "/:id",
  protect,
  restrictTo("Admin"),
  catchAsync(async (req, res) => {
    await categoryService.softDeleteCategory(String(req.params.id));
    sendDeleted(res, "Category deleted successfully.");
  }),
);

export default router;
