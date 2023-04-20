import cors from "cors";
import express, { ErrorRequestHandler } from "express";
import { FlowNodeData, Json } from "./util";
import fs from "fs";
import { FUNCTIONS } from "./functions";
import fetch from "node-fetch";
import FormData from "form-data";

const PORT = 80;

const app = express();
app.use(cors());
app.use(express.json());

// Need to have a get route for AWS health check
app.get("/", (req, res) => {
  res.send("OK");
});

app.use("/ui", express.static("../frontend/dist"));

// Frontend will call this route to get all the nodes and operator
app.get("/directory", (req, res) => {
  const hostname = req.headers["x-forwarded-host"] || req.headers.host;

  fs.readFile("../frontend/config.json", (err, data) => {
    if (err) throw err;
    const config = JSON.parse(data.toString());
    const nodes = Object.keys(config["nodes"]);
    res.send({
      nodes: nodes.map((node) => ({
        module: node,
        scope: config["name"], // TODO: auto extract this from some json file
        url: `/ui/remoteEntry.js`,
      })),
      operators: Object.fromEntries(
        FUNCTIONS.map((func) => [func.name, `/operator/${func.name}`])
      ),
    });
  });
});

FUNCTIONS.map((func) => {
  app.post(`/operator/${func.name}`, async (req, res) => {
    const {
      node,
      inputs,
      id,
    }: { node: FlowNodeData; inputs: Json[]; id: number } = req.body;

    const url = "http://" + process.env.DISPATCHER_URL;

    res.send("Ok");

    try {
      const output = func(node, inputs);

      let mappedOutputs = output.map(async (value) => {
        if (value instanceof File) {
          const file = value as File;
          const form = new FormData();
          form.append("file", file);
          const response = await fetch(`${url}/upload`, {
            method: "POST",
            body: form,
            headers: form.getHeaders(),
          });
          return await response.json();
        } else return value;
      });

      console.log("Finished with output ", output);

      fetch(`${url}/node_finished`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          node: id,
          output: output,
        }),
      });
    } catch (e) {
      fetch(`${url}/node_error`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          node: id,
          error: String((e as Error).stack),
        }),
      });
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server ready at: http://localhost:${PORT}`);
});
