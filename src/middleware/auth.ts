import type { NextFunction, Request, Response } from "express";
import prisma from "../lib/prisma";
import { verifyToken } from "../lib/jwt";
import { AppError } from "../lib/app-error";

export async function protect(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return next(new AppError(401, "You are not logged in. Please log in to continue."));
  }

  const token = header.split(" ")[1];

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return next(new AppError(401, "Invalid or expired token. Please log in again."));
  }

  const user = await prisma.user.findUnique({ where: { id: payload.id } });

  if (!user || user.isDeleted) {
    return next(new AppError(401, "The user belonging to this token no longer exists."));
  }

  req.user = { id: user.id, email: user.email, role: user.role };
  next();
}

export function restrictTo(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError(403, "You do not have permission to perform this action."));
    }
    next();
  };
}
