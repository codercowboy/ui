import {BaseView} from "../baseView";
import {HtmlString} from "../../models/iView";
import {iHospital} from "../../../store/models/iHospital";
import {iMapRender} from "../../models/iMapRender";
import {BaseMapRender} from "../mapRender/baseMapRender";
import {DISPATCHER_MESSAGES} from "../../../dispatcher/dispatcher.messages";
import {LOG_LEVEL} from "../../../logger/models/iLog";

export class HospitalMap extends BaseView {

    private mapContainerId: string;
    private mapApi: BaseMapRender;
    private mapReady = false;
    private mapSelectedApi: string;

    private currentHospitals: Array<iHospital> = [];

    protected doInit(): HtmlString {
        this.mapContainerId = this.getUniqueId();

        return `
            <div id="${this.mapContainerId}" class="hospitalMapContainer"></div>
        `;
    }

    protected onPlacedInDocument(): void {
        this.listenToMapReady();
        this.listenToSelectedMapApi();
        this.listenToHospitalList();
    }

    private listenToMapReady(): void {
        this.modules.subscriptionTracker.subscribeTo(
            this.modules.store.MapReady$,
            async (isReady: boolean) => {
                this.mapReady = isReady;
                if (this.mapReady && this.mapSelectedApi) {
                    await this.initMap(this.mapSelectedApi);
                }
            }
        );
    }

    private listenToSelectedMapApi(): void {
        this.modules.subscriptionTracker.subscribeTo(
            this.modules.store.SelectedMapApiName$,
            async (mapName: string) => {
                this.mapSelectedApi = mapName;
                if (this.mapReady) {
                    await this.initMap(mapName);
                }
            }
        );
    }

    private listenToHospitalList(): void {
        this.modules.subscriptionTracker.subscribeTo(
            this.modules.store.HospitalList$,
            async (newList: Array<iHospital>) => {
                this.currentHospitals = newList;
                if (this.mapReady) {
                    await this.updateMap(newList);
                }
            }
        );
    }

    private listenToMarkerClick(): void {
        this.modules.subscriptionTracker.subscribeTo(
            this.mapApi.markerClicked$,
            (hospitalName: string) => {
                this.handleMarkerClick(hospitalName);
            }
        );
    }

    private handleMarkerClick(hospitalName: string) {
        const hospital = this.currentHospitals.find(item => item.name === hospitalName);
    }

    private async initMap(apiSelector: string): Promise<void> {
        this.modules.dispatcher.dispatch(DISPATCHER_MESSAGES.NewLog,{
            message: "Initializing map in HospitalMap view",
            data: {map: apiSelector},
            level: LOG_LEVEL.Debug
        });
        if (this.mapApi) {
            this.mapApi.destroy();
        }
        this.mapApi = <BaseMapRender>document.createElement(apiSelector);
        this.mapApi.init(this.modules);

        //@ts-ignore
        document.getElementById(this.mapContainerId).appendChild(this.mapApi);

        await this.mapApi.loadMap();
        this.listenToMarkerClick();
    }

    private async updateMap(hospitalList: Array<iHospital>): Promise<void> {
        if (!this.mapApi.isInitialized) {
            await this.initMap(this.mapSelectedApi);
        } else {
            this.mapApi.removeAllMarkers();
        }

        const lenMinus = hospitalList.length - 1;
        hospitalList.forEach((hospital,index) => {
            this.mapApi.streamAddMarker(hospital.name,{
                markerTitle: hospital.name,
                position: hospital.address.coordinates
            },index === lenMinus )
        });
    }

    protected doDestroySelf(): void {
        if (this.mapApi) {
            this.mapApi.destroy();
            //@ts-ignore
            this.mapApi = null;
        }
    }

}