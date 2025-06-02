// src/components/modals/AuctionModal.tsx
import React, { useState } from 'react';

interface Props {
  isOpen: boolean;
  tokenId: number | null;
  onClose: () => void;
  onSubmit: (
    tokenId: number,
    durationSec: number,
    buyNowEth: string,
    minIncEth: string
  ) => Promise<void>;
}

const AuctionModal: React.FC<Props> = ({
  isOpen,
  tokenId,
  onClose,
  onSubmit,
}) => {
  const [durationMin, setDurationMin] = useState('60');     // 1 година
  const [buyNow, setBuyNow] = useState('0.5');
  const [minInc, setMinInc] = useState('0.01');
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen || tokenId === null) return null;

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      await onSubmit(
        tokenId,
        Number(durationMin) * 60,
        buyNow,
        minInc,
      );
      onClose();
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-sm">
        <h3 className="text-xl font-semibold mb-4">Створити аукціон для #{tokenId}</h3>

        <label className="block text-sm mb-1">Тривалість (хв):</label>
        <input
          value={durationMin}
          onChange={e => setDurationMin(e.target.value)}
          className="border p-2 w-full mb-3"
        />

        <label className="block text-sm mb-1">Buy Now, ETH:</label>
        <input
          value={buyNow}
          onChange={e => setBuyNow(e.target.value)}
          className="border p-2 w-full mb-3"
        />

        <label className="block text-sm mb-1">Min Bid Increment, ETH:</label>
        <input
          value={minInc}
          onChange={e => setMinInc(e.target.value)}
          className="border p-2 w-full mb-4"
        />

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded border"
          >
            Скасувати
          </button>
          <button
            disabled={isCreating}
            onClick={handleCreate}
            className="px-4 py-2 rounded bg-blue-600 text-white"
          >
            {isCreating ? 'Створення…' : 'Створити'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuctionModal;
