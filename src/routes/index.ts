import { Router } from "express";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import categoryRoutes from "./category.routes";
import productRoutes from "./product.routes";
import reviewRoutes from "./review.routes";
import orderRoutes from "./order.routes";
import cartRoutes from "./cart.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/categories", categoryRoutes);
router.use("/products", productRoutes);
router.use("/reviews", reviewRoutes);
router.use("/orders", orderRoutes);
router.use("/cart", cartRoutes);

export default router;
