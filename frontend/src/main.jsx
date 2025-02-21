import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.sass'
import App from './App.jsx'
// import {Provider} from "react-redux";
// import store from './components/ReportCreation/store.js'

createRoot(document.getElementById('root')).render(
    // <Provider store={store}>
    <StrictMode>
        <App />
    </StrictMode>
    // </Provider>,
)
