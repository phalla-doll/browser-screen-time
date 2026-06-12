import { createHashRouter } from "react-router-dom"

import { Layout } from "./Layout"
import { Home } from "./pages/Home"

// Hash routing: the dashboard is served from a static chrome-extension://
// file, so there is no server to handle path-based routes. The dashboard is a
// single full-width screen, so there is just one route under the layout.
export const router = createHashRouter([
  {
    path: "/",
    element: <Layout />,
    children: [{ index: true, element: <Home /> }],
  },
])
