import { Input } from "antd";
import React, { useEffect } from "react";
import { z } from "zod";
import type { Json } from "../../../backend/src/util";
import type { FlowNodeData, NodeProps } from "../util";

const dataSchema = z
  .object({
    name: z.string().default(""),
    placeholder: z.string().default(""),
  })
  .default({});

function RemoteUI({
  inputs,
  outputs,
  setOutputs,
  node,
}: {
  inputs: Json[];
  node: FlowNodeData<z.infer<typeof dataSchema>>;
  outputs: Json[] | undefined;
  setOutputs: React.Dispatch<React.SetStateAction<Json[]>>;
}) {
  const data = dataSchema.parse(node.data);
  const outputsParse = z.array(z.string()).length(1).safeParse(outputs);

  return (
    <Input
      addonBefore={data.name}
      placeholder={data.placeholder}
      value={outputsParse.success ? (outputsParse.data[0] as string) : ""}
      onChange={(e) => {
        setOutputs([e.target.value]);
      }}
    />
  );
}

function InputNode({
  callAfterUpdateInpOuts = () => {},
  node,
  setNode,
}: NodeProps<z.infer<typeof dataSchema>>) {
  const data = dataSchema.parse(node.data);

  useEffect(() => {
    setNode((nd) => ({
      ...nd,
      data: { name: "", placeholder: "" },
      operator: "ui",
      num_inputs: 0,
      num_outputs: 1,
      subcomponents: { ui: RemoteUI },
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

export default InputNode;
