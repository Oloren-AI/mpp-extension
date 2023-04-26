import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  DownloadOutlined,
  TableOutlined,
  UndoOutlined,
} from "@ant-design/icons";
import { Button, Input, Typography, Upload } from "antd";
import React, { useEffect, useState } from "react";
import { z } from "zod";
import type { Json } from "../../../backend/src/util";
import type { FlowNodeData, NodeProps } from "../util";
import { atom, useAtom } from "jotai";
import Papa from "papaparse";
import { RDKitModule } from "@rdkit/rdkit";

const rdkitAtom = atom<RDKitModule | null>(null);
const inferStateAtom = atom<InferInput | null>(null);

interface InferInput {
  smiles: string[];
  invalid: string[];
  status?: string;
  data?: any;
}

function SmilesInput() {
  const [rdkit] = useAtom(rdkitAtom);
  const [smiles, setSmiles] = useState<string>("");
  const [, setInferInput] = useAtom(inferStateAtom);
  const [valid, setValid] = useState<boolean>(false);

  useEffect(() => {
    if (rdkit) {
      const v = validateSMILES(smiles, rdkit);
      setValid(v);
      if (!v) setInferInput(null);
      else setInferInput({ smiles: [smiles], invalid: [] });
    }
  }, [smiles, rdkit]);

  return (
    <div className="flex flex-col space-y-2 pt-1">
      <label className="text-lg font-semibold">Enter SMILES</label>
      <Input
        placeholder="SMILES Strings"
        value={smiles}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          setInferInput(null);
          e.preventDefault();
          setSmiles(e.target.value);
        }}
        suffix={
          valid ? (
            <CheckCircleOutlined className="text-green-700" />
          ) : smiles ? (
            <CloseCircleOutlined className="text-red-700" />
          ) : (
            <span />
          )
        }
      />
    </div>
  );
}

function validateSMILES(smiles: string, rdkit: RDKitModule) {
  const mol = rdkit.get_mol(smiles || "invalid");
  const validity = mol.is_valid();
  mol.delete();
  return validity;
}

/**
 * Renders a file input box - parses uploaded file, detects a SMILE column.
 */

function FileInput() {
  const [inferInput, setInferInput] = useAtom(inferStateAtom);
  const [file, setFile] = useState<File | null>(null);
  const [rdkit] = useAtom(rdkitAtom);

  useEffect(() => {
    if (file && rdkit && !inferInput) {
      Papa.parse(file, {
        complete: (results) => {
          const table = z.array(z.array(z.string()).min(1)).parse(results.data);
          const columnCounts = Array<number>(table[0].length).fill(0);
          const rowIndicies = Array.from({ length: 10 }, () =>
            Math.floor(Math.random() * table.length)
          );

          for (const rowIdx of rowIndicies) {
            for (const colIdx of Array.from(
              { length: columnCounts.length },
              (_, i) => i
            )) {
              columnCounts[colIdx] += validateSMILES(
                table[rowIdx][colIdx],
                rdkit
              )
                ? 1
                : 0;
            }
          }

          const maxIdx = columnCounts.indexOf(Math.max(...columnCounts));

          const startRow = validateSMILES(table[0][maxIdx], rdkit) ? 0 : 1;

          const allSmiles = table.slice(startRow).map((row) => row[maxIdx]);
          const invalidSmiles = allSmiles.filter(
            (smiles) => !validateSMILES(smiles, rdkit)
          );

          setInferInput({ smiles: allSmiles, invalid: invalidSmiles });
        },
      });
    }
  }, [file, validateSMILES, rdkit]);

  return (
    <Upload.Dragger
      accept=".csv"
      multiple={false}
      customRequest={({ file, onSuccess }) => {
        const f = file as File;
        setFile(f);
        if (onSuccess) onSuccess({});
      }}
    >
      <p className="ant-upload-drag-icon">
        <TableOutlined />
      </p>
      <p className="ant-upload-text">Upload a CSV file with a SMILES column</p>
      <p className="ant-upload-hint">Column name will be autodetected.</p>
    </Upload.Dragger>
  );
}

