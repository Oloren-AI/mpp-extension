import React, { useEffect } from "react";
import { InputNumber } from "antd";
import { z } from "zod";
import type { FlowNodeData, NodeProps, NodeSetter } from "../util";

export default function NumberNode({
  callAfterUpdateInpOuts = () => {},
  node,
  setNode,
}: NodeProps) {
  useEffect(() => {
    setNode((nd) => ({
      ...nd,
      data: 0,
      operator: "extractdata",
      num_inputs: 0,
      num_outputs: 1,
    }));
    callAfterUpdateInpOuts();
  }, []);

  const val = z.number().safeParse(node.data) ? (node.data as number) : 0;

  return (
    <InputNumber
      className="nodrag"
      value={val}
      onChange={(e) => {
        if (e != undefined) setNode((nd) => ({ ...nd, data: e }));
      }}
    />
  );
}
