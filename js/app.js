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
  permukiman: '#8a5a1e',
  sawah: '#6b8e23',
  vegetasi: '#0a3c14',
  sungai: '#2f7fb0',
  umkm: '#c1440e',
  bencana: { 'Tinggi': '#b3352e', 'Sedang': '#d1893a', 'Rendah': '#6b8e23' },
  batasDesa: '#0a3c14',
  dusunDepok: '#8a5a1e',
  dusunLimus: '#1d4e89',
  dusunDesa: '#6b4c7a'
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

// ---------- 01. Batas Administrasi (per wilayah, masing-masing layer sendiri) ----------
function buatLayerBatas(warna, weight, dash) {
  return L.geoJSON(null, {
    style: { color: warna, weight: weight, dashArray: dash, fillOpacity: 0 },
    onEachFeature: (f, layer) => layer.bindPopup(popupSimple(f.properties.nama, f.properties.info))
  });
}
let layerBatasDesa = buatLayerBatas(WARNA.batasDesa, 3, '6 3');
let layerDusunDepok = buatLayerBatas(WARNA.dusunDepok, 1.8, '3 3');
let layerDusunLimus = buatLayerBatas(WARNA.dusunLimus, 1.8, '3 3');
let layerDusunDesa = buatLayerBatas(WARNA.dusunDesa, 1.8, '3 3');
const BATAS_PER_NAMA = {
  'Desa Sukajadi': layerBatasDesa,
  'Dusun Depok': layerDusunDepok,
  'Dusun Limus': layerDusunLimus,
  'Dusun Desa': layerDusunDesa
};

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

// ---------- 03. Fasilitas Umum (per kategori, masing-masing layer sendiri) ----------
function buatLayerFasilitas(warna) {
  return L.geoJSON(null, {
    pointToLayer: (f, latlng) => L.circleMarker(latlng, {
      radius: 6.5, fillColor: warna, color: '#fff', weight: 1.5, fillOpacity: 1
    }),
    onEachFeature: (f, layer) => {
      layer.bindPopup(popupSimple(f.properties.nama_fasilitas));
      layer.bindTooltip(f.properties.nama_fasilitas, {
        permanent: true, direction: 'top', offset: [0, -6], className: 'map-label'
      });
      layer.on('mouseover', () => layer.setRadius(9.5));
      layer.on('mouseout', () => layer.setRadius(6.5));
    }
  });
}
let layerFasPemerintahan = buatLayerFasilitas(WARNA_FASILITAS['Pemerintahan']);
let layerFasPeribadatan = buatLayerFasilitas(WARNA_FASILITAS['Peribadatan']);
let layerFasPendidikan = buatLayerFasilitas(WARNA_FASILITAS['Pendidikan']);
let layerFasKesehatan = buatLayerFasilitas(WARNA_FASILITAS['Kesehatan']);
let layerFasOlahraga = buatLayerFasilitas(WARNA_FASILITAS['Olahraga/Sosial']);
let layerFasPemakaman = buatLayerFasilitas(WARNA_FASILITAS['Pemakaman']);
let layerFasPosRonda = buatLayerFasilitas(WARNA_FASILITAS['Pos Ronda']);
let layerFasAir = buatLayerFasilitas(WARNA_FASILITAS['Infrastruktur Air']);
let layerFasLainnya = buatLayerFasilitas(WARNA_FASILITAS['Lainnya']);
const FASILITAS_PER_JENIS = {
  'Pemerintahan': layerFasPemerintahan,
  'Peribadatan': layerFasPeribadatan,
  'Pendidikan': layerFasPendidikan,
  'Kesehatan': layerFasKesehatan,
  'Olahraga/Sosial': layerFasOlahraga,
  'Pemakaman': layerFasPemakaman,
  'Pos Ronda': layerFasPosRonda,
  'Infrastruktur Air': layerFasAir,
  'Lainnya': layerFasLainnya
};

