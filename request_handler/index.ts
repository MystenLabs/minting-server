import { app } from "./app";

const port = 3000;
app.listen(port, () => {
  console.log(`RequestHandler running on port ${port}...`);
});
