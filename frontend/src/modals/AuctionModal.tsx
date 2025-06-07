import React, { useState } from 'react';
import { addMonths } from 'date-fns';
import './Modal.css';

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
  const [endDateTime, setEndDateTime] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 60);
    return now.toISOString().slice(0, 16);
  });

  const [buyNow, setBuyNow] = useState('0.5');
  const [minInc, setMinInc] = useState('0.01');
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen || tokenId === null) return null;

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const selectedTime = new Date(endDateTime).getTime();
      const now = new Date().getTime();
      const durationSec = Math.floor((selectedTime - now) / 1000);

      if (durationSec <= 0) {
        alert("Дата завершення повинна бути пізніше поточної.");
        setIsCreating(false);
        return;
      }

      await onSubmit(tokenId, durationSec, buyNow, minInc);
      onClose();
    } finally {
      setIsCreating(false);
    }
  };

  const maxDate = addMonths(new Date(), 6).toISOString().slice(0, 16);
  const minDate = new Date().toISOString().slice(0, 16);

  return (
    <div className="modal-backdrop">
      <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-6 w-full max-w-xl shadow-lg">
        <h3 className="text-xl font-semibold mb-5 dark:text-white">
          Створити аукціон для #{tokenId}
        </h3>

        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
          Дата завершення:
        </label>
        <input
          type="datetime-local"
          value={endDateTime}
          min={minDate}
          max={maxDate}
          onChange={(e) => setEndDateTime(e.target.value)}
          className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 w-full mb-4 bg-white dark:bg-gray-800 text-black dark:text-white"
        />

        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
          Buy Now, ETH:
        </label>
        <input
          value={buyNow}
          onChange={(e) => setBuyNow(e.target.value)}
          className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 w-full mb-4 bg-white dark:bg-gray-800 text-black dark:text-white"
        />

        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
          Min Bid Increment, ETH:
        </label>
        <input
          value={minInc}
          onChange={(e) => setMinInc(e.target.value)}
          className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 w-full mb-4 bg-white dark:bg-gray-800 text-black dark:text-white"
        />

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
          >
            Скасувати
          </button>
          <button
            disabled={isCreating}
            onClick={handleCreate}
          >
            {isCreating ? 'Створення…' : 'Створити'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuctionModal;
