import type { NextFunction, Request, Response } from "express";
import { AppError } from "../lib/app-error";

export function notFound(_req: Request, _res: Response, next: NextFunction) {
  next(new AppError(404, "Route not found."));
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      data: null,
    });
  }

  if (err.name === "PrismaClientKnownRequestError") {
    const prismaErr = err as { code?: string };
    if (prismaErr.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "A record with this value already exists.",
        data: null,
      });
    }
    if (prismaErr.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Record not found.",
        data: null,
      });
    }
  }

  console.error(err);

  return res.status(500).json({
    success: false,
    message: "Something went wrong on the server.",
    data: null,
  });
}
