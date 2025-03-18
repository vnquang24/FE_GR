import { AppState } from '@/lib/redux/models/app-state';
import {action} from 'easy-peasy'

const appState: AppState = {
    isShowSidebar: false,
    setIsShowSidebar: action((state, payload) => {
        state.isShowSidebar = payload
    }),
}

export { appState }
