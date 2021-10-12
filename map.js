const MARKERCOLORS = ['red', 'orange', 'green', 'blue', 'lightgray']
class Map {

  constructor(mapElementId) {
    this.buildMap(mapElementId);
  }

  buildMap(mapElementId) {
    this.map = L.map(mapElementId,
      {
        center: [20.0, 0.0],
        crs: L.CRS.EPSG3857,
        zoom: 2,
        zoomControl: true,
        preferCanvas: false,
        worldCopyJump: true
      }
    );

    this.featureGroupTiles = L.featureGroup().addTo(this.map);

    var mapbox = L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
      attribution: '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="http://www.openstreetmap.org/about/">OpenStreetMap</a> <b><a href="https://www.mapbox.com/map-feedback/">Improve this map</a></b>',
      maxZoom: 18,
      id: 'franco42/ckuntcr7y826417s0053n3lkg',
      tileSize: 512,
      zoomOffset: -1,
      accessToken: 'pk.eyJ1IjoiZnJhbmNvNDIiLCJhIjoiY2t1Zmx4MnMxMHBkejJucnQzN2g0dngwZSJ9.9Egt_G5G24b7D9Ua8W3YHQ'
    })
    mapbox.addTo(this.featureGroupTiles);

    var openstreetmap = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      { 
        attribution: 'Data by &copy; <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.',
        detectRetina: false, 
        maxNativeZoom: 18, 
        maxZoom: 18, 
        minZoom: 0, 
        noWrap: false, 
        opacity: 1, 
        subdomains: "abc", 
        tms: false }
    )

    this.featureGroupConfirmedShips = L.featureGroup().addTo(this.map);
    this.featureGroupWatchList = L.featureGroup().addTo(this.map);

    L.control.layers(
        {
          "Mapbox": mapbox,
          "OpenStreetMap": openstreetmap,
        },
        {
          "Watchlist" : this.featureGroupWatchList,
        },
        {"autoZIndex": true, "collapsed": false, "position": "topright"}
    ).addTo(this.map);

    this.featureGroupWatchList.remove();
  }

  addShipsToMap(ships) {
    this.featureGroupConfirmedShips.clearLayers();
    this.featureGroupWatchList.clearLayers();

    for (const [sid, ship] of Object.entries(ships)) {
      var fg = ship.mapStatus < 4 ? this.featureGroupConfirmedShips : this.featureGroupWatchList;
      this.addShip(sid, ship, fg, -1);
      this.addShip(sid, ship, fg, 0);
      this.addShip(sid, ship, fg, 1);
    }
  }

  addShip(sid, ship, layer, offset) {
    var pos = ship.position;
    var m = pos.match('(?<la>-?\\d*(.\\d+))° \\/ (?<lo>-?\\d*(.\\d+))°');
    if (!m)
      return;

    var lat = parseFloat(m.groups.la);
    var lon = parseFloat(m.groups.lo) + offset*360;

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
          <h3>
            <b><a href="https://www.marinetraffic.com/en/ais/home/shipid:${ship.mtsid}/zoom:10" target="_blank" rel="noopener noreferrer">${ship.name}</a></b>
          </h3>
          ${ship.dept} &rarr; ${ship.dest}
          <br>
          <i>${ship.status}</i>
          <br>
          <i>${ship.destType}: ${ship.destLocalTime}<i>
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
}

function loadShips(m) {
  $.getJSON('map.json', ships => {
    console.log(ships)
    m.addShipsToMap(ships)
    setTimeout(function () {loadShips(m)}, 60000) // update in 5 mins
  });
}

$(function () {
  var m = new Map("map");
  loadShips(m)
});