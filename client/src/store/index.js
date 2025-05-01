import { configureStore } from "@reduxjs/toolkit";
import menuReducer from "./menuSlice";
import collectionsReducer from "./collectionsSlice";

export const store = configureStore({
  reducer: {
    menu: menuReducer,
    collections: collectionsReducer,
    // tambahkan reducer lain jika diperlukan
  },
});
