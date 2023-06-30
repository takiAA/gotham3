import { BrowserRouter, Routes, Route } from 'react-router-dom'

import './App.css'

import Navbar from './components/Navbar'
import Mark from './pages/mark/Mark'
import Rank from './pages/rank/Rank'
import Arbi from './pages/arbi/Arbi'
import Init from './pages/init/Init'
import Personal from './pages/personal/Personal'
import Faucet from './pages/faucet/Faucet'

import { ToastContainer } from 'react-toastify';
import PersonalArbi from './pages/personal/PersonalArbi'

function App() {
  return <BrowserRouter basename="/beta/">
    <Navbar />
    <Routes>
      <Route index element={<Mark />} />
      <Route path='faucet' element={<Faucet />} />
      <Route path='rank' element={<Rank />} />
      <Route path='arbi' element={<Arbi />} />
      <Route path='init' element={<Init />} />
      <Route path='personal' element={<Personal />} />
      <Route path='personalArbi' element={<PersonalArbi />} />
    </Routes>
    <ToastContainer
                position="top-center"
                autoClose={4000}
                limit={3}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="dark" />
  </BrowserRouter>;
}

export default App
