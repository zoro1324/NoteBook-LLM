import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'
import HomePage from './pages/HomePage'
import NotebookPage from './pages/NotebookPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/notebook/:id" element={<NotebookPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
