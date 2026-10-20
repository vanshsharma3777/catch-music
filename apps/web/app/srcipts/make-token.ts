// scripts/make-token.ts
import jwt from "jsonwebtoken";

const token = jwt.sign(
  { sub: "78c7fe74-be24-4d3c-8ea4-ce597467d89c", email: "sharmavansh.3777@gmail.com", name: "Test", picture: null },
  "change-kr-dunga-don't-worry",
  { expiresIn: "30d", algorithm: "HS256" }
);
console.log(token);
