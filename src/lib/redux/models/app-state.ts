import {Action} from 'easy-peasy'

interface AppState {
    isShowSidebar: boolean
    setIsShowSidebar: Action<AppState, boolean>
}

export type {AppState}