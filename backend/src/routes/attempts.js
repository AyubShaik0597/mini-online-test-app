import { Router } from "express";
import mongoose from "mongoose";
import Attempt from "../models/Attempt.js";
import Question from "../models/Question.js";
import User from "../models/User.js";
import {
  requireAuth,
  requireAdmin,
  requireStudent
} from "../middleware/auth.js";

const router = Router();

// Submit an exam. Administrators cannot submit student exams.
router.post(
  "/",
  requireAuth,
  requireStudent,
  async (req, res) => {
    try {
      const submitted = Array.isArray(req.body.answers)
        ? req.body.answers
        : [];

      if (!submitted.length) {
        return res.status(400).json({
          message: "No answers submitted."
        });
      }

      const validIds = submitted
        .filter(
          (answer) =>
            answer.questionId &&
            mongoose.isValidObjectId(answer.questionId)
        )
        .map((answer) => answer.questionId);

      const uniqueIds = [...new Set(validIds.map(String))];

      if (uniqueIds.length !== 10) {
        return res.status(400).json({
          message: "A test must contain 10 valid questions."
        });
      }

      const questions = await Question.find({
        _id: { $in: uniqueIds }
      });

      if (questions.length !== 10) {
        return res.status(400).json({
          message: "Some questions are no longer available."
        });
      }

      const byId = new Map(
        questions.map((question) => [
          String(question._id),
          question
        ])
      );

      const seen = new Set();

      for (const answer of submitted) {
        const id = String(answer.questionId);

        if (seen.has(id) || !byId.has(id)) {
          return res.status(400).json({
            message: "Invalid or duplicate question submitted."
          });
        }

        seen.add(id);
      }

      const answers = submitted.map((answer) => {
        const question = byId.get(String(answer.questionId));

        const selected =
          Number.isInteger(answer.selectedAnswer) &&
          answer.selectedAnswer >= 0 &&
          answer.selectedAnswer <= 3
            ? answer.selectedAnswer
            : null;

        return {
          questionId: question._id,
          selectedAnswer: selected,
          correctAnswer: question.correctAnswer,
          isCorrect: selected === question.correctAnswer
        };
      });

      const score = answers.filter(
        (answer) => answer.isCorrect
      ).length;

      const attempt = await Attempt.create({
        user: req.user._id,
        score,
        total: answers.length,
        answers,
        autoSubmitted: Boolean(req.body.autoSubmitted)
      });

      const detailedAnswers = answers.map((answer) => {
        const question = byId.get(
          String(answer.questionId)
        );

        return {
          questionId: answer.questionId,
          text: question.text,
          options: question.options,
          selectedAnswer: answer.selectedAnswer,
          correctAnswer: answer.correctAnswer,
          isCorrect: answer.isCorrect
        };
      });

      return res.status(201).json({
        id: attempt._id,
        score,
        total: attempt.total,
        percentage: Math.round(
          (score / attempt.total) * 100
        ),
        submittedAt: attempt.submittedAt,
        autoSubmitted: attempt.autoSubmitted,
        answers: detailedAnswers
      });
    } catch (error) {
      console.error("Submit attempt error:", error.message);

      return res.status(500).json({
        message: "Could not save this attempt."
      });
    }
  }
);

// Student's own attempt history.
router.get(
  "/me",
  requireAuth,
  requireStudent,
  async (req, res) => {
    try {
      const attempts = await Attempt.find({
        user: req.user._id
      })
        .sort({ submittedAt: -1 })
        .limit(100)
        .lean();

      return res.json(
        attempts.map((attempt) => ({
          id: attempt._id,
          score: attempt.score,
          total: attempt.total,
          percentage:
            attempt.total > 0
              ? Math.round(
                  (attempt.score / attempt.total) * 100
                )
              : 0,
          submittedAt: attempt.submittedAt,
          autoSubmitted: attempt.autoSubmitted
        }))
      );
    } catch (error) {
      console.error("Load history error:", error.message);

      return res.status(500).json({
        message: "Could not load attempt history."
      });
    }
  }
);

// Admin dashboard: all students and all their attempts.
router.get(
  "/admin",
  requireAuth,
  requireAdmin,
  async (_req, res) => {
    try {
      const adminEmail = (
        process.env.ADMIN_EMAIL || ""
      )
        .trim()
        .toLowerCase();

      const users = await User.find({
        email: { $ne: adminEmail }
      })
        .select("_id name email createdAt")
        .sort({ createdAt: -1 })
        .lean();

      const attempts = await Attempt.find()
        .populate("user", "name email")
        .sort({ submittedAt: -1 })
        .lean();

      // Fetch the questions referenced by saved answers.
      const questionIds = [
        ...new Set(
          attempts.flatMap((attempt) =>
            attempt.answers.map((answer) =>
              String(answer.questionId)
            )
          )
        )
      ];

      const questions = await Question.find({
        _id: { $in: questionIds }
      }).lean();

      const questionMap = new Map(
        questions.map((question) => [
          String(question._id),
          question
        ])
      );

      const students = users.map((user) => {
        const studentAttempts = attempts
          .filter(
            (attempt) =>
              String(attempt.user?._id) === String(user._id)
          )
          .map((attempt) => ({
            id: attempt._id,
            score: attempt.score,
            total: attempt.total,
            percentage:
              attempt.total > 0
                ? Math.round(
                    (attempt.score / attempt.total) * 100
                  )
                : 0,
            submittedAt: attempt.submittedAt,
            autoSubmitted: attempt.autoSubmitted,
            answers: attempt.answers.map((answer) => {
              const question = questionMap.get(
                String(answer.questionId)
              );

              return {
                questionId: answer.questionId,
                text: question?.text || "Question unavailable",
                options: question?.options || [],
                selectedAnswer: answer.selectedAnswer,
                correctAnswer: answer.correctAnswer,
                isCorrect: answer.isCorrect
              };
            })
          }));

        return {
          id: user._id,
          name: user.name,
          email: user.email,
          registeredAt: user.createdAt,
          attempts: studentAttempts
        };
      });

      const allAttempts = students.flatMap(
        (student) => student.attempts
      );

      return res.json({
        totalStudents: students.length,
        totalAttempts: allAttempts.length,
        averagePercentage:
          allAttempts.length > 0
            ? Math.round(
                allAttempts.reduce(
                  (sum, attempt) =>
                    sum + attempt.percentage,
                  0
                ) / allAttempts.length
              )
            : 0,
        students
      });
    } catch (error) {
      console.error("Admin dashboard error:", error.message);

      return res.status(500).json({
        message: "Could not load admin dashboard."
      });
    }
  }
);

export default router;