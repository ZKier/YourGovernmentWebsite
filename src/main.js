import './style.css'

// The URL on your server where CesiumJS's static files are hosted.
//window.CESIUM_BASE_URL = '/';

import { Viewer, GeoJsonDataSource, Color } from 'cesium';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import * as sidebar from "./infopanel.js";

//let countyData = {}; // initalize dataObject
//API_BASE = "http://127.0.0.1:5000"; // probably dont want to put this into GitHub
//Ion.defaultAccessToken = 'your_access_token';

// Create a globe and remove the infobox and selection indicator
const viewer = new Cesium.Viewer('map-container', {
    infoBox: false, // removes the infobox to the side of the page.
    selectionIndicator: false, // removes the green selection indicator from cesium globe.
    terrain: Cesium.Terrain.fromWorldTerrain(),
});  

// Pull the US GeoJSON data to create a boundary
const boundary = await Cesium.GeoJsonDataSource.load(
    '/data/us_nation.geojson',
    {
        stroke: Cesium.Color.RED,
        fill: Cesium.Color.TRANSPARENT,
        strokeWidth: 5,
        clampToGround: false
    }
);

// Add the US GeoJSON boundary to the globe
viewer.dataSources.add(boundary);
const entity = boundary.entities.values[0];
const name = entity.name;

// Add a label to the created boundary, at the moment the US because position is hardcoded
const label = viewer.entities.add({
    id: entity.id + "-label",
    position: Cesium.Cartesian3.fromDegrees(-98.5, 39.5),

    label: {
        text: name,
        font: "24px sans-serif",
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,

        style: Cesium.LabelStyle.FILL_AND_OUTLINE,

        // Creates a rectangular area behind the text
        showBackground: true,
        //backgroundColor: Cesium.Color.BLACK.withAlpha(0.01),
        backgroundColor: Cesium.Color.TRANSPARENT,
        backgroundPadding: new Cesium.Cartesian2(10, 6),

        verticalOrigin: Cesium.VerticalOrigin.Center,
        horizontalOrigin:Cesium.HorizontalOrigin.Center,
        disableDepthTestDistance: 15000000, // maybe i can make an if condition for if the location is visible on the screen
        //eyeOffset: new Cesium.Cartesian3(0, 0, -10000),

        distanceDisplayCondition:
            new Cesium.DistanceDisplayCondition(
                0.0,
                30000000.0
            )
    }
});

// Stash the boundary this label represents
label.myBoundary = boundary;

// Adds styling during hover
label.hoverStyle = {
    fillColor: Cesium.Color.YELLOW,
    outlineColor: Cesium.Color.RED
};

// creates a way for the .hoverStyle property to be used
const labelHoverHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

let hoveredEntity = null;

