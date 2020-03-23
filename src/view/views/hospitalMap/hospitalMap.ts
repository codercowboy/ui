import {BaseView} from "../baseView";
import {HtmlString} from "../../models/iView";
import {iHospital} from "../../../store/models/iHospital";
import {iMapRender} from "../../models/iMapRender";

export class HospitalMap extends BaseView {

    private mapContainerId: string;
    private mapApi: iMapRender;

    private currentHospitals: Array<iHospital> = [];

    protected doInit(): HtmlString {
        this.mapContainerId = this.getUniqueId();

        return `
            <div id="${this.mapContainerId}" class="hospitalMapContainer"></div>
        `;
    }

    protected onPlacedInDocument(): void {
        this.listenToSelectedMapApi();
        this.listenToHospitalList();
        this.listenToMarkerClick();
    }

    private listenToSelectedMapApi(): void {
        this.modules.subscriptionTracker.subscribeTo(
            this.modules.store.SelectedMapApiName$,
            (mapName: string) => {
                this.initMap(mapName);
            }
        );
    }

    private listenToHospitalList(): void {
        this.modules.subscriptionTracker.subscribeTo(
            this.modules.store.HospitalList$,
            (newList: Array<iHospital>) => {
                this.currentHospitals = newList;
                this.updateMap(newList);
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
        console.log(hospitalName,hospital);
    }

    private async initMap(apiName: string): Promise<void> {
        if (this.mapApi) {
            this.mapApi.removeMap();
        }
        this.mapApi = this.modules.mapRenderFactory.getMap(apiName);
        await this.mapApi.loadMap(this.mapContainerId);
    }

    private updateMap(hospitalList: Array<iHospital>): void {
        this.mapApi.removeAllMarkers();
        const lenMinus = hospitalList.length - 1;
        hospitalList.forEach((hospital,index) => {
            this.mapApi.streamAddMarker(hospital.name,{
                markerTitle: hospital.name,
                position: hospital.address.coordinates
            },index === lenMinus )
        });
    }

    protected doDestroySelf(): void {
        this.mapApi.removeMap();
    }

}