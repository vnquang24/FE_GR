import { AppState } from '@/lib/redux/models/app-state';
import {action} from 'easy-peasy'

const appState: AppState = {
    isShowSidebar: false,
    setIsShowSidebar: action((state, payload) => {
        state.isShowSidebar = payload
    }),
    operationNowPage: 1,
    setOperationNowPage: action((state, payload) => {
        state.operationNowPage = payload
    }),
    isUpdateAbility: false,
    setIsUpdateAbility: action((state, payload) => {
        state.isUpdateAbility = payload
    })
}

export { appState }
