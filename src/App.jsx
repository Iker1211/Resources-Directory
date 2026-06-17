import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CurriculumFlow from './pages/CurriculumFlow';
import Foundation from './pages/Foundation';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CurriculumFlow />} />
        <Route path="/foundation" element={<Foundation />} />
      </Routes>
    </BrowserRouter>
  );
}
