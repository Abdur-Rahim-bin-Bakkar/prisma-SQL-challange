import { Router } from "express";
import { catchAsync } from "../lib/catch-async";
import { sendCreated, sendDeleted, sendSuccess } from "../lib/response";
import { protect } from "../middleware/auth";
import * as cartService from "../services/cart/cart.service";

const router = Router();

router.use(protect);

router.get(
  "/",
  catchAsync(async (req, res) => {
    const cart = await cartService.getCart(req.user!.id);
    sendSuccess(res, 200, "Cart retrieved successfully.", cart);
  }),
);

router.post(
  "/",
  catchAsync(async (req, res) => {
    const result = await cartService.addToCart(req.user!.id, req.body?.productId, req.body?.quantity);
    sendCreated(res, result.added ? "Added to cart." : "Cart updated.", result.item);
  }),
);

router.patch(
  "/:id",
  catchAsync(async (req, res) => {
    const item = await cartService.updateCartItem(req.user!.id, String(req.params.id), req.body?.quantity);
    sendSuccess(res, 200, "Cart updated successfully.", item);
  }),
);

router.delete(
  "/:id",
  catchAsync(async (req, res) => {
    await cartService.removeFromCart(req.user!.id, String(req.params.id));
    sendDeleted(res, "Removed from cart.");
  }),
);

export default router;
