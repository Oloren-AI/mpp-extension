import React, { useEffect } from "react";
import { InputNumber } from "antd";
import { z } from "zod";
import type { FlowNodeData, NodeSetter } from "../util";

interface NodeProps {
  node: FlowNodeData;
  setNode: NodeSetter;
}

export default function NumberNode({ node, setNode }: NodeProps) {
  useEffect(() => {
    setNode((nd) => ({ ...nd, data: 0, operator: "extractdata" }));
  }, []);

  const val = z.number().safeParse(node.data) ? (node.data as number) : 0;

  return (
    <InputNumber
      value={val}
      onChange={(e) => {
        if (e != undefined) setNode((nd) => ({ ...nd, data: e }));
      }}
    />
  );
}
