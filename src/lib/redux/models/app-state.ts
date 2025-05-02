import {Action} from 'easy-peasy'

interface AppState {
    isShowSidebar: boolean
    setIsShowSidebar: Action<AppState, boolean>
    operationNowPage: number
    setOperationNowPage: Action<AppState, number>
}

export type {AppState}