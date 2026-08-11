import { Router } from "express";
import { catchAsync } from "../lib/catch-async";
import { sendCreated, sendDeleted, sendSuccess } from "../lib/response";
import { protect, restrictTo } from "../middleware/auth";
import * as productService from "../services/product/product.service";

const router = Router();

router.get(
  "/",
  catchAsync(async (req, res) => {
    const result = await productService.getProducts({
      page: Number(req.query.page),
      limit: Number(req.query.limit),
      search: String(req.query.search || ""),
    });
    sendSuccess(res, 200, "Products retrieved successfully.", result);
  }),
);

router.get(
  "/:id",
  catchAsync(async (req, res) => {
    const product = await productService.getProductById(String(req.params.id));
    sendSuccess(res, 200, "Product retrieved successfully.", product);
  }),
);

router.post(
  "/",
  protect,
  restrictTo("Admin"),
  catchAsync(async (req, res) => {
    const product = await productService.createProduct(req.body);
    sendCreated(res, "Product created successfully.", product);
  }),
);

router.patch(
  "/:id",
  protect,
  restrictTo("Admin"),
  catchAsync(async (req, res) => {
    const product = await productService.updateProduct(String(req.params.id), req.body);
    sendSuccess(res, 200, "Product updated successfully.", product);
  }),
);

router.delete(
  "/:id",
  protect,
  restrictTo("Admin"),
  catchAsync(async (req, res) => {
    await productService.softDeleteProduct(String(req.params.id));
    sendDeleted(res, "Product deleted successfully.");
  }),
);

export default router;
