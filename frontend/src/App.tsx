import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/common/Navbar';
import { AppProvider } from './AppProvider';
import HomePage from './pages/HomePage';
import { MarketplacePage} from './pages/MarketplacePage';
import MintPage from './pages/MintPage';
import { MyNftsPage } from './pages/MyNftsPage';
import  AuctionPage  from './pages/AuctionPage'
import AuctionDetailPage from './pages/AuctionDetailPage';
import Footer from './components/common/Footer';

function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <Routes>
              <Route path="/" element={<HomePage />} />
          </Routes>
          <main className="flex-grow container mx-auto px-4 py-8">
            <Routes>
              <Route path="/marketplace" element={<MarketplacePage />} />
              <Route path="/mint" element={<MintPage />} />
              <Route path="/my-nfts" element={<MyNftsPage />} />
              <Route path="/auction" element={<AuctionPage />} />
              <Route path="/auction/:id" element={<AuctionDetailPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;