import { configureStore } from '@reduxjs/toolkit';
import reportsReducer from '../features/reportsSlice.jsx';

export default configureStore({
    reducer: {
        reports: reportsReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false,
        }),
});