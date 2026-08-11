import { Router } from "express";
import { catchAsync } from "../lib/catch-async";
import { sendCreated, sendDeleted, sendSuccess } from "../lib/response";
import { protect } from "../middleware/auth";
import * as reviewService from "../services/review/review.service";

const router = Router();

router.get(
  "/",
  catchAsync(async (req, res) => {
    const result = await reviewService.getReviews({
      page: Number(req.query.page),
      limit: Number(req.query.limit),
      search: String(req.query.search || ""),
    });
    sendSuccess(res, 200, "Reviews retrieved successfully.", result);
  }),
);

router.get(
  "/:id",
  catchAsync(async (req, res) => {
    const review = await reviewService.getReviewById(String(req.params.id));
    sendSuccess(res, 200, "Review retrieved successfully.", review);
  }),
);

router.post(
  "/",
  protect,
  catchAsync(async (req, res) => {
    const review = await reviewService.createReview(req.user!.id, req.body);
    sendCreated(res, "Review created successfully.", review);
  }),
);

router.patch(
  "/:id",
  protect,
  catchAsync(async (req, res) => {
    const review = await reviewService.updateReview(req.user!.id, req.user!.role, String(req.params.id), req.body);
    sendSuccess(res, 200, "Review updated successfully.", review);
  }),
);

router.delete(
  "/:id",
  protect,
  catchAsync(async (req, res) => {
    await reviewService.softDeleteReview(req.user!.id, req.user!.role, String(req.params.id));
    sendDeleted(res, "Review deleted successfully.");
  }),
);

export default router;
