import {
    createBrowserRouter, 
  } from "react-router-dom";
import Home from "../page/home";
import Guide from "../components/help/userGuides"

  const router = createBrowserRouter([
    {
      path: "/",
      element: (
       <Home />
      ),
    },
    {
      path: "/Guide",
      element: (
       <Guide />
      ),
    },
   
  ]);

  export default router