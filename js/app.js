/* =========================================================
   WebGIS Desa Sukajadi — app.js
   Logika peta: load GeoJSON, layer control, legend, popup
========================================================= */

// ---------- 1. Titik pusat & konfigurasi awal ----------
const PUSAT_DESA = [-7.3053, 108.3267]; // [lat, lon] Desa Sukajadi, Sadananya, Ciamis
const ZOOM_AWAL = 15;

// ---------- 2. Inisialisasi peta ----------
const map = L.map('map', {
  zoomControl: false,
  attributionControl: true
}).setView(PUSAT_DESA, ZOOM_AWAL);

L.control.zoom({ position: 'bottomright' }).addTo(map);
L.control.scale({ position: 'bottomright', metric: true, imperial: false }).addTo(map);

// ---------- 3. Basemap ----------
const basemapOSM = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors',
  maxZoom: 19
});

const basemapSat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
  attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
  maxZoom: 19
});

basemapOSM.addTo(map);

// ---------- 4. Palet warna tiap layer ----------
const WARNA = {
  batas: '#16241d',
  permukiman: '#a8622f',
  sawah: '#7a9b4e',
  sungai: '#3e7cb1',
  vegetasi: '#2b4a34',
  umkm: '#a8622f',
  fasilitas: '#3e7cb1',
  bencana: {
    'Tinggi': '#b34a3e',
    'Sedang': '#d1893a',
    'Rendah': '#7a9b4e'
  }
};

// ---------- 5. Helper: bikin isi popup dari properties GeoJSON ----------
function buatPopup(judul, tag, props, kunciDilewati = []) {
  let rows = '';
  for (const k in props) {
    if (kunciDilewati.includes(k)) continue;
    rows += `<tr><td class="k">${k}</td><td>${props[k]}</td></tr>`;
  }
  return `<div class="gis-popup"><b>${judul}</b><br/><span class="tag">${tag}</span><table>${rows}</table></div>`;
}

// ---------- 6. LAYER: Batas Desa (garis, hasil digitasi) ----------
let layerBatasDesa = L.geoJSON(null, {
  style: { color: WARNA.batas, weight: 3, dashArray: '5 3' },
  onEachFeature: (f, layer) => {
    layer.bindPopup(buatPopup(f.properties.nama_desa || 'Batas Desa', 'Batas Administrasi', f.properties, ['jenis']));
  }
});

// ---------- 7. LAYER: Permukiman, Sawah, Sungai, Vegetasi (hasil digitasi) ----------
function buatLayerPoligon(warna, judulTag) {
  return L.geoJSON(null, {
    style: { color: warna, weight: 1, fillColor: warna, fillOpacity: 0.4 },
    onEachFeature: (f, layer) => {
      layer.bindPopup(buatPopup(f.properties.jenis, judulTag, f.properties, ['jenis']));
      layer.on('mouseover', () => layer.setStyle({ weight: 3, fillOpacity: 0.65 }));
      layer.on('mouseout', () => layer.setStyle({ weight: 1, fillOpacity: 0.4 }));
    }
  });
}
let layerPermukiman = buatLayerPoligon(WARNA.permukiman, 'Permukiman');
let layerSawah = buatLayerPoligon(WARNA.sawah, 'Sawah');
let layerSungai = buatLayerPoligon(WARNA.sungai, 'Sungai');
let layerVegetasi = buatLayerPoligon(WARNA.vegetasi, 'Vegetasi');

// ---------- 8. LAYER: UMKM ----------
let layerUmkm = L.geoJSON(null, {
  pointToLayer: (f, latlng) => L.circleMarker(latlng, {
    radius: 6, fillColor: WARNA.umkm, color: '#fff', weight: 1.5, fillOpacity: 0.9
  }),
  onEachFeature: (f, layer) => {
    layer.bindPopup(buatPopup(f.properties.nama_usaha, 'UMKM &middot; ' + f.properties.jenis_usaha, f.properties, ['nama_usaha', 'jenis_usaha']));
    layer.on('mouseover', () => layer.setRadius(9));
    layer.on('mouseout', () => layer.setRadius(6));
  }
});

// ---------- 9. LAYER: Fasilitas Umum ----------
const ICON_FASILITAS = {
  'Pemerintahan': '#16241d',
  'Peribadatan': '#c99a3a',
  'Pendidikan': '#3e7cb1',
  'Kesehatan': '#b34a3e',
  'Olahraga/Sosial': '#7a9b4e'
};
let layerFasilitas = L.geoJSON(null, {
  pointToLayer: (f, latlng) => L.circleMarker(latlng, {
    radius: 6.5,
    fillColor: ICON_FASILITAS[f.properties.jenis_fasilitas] || WARNA.fasilitas,
    color: '#fff', weight: 1.5, fillOpacity: 0.95
  }),
  onEachFeature: (f, layer) => {
    layer.bindPopup(buatPopup(f.properties.nama_fasilitas, 'Fasilitas &middot; ' + f.properties.jenis_fasilitas, f.properties, ['nama_fasilitas', 'jenis_fasilitas']));
    layer.on('mouseover', () => layer.setRadius(9.5));
    layer.on('mouseout', () => layer.setRadius(6.5));
  }
});

