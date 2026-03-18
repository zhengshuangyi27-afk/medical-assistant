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
import RequireAuth from './components/RequireAuth';

export default function App() {
  useEffect(() => {
    migrateToDashScopeDefault();
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans max-w-md mx-auto relative shadow-xl overflow-hidden flex flex-col">
        <Routes>
          <Route path="/profile" element={<Profile />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <Home />
              </RequireAuth>
            }
          />
          <Route
            path="/records"
            element={
              <RequireAuth>
                <Records />
              </RequireAuth>
            }
          />
          <Route
            path="/drafts"
            element={
              <RequireAuth>
                <Drafts />
              </RequireAuth>
            }
          />
          <Route
            path="/search"
            element={
              <RequireAuth>
                <Search />
              </RequireAuth>
            }
          />
          <Route
            path="/report"
            element={
              <RequireAuth>
                <Report />
              </RequireAuth>
            }
          />
          <Route
            path="/qa"
            element={
              <RequireAuth>
                <Report />
              </RequireAuth>
            }
          />
          <Route
            path="/tasks"
            element={
              <RequireAuth>
                <Tasks />
              </RequireAuth>
            }
          />
          <Route
            path="/calculator"
            element={
              <RequireAuth>
                <Calculator />
              </RequireAuth>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
