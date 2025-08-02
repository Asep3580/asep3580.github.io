import { db } from '../core/state.js';
import { initializeAgendaMap, updateMapAndMarker } from '../features/agenda.js';

let agendaMap = null;
let agendaMarker = null;

export function setMapInstances(map, marker) {
    agendaMap = map;
    agendaMarker = marker;
}

export function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if(modal) {
        modal.classList.remove('hidden');
        setTimeout(() => {
            modal.classList.add('flex');
            modal.classList.remove('opacity-0');
            modal.querySelector('.modal-content').classList.remove('scale-95');
        }, 10);
    }
};

export function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if(modal) {
        modal.classList.add('opacity-0');
        modal.querySelector('.modal-content').classList.add('scale-95');
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            // Cleanup map on close
            if (modalId === 'agendaModal' && agendaMap) {
                agendaMap.remove();
                agendaMap = null;
                agendaMarker = null;
            }
        }, 300);
    }
};

export function openPelangganModal(id = null) {
    const form = document.getElementById('formTambahPelanggan'); form.reset();
    const title = document.getElementById('pelangganModalTitle'), idInput = document.getElementById('pelanggan-id');
    if (id) {
        const p = db.pelanggan.find(cust => cust.id === id);
        if (p) {
            title.textContent = 'Edit Pelanggan'; idInput.value = p.id;
            document.getElementById('pelanggan-nama').value = p.nama;
            document.getElementById('pelanggan-perusahaan').value = p.perusahaan;
            document.getElementById('pelanggan-segmentasi').value = p.segmentasi;
            document.getElementById('pelanggan-alamat').value = p.alamat;
            document.getElementById('pelanggan-email').value = p.email;
            document.getElementById('pelanggan-telepon').value = p.telepon;
        }
    } else { title.textContent = 'Tambah Pelanggan Baru'; idInput.value = ''; }
    openModal('pelangganModal');
}

export function openAgendaModal(id = null) {
    const form = document.getElementById('formAgenda'); form.reset();
    const title = document.getElementById('agendaModalTitle'), idInput = document.getElementById('agenda-id');
    const fotoUpload = document.getElementById('agenda-foto-upload');
    const fotoPreview = document.getElementById('agenda-foto-preview');
    fotoUpload.value = '';
    fotoPreview.src = '#';
    fotoPreview.classList.add('hidden');

    let initialCoords = [-6.917464, 107.619125]; // Default to Bandung
    let initialZoom = 13;
    let hasInitialMarker = false;

    if (id) {
        const item = db.agenda.find(a => a.id === id);
        if (item) {
            title.textContent = 'Edit Agenda Meeting'; idInput.value = item.id;
            document.getElementById('agenda-judul').value = item.judul;
            document.getElementById('agenda-tipe').value = item.tipe;
            document.getElementById('agenda-pelanggan').value = item.pelangganId;
            document.getElementById('agenda-tanggal').value = item.tanggal;
            document.getElementById('agenda-jam-mulai').value = item.jamMulai;
            document.getElementById('agenda-jam-selesai').value = item.jamSelesai;
            document.getElementById('agenda-lokasi').value = item.lokasi || '';
            document.getElementById('agenda-catatan').value = item.catatan;

            if (item.fotoUrl) {
                fotoPreview.src = item.fotoUrl;
                fotoPreview.classList.remove('hidden');
            }

            if (item.lokasi && /^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(item.lokasi)) {
                initialCoords = item.lokasi.split(',').map(Number);
                initialZoom = 16;
                hasInitialMarker = true;
            }
        }
    } else { 
        title.textContent = 'Tambah Agenda Baru'; 
        idInput.value = ''; 
    }
    openModal('agendaModal');

    const mapInstances = initializeAgendaMap(initialCoords, initialZoom);
    setMapInstances(mapInstances.map, mapInstances.marker);

    if (hasInitialMarker) {
        updateMapAndMarker(initialCoords, false);
    }
}

// ... (tambahkan fungsi open...Modal lainnya di sini)