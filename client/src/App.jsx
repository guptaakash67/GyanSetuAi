import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import WisdomGuide from './pages/WisdomGuide'
import Library from './pages/Library'
import Journey from './pages/JourneyPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/wisdom-guide" element={<WisdomGuide />} />
        <Route path="/library" element={<Library />} />
        <Route path="/library/:slug" element={<Library />} />
        <Route path="/journey" element={<Journey />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App