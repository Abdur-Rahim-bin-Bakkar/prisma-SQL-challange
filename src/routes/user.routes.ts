import { Router } from "express";
import { catchAsync } from "../lib/catch-async";
import { sendCreated, sendDeleted, sendSuccess } from "../lib/response";
import { protect, restrictTo } from "../middleware/auth";
import * as userService from "../services/user/user.service";

const router = Router();

router.use(protect);

router.get(
  "/",
  catchAsync(async (req, res) => {
    const result = await userService.getUsers({
      page: Number(req.query.page),
      limit: Number(req.query.limit),
      search: String(req.query.search || ""),
    });
    sendSuccess(res, 200, "Users retrieved successfully.", result);
  }),
);

router.post(
  "/",
  restrictTo("Admin"),
  catchAsync(async (req, res) => {
    const user = await userService.createUser(req.body);
    sendCreated(res, "User created successfully.", user);
  }),
);

router.get(
  "/:id",
  catchAsync(async (req, res) => {
    const user = await userService.getUserById(String(req.params.id));
    sendSuccess(res, 200, "User retrieved successfully.", user);
  }),
);

router.patch(
  "/:id",
  restrictTo("Admin"),
  catchAsync(async (req, res) => {
    const user = await userService.updateUser(String(req.params.id), req.body);
    sendSuccess(res, 200, "User updated successfully.", user);
  }),
);

router.delete(
  "/:id",
  restrictTo("Admin"),
  catchAsync(async (req, res) => {
    await userService.softDeleteUser(String(req.params.id));
    sendDeleted(res, "User deleted successfully.");
  }),
);

export default router;
