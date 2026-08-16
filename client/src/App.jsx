import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from './components/ProtectedRoute'

import Home from './pages/Home'
import WisdomGuide from './pages/WisdomGuide'
import Library from './pages/Library'
import Journey from "./pages/JourneyPage"
import SignIn from "./pages/SignIn"
import SignUp from "./pages/SignUp"
import ScriptureChat from './pages/ScriptureChat'  // ← ADD THIS

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/library" element={<Library />} />
          <Route path="/library/:slug" element={<Library />} />
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/sign-up" element={<SignUp />} />

          {/* Protected routes */}
          <Route path="/wisdom-guide" element={<ProtectedRoute><WisdomGuide /></ProtectedRoute>} />
          <Route path="/journey" element={<ProtectedRoute><Journey /></ProtectedRoute>} />
          <Route path="/chat/:tradition/:textId" element={<ProtectedRoute><ScriptureChat /></ProtectedRoute>} />  {/* ← ADD THIS */}
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App