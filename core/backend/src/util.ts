import { z } from "zod";
import { Socket, io } from "socket.io-client";
import { v4 as uuidv4 } from "uuid";
import fetch from "node-fetch";

export type Json = string | number | boolean | Json[] | { [key: string]: Json };
const literalSchema = z.union([z.string(), z.number(), z.boolean()]);
export const jsonSchema: z.ZodType<Json> = z.lazy(() =>
  z.union([literalSchema, z.array(jsonSchema), z.record(jsonSchema)])
);
export const entrySchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  description: z.string().optional(),
});

export const nodeSchema = z.object({
  id: z.string(),
  operator: z.string(),
  input_ids: z.array(entrySchema),
  output_ids: z.array(entrySchema),
  data: jsonSchema,
  name: z.string().optional(),
  description: z.string().optional(),
  remote: z
    .object({
      module: z.string(),
      scope: z.string(),
      url: z.string().url(),
    })
    .optional(),
});

export interface FlowNodeData {
  id: string;
  data: Json;
  num_inputs: number;
  num_outputs: number;
  operator: string;
  hierarchy: string[];
  special?: boolean;
  logs?: string;
  status?: "idle" | "running" | "finished" | "error";
}

export const fileSchema = z.object({
  path: z.string(),
});

export type File = z.infer<typeof fileSchema>;

export type OrchestratorFunction = (
  node: FlowNodeData,
  inputs: (Json | File)[],
  runFunction: (inputs: Json[], graph: Json) => Promise<(Json | File)[]>
) => Promise<(Json | File)[]>;

// TODO: type graph as FlowNode

export async function runGraph(
  node_id: number,
  inputs: Json[],
  graph: Json,
  dispatcherUrl: string,
  timeoutMs: number = 5000
): Promise<(Json | File)[]> {
  console.log("Running graph: ", JSON.stringify(graph, null, 2));
  const parsedGraph = nodeSchema.parse(graph);

  const socket = io(
    dispatcherUrl.replace("http://", "ws://").replace("https://", "ws://")
  );

  const maxId = Math.max(...parsedGraph.output_ids.map((el) => el.id)) + 1;

  const uuid = uuidv4();
  const newElements = inputs.map((input, idx) => ({
    id: `${uuid}-input-${idx}`,
    data: input,
    operator: "extractdata",
    input_ids: [],
    output_ids: [{ id: maxId + idx }],
  }));
  parsedGraph.id = `${uuid}-graph`;
  parsedGraph.input_ids = newElements.map((el) => el.output_ids[0]);
  const newGraph = [parsedGraph, ...newElements];

  console.log("Graph to Run: ", JSON.stringify(newGraph, null, 2));

  socket.on("connect", () => {
    socket.emit("extensionregister", { id: node_id }, (client_uuid: string) => {
      fetch(`${dispatcherUrl}/run_graph`, {
        method: "POST",
        body: JSON.stringify({ graph: newGraph, uuid: client_uuid }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log("Registered with dispatcher");
    });
  });
  // create a promise that resolves when the subgraph finishes

  return new Promise((resolve, reject) => {
    socket.on("node", (node) => {
      console.log("Node: ", JSON.stringify(node, null, 2));
      if (node.status === "finished") {
        if (
          node.data.output_ids.length > 0 &&
          parsedGraph.id === node.data.id
        ) {
          clearTimeout(timeoutId);
          socket.disconnect();
          resolve(node.output);
        }
      } else if (node.status !== "running") {
        reject(new Error("Fn failed to run: " + JSON.stringify(node)));
      }
    });

    const timeoutId = setTimeout(() => {
      socket.disconnect();
      reject(new Error(`Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });
}