labelHoverHandler.setInputAction((movement) => {
    const picked = viewer.scene.pick(movement.endPosition);
    if (picked?.id?.label) {
        // Store the entity that the user is hovering
        hoveredEntity = picked.id;

        // Apply hover appearance
        hoveredEntity.label.fillColor = Cesium.Color.BLUE;
        hoveredEntity.label.outlineColor = Cesium.Color.WHITE;
    }

    else if (hoveredEntity) {
        // Restore previous entity
        hoveredEntity.label.fillColor = Cesium.Color.WHITE;
        hoveredEntity.label.outlineColor = Cesium.Color.BLACK;

        // Nothing is hovered anymore
        hoveredEntity = null;
    }
}, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

// Make the label clickable (This won't work I have to focus on the other handler)
label.onClick = () => {
    console.log("United States clicked!");
    //goTo(boundary); // I want it to go to the thing that the label represents...
};

async function goTo(boundary0) {
    await viewer.flyTo(boundary0, {
        duration: 2.0,
        offset: new Cesium.HeadingPitchRange(
            Cesium.Math.toRadians(0), // compass direction'0 = Facing North' every +90 is a clockwise turn so E S W
            Cesium.Math.toRadians(-90), // Angle that you look at the planet, -90 is looking stright down
            0 // zoom
        ),
    });
}

//Have the camera fly to the US Center
await viewer.flyTo(boundary, {
  duration: 2.0,
  offset: new Cesium.HeadingPitchRange(
    Cesium.Math.toRadians(0), // compass direction'0 = Facing North' every +90 is a clockwise turn so E S W
    Cesium.Math.toRadians(-90), // Angle that you look at the planet, -90 is looking stright down
    0 // zoom
  ),
});

// Display [Longitude / Latitude] values in the console on click.
const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
handler.setInputAction((click) => {
  const cartesian = viewer.camera.pickEllipsoid(
    click.position,
    viewer.scene.globe.ellipsoid
  );

  if (cartesian) {
    const cartographic = Cesium.Cartographic.fromCartesian(cartesian);

    const longitude = Cesium.Math.toDegrees(cartographic.longitude);
    const latitude = Cesium.Math.toDegrees(cartographic.latitude);

    console.log("Clicked location:");
    console.log("Latitude:", latitude);
    console.log("Longitude:", longitude);
  }
}, Cesium.ScreenSpaceEventType.LEFT_CLICK);


// So far this adds the data to the info panel
const clickHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

clickHandler.setInputAction((click) => {
    console.log("USER CLICKED SOMETHING!");
    const pickedObject = viewer.scene.pick(click.position);
    console.log(pickedObject);
    console.log(pickedObject.name);
    console.log(pickedObject.id.id);

    
    // Check to see if the id of the selected object ends with 
    // "-label" and postion the viewer
    if(pickedObject.id.id.endsWith("-label")) {
        console.log("this item is a label...")
        goTo(pickedObject.id.myBoundary);
    }

    if (!Cesium.defined(pickedObject)) {
        return;
    }

    const clickedEntity = pickedObject.id;
    console.log(clickedEntity.name);
    let nation_name = clickedEntity.name;

    // Check to see if the id of the selected object ends with 
    // "-label" and postion the viewer
    if(pickedObject.id.id.endsWith("-label")) {
        console.log("this item is a label...")
        goTo(pickedObject.id.myBoundary);
        nation_name = pickedObject.primitive._text;
    }

    updateDropdownHeader("nation", "Nation: " + nation_name);
  
}, Cesium.ScreenSpaceEventType.LEFT_CLICK);


// Display [Longitude / Latitude] values in the top left corner.
const coordinates = document.getElementById("coordinates");
handler.setInputAction((movement) => {
    const cartesian = viewer.camera.pickEllipsoid(
        movement.endPosition,
        viewer.scene.globe.ellipsoid
    );
    if (!cartesian) {
        coordinates.innerHTML = "Outside globe";
        return;
    }
    const cartographic = Cesium.Cartographic.fromCartesian(cartesian);

    const latitude = Cesium.Math.toDegrees(cartographic.latitude);
    const longitude = Cesium.Math.toDegrees(cartographic.longitude);

    coordinates.innerHTML =
        `Lat: ${latitude.toFixed(6)}<br>` +
        `Lon: ${longitude.toFixed(6)}`;

}, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

// Toggle the sidebar
const sidebarIcon = document.getElementById("info-panel-toggle-button");
sidebarIcon.addEventListener("click", () => {
    const wrapper = document.getElementById("info-panel-wrapper");
    wrapper.classList.toggle("closed");
});

// Pull json data
// fetch("my-government-map\public\data\counties.json")
//   .then(response => response.json())
//   .then(data => {
//     countyData = data;
//   });

// Pulls the svg file
// fetch("svg/Usa_counties_large.svg")
//     // when the file arrives convert it to text
//     .then(response => response.text())
//     // put the svg that you just pulled into the map-container element from document
//     .then(svg => {
//         document.getElementById("map-container").innerHTML = svg;
        
//         // check to see if the document was properly accessed
//         //console.log(document.querySelector("#map-container svg"));

//         // Organize zoom features from imported script in document.
//         // svgPanZoom('#map-container svg', {
//         //     zoomEnabled: true,
//         //     controlIconsEnabled: true,
//         //     fit: true,
//         //     center: true,

//         //     minZoom: 1, // 1 is the default size.
//         //     maxZoom: 20 // 20 is 20x the size.
//         // });

//         // Prevent zooming out past the starting fitted view
//         //const startingZoom = panZoomMap.getZoom();
//         //panZoomMap.setMinZoom(startingZoom);

//         // collect all of the states
//         const states = document.querySelectorAll("g[id]");
//         // collect all of the counties using ids that begin with 'c'
//         const counties = document.querySelectorAll('path[id^="c"]');

//         counties.forEach(county => {
//             county.addEventListener("mouseenter", () => {
//                 // go up the parents and find the closest <g>
//                 const state = county.closest("g[id]");
//                 // debugging
//                 console.log("County:", county.id);
//                 console.log("State:", state?.id);
//                 state.querySelectorAll('path[id^="c"]').forEach(c => {
//                     c.classList.add("state-hover");
//                 });
//             });

//             county.addEventListener("mouseleave", () => {
//                 const state = county.closest("g[id]");

//                 state.querySelectorAll('path[id^="c"]').forEach(c => {
//                     c.classList.remove("state-hover");
//                 });
//             });
//         });

//         // do what you want to each state
//         counties.forEach(county => {
//             county.addEventListener("click", () => {
//                 const data = countyData[county.id]; // this is supposed to pull from database
//                 const state = county.closest("g[id]");
//                 const stateID = state.id.replace("_", " ");
                
//                 const countyID = document.getElementById(county.id);
//                 const title = countyID.querySelector("title").textContent;
//                 const countyName = title.split(",")[0];

//                 // updating the sidebar
//                 if (!data) {
//                     // update nation dropdown
//                     updateDropdownHeader("nation", "Nation: " + "United States of America");
//                     // update state dropdown
//                     updateDropdownHeader("state", stateID);
//                     // update county dropdown
//                     updateDropdownHeader("county", `${countyName} County`);
//                     // update municipality dropdown
//                     updateDropdownHeader("municipality", "Municipality: N/A");

//                     // Populates the dropdown
//                     createDropdownContent(data);

//                     //createProfiles("nation"); // TESTING
//                     return;
//                 // Updated dropdown headers when the data is available
//                 } else {
//                     // update nation dropdown
//                     updateDropdownHeader("nation", "Nation: " + "United States of America");
//                     // update state dropdown
//                     updateDropdownHeader("state", "State: " + data.state);
//                     // update county dropdown
//                     updateDropdownHeader("county", "County: " + data.county);
//                     // update municipality dropdown
//                     updateDropdownHeader("municipality", "Municipality: N/A");

//                     // Populates the dropdown
//                     createDropdownContent(data);

//                     //createProfiles("nation"); // TESTING
//                     return;
//                     //<h2>${data.county}, ${data.state}</h2>
//                     //<p><strong>Governor:</strong> ${data.governor}</p>
//                     //<p><strong>Senators:</strong> ${data.senators.join(", ")}</p>
//                 }
//             });
//         });      
//     });

function updateDropdownHeader(layer, content) {
    document.querySelector(`#${layer}-dropdown-bar`).innerHTML = `
        <div id="${layer}-dropdown-indicator">
            <img id="${layer}-dropdown-arrow" src="svg\\down-arrow.svg" alt="closed dropdown arrow">
        </div>
        <div class="info-panel-subheader">
            <h3>${content}</h3>
        </div>
    `;
    addHideUnhideDropdownBar(layer);
    console.log("did this function run?")
}    
// Populates the dropdown
function createDropdownContent(data) {
    // Nation
    createProfiles("nation");

    // State
    //createProfile("state");
    // County
    
    // Municipality
    
}

function createPhoto(layer) {
    if (document.getElementById(`${layer}-profile-container`)) {
        document.querySelector(`#${layer}-photo-container`).insertAdjacentHTML('afterbegin', `
            <svg id="${layer}-frame-overlay" class="frame-overlay" width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <clipPath id="${layer}-frame-shape">
                        <circle cx="25" cy="25" r="25" fill="#D9D9D9"/>
                    </clipPath> 
                <defs>
            </svg>
        `);
        placePhoto(layer, "images/Georgia-Brian-Kemp-2019.jpg");
        updateName(layer);
    }
}

function placePhoto(layer, imagePath) {
    // document.querySelector(`#${layer}-photo-container`).insertAdjacentHTML('afterbegin', `
    //     <img src="images\\Georgia-Brian-Kemp-2019.jpg" alt="User Content" class="photo"></img>
    // `);
    
    const mySvg = document.getElementById(`${layer}-frame-overlay`);
    console.log(`${layer}-frame-overlay`);
    const imageString = `<image href="${imagePath}" x="0" y="0" width="50" height="50" clip-path="url(#${layer}-frame-shape)" preserveAspectRatio="xMidYMid slice" />`;
    
    mySvg.insertAdjacentHTML('beforeend', imageString);
    mySvg.insertAdjacentHTML('beforeend', `<circle cx="25" cy="25" r="24" fill="none" stroke="white" stroke-width="2"/>`);
}

function updateName(layer) {
    if (document.getElementById(`${layer}-profile-container`)) {
        document.querySelector(`#${layer}-quick-info-container`).innerHTML = `
            <div class="name-container">Brian Kemp</div>
            <div class="position-container">Governor</div>
        `;
    }
}

function createProfileText(layer) {
    document.querySelector(`#${layer}-inserted-content`).innerHTML = `
        <div class="profile-container" id="${layer}-profile-container">
            <div id="${layer}-photo-container" class="photo-container"></div>
            <div id="${layer}-quick-info-container" class="quick-info-container">
                <div class="name-container">Insert Name</div>
                <div class="position-container">Insert Position</div>
            </div>
        </div>
    `;
    return;
}

function intializeProfileText(layer, member) {
    console.log(`#${layer}-dropdown-bar`);

    let url = "";
    if (member.image_url) {
        url = member.image_url;
    } else {
        url = "https://www.google.com/url?sa=t&source=web&rct=j&url=https%3A%2F%2Fwww.geaves.com%2Fcharcoal-grey-zero&ved=0CBYQjRxqFwoTCLj_ifuarZUDFQAAAAAdAAAAABAh&opi=89978449";
    }

    document.querySelector(`#${layer}-dropdown-bar`).insertAdjacentHTML('afterend', `
        <div class="${layer}-inserted-content">
            <div class="profile-container">
                <div class="photo-container">
                    <svg class="frame-overlay" width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">    
                        <defs>
                            <clipPath id="${member.id}">
                                <circle cx="25" cy="25" r="24" fill="none" stroke="white" stroke-width="2"/>
                            </clipPath> 
                        </defs>
                        <image class="profile-photo" href="${member.image_url}" x="0" y="0" width="50" height="50" clip-path="url(#${member.id})" preserveAspectRatio="xMidYMid slice" />
                        <circle cx="25" cy="25" r="24" fill="none" stroke="white" stroke-width="2"/>
                    </svg>
                </div>
                <div class="quick-info-container">
                    <div class="name-container">${member.name}</div>
                    <div class="position-container">${member.chamber}</div>
                    <div class="position-container">${member.state}</div>
                </div>
            </div>
        </div>
    `);
}


// had to use async because this function uses an await
async function createProfiles(layer) {
    // had to use await because this function takes time
    const jsonData = await getLayerData(layer); // get the nation data in this case
    
    let member = jsonData[0];

    //console.log(member.name);
    console.log(jsonData);
    console.log(jsonData.length);
    console.log(member.name);

    let i = 0;
    while (i < jsonData.length) {
        member = jsonData[i];

        createProfile(layer, member) // i must handle a null photo
        if (i < 20) { i++; } else { break } // Stops the loop early for testing
    }
}

async function getLayerData(layer) { 
    const route = `/${layer}_congress_members`
    const response = await fetch(`${API_BASE}${route}`);
    const jsonData = await response.json();
    return jsonData;
}

function createProfile(layer, member) {
    // prevents duplication of html data
    let newDiv = document.getElementById(`${layer}-inserted-content-${member.id}`);
    if (!newDiv) { // if the new content doesn't exist do this
        intializeProfileText(layer, member); // Create dropdown values for the first time
    } else { // Do this
        //createProfileText(layer);
    }
    //createPhoto(layer);   
}

function addHideUnhideDropdownBar(layer) {
    const indicator = document.getElementById(`${layer}-dropdown-indicator`);
    indicator.addEventListener("click", () => {
        const arrow = document.getElementById(`${layer}-dropdown-arrow`);
        
        if (arrow.src.includes("svg/down-arrow.svg")) {
        arrow.src = "svg/side-arrow.svg";
        } else {
        arrow.src = "svg/down-arrow.svg";
        }
        const elements = document.querySelectorAll(`.${layer}-inserted-content`)
        elements.forEach(element => {
            element.classList.toggle("hidden");
        });
        //const element = document.getElementById(`${layer}-dropdown-bar`);
        
    });
    //const element = document.getElementById(`${layer}-dropdown-bar`);
    //element.classList.toggle("hidden");
}