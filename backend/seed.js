
import mongoose from "mongoose";
import fs from "fs";
import Todo from "./src/models/todo.model.js";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/todo-app";

await mongoose.connect(MONGODB_URI);

try {
    const todos = JSON.parse(
        fs.readFileSync("./todos.json", "utf-8")
    );

    await Todo.insertMany(todos);

    console.log(`${todos.length} todos inserted successfully`);
} catch (error) {
    console.error("Error inserting todos:", error.message);
} finally {
    await mongoose.disconnect();
}
