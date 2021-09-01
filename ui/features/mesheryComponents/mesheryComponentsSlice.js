import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { fetchAvailableAdapters } from "./adapters";
import {
  changeOperatorStatus,
  fetchMesheryComponentsStatus,
  initialiseOperatorStatusEventsSubscriptions,
} from "./operator";

/**
    this feature/module is responsible for all the data and operations concerning Connection status, 
    operations, configurations of all the meshery components,
    - Meshery operator
    - Meshsync
    - Meshery Broker (NATS)
    - Meshery Server
    - Meshery Adapters
  */

const initialState = {
  operator: {
    connectionStatus: "UNKOWN",
    version: "UNKNOWN",
  },
  meshsync: {
    connectionStatus: "UNKOWN",
    version: "UNKNOWN",
  },
  broker: {
    connectionStatus: "UNKOWN",
    version: "UNKNOWN",
  },
  server: {
    connectionStatus: "UNKOWN",
    version: "UNKNOWN",
  },
  adapters: [],
  loading: false,
  operatorError: {
    code: null,
    desciption: null,
  },
  subscription: {
    initialised: false,
    disposer: null,
  }, // subscription object
};

export const fetchComponentsStatusThunk = createAsyncThunk(
  "mesheryComponents/fetchComponentsStatus",
  async () => {
    const response = await fetchMesheryComponentsStatus();
    return response;
  }
);

export const initialiseOperatorStatusSubscriptionThunk = createAsyncThunk(
  "mesheryComponents/initialiseOperatorStatusEventsSubscription",
  async (cb) => {
    const response = await initialiseOperatorStatusEventsSubscriptions(cb); // cb should dispatch updateConnectionStatus action
    return response;
  }
);

export const fetchAvailableAdaptersThunk = createAsyncThunk(
  "mesheryComponents/fetchAvailableAdapters",
  async () => {
    const response = await fetchAvailableAdapters();
    return response;
  }
);

export const changeOperatorStateThunk = createAsyncThunk(
  "mesheryComponents/changeOperatorState",
  async (desiredState) => {
    // error handling should be done as errors will be passed in resolved object
    const response = await changeOperatorStatus(desiredState);
    return response;
  }
);

const updateConnectionStatusReducer = (state, action) => {
  state.operator.connectionStatus =
    action.payload?.operator?.status || "UNKNOWN";

  state.broker.connectionStatus = action.payload?.broker?.status || "UNKNOWN";
  state.broker.version = action.payload?.broker?.version || "UNKNOWN";

  state.meshsync.connectionStatus =
    action.payload?.meshsync?.status || "UNKNOWN";
  state.meshsync.version = action.payload?.meshsync?.version || "UNKNOWN";

  if (
    action.payload.operator.error &&
    (action.payload.operator.error.code ||
      action.payload.operator.error.description)
  )
    state.operatorError = action.payload.operator.error;
  return state;
};

const mesheryComponentsSlice = createSlice({
  name: "mesheryComponents",
  initialState,
  reducers: {
    // use `reduce-reducers` to combine multiple reducers
    // (Refer: https://github.com/reduxjs/redux-toolkit/issues/259#issuecomment-604496169)

    // redux-toolkit uses IMMER under the hood which allows us to mutate the state without actually mutating it
    updateConnectionStatus: updateConnectionStatusReducer,
  },
  extraReducers: (builder) => {
    builder.addCase(fetchComponentsStatusThunk.pending, (state) => {
      state.loading = true;
      return state;
    });
    builder.addCase(fetchComponentsStatusThunk.fulfilled, (state, action) => {
      state.loading = false;
      return updateConnectionStatusReducer(state, action);
    });
    builder.addCase(fetchComponentsStatusThunk.rejected, (state) => {
      state.loading = false;
      return state;
    });

    builder.addCase(fetchAvailableAdaptersThunk.pending, (state) => {
      state.loading = true;
      return state;
    });
    builder.addCase(fetchAvailableAdaptersThunk.fulfilled, (state, action) => {
      state.loading = false;
      state.adapters = action.payload;
      return state;
    });
    builder.addCase(fetchAvailableAdaptersThunk.rejected, (state) => {
      state.loading = false;
      return state;
    });

    builder.addCase(
      initialiseOperatorStatusSubscriptionThunk.fulfilled,
      (state) => {
        state.subscription.initialised = true;
        // state.subscription.disposer = action.payload;
        return state;
      }
    );
    builder.addCase(
      initialiseOperatorStatusSubscriptionThunk.rejected,
      (state) => {
        state.subscription.initialised = false;
        return state;
      }
    );

    builder.addCase(changeOperatorStateThunk.pending, (state) => {
      state.loading = true;
      return state;
    }),
      builder.addCase(changeOperatorStateThunk.fulfilled, (state) => {
        state.loading = false;
        // handle other state updates
        return state;
      });
    builder.addCase(changeOperatorStateThunk.rejected, (state) => {
      state.loading = false;
      return state;
    });
  },
});

export default mesheryComponentsSlice.reducer;
export const { updateConnectionStatus } = mesheryComponentsSlice.actions;

export const operatorSelector = (state) => state.mesheryComponents.operator;
export const adaptersSelector = (state) => state.mesheryComponents.adapters;
export const loadingSelector = (state) => state.mesheryComponents.loading;
