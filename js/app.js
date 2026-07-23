/* =========================================================
   WebGIS Desa Sukajadi — app.js
========================================================= */

const PUSAT_DESA = [-7.3053, 108.3267];
const ZOOM_AWAL = 15;

const map = L.map('map', {
  zoomControl: false,
  attributionControl: true
}).setView(PUSAT_DESA, ZOOM_AWAL);

L.control.zoom({ position: 'bottomright' }).addTo(map);
L.control.scale({ position: 'bottomright', metric: true, imperial: false }).addTo(map);

// ---------- Basemap ----------
const basemapOSM = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors',
  maxZoom: 19
});
const basemapEsri = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
  attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
  maxZoom: 19
});
const basemapGoogle = L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
  subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
  attribution: '&copy; Google',
  maxZoom: 20
});
basemapOSM.addTo(map);

// ---------- Palet warna (opacity penuh / 0% transparan) ----------
const WARNA = {
  batas: '#0a3c14',
  permukiman: '#8a5a1e',
  sawah: '#6b8e23',
  vegetasi: '#0a3c14',
  sungai: '#2f7fb0',
  umkm: '#c1440e',
  bencana: { 'Tinggi': '#b3352e', 'Sedang': '#d1893a', 'Rendah': '#6b8e23' }
};
const WARNA_FASILITAS = {
  'Pemerintahan': '#0a3c14',
  'Peribadatan': '#dca00a',
  'Pendidikan': '#1d4e89',
  'Kesehatan': '#b3352e',
  'Olahraga/Sosial': '#6b8e23',
  'Pemakaman': '#5a5a5a',
  'Pos Ronda': '#8a5a1e',
  'Infrastruktur Air': '#1f7a8c',
  'Lainnya': '#6b4c7a'
};

// ---------- Helper popup (minimal, cuma 1 baris) ----------
function popupSimple(text, sub) {
  return `<div class="gis-popup">${text}${sub ? `<span class="sub">${sub}</span>` : ''}</div>`;
}

// ---------- 01. Batas Administrasi ----------
let layerBatasDesa = L.geoJSON(null, {
  style: { color: WARNA.batas, weight: 3, dashArray: '5 3' },
  onEachFeature: (f, layer) => layer.bindPopup(popupSimple('Batas Desa Sukajadi'))
});

// ---------- 02. Penggunaan Lahan ----------
function buatLayerLahan(warna) {
  return L.geoJSON(null, {
    style: { color: warna, weight: 1, fillColor: warna, fillOpacity: 1 },
    onEachFeature: (f, layer) => layer.bindPopup(popupSimple(f.properties.jenis))
  });
}
let layerPermukiman = buatLayerLahan(WARNA.permukiman);
let layerSawah = buatLayerLahan(WARNA.sawah);
let layerVegetasi = buatLayerLahan(WARNA.vegetasi);
let layerSungai = buatLayerLahan(WARNA.sungai);

// ---------- 03. Fasilitas Umum ----------
let layerFasilitas = L.geoJSON(null, {
  pointToLayer: (f, latlng) => L.circleMarker(latlng, {
    radius: 6.5,
    fillColor: WARNA_FASILITAS[f.properties.jenis_fasilitas] || '#888',
    color: '#fff', weight: 1.5, fillOpacity: 1
  }),
  onEachFeature: (f, layer) => {
    layer.bindPopup(popupSimple(f.properties.nama_fasilitas));
    layer.on('mouseover', () => layer.setRadius(9.5));
    layer.on('mouseout', () => layer.setRadius(6.5));
  }
});

// ---------- 04. UMKM ----------
let layerUmkm = L.geoJSON(null, {
  pointToLayer: (f, latlng) => L.circleMarker(latlng, {
    radius: 6.5, fillColor: WARNA.umkm, color: '#fff', weight: 1.5, fillOpacity: 1
  }),
  onEachFeature: (f, layer) => {
    layer.bindPopup(popupSimple(f.properties.nama_usaha));
    layer.on('mouseover', () => layer.setRadius(9.5));
    layer.on('mouseout', () => layer.setRadius(6.5));
  }
});