function InvalidCorrector() {
  const [inferInput, setInferInput] = useAtom(inferStateAtom);
  const [rdkit] = useAtom(rdkitAtom);
  const [state, setState] = useState<InferInput | null>(null);
  const [valid, setValid] = useState<boolean[]>();
  const [deleted, setDeleted] = useState<boolean[]>([]);

  const fixedAll = valid?.map((v, idx) => v || deleted[idx]).every((v) => v);

  useEffect(() => {
    if (inferInput) {
      setState(inferInput);
      setValid(Array(inferInput.invalid.length).fill(false));
      setDeleted(Array(inferInput.invalid.length).fill(false));
    }
  }, [inferInput]);

  return inferInput && state && valid && rdkit ? (
    <div className="flex w-full flex-col space-y-2">
      <label className="text-lg font-semibold">Fix Invalid SMILES</label>
      {state.invalid.map((smiles, idx) => {
        return (
          <div className="flex w-full flex-row space-x-2">
            <Input
              className="grow"
              placeholder="SMILES Strings"
              value={smiles}
              disabled={deleted[idx]}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const newValid = [...valid];
                const newState = [...state.invalid];
                newState[idx] = e.target.value;
                newValid[idx] = validateSMILES(e.target.value, rdkit);
                setValid(newValid);
                setState({ smiles: state.smiles, invalid: newState });
              }}
              key={idx}
              suffix={
                valid[idx] || deleted[idx] ? (
                  <CheckCircleOutlined className="text-green-700" />
                ) : smiles ? (
                  <CloseCircleOutlined className="text-red-700" />
                ) : (
                  <span />
                )
              }
            />
            <Button
              className="inline-flex items-center"
              onClick={() =>
                setDeleted(deleted.map((d, i) => (i === idx ? !d : d)))
              }
            >
              {deleted[idx] ? <UndoOutlined /> : <DeleteOutlined />}
            </Button>
          </div>
        );
      })}
      <Button
        className="w-full"
        disabled={!fixedAll}
        onClick={() => {
          const allSmiles: (string | null)[] = inferInput.smiles;
          for (let i = 0; i < inferInput.invalid.length; i++) {
            const idx = allSmiles.indexOf(inferInput.invalid[i]);
            if (deleted[i]) allSmiles[idx] = null;
            else allSmiles[idx] = state.invalid[i];
          }
          setInferInput({
            smiles: allSmiles.filter((x): x is string => !!x),
            invalid: [],
          });
        }}
      >
        Submit Fixes
      </Button>
    </div>
  ) : null;
}

const dataSchema = z.any();

function RemoteUI({
  inputs,
  outputs,
  setOutputs,
  node,
}: {
  inputs: Json[];
  node: FlowNodeData<z.infer<typeof dataSchema>>;
  outputs: (Json | File)[] | null;
  setOutputs: React.Dispatch<React.SetStateAction<(Json | File)[] | null>>;
}) {
  const [rdkit, setRDKit] = useAtom(rdkitAtom);
  const [inferState] = useAtom(inferStateAtom);

  useEffect(() => {
    if (inferState && inferState.invalid.length > 0)
      setOutputs([inferState.smiles]);
    else setOutputs(null);
  }, [inferState]);

  useEffect(() => {
    if (!rdkit && window && window.initRDKitModule) {
      window
        .initRDKitModule()
        .then((RDKit) => {
          alert("RDKit loaded");
          console.log("Loading rdkit...");
          setRDKit(RDKit);
        })
        .catch((e) => {
          console.error("Error loading RDKit", e);
        });
    }
  }, [rdkit, setRDKit]);

  return (
    <div tw="w-full flex flex-col space-y-2">
      <div tw="flex w-full flex-row items-center space-x-4">
        <div tw="h-fit w-1/2">
          <SmilesInput />
        </div>
        <div tw="h-fit w-1/2">
          <FileInput />
        </div>
      </div>
      {inferState && inferState.invalid.length > 0 ? (
        <InvalidCorrector />
      ) : null}
    </div>
  );
}

function DownloadFile({
  outputs,
  download,
}: {
  outputs: Json[];
  download?: (url: String) => void;
}) {
  const f = z
    .object({ reserved: z.literal("file"), url: z.string().url() })
    .parse(outputs[0]);

  return (
    <Button
      icon={<DownloadOutlined />}
      onClick={() => {
        if (download) download(f.url);
      }}
    >
      Download File
    </Button>
  );
}

export default function InputMolecules({
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
      subcomponents: { ui: RemoteUI, output: DownloadFile },
    }));
    callAfterUpdateInpOuts();
  }, []);

  return (
    <div tw="flex flex-col space-y-2">
      <Typography.Text>User Input Molecules</Typography.Text>
    </div>
  );
}
