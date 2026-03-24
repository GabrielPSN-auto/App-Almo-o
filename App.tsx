/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Registro from "./pages/Registro";
import Dados from "./pages/Dados";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Registro />} />
          <Route path="dados" element={<Dados />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
