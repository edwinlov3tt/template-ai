import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Editor from './pages/Editor'
import Embed from './pages/Embed'
import Templates from './pages/Templates'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/editor" element={<Editor />} />
      <Route path="/editor/:shareCode" element={<Editor />} />
      <Route path="/embed" element={<Embed />} />
      <Route path="/templates" element={<Templates />} />
    </Routes>
  )
}
