import express from "express";
import { Vertex, PineconeClient, GroqClient } from "clients";

const router = express.Router();

router.post("/api/chat", async (req, res) => {
  try {
    const { query, documents, email } = req.body;
    const pinecone = new PineconeClient(
      process.env.PINECONE_INDEX_NAME!,
      email,
    );

    const ans = await pinecone.chat({
      query,
      documents,
      email,
    });
    res.status(200).send(ans);
  } catch (err: any) {
    console.error(err);
    res.status(500).send({
      message: `${err.message}`,
    });
  }
});

router.post("/api/vertex", async (req, res) => {
  try {
    const { query, email, documents } = req.body;

    const vertex = new Vertex();
    // Inject google credentials at runtime
    await vertex.init();

    const ans = await vertex.getAnswerFromDocuments(
      query as string,
      email,
      documents,
    );
    res.status(200).send({ answer: ans });
  } catch (error: any) {
    console.error(error);
    if (
      error.message.includes("Please limit number of documents to 10 or less")
    ) {
      res
        .status(400)
        .send({ message: "Please limit number of documents to 10 or less" });
    } else {
      res.status(500).send({ message: "Internal Server Error", error });
    }
  }
});

router.post("/api/groq", async (req, res) => {
  const { query, email } = req.body;
  const groq = new GroqClient();
  const ans = await groq.getAnswerFromFiles(query as string, email);
  res.status(200).send(ans);
});

export { router as chatRouter };
