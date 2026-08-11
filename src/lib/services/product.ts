import { Router } from "express";
import prisma from "../prisma";

const router = Router();

router.post("/new", async (req, res) => {
  const data = req.body;

  const product = await prisma.product.create({
    data
  });

  res.json({
    success: true,
    message: "stored",
    product
  });
});

router.get('/products', async(req, res)=>{
    const data = await prisma.product.findMany()
    res.json(data)
})

export default router;