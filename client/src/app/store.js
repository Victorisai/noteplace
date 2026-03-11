import { configureStore } from '@reduxjs/toolkit';
import messagesReducer from '../features/messages/messagesSlice';

export const store = configureStore({
  reducer: {
    messages: messagesReducer,
  },
});

export default store;
