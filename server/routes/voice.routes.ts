import { Router } from "express";
import multer from "multer";
import { processVoiceCommand } from "../controllers/voice.controller";

const router = Router();

// Configure multer for memory storage (files kept in RAM for quick processing)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    }
});

// POST /api/voice/command
router.post("/command", upload.single("audio"), processVoiceCommand);

export default router;
