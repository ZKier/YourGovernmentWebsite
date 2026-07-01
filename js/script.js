let countyData = {}; // initalize dataObject
API_BASE = "http://127.0.0.1:5000";

// Pull json data
fetch("data/counties.json")
  .then(response => response.json())
  .then(data => {
    countyData = data;
  });

// Pulls the svg file
fetch("svg/Usa_counties_large.svg")
    // when the file arrives convert it to text
    .then(response => response.text())
    // put the svg that you just pulled into the map-container element from document
    .then(svg => {
        document.getElementById("map-container").innerHTML = svg;
        
        // check to see if the document was properly accessed
        console.log(document.querySelector("#map-container svg"));

        // Organize zoom features from imported script in document.
        svgPanZoom('#map-container svg', {
            zoomEnabled: true,
            controlIconsEnabled: true,
            fit: true,
            center: true,

            minZoom: 1, // 1 is the default size.
            maxZoom: 20 // 20 is 20x the size.
        });

        // Prevent zooming out past the starting fitted view
        //const startingZoom = panZoomMap.getZoom();
        //panZoomMap.setMinZoom(startingZoom);

        // collect all of the states
        const states = document.querySelectorAll("g[id]");
        // collect all of the counties using ids that begin with 'c'
        const counties = document.querySelectorAll('path[id^="c"]');

        counties.forEach(county => {
            county.addEventListener("mouseenter", () => {
                // go up the parents and find the closest <g>
                const state = county.closest("g[id]");
                // debugging
                console.log("County:", county.id);
                console.log("State:", state?.id);
                state.querySelectorAll('path[id^="c"]').forEach(c => {
                    c.classList.add("state-hover");
                });
            });

            county.addEventListener("mouseleave", () => {
                const state = county.closest("g[id]");

                state.querySelectorAll('path[id^="c"]').forEach(c => {
                    c.classList.remove("state-hover");
                });
            });
        });

        // do what you want to each state
        counties.forEach(county => {
            county.addEventListener("click", () => {
                const data = countyData[county.id]; // this is supposed to pull from database
                const state = county.closest("g[id]");
                const stateID = state.id.replace("_", " ");
                
                const countyID = document.getElementById(county.id);
                const title = countyID.querySelector("title").textContent;
                const countyName = title.split(",")[0];

                // updating the sidebar
                if (!data) {
                    // update nation dropdown
                    updateDropdownHeader("nation", "Nation: " + "United States of America");
                    // update state dropdown
                    updateDropdownHeader("state", stateID);
                    // update county dropdown
                    updateDropdownHeader("county", `${countyName} County`);
                    // update municipality dropdown
                    updateDropdownHeader("municipality", "Municipality: N/A");

                    // Populates the dropdown
                    createDropdownContent(data);

                    //createProfiles("nation"); // TESTING
                    return;
                // Updated dropdown headers when the data is available
                } else {
                    // update nation dropdown
                    updateDropdownHeader("nation", "Nation: " + "United States of America");
                    // update state dropdown
                    updateDropdownHeader("state", "State: " + data.state);
                    // update county dropdown
                    updateDropdownHeader("county", "County: " + data.county);
                    // update municipality dropdown
                    updateDropdownHeader("municipality", "Municipality: N/A");

                    // Populates the dropdown
                    createDropdownContent(data);

                    //createProfiles("nation"); // TESTING
                    return;
                    //<h2>${data.county}, ${data.state}</h2>
                    //<p><strong>Governor:</strong> ${data.governor}</p>
                    //<p><strong>Senators:</strong> ${data.senators.join(", ")}</p>
                }
            });
        });      
    });

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