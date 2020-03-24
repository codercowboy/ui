import {iStore, iStoreState} from "../store/models/iStore";
import {iDispatcher} from "../dispatcher/models/iDispatcher";
import {Store} from "../store/store";
import {Dispatcher} from "../dispatcher/dispatcher";
import {StubStoreDataQuery} from "../store/dataQuery/stubDataQuery";
import {ViewRegistry} from "../view/viewRegistry/viewRegistry";
import {iViewRegistry} from "../view/models/iViewRegistry";
import {AppMain} from "../view/views/appMain";
import {iAddressFormatter} from "../common/models/iAddressFormatter";
import {AddressFormatter} from "../common/addressFormatter";
import {DISPATCHER_MESSAGES} from "../dispatcher/dispatcher.messages";

interface iBaseAppModules {
    store: iStore,
    dispatcher: iDispatcher,
    DISPATCHER_MESSAGES: {[key:string]: string},
    appView: AppMain,
    viewRegistry: iViewRegistry,
    addressFormatter: iAddressFormatter
}

const initialStoreState: iStoreState = {
    hospitalList: [],
    currentPage: "hospital-map",
    debugShowStoreState: false,
    isLoading: true,
    selectedMapApiName: "google-maps-render",
    mapReady: false,
    mapState: {
        zoom: 5,
        center: {
            lat: 0,
            lng: 0
        }
    }
};


const placeholderId = "appContainer";

class Bootstrapper {

    static initApp(): void {
        const modules = Bootstrapper.resolveModules();
        const placeholder = document.getElementById(placeholderId);
        if (!placeholder) {
            throw new Error("Error during app start: a div with id "+placeholderId+" must be set!");
        }
        placeholder.appendChild(modules.appView);
        modules.appView.init(modules);

        //@ts-ignore
        if (window.MAP_IS_READY) {
            //@ts-ignore
            window.__init_map.call(modules);
        } else {
            //@ts-ignore
            window.__init_map = window.__init_map.bind(modules);
        }

    }

    private static resolveModules(): iBaseAppModules {
        const dispatcher = new Dispatcher();

        const storeDataQuery = new StubStoreDataQuery();
        const store = new Store({
            dispatcher,
            dataQuery: storeDataQuery
        },initialStoreState);

        const viewRegistry = new ViewRegistry();

        const appView = <AppMain>document.createElement(viewRegistry.selectors.AppMain);
        const addressFormatter = new AddressFormatter();

        return {
            store,
            dispatcher,
            appView,
            viewRegistry,
            addressFormatter,
            DISPATCHER_MESSAGES
        };
    }
}
Bootstrapper.initApp();