import { Router } from "express";
import { catchAsync } from "../lib/catch-async.js";
import { sendCreated, sendDeleted, sendSuccess } from "../lib/response.js";
import { protect } from "../middleware/auth.js";
import * as orderService from "../services/order/order.service.js";

const router = Router();

router.use(protect);

router.post(
  "/",
  catchAsync(async (req, res) => {
    const order = await orderService.createOrder(req.user!.id, req.body);
    sendCreated(res, "Order created successfully.", order);
  }),
);

router.get(
  "/",
  catchAsync(async (req, res) => {
    const result = await orderService.getOrders(req.user!.id, req.user!.role, {
      page: Number(req.query.page),
      limit: Number(req.query.limit),
      search: String(req.query.search || ""),
    });
    sendSuccess(res, 200, "Orders retrieved successfully.", result);
  }),
);

router.get(
  "/:id",
  catchAsync(async (req, res) => {
    const order = await orderService.getOrderById(req.user!.id, req.user!.role, String(req.params.id));
    sendSuccess(res, 200, "Order retrieved successfully.", order);
  }),
);

router.patch(
  "/:id",
  catchAsync(async (req, res) => {
    const order = await orderService.updateOrder(req.user!.id, req.user!.role, String(req.params.id), req.body);
    sendSuccess(res, 200, "Order updated successfully.", order);
  }),
);

router.delete(
  "/:id",
  catchAsync(async (req, res) => {
    await orderService.softDeleteOrder(req.user!.id, req.user!.role, String(req.params.id));
    sendDeleted(res, "Order deleted successfully.");
  }),
);

export default router;
