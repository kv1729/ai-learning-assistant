import "katex/dist/katex.min.css";
import "./index.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import { router } from "./router.jsx";
import LearnerProvider from "./state/LearnerProvider.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <LearnerProvider>
      <RouterProvider router={router} />
    </LearnerProvider>
  </StrictMode>,
);
