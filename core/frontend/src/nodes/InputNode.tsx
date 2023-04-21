import React, { useEffect } from "react";
import { Input, InputNumber } from "antd";
import { z } from "zod";
import type { FlowNodeData, NodeProps, NodeSetter } from "../util";

const dataSchema = z
  .object({
    name: z.string().default(""),
    placeholder: z.string().default(""),
    value: z.string().default(""),
  })
  .default({});

function RemoteUI({ node, setNode }: NodeProps<z.infer<typeof dataSchema>>) {
  const data = dataSchema.parse(node.data);
  console.log(data);
  return (
    <Input
      addonBefore={data.name}
      placeholder={data.placeholder}
      value={data.value}
      onChange={(e) => {
        setNode((nd) => ({
          ...nd,
          data: { ...nd.data, value: e.target.value },
        }));
      }}
    />
  );
}

export default function InputNode({
  callAfterUpdateInpOuts = () => {},
  node,
  setNode,
}: NodeProps<z.infer<typeof dataSchema>>) {
  const data = dataSchema.parse(node.data);

  useEffect(() => {
    setNode((nd) => ({
      ...nd,
      data: { name: "", placeholder: "", value: "" },
      operator: "extractdata",
      num_inputs: 0,
      num_outputs: 1,
      ui: RemoteUI,
    }));
    callAfterUpdateInpOuts();
  }, []);

  return (
    <div tw="flex flex-col space-y-2">
      <Input
        addonBefore={"Input Name"}
        value={data.name}
        onChange={(e) => {
          if (e != undefined)
            setNode((nd) => ({
              ...nd,
              data: { ...nd.data, name: e.target.value },
            }));
        }}
      />
      <Input
        addonBefore={"Input Placeholder"}
        value={data.placeholder}
        onChange={(e) => {
          if (e != undefined)
            setNode((nd) => ({
              ...nd,
              data: { ...nd.data, placeholder: e.target.value },
            }));
        }}
      />
    </div>
  );
}
