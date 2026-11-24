import { Router } from "express";
import Question from "../models/Question.js";
import {
  requireAuth,
  requireAdmin,
  requireStudent
} from "../middleware/auth.js";

const router = Router();

// Students get 10 random questions.
router.get(
  "/",
  requireAuth,
  requireStudent,
  async (_req, res) => {
    try {
      const questions = await Question.aggregate([
        { $sample: { size: 10 } }
      ]);

      return res.json(
        questions.map((question) => ({
          id: question._id,
          text: question.text,
          options: question.options,
          subject: question.subject
        }))
      );
    } catch (error) {
      console.error("Load questions error:", error.message);

      return res.status(500).json({
        message: "Could not load questions."
      });
    }
  }
);

// Admins can add questions.
router.post(
  "/",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const { text, options, correctAnswer, subject } = req.body;

      if (
        !text?.trim() ||
        !Array.isArray(options) ||
        options.length !== 4 ||
        options.some((option) => !String(option).trim()) ||
        !Number.isInteger(correctAnswer) ||
        correctAnswer < 0 ||
        correctAnswer > 3
      ) {
        return res.status(400).json({
          message:
            "Provide question text, four options, and correctAnswer from 0 to 3."
        });
      }

      const question = await Question.create({
        text: text.trim(),
        options: options.map((option) => String(option).trim()),
        correctAnswer,
        subject: subject || "General Knowledge"
      });

      return res.status(201).json({
        message: "Question added.",
        id: question._id
      });
    } catch (error) {
      console.error("Add question error:", error.message);

      return res.status(500).json({
        message: "Could not add question."
      });
    }
  }
);

export default router;