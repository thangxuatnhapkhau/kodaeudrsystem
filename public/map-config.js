// Administrator configuration. If changing the tile host, also update img-src in netlify.toml.
// Use a provider that permits your intended traffic; public OSM tiles have no SLA.
window.EudrMapConfig=Object.freeze({
 tileUrl:'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
 maxZoom:19,
 attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>'
});