// ---------- 10. LAYER: Kerawanan Bencana ----------
let layerBencana = L.geoJSON(null, {
  style: (f) => ({
    color: WARNA.bencana[f.properties.tingkat_kerawanan] || '#888',
    weight: 1,
    fillColor: WARNA.bencana[f.properties.tingkat_kerawanan] || '#888',
    fillOpacity: 0.4
  }),
  onEachFeature: (f, layer) => {
    layer.bindPopup(buatPopup(f.properties.jenis_bencana, 'Kerawanan: ' + f.properties.tingkat_kerawanan, f.properties, ['jenis_bencana', 'tingkat_kerawanan']));
  }
});

// ---------- 11. Load semua file GeoJSON ----------
const sumberData = [
  { url: 'batas_desa.geojson', layer: layerBatasDesa, nama: 'Batas Desa' },
  { url: 'permukiman.geojson', layer: layerPermukiman, nama: 'Permukiman' },
  { url: 'sawah.geojson', layer: layerSawah, nama: 'Sawah' },
  { url: 'sungai.geojson', layer: layerSungai, nama: 'Sungai' },
  { url: 'vegetasi.geojson', layer: layerVegetasi, nama: 'Vegetasi' },
  { url: 'umkm.geojson', layer: layerUmkm, nama: 'UMKM' },
  { url: 'fasilitas_umum.geojson', layer: layerFasilitas, nama: 'Fasilitas Umum' },
  { url: 'kerawanan_bencana.geojson', layer: layerBencana, nama: 'Kerawanan Bencana' }
];

Promise.all(
  sumberData.map(s =>
    fetch(s.url)
      .then(r => {
        if (!r.ok) throw new Error(s.nama + ' gagal dimuat (' + r.status + ')');
        return r.json();
      })
      .then(geojson => { s.layer.addData(geojson); })
      .catch(err => console.warn('[WebGIS]', err.message))
  )
).then(() => {
  // Tampilkan layer default: data dasar hasil digitasi + umkm + fasilitas (bencana off by default)
  layerBatasDesa.addTo(map);
  layerPermukiman.addTo(map);
  layerSawah.addTo(map);
  layerSungai.addTo(map);
  layerVegetasi.addTo(map);
  layerUmkm.addTo(map);
  layerFasilitas.addTo(map);

  // Zoom ke batas desa kalau datanya ada
  try {
    if (layerBatasDesa.getBounds().isValid()) {
      map.fitBounds(layerBatasDesa.getBounds(), { padding: [40, 40] });
    }
  } catch (e) { /* biarkan default view */ }

  perbaruiBadgeLayer();
});

// ---------- 11b. Badge jumlah layer aktif di topbar ----------
function perbaruiBadgeLayer() {
  const badge = document.getElementById('layerBadge');
  if (!badge) return;
  const aktif = Object.values(checkboxMap).filter(l => map.hasLayer(l)).length;
  badge.textContent = `${aktif} / ${Object.keys(checkboxMap).length} layer aktif`;
}

// ---------- 12. Checkbox toggle layer ----------
const checkboxMap = {
  chkBatas: layerBatasDesa,
  chkPermukiman: layerPermukiman,
  chkSawah: layerSawah,
  chkSungai: layerSungai,
  chkVegetasi: layerVegetasi,
  chkUmkm: layerUmkm,
  chkFasilitas: layerFasilitas,
  chkBencana: layerBencana
};
Object.keys(checkboxMap).forEach(id => {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('change', () => {
    const layer = checkboxMap[id];
    if (el.checked) { layer.addTo(map); } else { map.removeLayer(layer); }
    perbaruiBadgeLayer();
  });
});

// ---------- 13. Basemap switch ----------
document.getElementById('bmOSM').addEventListener('click', () => {
  map.removeLayer(basemapSat); basemapOSM.addTo(map);
  document.getElementById('bmOSM').classList.add('active');
  document.getElementById('bmSat').classList.remove('active');
});
document.getElementById('bmSat').addEventListener('click', () => {
  map.removeLayer(basemapOSM); basemapSat.addTo(map);
  document.getElementById('bmSat').classList.add('active');
  document.getElementById('bmOSM').classList.remove('active');
});

// ---------- 14. Sidebar toggle ----------
const sidebar = document.getElementById('sidebar');
document.getElementById('toggleSidebar').addEventListener('click', () => {
  sidebar.classList.toggle('collapsed');
});

// ---------- 15. Koordinat kursor ----------
const coordEl = document.getElementById('coordReadout');
map.on('mousemove', (e) => {
  coordEl.textContent = `Lat ${e.latlng.lat.toFixed(5)}, Lon ${e.latlng.lng.toFixed(5)}`;
});

// ---------- 16. Landing -> masuk peta ----------
document.getElementById('btnMasuk').addEventListener('click', () => {
  document.getElementById('landing').style.display = 'none';
  document.getElementById('app').classList.add('active');
  setTimeout(() => map.invalidateSize(), 100);
});
