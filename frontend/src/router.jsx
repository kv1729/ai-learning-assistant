import { createBrowserRouter } from "react-router";
import { NavLayout, RootLayout } from "./components/Layouts.jsx";
import CurriculumScreen from "./screens/CurriculumScreen.jsx";
import ExploreScreen from "./screens/ExploreScreen.jsx";
import FeedScreen from "./screens/FeedScreen.jsx";
import HomeRedirect from "./screens/HomeRedirect.jsx";
import NotFoundScreen from "./screens/NotFoundScreen.jsx";
import ProfileScreen from "./screens/ProfileScreen.jsx";
import QuickCheckScreen from "./screens/QuickCheckScreen.jsx";
import SavedScreen from "./screens/SavedScreen.jsx";

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <NotFoundScreen />,
    children: [
      {
        element: <NavLayout />,
        children: [
          { index: true, element: <HomeRedirect /> },
          { path: "learn/:nodeId/:position", element: <FeedScreen /> },
          { path: "explore", element: <ExploreScreen /> },
          { path: "explore/:curriculumId", element: <CurriculumScreen /> },
          { path: "profile", element: <ProfileScreen /> },
          { path: "profile/saved", element: <SavedScreen /> },
          { path: "*", element: <NotFoundScreen /> },
        ],
      },
      // Focused flows: full screen, no bottom navigation.
      // The detail screen pulls in the Markdown stack, so it loads on demand.
      {
        path: "learn/:nodeId/:position/detail",
        lazy: async () => ({ Component: (await import("./screens/DetailScreen.jsx")).default }),
      },
      { path: "learn/:nodeId/:position/check", element: <QuickCheckScreen /> },
    ],
  },
]);