// ---------- 05. Kerawanan Bencana ----------
let layerBencana = L.geoJSON(null, {
  style: (f) => ({
    color: WARNA.bencana[f.properties.tingkat_kerawanan] || '#888',
    weight: 1,
    fillColor: WARNA.bencana[f.properties.tingkat_kerawanan] || '#888',
    fillOpacity: 1
  }),
  onEachFeature: (f, layer) => layer.bindPopup(popupSimple('Kerawanan Longsor', f.properties.tingkat_kerawanan))
});

// ---------- Load semua GeoJSON ----------
const sumberData = [
  { url: 'data/batas_desa.geojson', layer: layerBatasDesa },
  { url: 'data/permukiman.geojson', layer: layerPermukiman },
  { url: 'data/sawah.geojson', layer: layerSawah },
  { url: 'data/vegetasi.geojson', layer: layerVegetasi },
  { url: 'data/sungai.geojson', layer: layerSungai },
  { url: 'data/fasilitas_umum.geojson', layer: layerFasilitas },
  { url: 'data/umkm.geojson', layer: layerUmkm },
  { url: 'data/kerawanan_bencana.geojson', layer: layerBencana }
];

Promise.all(
  sumberData.map(s =>
    fetch(s.url)
      .then(r => { if (!r.ok) throw new Error(s.url + ' gagal dimuat'); return r.json(); })
      .then(geojson => s.layer.addData(geojson))
      .catch(err => console.warn('[WebGIS]', err.message))
  )
).then(() => {
  layerBatasDesa.addTo(map);
  layerPermukiman.addTo(map);
  layerSawah.addTo(map);
  layerVegetasi.addTo(map);
  layerSungai.addTo(map);
  layerFasilitas.addTo(map);
  layerUmkm.addTo(map);
  // Kerawanan Bencana default OFF (sesuai checkbox unchecked)

  try {
    if (layerBatasDesa.getBounds().isValid()) {
      map.fitBounds(layerBatasDesa.getBounds(), { padding: [40, 40] });
    }
  } catch (e) {}
});

// ---------- Toggle checkbox layer ----------
const checkboxMap = {
  chkBatas: layerBatasDesa,
  chkPermukiman: layerPermukiman,
  chkSawah: layerSawah,
  chkVegetasi: layerVegetasi,
  chkSungai: layerSungai,
  chkFasilitas: layerFasilitas,
  chkUmkm: layerUmkm,
  chkBencana: layerBencana
};
Object.keys(checkboxMap).forEach(id => {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('change', () => {
    const layer = checkboxMap[id];
    if (el.checked) { layer.addTo(map); } else { map.removeLayer(layer); }
  });
});

// ---------- Basemap switch (3 pilihan) ----------
const basemaps = { bmOSM: basemapOSM, bmEsri: basemapEsri, bmGoogle: basemapGoogle };
Object.keys(basemaps).forEach(id => {
  document.getElementById(id).addEventListener('click', () => {
    Object.values(basemaps).forEach(bm => map.removeLayer(bm));
    basemaps[id].addTo(map);
    Object.keys(basemaps).forEach(bid => document.getElementById(bid).classList.toggle('active', bid === id));
  });
});

// ---------- Sidebar toggle ----------
const sidebar = document.getElementById('sidebar');
document.getElementById('toggleSidebar').addEventListener('click', () => {
  sidebar.classList.toggle('collapsed');
});

// ---------- Koordinat kursor ----------
const coordEl = document.getElementById('coordReadout');
map.on('mousemove', (e) => {
  coordEl.textContent = `Lat ${e.latlng.lat.toFixed(5)}, Lon ${e.latlng.lng.toFixed(5)}`;
});

// ---------- Landing -> masuk peta ----------
document.getElementById('btnMasuk').addEventListener('click', () => {
  document.getElementById('landing').style.display = 'none';
  document.getElementById('app').classList.add('active');
  setTimeout(() => map.invalidateSize(), 100);
});
