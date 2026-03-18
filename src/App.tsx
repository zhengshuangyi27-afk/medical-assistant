/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Records from './pages/Records';
import Drafts from './pages/Drafts';
import Search from './pages/Search';
import Report from './pages/Report';
import Profile from './pages/Profile';
import Calculator from './pages/Calculator';
import Tasks from './pages/Tasks';
import { migrateToDashScopeDefault } from './lib/llm';

export default function App() {
  useEffect(() => {
    migrateToDashScopeDefault();
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans max-w-md mx-auto relative shadow-xl overflow-hidden flex flex-col">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/records" element={<Records />} />
          <Route path="/drafts" element={<Drafts />} />
          <Route path="/search" element={<Search />} />
          <Route path="/report" element={<Report />} />
          <Route path="/qa" element={<Report />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/calculator" element={<Calculator />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
