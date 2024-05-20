import express from "express";

const app = express();
const port = 3000;

app.post("/", (req: any, res: any) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`RequestHandler running on port ${port}...`);
});
