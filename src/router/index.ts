import { createHashRouter } from "react-router-dom";
import Main from "@/pages/Main";
import Preference from "@/pages/Preference";
import SelectionToolbar from "@/pages/SelectionToolbar";

export const router = createHashRouter([
  {
    Component: Main,
    path: "/",
  },
  {
    Component: Preference,
    path: "/preference",
  },
  {
    Component: SelectionToolbar,
    path: "/selection-toolbar",
  },
]);
