import { Router } from "express";
import { catchAsync } from "../lib/catch-async.js";
import { sendCreated, sendSuccess } from "../lib/response.js";
import { protect } from "../middleware/auth.js";
import * as authService from "../services/auth/auth.service.js";

const router = Router();

router.post(
  "/register",
  catchAsync(async (req, res) => {
    const result = await authService.register(req.body);
    sendCreated(res, "Account created successfully.", result);
  }),
);

router.post(
  "/login",
  catchAsync(async (req, res) => {
    const result = await authService.login(req.body);
    sendSuccess(res, 200, "Logged in successfully.", result);
  }),
);

router.post(
  "/exchange",
  catchAsync(async (req, res) => {
    const result = await authService.exchangeSessionToken(req.body?.token);
    sendSuccess(res, 200, "Session exchanged successfully.", result);
  }),
);

router.get(
  "/me",
  protect,
  catchAsync(async (req, res) => {
    const user = await authService.getCurrentUser(req.user!.id);
    sendSuccess(res, 200, "Current user retrieved successfully.", user);
  }),
);

router.patch(
  "/password",
  protect,
  catchAsync(async (req, res) => {
    const result = await authService.changePassword(req.user!.id, req.body.currentPassword, req.body.newPassword);
    sendSuccess(res, 200, result.message, null);
  }),
);

export default router;
