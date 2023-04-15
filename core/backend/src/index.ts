import cors from "cors";
import express, { ErrorRequestHandler } from "express";
import { FlowNodeData, Json } from "./util";
import { createProxyMiddleware } from "http-proxy-middleware";
import { z } from "zod";

const PORT = 100;

const app = express();
app.use(cors());
app.use(express.json());

// Need to have a get route for AWS health check
app.get("/", (req, res) => {
  res.send("OK");
});

app.use("/ui", express.static("../frontend/dist"));

// import expose from "../frontend/expose.json";
import fs from "fs";

// Frontend will call this route to get all the nodes and operator
app.get("/directory", (req, res) => {
  fs.readFile("../frontend/expose.json", (err, data) => {
    if (err) throw err;
    const nodes = Object.keys(JSON.parse(data.toString()));
    res.send({
      nodes,
      operators: [`${req.protocol}://${req.hostname}:${PORT}/operation`],
    });
  });
});

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

app.listen(PORT, () => {
  console.log("🚀 Server ready at: http://localhost:100");
});
