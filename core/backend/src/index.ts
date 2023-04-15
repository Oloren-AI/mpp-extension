import cors from "cors";
import express, { ErrorRequestHandler } from "express";
import { FlowNodeData, Json } from "./util";
import { createProxyMiddleware } from "http-proxy-middleware";
import { z } from "zod";

const app = express();
app.use(cors());
app.use(express.json());

// Need to have a get route for AWS health check
app.get("/", (req, res) => {
  res.send("OK");
});

app.use("/ui", express.static("../frontend/dist"));

// Actual computation stuff goes here

app.post("/operation", (req, res) => {
  const { node, inputs }: { node: FlowNodeData; inputs: Json[] } =
    req.body.json;

  res.send("Ok");

  // check if inputs are numbers
  const parsedInputs = z.array(z.number()).length(2).safeParse(inputs);

  if (parsedInputs.success) {
    if (node.data === "add") return parsedInputs.data[0] + parsedInputs.data[1];
    else if (node.data === "subtract")
      return parsedInputs.data[0] - parsedInputs.data[1];
    else if (node.data === "multiply")
      return parsedInputs.data[0] * parsedInputs.data[1];
    else if (node.data === "divide")
      return parsedInputs.data[0] / parsedInputs.data[1];
    else
      throw new Error(
        "Invalid operator. Must be one of add, subtract, multiply, or divide"
      );
  } else
    throw new Error(
      `Inputs must be list of two numbers, received ${JSON.stringify(inputs)}`
    );

  // check node data
});

app.listen(100, () => {
  console.log("🚀 Server ready at: http://localhost:100");
});
