export type Json = string | number | boolean | Json[] | { [key: string]: Json };

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

export type OrchestratorFunction = (
  node: FlowNodeData,
  inputs: Json[]
) => Json[];
