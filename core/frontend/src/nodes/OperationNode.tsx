import { Select, Typography } from "antd";
import React, { useEffect } from "react";
import { z } from "zod";

const { Text } = Typography;

import { NodeProps, baseUrl } from "../util";

export default function OperationNode({
  callAfterUpdateInpOuts = () => {},
  node,
  setNode,
}: NodeProps) {
  const options = ["Add", "Subtract", "Multiply", "Divide"] as const;

  useEffect(() => {
    setNode((nd) => ({
      ...nd,
      data: options[0],
      operator: `${baseUrl(node.remote.url)}/operator/operation`, // specify operator url as such
      num_inputs: 2,
      num_outputs: 1,
    }));
    callAfterUpdateInpOuts();
  }, []);

  const val = z.enum(options).safeParse(node.data) ? node.data : options[0];

  return (
    <div tw="flex flex-row space-x-2 items-center">
      <Text>Elementary Operation: </Text>
      <Select
        className="nodrag"
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