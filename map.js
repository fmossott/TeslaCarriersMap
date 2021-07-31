function buildMap(ships) {
  var map = L.map("map",
    {
      center: [20.0, 0.0],
      crs: L.CRS.EPSG3857,
      zoom: 2,
      zoomControl: true,
      preferCanvas: false,
    }
  );

  var featureGroupTiles = L.featureGroup().addTo(map);

  L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    { "attribution": "Data by \u0026copy; \u003ca href=\"http://openstreetmap.org\"\u003eOpenStreetMap\u003c/a\u003e, under \u003ca href=\"http://www.openstreetmap.org/copyright\"\u003eODbL\u003c/a\u003e.", "detectRetina": false, "maxNativeZoom": 18, "maxZoom": 18, "minZoom": 0, "noWrap": false, "opacity": 1, "subdomains": "abc", "tms": false }
  ).addTo(featureGroupTiles);

  var featureGroupConfirmedShips = L.featureGroup().addTo(map);
  var featureGroupWatchList = L.featureGroup().addTo(map);

  for (const [sid, ship] of Object.entries(ships)) {
    var fg = ship.mapStatus < 4 ? featureGroupConfirmedShips : featureGroupWatchList;
    addShip(sid, ship, fg);
  }

  L.control.layers(
      {},
      {
        "Watchlist" : featureGroupWatchList,
      },
      {"autoZIndex": true, "collapsed": false, "position": "topright"}
  ).addTo(map);

  featureGroupWatchList.remove();
}

const MARKERCOLORS = ['red', 'orange', 'green', 'blue', 'lightgray']

function addShip(sid, ship, layer) {
  var pos = ship.position;
  var m = pos.match('(?<la>-?\\d*(.\\d+))° \\/ (?<lo>-?\\d*(.\\d+))°');
  if (!m)
    return;

  var lat = m.groups.la;
  var lon = m.groups.lo;

  var color = MARKERCOLORS[ship.mapStatus];
  if (color === undefined) {
    color = 'white';
  }

  var marker = L.marker([lat, lon]).addTo(layer);

  var icon = L.AwesomeMarkers.icon(
    { "extraClasses": "fa-rotate-0", "icon": ship.mapStatus==4 ? "binoculars" : "ship", "iconColor": "white", "markerColor": color, "prefix": "fa" }
  );
  marker.setIcon(icon);

  var popup = L.popup({ "maxWidth": "100%" }).setContent(
    `<div class="map-popup">
         <center>
           <b><a href="https://www.marinetraffic.com/en/ais/home/shipid:${ship.mtsid}/zoom:10" target="_blank" rel="noopener noreferrer">${ship.name}</a></b>
           <br>
           ${ship.dept} &gt; ${ship.dest}
           <br>
           <i>${ship.status}</i>
        </center>
      </div>`
  );

  marker.bindPopup(popup)

  var label = L.marker([lat, lon]).addTo(layer);

  var div = L.divIcon({
    "className": "map-label", 
    "html": `<span>${ship.name}</span>`,
    "iconAnchor": [0, 0]});
  label.setIcon(div);
}

function loadShips() {
  $.getJSON('map.json', ships => {
    console.log(ships)
    buildMap(ships)
  });
}

$(loadShips)