import type { Response } from "express";

export function sendSuccess<T>(res: Response, status: number, message: string, data: T) {
  return res.status(status).json({ success: true, message, data });
}

export function sendCreated<T>(res: Response, message: string, data: T) {
  return sendSuccess(res, 201, message, data);
}

export function sendDeleted(res: Response, message: string) {
  return sendSuccess(res, 200, message, null);
}
