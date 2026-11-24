import mongoose from "mongoose";
import dotenv from "dotenv";
import Question from "./models/Question.js";
dotenv.config();

const questions = [
  { text: "Which planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter", "Mercury"], correctAnswer: 1, subject: "Science" },
  { text: "What is 12 × 8?", options: ["84", "88", "96", "108"], correctAnswer: 2, subject: "Mathematics" },
  { text: "Which language runs natively in most web browsers?", options: ["Java", "C", "JavaScript", "Python"], correctAnswer: 2, subject: "Computing" },
  { text: "What is the capital of Japan?", options: ["Seoul", "Tokyo", "Beijing", "Bangkok"], correctAnswer: 1, subject: "Geography" },
  { text: "How many sides does a hexagon have?", options: ["5", "6", "7", "8"], correctAnswer: 1, subject: "Mathematics" },
  { text: "Which gas do plants absorb from the atmosphere?", options: ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"], correctAnswer: 2, subject: "Science" },
  { text: "Who wrote the play Romeo and Juliet?", options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"], correctAnswer: 1, subject: "Literature" },
  { text: "What does HTTP stand for?", options: ["HyperText Transfer Protocol", "High Transfer Text Program", "Hyperlink Tool Transfer Process", "Host Text Transmission Protocol"], correctAnswer: 0, subject: "Computing" },
  { text: "Which ocean is the largest?", options: ["Atlantic", "Indian", "Arctic", "Pacific"], correctAnswer: 3, subject: "Geography" },
  { text: "What is the square root of 144?", options: ["10", "11", "12", "14"], correctAnswer: 2, subject: "Mathematics" },
  { text: "Which data structure follows FIFO?", options: ["Stack", "Queue", "Tree", "Graph"], correctAnswer: 1, subject: "Computing" },
  { text: "At standard atmospheric pressure, water boils at what temperature?", options: ["90°C", "95°C", "100°C", "110°C"], correctAnswer: 2, subject: "Science" }
];
try {
  await mongoose.connect(process.env.MONGO_URI);
  await Question.deleteMany({});
  await Question.insertMany(questions);
  console.log(`Seeded ${questions.length} questions.`);
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
