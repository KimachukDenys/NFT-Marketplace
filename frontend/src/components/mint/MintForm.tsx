// src/components/mint/MintForm.tsx
import React, { useState } from "react";

interface Props {
  onMint: (name: string, desc: string, file: File) => void;
}

export const MintForm: React.FC<Props> = ({ onMint }) => {
  const [name, setName]   = useState("");
  const [desc, setDesc]   = useState("");
  const [file, setFile]   = useState<File | null>(null);
  const [preview, setPrev] = useState<string | null>(null);
  

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    if (f) setPrev(URL.createObjectURL(f));
  };

  return (
    <div>
      <h2>Створити NFT</h2>

      <input value={name} onChange={e => setName(e.target.value)} placeholder="Назва" />

      <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Опис" />

      <input type="file" accept="image/*" onChange={handleFile} />
      {preview && <img src={preview} alt="preview" style={{maxWidth:150, marginTop:8}} />}

      <button disabled={!file || !name || !desc}
              onClick={() => file && onMint(name.trim(), desc.trim(), file)}>
        Mint
      </button>
    </div>
  );
};
