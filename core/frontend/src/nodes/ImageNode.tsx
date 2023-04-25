import React, { useEffect } from "react";
import { Input, InputNumber, Typography } from "antd";
import { z } from "zod";
import type { FlowNodeData, NodeProps, NodeSetter } from "../util";
import type { Json } from "../../../backend/src/util";

function ImageNode({
  callAfterUpdateInpOuts = () => {},
  node,
  setNode,
}: NodeProps) {
  useEffect(() => {
    setNode((nd) => ({
      ...nd,
      data: "https://oloren.ai/assets/images/logo.svg",
      operator: "extractdata",
      num_inputs: 0,
      num_outputs: 1,
      subcomponents: { output: DisplayImage },
    }));
    callAfterUpdateInpOuts();
  }, []);

  const val = z.string().safeParse(node.data) ? (node.data as string) : "";

  return (
    <Input
      value={val}
      onChange={(e) => {
        setNode((nd) => ({ ...nd, data: e.target.value }));
      }}
    />
  );
}

function DisplayImage({ outputs }: { outputs: Json[] }) {
  const imageUrl = z.string().parse(outputs[0]);
  return <img src={imageUrl}></img>;
}

ImageNode.DisplayOutput = DisplayImage;

export default ImageNode;