// ---------- 04. UMKM ----------
let layerUmkm = L.geoJSON(null, {
  pointToLayer: (f, latlng) => L.circleMarker(latlng, {
    radius: 6.5, fillColor: WARNA.umkm, color: '#fff', weight: 1.5, fillOpacity: 1
  }),
  onEachFeature: (f, layer) => {
    layer.bindPopup(popupSimple(f.properties.nama_usaha));
    layer.bindTooltip(f.properties.nama_usaha, {
      permanent: true, direction: 'top', offset: [0, -6], className: 'map-label'
    });
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

// ---------- Load data: batas_desa.geojson (dipecah per nama wilayah) ----------
let batasSudahDimuat = false;

function muatBatasDesa() {
  return fetch('data/batas_desa.geojson')
    .then(r => { if (!r.ok) throw new Error('batas_desa.geojson gagal dimuat'); return r.json(); })
    .then(geojson => {
      geojson.features.forEach(f => {
        const target = BATAS_PER_NAMA[f.properties.nama];
        if (target) target.addData(f);
      });
    })
    .catch(err => console.warn('[WebGIS]', err.message));
}

// ---------- Load data: fasilitas_umum.geojson (dipecah per kategori) ----------
function muatFasilitasUmum() {
  return fetch('data/fasilitas_umum.geojson')
    .then(r => { if (!r.ok) throw new Error('fasilitas_umum.geojson gagal dimuat'); return r.json(); })
    .then(geojson => {
      geojson.features.forEach(f => {
        const target = FASILITAS_PER_JENIS[f.properties.jenis_fasilitas];
        if (target) target.addData(f);
      });
    })
    .catch(err => console.warn('[WebGIS]', err.message));
}

// ---------- Load data lain (langsung 1 layer 1 file) ----------
const sumberDataLain = [
  { url: 'data/permukiman.geojson', layer: layerPermukiman },
  { url: 'data/sawah.geojson', layer: layerSawah },
  { url: 'data/vegetasi.geojson', layer: layerVegetasi },
  { url: 'data/sungai.geojson', layer: layerSungai },
  { url: 'data/umkm.geojson', layer: layerUmkm },
  { url: 'data/kerawanan_bencana.geojson', layer: layerBencana }
];

Promise.all([
  muatBatasDesa(),
  muatFasilitasUmum(),
  ...sumberDataLain.map(s =>
    fetch(s.url)
      .then(r => { if (!r.ok) throw new Error(s.url + ' gagal dimuat'); return r.json(); })
      .then(geojson => s.layer.addData(geojson))
      .catch(err => console.warn('[WebGIS]', err.message))
  )
]).then(() => {
  // Cuma Batas Desa Sukajadi yang nyala default, sisanya nunggu dicentang manual
  layerBatasDesa.addTo(map);
  // Semua layer lain default OFF (sesuai checkbox awal di sidebar)

  batasSudahDimuat = true;

  if (document.getElementById('app').classList.contains('active')) {
    fitKeBatasDesa();
  }
});

function fitKeBatasDesa() {
  try {
    if (layerBatasDesa.getBounds().isValid()) {
      map.invalidateSize();
      map.fitBounds(layerBatasDesa.getBounds(), { padding: [30, 30] });
    }
  } catch (e) {}
}

// ---------- Toggle checkbox layer ----------
const checkboxMap = {
  chkBatasDesa: layerBatasDesa,
  chkDusunDepok: layerDusunDepok,
  chkDusunLimus: layerDusunLimus,
  chkDusunDesa: layerDusunDesa,
  chkPermukiman: layerPermukiman,
  chkSawah: layerSawah,
  chkVegetasi: layerVegetasi,
  chkSungai: layerSungai,
  chkFasPemerintahan: layerFasPemerintahan,
  chkFasPeribadatan: layerFasPeribadatan,
  chkFasPendidikan: layerFasPendidikan,
  chkFasKesehatan: layerFasKesehatan,
  chkFasOlahraga: layerFasOlahraga,
  chkFasPemakaman: layerFasPemakaman,
  chkFasPosRonda: layerFasPosRonda,
  chkFasAir: layerFasAir,
  chkFasLainnya: layerFasLainnya,
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
  setTimeout(() => {
    if (batasSudahDimuat) {
      fitKeBatasDesa();
    } else {
      map.invalidateSize();
    }
  }, 150);
});
