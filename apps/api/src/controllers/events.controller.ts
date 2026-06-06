import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const captureEvent = async (req: any, res: any) => {
  try {
    const { projectKey, type, message, stack, url, userAgent } = req.body;

    const newEvent = await prisma.event.create({
      data: {
        projectKey,
        type,
        message,
        stack: stack || null,
        url: url || null,
        userAgent: userAgent || null,
      },
    });

    if (req.io) {
      req.io.emit("new-event", newEvent);
    }

    return res.status(201).json({
      success: true,
      data: newEvent,
    });
  } catch (error: unknown) {
    console.error("Capture Event error:");
    const errorMessage = error instanceof Error ? error.message : String(error);
    return res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
};
