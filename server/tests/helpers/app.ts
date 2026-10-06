import request from "supertest";
import app from "../../src/app.ts";

export const api = () => request(app);
