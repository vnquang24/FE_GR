import { createStore } from 'easy-peasy'
import { StoreModel } from './models'
import { appState} from './stores'

const model: StoreModel = {
    appState
}

const store = createStore<StoreModel>(model)

export default store
