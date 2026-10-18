import jwt from "jsonwebtoken";

const secret = "apna_MOBILE_JWT_SECRET";

const token = jwt.sign({ sub: "test-user-id", email: "a@b.com" }, secret, {
  expiresIn: "1h",
  algorithm: "HS256",
});
console.log("TOKEN:", token);

const payload = jwt.verify(token, secret, { algorithms: ["HS256"] });
console.log("PAYLOAD:", payload);
