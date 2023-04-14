import React, { useEffect } from "react";
import { Typography, Select } from "antd";
import { z } from "zod";

const { Text } = Typography;

import type { FlowNodeData, NodeSetter } from "../util";

interface NodeProps {
  node: FlowNodeData;
  setNode: NodeSetter;
}

export default function OperationNode({ node, setNode }: NodeProps) {
  const options = ["Add", "Subtract", "Multiply", "Divide"] as const;

  useEffect(() => {
    setNode((nd) => ({ ...nd, data: options[0] }));
  }, []);

  const val = z.enum(options).safeParse(node.data) ? node.data : options[0];

  return (
    <div tw="flex flex-row space-x-2 items-center">
      <Text>Elementary Operation: </Text>
      <Select
        value={val}
        options={options.map((op) => ({ label: op, value: op }))}
        onChange={(e) => {
          setNode((nd) => ({ ...nd, data: e as string }));
        }}
        tw="w-28"
      />
    </div>
  );
}
