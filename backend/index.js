import express from "express";
import userRoutes from "./routes/users.js";
import fileRoutes from "./routes/files.js";
import authRoutes from "./routes/user-auth.js";
import { expressjwt } from "express-jwt";
import { getUserByIdModel } from "./models/users.js";
import cors from "cors";
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const port = 3000;

// Middleware setup
app.use(cors());
app.use(express.json());

// Public routes (authentication routes)
app.use("/auth", authRoutes);

// JWT middleware configuration
app.use(
  expressjwt({
    secret: process.env.JWT_SECRET_KEY,
    algorithms: ["HS256"],
  }).unless({ 
    path: [
      /^\/auth\/login/,
      /^\/auth\/register/,
      { url: '/', methods: ['GET'] }
    ]
  })
);

// User middleware to attach user to request
app.use(async (request, response, next) => {
  try {
    if (request.auth?.id) {
      const user = await getUserByIdModel(request.auth.id);

      if (!user) {
        const error = new Error("User not found");
        error.status = 404;
        return next(error);
      }

      // Put user object in request object -> req.user
      request.user = {
        id: user.id,
        email: user.email
      };
      return next();
    }

    next();
  } catch(error) {
    console.error("User middleware error:", error);
    error.status = 500;
    next(error);
  }
});

// Root route
app.get("/", (req, res) => {
  res.send("Welcome to our multilingual file manager platform!");
});

// Protected routes
app.use("/users", userRoutes);
app.use("/files", fileRoutes);

// Error handling middleware
app.use((error, request, response, next) => {
  console.error("Global error handler:", error);

  let status = error.status || 500;
  let message = error.message || "Internal Server Error";

  if (error.name === "UnauthorizedError") {
    status = 401;
    message = "Invalid or missing authentication token";
  }

  response.status(status).json({ message });
});

app.listen(port, () => {
  console.log(`App listening on http://localhost:${port}`);
});