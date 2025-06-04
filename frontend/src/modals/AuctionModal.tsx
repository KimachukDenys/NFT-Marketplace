import React, { useState } from 'react';
import { addMonths } from 'date-fns';

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
    now.setMinutes(now.getMinutes() + 60); // default +1 година
    return now.toISOString().slice(0, 16); // "yyyy-MM-ddTHH:mm"
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

      await onSubmit(
        tokenId,
        durationSec,
        buyNow,
        minInc,
      );
      onClose();
    } finally {
      setIsCreating(false);
    }
  };

  const maxDate = addMonths(new Date(), 6).toISOString().slice(0, 16);
  const minDate = new Date().toISOString().slice(0, 16);

  return (
   <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        background: 'gray',
        padding: '20px',
        borderRadius: '8px',
        maxWidth: '800px',
        width: '100%'
      }}>        
      
        <h3 className="text-xl font-semibold mb-4">Створити аукціон для #{tokenId}</h3>
        <label className="block text-sm mb-1">Дата завершення:</label>
        <input
          type="datetime-local"
          value={endDateTime}
          min={minDate}
          max={maxDate}
          onChange={e => setEndDateTime(e.target.value)}
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
            className="px-4 py-2 rounded border hover:bg-gray-100"
          >
            Скасувати
          </button>
          <button
            disabled={isCreating}
            onClick={handleCreate}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isCreating ? 'Створення…' : 'Створити'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuctionModal;
