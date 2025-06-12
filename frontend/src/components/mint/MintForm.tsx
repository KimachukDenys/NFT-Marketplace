import React, { useState, useRef, useCallback } from "react";

interface Props {
  onMint: (name: string, desc: string, file: File) => void;
}

export const MintForm: React.FC<Props> = ({ onMint }) => {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File | null) => {
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type.startsWith("image/")) {
        handleFile(droppedFile);
        e.dataTransfer.clearData();
      }
    }
  }, []);

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const openFileDialog = () => {
    inputRef.current?.click();
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (file) onMint(name.trim(), desc.trim(), file);
      }}
      className="space-y-6"
    >
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Назва NFT"
        className="w-full rounded-xl border border-gray-300 px-3 py-2 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-color"
        required
      />

      <textarea
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        placeholder="Опис NFT"
        rows={4}
        className="w-full rounded-xl border border-gray-300 px-3 py-2 text-black dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-accent-color"
        required
      />

      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={openFileDialog}
        className={`cursor-pointer border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition
          ${isDragging ? "border-accent-color bg-accent-color/10" : "border-gray-400 bg-gray-50 dark:bg-gray-800"}
        `}
        style={{ minHeight: 180 }}
      >
        {preview ? (
          <img
            src={preview}
            alt="preview"
            className="max-h-36 object-contain rounded-md"
          />
        ) : (
          <>
            <p className="text-gray-500 dark:text-gray-400 mb-2">Перетягніть сюди фото або клікніть щоб вибрати файл</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFile(e.target.files[0]);
            }
          }}
          className="hidden"
        />
      </div>

      <button
        type="submit"
        disabled={!file || !name.trim() || !desc.trim()}
        className="w-full rounded bg-accent-color py-3 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent-color-dark transition"
      >
        Mint NFT
      </button>
    </form>
  );
};
