import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/common/Navbar';
import { AppProvider } from './AppContext';
import { MarketplacePage} from './pages/MarketplacePage';
import MintPage from './pages/MintPage';
import { MyNftsPage } from './pages/MyNftsPage';

function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <div className="min-h-screen bg-gray-100">
          <Navbar />
          <div className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<MarketplacePage />} />
              <Route path="/mint" element={<MintPage />} />
              <Route path="/my-nfts" element={<MyNftsPage />} />
            </Routes>
          </div>
        </div>
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;