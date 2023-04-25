import { Button, Upload } from "antd";
import React, { useEffect, useState } from "react";
import { z } from "zod";
import type { Json } from "../../../backend/src/util";
import type { FlowNodeData, NodeProps } from "../util";
import { UploadOutlined } from "@ant-design/icons";

const dataSchema = z.any();

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
  const [file, setFile] = useState<File | null>(null);

  return (
    <div className="w-full flex flex-col space-y-2">
      <div>{file ? file.name : "No file uploaded"}</div>
      <Upload beforeUpload={(file) => setFile(file)}>
        <Button icon={<UploadOutlined />}>Upload File</Button>
      </Upload>
    </div>
  );
}

function FileUploadNode({
  callAfterUpdateInpOuts = () => {},
  node,
  setNode,
}: NodeProps<z.infer<typeof dataSchema>>) {
  const data = dataSchema.parse(node.data);

  useEffect(() => {
    setNode((nd) => ({
      ...nd,
      data: {},
      operator: "ui",
      num_inputs: 0,
      num_outputs: 1,
      subcomponents: { ui: RemoteUI },
    }));
    callAfterUpdateInpOuts();
  }, []);

  return (
    <div tw="flex flex-col space-y-2">
      <div>File Upload</div>
    </div>
  );
}

export default FileUploadNode;
