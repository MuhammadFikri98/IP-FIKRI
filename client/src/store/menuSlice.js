import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  menus: [],
  isLoading: false,
  error: null,
};

export const menuSlice = createSlice({
  name: "menu",
  initialState,
  reducers: {
    startLoading: (state) => {
      state.isLoading = true;
    },
    setMenus: (state, action) => {
      state.menus = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },
  },
});

export const { startLoading, setMenus, setError } = menuSlice.actions;

export default menuSlice.reducer;
