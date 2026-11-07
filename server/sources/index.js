// অ্যালাউলিস্ট: শুধু এখানে নিবন্ধিত উৎস ব্যবহার করা যাবে।
import * as met from "./met.js";
import * as artic from "./artic.js";

export const SOURCES = {
  [met.sourceName]: met,
  [artic.sourceName]: artic,
};
