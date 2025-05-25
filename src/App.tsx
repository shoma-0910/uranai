import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { FortuneTellerProfile } from './components/FortuneTellerProfile';
import { RegisterPage } from './pages/RegisterPage';
import { UserRegisterPage } from './pages/UserRegisterPage';
import { FortuneTellerRegisterPage } from './pages/FortuneTellerRegisterPage';
import { LoginPage } from './pages/LoginPage';
import { TopPage } from './pages/TopPage';
import { FortuneTellerListPage } from './pages/FortuneTellerListPage';
import { MyPage } from './pages/MyPage';
import { FortuneTellerMyPage } from './pages/FortuneTellerMyPage';
import { FortuneTellerProfilePage } from './pages/FortuneTellerProfilePage';
import { FortuneTellerProfileEditPage } from './pages/FortuneTellerProfileEditPage';
import { AvailabilitySchedulePage } from './pages/AvailabilitySchedulePage';
import { AdminPage } from './pages/AdminPage';
import { Header } from './components/Header';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-white text-gray-800">
        <Header />
        <Toaster position="top-right" />
        
        <Routes>
          <Route path="/" element={<TopPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/fortune-tellers" element={<FortuneTellerListPage />} />
          <Route path="/fortune-teller/:id" element={<FortuneTellerProfile />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/register/user" element={<UserRegisterPage />} />
          <Route path="/register/fortune-teller" element={<FortuneTellerRegisterPage />} />
          <Route path="/register/fortune-teller/profile" element={<FortuneTellerProfilePage />} />
          <Route path="/register/fortune-teller/profile/edit" element={<FortuneTellerProfileEditPage />} />
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/mypage/fortune-teller" element={<FortuneTellerMyPage />} />
          <Route path="/mypage/fortune-teller/availability" element={<AvailabilitySchedulePage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;