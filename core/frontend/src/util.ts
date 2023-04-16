type Json = string | number | boolean | Json[] | { [key: string]: Json };

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
  remote: {
    module: string;
    scope: string;
    url: string;
  };
}

export type NodeSetter = React.Dispatch<React.SetStateAction<FlowNodeData>>;

export function baseUrl(url: string) {
  const pathArray = url.split("/");
  const protocol = pathArray[0];
  const host = pathArray[2];
  return protocol + "//" + host;
}
