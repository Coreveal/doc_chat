import "dotenv/config";
import { app } from "./app";
const start = async () => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY must be defined");
    }
    // add other startup scripts
  } catch (err) {
    console.error(err);
  }

  app.listen(process.env.PORT || 3000, () => {
    console.log("Listening on port 3000...");
  });
};

start();
