import {
  fileSchema,
  type File,
  type FlowNodeData,
  type Json,
  type OrchestratorFunction,
} from "./util";
import { Buffer } from "buffer";
import { z } from "zod";
import fs from "fs";

async function operation(node: FlowNodeData, inputs: (Json | File)[]) {
  const parsedInputs = z.array(z.number()).length(2).safeParse(inputs);

  if (parsedInputs.success) {
    const op = (node.data as string).toLowerCase();
    if (op === "add") return [parsedInputs.data[0] + parsedInputs.data[1]];
    else if (op === "subtract")
      return [parsedInputs.data[0] - parsedInputs.data[1]];
    else if (op === "multiply")
      return [parsedInputs.data[0] * parsedInputs.data[1]];
    else if (op === "divide")
      return [parsedInputs.data[0] / parsedInputs.data[1]];
    else
      throw new Error(
        "Invalid operator. Must be one of add, subtract, multiply, or divide"
      );
  } else
    throw new Error(
      `Inputs must be list of two numbers, received ${JSON.stringify(inputs)}`
    );
}

async function foo(node: FlowNodeData, inputs: (Json | File)[]) {
  fs.writeFileSync("blah.txt", "Hello world!");
  return [{ path: "blah.txt" }];
}

async function bar(node: FlowNodeData, inputs: (Json | File)[]) {
  const f = fileSchema.parse(inputs[0]);
  const data = fs.readFileSync(f.path).toString();
  return [`File contents: ${data}`];
}

const map: OrchestratorFunction = async (node, inputs, run) => {
  const input_list = z.array(z.any()).parse(inputs[0]);
  console.log("inputs: ", inputs);
  return [
    (await Promise.all(input_list.map((inp) => run([inp], inputs[1])))).map(
      (x) => x[0]
    ),
  ];
};

export const FUNCTIONS: OrchestratorFunction[] = [operation, foo, bar, map];
