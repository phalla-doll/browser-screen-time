import { createHashRouter } from "react-router-dom"

import { Layout } from "./Layout"
import { Analytics } from "./pages/Analytics"
import { Dashboard } from "./pages/Dashboard"
import { Insights } from "./pages/Insights"
import { Timeline } from "./pages/Timeline"

// Hash routing: the dashboard is served from a static chrome-extension://
// file, so there is no server to handle path-based routes.
export const router = createHashRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "timeline", element: <Timeline /> },
      { path: "analytics", element: <Analytics /> },
      { path: "insights", element: <Insights /> },
    ],
  },
])
