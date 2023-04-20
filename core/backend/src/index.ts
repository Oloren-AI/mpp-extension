import cors from "cors";
import express from "express";
import { FlowNodeData, Json, fileSchema } from "./util";
import fs from "fs";
import { FUNCTIONS } from "./functions";
import fetch from "node-fetch";
import FormData from "form-data";
import { AddressInfo } from "net";
import { z } from "zod";
import https from "https";
import tmp from "tmp";

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

async function downloadFromSignedUrl(
  signedUrl: string
): Promise<tmp.FileResult> {
  const tmpFile = tmp.fileSync();
  const file = fs.createWriteStream(tmpFile.name);
  const response = await fetch(signedUrl);
  return new Promise((resolve, reject) => {
    response.body?.pipe(file);
    file.on("finish", () => {
      file.close();
      resolve(tmpFile);
    });
  });
}

FUNCTIONS.map((func) => {
  app.post(`/operator/${func.name}`, async (req, res) => {
    const {
      node,
      inputs,
      id,
      dispatcherurl,
    }: {
      node: FlowNodeData;
      inputs: Json[];
      id: number;
      dispatcherurl?: string;
    } = req.body;

    const url = dispatcherurl ?? "http://" + process.env.DISPATCHER_URL;

    res.send("Ok");

    try {
      let tempFiles: tmp.FileResult[] = [];
      const mappedInputs = await Promise.all(
        inputs.map(async (value) => {
          const fileParse = z
            .object({ reserved: z.literal("file"), url: z.string().url() })
            .safeParse(value);
          if (fileParse.success) {
            const tmp = await downloadFromSignedUrl(fileParse.data.url);
            tempFiles.push(tmp);
            return { path: tmp.name };
          } else return value;
        })
      );

      const output = await func(node, mappedInputs);
      let filepaths: string[] = [];
      const form = new FormData();
      let filePresent = false;

      let mappedOutput = output.map((value, idx) => {
        const fileParse = fileSchema.safeParse(value);
        if (fileParse.success) {
          filePresent = true;
          filepaths.push(fileParse.data.path);
          form.append(idx.toString(), fs.createReadStream(fileParse.data.path));
          return "TO BE REPLACED BY FILE";
        } else return value;
      });

      if (filePresent) {
        form.append("node", JSON.stringify(id));
        form.append("output", JSON.stringify(mappedOutput));

        await fetch(`${url}/node_finished_file`, {
          method: "POST",
          headers: form.getHeaders(),
          body: form,
        });

        filepaths.forEach(fs.unlinkSync);
      } else {
        fetch(`${url}/node_finished`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            node: id,
            output: mappedOutput,
          }),
        });
      }
      tempFiles.forEach((tmp) => tmp.removeCallback());
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

if (process.env.NODE_ENV === "production") {
  app.listen(80, () => {
    console.log(`🚀 Server ready at: http://localhost`);
  });
} else {
  let port;
  fs.readFile(".port", (err, data) => {
    if (err) {
      port = 0;
      console.log("Assigning random available port.");
    } else {
      port = parseInt(data.toString());
    }

    const server = app.listen(port, () => {
      const { port } = server.address() as AddressInfo;
      console.log(`🚀 Extension Running at http://localhost:${port}`);
      if (process.env.NODE_ENV !== "production") {
        fs.writeFile(".port", port.toString(), (err) => {
          if (err) throw err;
        });
      }
    });
  });
}
