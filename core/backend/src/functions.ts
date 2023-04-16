import type { FlowNodeData, Json, OrchestratorFunction } from "./util";
import { z } from "zod";

function operation(node: FlowNodeData, inputs: Json[]) {
  const parsedInputs = z.array(z.number()).length(2).safeParse(inputs);

  if (parsedInputs.success) {
    if (node.data === "add")
      return [parsedInputs.data[0] + parsedInputs.data[1]];
    else if (node.data === "subtract")
      return [parsedInputs.data[0] - parsedInputs.data[1]];
    else if (node.data === "multiply")
      return [parsedInputs.data[0] * parsedInputs.data[1]];
    else if (node.data === "divide")
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

function foo(node: FlowNodeData, inputs: Json[]) {
  return inputs;
}

export const FUNCTIONS: OrchestratorFunction[] = [operation, foo];
