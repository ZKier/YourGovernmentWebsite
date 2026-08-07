import './style.css'

// The URL on your server where CesiumJS's static files are hosted.
//window.CESIUM_BASE_URL = '/';

import {
  Viewer,
  GeoJsonDataSource,
  Color
} from 'cesium';

import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';

// Find the info-panel in the screen
export function initializeInfoPanel() {
    const info_panel = document.getElementById("info-panel");
}

