import React, { useEffect } from "react";
import { InputNumber, Typography } from "antd";
import { z } from "zod";
import {
  baseUrl,
  type FlowNodeData,
  type NodeProps,
  type NodeSetter,
} from "../util";

export default function NumberNode({
  callAfterUpdateInpOuts = () => {},
  node,
  setNode,
}: NodeProps) {
  useEffect(() => {
    setNode((nd) => ({
      ...nd,
      data: {},
      operator: `${baseUrl(node.remote.url)}/operator/map`, // specify operator url as such
      num_inputs: 2,
      num_outputs: 1,
    }));
    callAfterUpdateInpOuts();
  }, []);

  const val = z.number().safeParse(node.data) ? (node.data as number) : 0;

  return <Typography.Text>Map Node</Typography.Text>;
}
