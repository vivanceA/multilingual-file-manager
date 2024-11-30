import jwt from "jsonwebtoken";
import bcrypt from 'bcrypt';
import { findUserByEmailModel, createUserModel } from "../models/users.js";

export const login = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const [user] = await findUserByEmailModel(email);

    if (!user) {
      const error = new Error("User not found");
      error.status = 404;
      return next(error);
    }
  
    const passwordsMatch = await bcrypt.compare(password, user.password);

    if (!passwordsMatch) {
      const error = new Error("Email or password is incorrect");
      error.status = 401;
      return next(error);
    }

    const token = jwt.sign(
      { 
        id: user.id,
        email: user.email
      }, 
      process.env.JWT_SECRET_KEY, 
      { expiresIn: "1h" }
    );

    console.log("Login successful", {
      userId: user.id, 
      tokenGenerated: !!token
    });

    res.json({ 
      user: {
        id: user.id,
        email: user.email,
        // include other non-sensitive user info
      }, 
      token 
    });
  } catch(err) {
    console.error("Login error:", err);
    const error = new Error("Internal server error");
    error.status = 500;
    next(error);
  }
};

// Optional: Add a registration controller
export const register = async (req, res, next) => {
  const { email, password, ...otherDetails } = req.body;
  
  try {
    // Check if user already exists
    const [existingUser] = await findUserByEmailModel(email);
    if (existingUser) {
      const error = new Error("User already exists");
      error.status = 409;
      return next(error);
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = await createUserModel({
      email,
      password: hashedPassword,
      ...otherDetails
    });

    res.status(201).json({
      message: "User registered successfully",
      userId: newUser.id
    });
  } catch(err) {
    console.error("Registration error:", err);
    const error = new Error("Registration failed");
    error.status = 500;
    next(error);
  }
};