import { useState } from "react";
import { useAppContext } from '../hooks/useAppContext';
import { MintForm } from "../components/mint/MintForm";
import { useNavigate } from "react-router-dom";

const MintPage = () => {
  const { account, nftContract } = useAppContext();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleMint = async (name: string, desc: string, file: File) => {
    if (!account || !nftContract) {
      setError("Будь ласка, спочатку підключіть гаманець");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // 1. Завантажити зображення на IPFS
      const imageForm = new FormData();
      imageForm.append("file", file);

      const imgRes = await fetch("http://localhost:5001/api/v0/add", {
        method: "POST",
        body: imageForm,
      });

      if (!imgRes.ok) throw new Error("Не вдалося завантажити зображення");
      const imgData = await imgRes.json();
      const imgCid = imgData.Hash;

      // 2. Створити metadata та завантажити
      const meta = {
        name,
        description: desc,
        image: `ipfs://${imgCid}`,
        createdAt: new Date().toISOString(),
      };
      const metaBlob = new Blob([JSON.stringify(meta)], {
        type: "application/json",
      });
      const metaForm = new FormData();
      metaForm.append("file", metaBlob, "metadata.json");

      const metaRes = await fetch("http://localhost:5001/api/v0/add", {
        method: "POST",
        body: metaForm,
      });

      if (!metaRes.ok) throw new Error("Не вдалося завантажити metadata");
      const metaData = await metaRes.json();
      const tokenURI = `ipfs://${metaData.Hash}`;

      // 3. Виклик контракту mintNFT
      const tx = await nftContract.mintNFT(account, tokenURI, {
        gasLimit: 500_000,
      });
      await tx.wait();
      
      console.log(tokenURI);

      // Перенаправлення на сторінку з NFT користувача після успішного мінту
      navigate("/my-nfts");
    } catch (err) {
      console.error(err);
      setError(`Помилка при створенні NFT: ${err instanceof Error ? err.message : "Невідома помилка"}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Створити новий NFT</h2>
      
      {!account && (
        <div className="mb-4 p-4 bg-yellow-100 text-yellow-800 rounded">
          Будь ласка, підключіть гаманець для створення NFT
        </div>
      )}

      <MintForm onMint={handleMint} />
      
      {isUploading && (
        <div className="mt-4 p-4 bg-blue-100 text-blue-800 rounded text-center">
          Завантаження та обробка NFT...
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-800 rounded">
          {error}
        </div>
      )}
    </div>
  );
};

export default MintPage;