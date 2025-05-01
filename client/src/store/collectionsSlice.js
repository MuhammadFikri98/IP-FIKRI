import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Async thunk for fetching user's collections
export const fetchCollections = createAsyncThunk(
  "collections/fetchCollections",
  async (userId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("access_token");

      if (!token) {
        return rejectWithValue("No access token found");
      }

      const response = await axios.get(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:3000"
        }/users/${userId}/collections`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch collections"
      );
    }
  }
);

// Async thunk for creating a new collection
export const createCollection = createAsyncThunk(
  "collections/createCollection",
  async (collectionData, { rejectWithValue, dispatch }) => {
    try {
      const token = localStorage.getItem("access_token");

      if (!token) {
        return rejectWithValue("No access token found");
      }

      const response = await axios.post(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:3000"
        }/collections`,
        collectionData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // After creating a collection, refresh the collections list
      if (response.data) {
        dispatch(fetchCollections(response.data.userId));
      }

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create collection"
      );
    }
  }
);

// Async thunk for fetching a single collection by ID
export const fetchCollectionById = createAsyncThunk(
  "collections/fetchCollectionById",
  async (id, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("access_token");

      if (!token) {
        return rejectWithValue("No access token found");
      }

      const response = await axios.get(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:3000"
        }/collections/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch collection"
      );
    }
  }
);

// Async thunk for updating a collection
export const updateCollection = createAsyncThunk(
  "collections/updateCollection",
  async ({ id, collectionData }, { rejectWithValue, dispatch }) => {
    try {
      const token = localStorage.getItem("access_token");

      if (!token) {
        return rejectWithValue("No access token found");
      }

      const response = await axios.put(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:3000"
        }/collections/${id}`,
        collectionData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // After updating a collection, refresh all collections
      if (response.data && response.data.userId) {
        dispatch(fetchCollections(response.data.userId));
      }

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update collection"
      );
    }
  }
);

// Async thunk for deleting a collection
export const deleteCollection = createAsyncThunk(
  "collections/deleteCollection",
  async (collectionId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("access_token");

      if (!token) {
        return rejectWithValue("No access token found");
      }

      await axios.delete(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:3000"
        }/collections/${collectionId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      return collectionId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete collection"
      );
    }
  }
);

// Initial state
const initialState = {
  collections: [],
  currentCollection: null,
  isLoading: false,
  error: null,
  success: null,
};

// Create the slice
const collectionsSlice = createSlice({
  name: "collections",
  initialState,
  reducers: {
    clearCollectionsError: (state) => {
      state.error = null;
    },
    clearCollectionsSuccess: (state) => {
      state.success = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch collections cases
      .addCase(fetchCollections.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCollections.fulfilled, (state, action) => {
        state.collections = action.payload;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(fetchCollections.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Create collection cases
      .addCase(createCollection.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(createCollection.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
        state.success = "Collection created successfully";
      })
      .addCase(createCollection.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.success = null;
      })

      // Fetch single collection cases
      .addCase(fetchCollectionById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.currentCollection = null;
      })
      .addCase(fetchCollectionById.fulfilled, (state, action) => {
        state.currentCollection = action.payload;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(fetchCollectionById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.currentCollection = null;
      })

      // Update collection cases
      .addCase(updateCollection.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(updateCollection.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
        state.success = "Collection updated successfully";

        // Update collection in the collections array if it exists
        const index = state.collections.findIndex(
          (col) => col.id === action.payload.id
        );
        if (index !== -1) {
          state.collections[index] = action.payload;
        }
      })
      .addCase(updateCollection.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.success = null;
      })

      // Delete collection cases
      .addCase(deleteCollection.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteCollection.fulfilled, (state, action) => {
        state.collections = state.collections.filter(
          (collection) => collection.id !== action.payload
        );
        state.isLoading = false;
        state.error = null;
        state.success = "Collection deleted successfully";
      })
      .addCase(deleteCollection.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearCollectionsError, clearCollectionsSuccess } =
  collectionsSlice.actions;

export default collectionsSlice.reducer;
