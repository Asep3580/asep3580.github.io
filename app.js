// === Firebase Configuration ===
const firebaseConfig = {
  apiKey: "AIzaSyCvkTIcoypaOaJivSTA8uViaiTCkHs0YKw",
  authDomain: "crm-hotel-f232e.firebaseapp.com",
  databaseURL: "https://crm-hotel-f232e-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "crm-hotel-f232e",
  storageBucket: "crm-hotel-f232e.firebasestorage.app",
  messagingSenderId: "841840943858",
  appId: "1:841840943858:web:ffda7096bc06daefaca66b",
  measurementId: "G-7KC312XT0H"
};

// Inisialisasi Firebase
firebase.initializeApp(firebaseConfig);
console.log("✅ Firebase initialized");

const firestore = firebase.firestore();

firestore.collection("pelanggan").limit(1).get()
  .then(() => console.log("✅ Firestore connected"))
  .catch((err) => console.error("❌ Firestore not connected", err));


document.addEventListener('DOMContentLoaded', function() {
    // --- GLOBAL STATE & DATABASE ---
    let db = {};
    let currentUser = null;
    let salesTargetChartInstance = null;
    let salespersonChartInstance = null;
    let segmentChartInstance = null;
    let lastRoomBookingId = null; 
    let currentSalesReportData = [];
    let calendar = null;
    const now = new Date('2025-07-29T11:58:00'); // Set specific date for demo consistency

    const initialDb = {
        pelanggan: [
            { id: 1, nama: 'Budi Santoso', perusahaan: 'PT. Maju Mundur', email: 'budi.s@majumundur.com', telepon: '081234567890', alamat: 'Jl. Jenderal Sudirman Kav. 52-53, Jakarta Selatan', segmentasi: 'Corporate' },
            { id: 2, nama: 'Ani Wijaya', perusahaan: '-', email: 'ani.wijaya@gmail.com', telepon: '089876543210', alamat: 'Jl. Gatot Subroto No. 12, Bandung', segmentasi: 'Individual' }
        ],
        agenda: [
            { id: 1, judul: 'Follow Up Penawaran Event', pelangganId: 1, tanggal: '2025-07-29', jamMulai: '10:00', jamSelesai: '11:00', catatan: 'Meeting di lobi', status: 'Definite', tipe: 'visit', lokasi: '-6.917464, 107.619125' },
            { id: 2, judul: 'Presentasi Paket Wedding', pelangganId: 2, tanggal: '2025-07-29', jamMulai: '14:00', jamSelesai: '15:30', catatan: 'Ruang Jasmine', status: 'Tentative', tipe: 'telemarketing', lokasi: 'Kantor Klien' }
        ],
        kamarBookings: [
             { id: 'BK-1721800000000', tipeBooking: 'Kamar', pelangganId: 1, tanggalBooking: '2025-07-24T10:00:00.000Z', checkin: '2025-07-28', checkout: '2025-07-30', totalHarga: 5000000, status: 'Terkonfirmasi', rooms: [{type: 'deluxe', name: 'Deluxe Room', count: 1, basePrice: 1100000, package: 'breakfast', guests: 2}, {type: 'suite', name: 'Executive Suite', count: 1, basePrice: 2200000, package: 'room_only', guests: 1}], createdBy: 1 }
        ],
        meetingBookings: [
            { id: 'BM-1721900000000', tipeBooking: 'Meeting', pelangganId: 2, tanggalBooking: '2025-07-25T11:00:00.000Z', tanggalMulai: '2025-07-29', tanggalBerakhir: '2025-07-29', jamMulai: '09:00', jamBerakhir: '17:00', totalHarga: 4500000, status: 'Terkonfirmasi', roomKey: 'jasmine', createdBy: 1 }
        ],
        payments: [
            { id: 1, bookingId: 'BK-1721800000000', tanggal: '2025-07-25', jumlah: 2500000, metode: 'Transfer Bank', tipe: 'DP', catatan: 'DP 50%', createdBy: 1 }
        ],
        roomTypes: {
            "deluxe": { 
                name: "Deluxe Room", 
                prices: { individual: 1250000, corporate: 1100000, "travel-agent": 1000000, government: 1050000 },
                breakfastPrice: 150000 
            },
            "suite": { 
                name: "Executive Suite", 
                prices: { individual: 2500000, corporate: 2200000, "travel-agent": 2000000, government: 2100000 },
                breakfastPrice: 200000 
            }
        },
        meetingPackages: {
            "halfday": { name: "Halfday Meeting", price: 250000 },
            "fullday": { name: "Fullday Meeting", price: 450000 },
            "only_room": { name: "Only Room Rental", price: 0 }
        },
        meetingRooms: {
            "jasmine": { name: "Jasmine Room (20 pax)", rentalPrice: 1500000 },
            "rose": { name: "Rose Ballroom (100 pax)", rentalPrice: 5000000 }
        },
        users: [ 
            { id: 1, name: 'Siti Saleha', email: 'sales@hotel.com', role: 'Sales', password: 'password123' },
            { id: 2, name: 'Admin Hotel', email: 'gm@hotel.com', role: 'Admin', password: 'password123' },
            { id: 3, name: 'Developer', email: 'dev@hotel.com', role: 'Admin', password: 'devpassword' }
        ],
        targets: {
            "2025-07": 200 // Target 200 Juta untuk Juli 2025
        },
        settings: {
            taxAndServicePercentage: 21,
            invoiceSettings: {
                logoUrl: 'https://crm.kagum-hotel.com/images/kagum-logo.png',
                paymentNotes: 'Pembayaran dapat ditransfer ke:\nBank ABC\nNo. Rek: 123-456-7890\nA/N: PT. Hotel Sejahtera'
            },
            rolePermissions: {
                'Sales': {
                    'dashboard': true, 'kalender': true, 'pelanggan': true, 'agenda': true,
                    'booking-kamar': true, 'booking-meeting': true, 'pembayaran': true, 'laporan': true, 'laporan-sales': true,
                    'manajemen-user': false, 'manajemen-inventaris': false, 'manajemen-pengaturan': false
                },
                'Manager': {
                    'dashboard': true, 'kalender': true, 'pelanggan': true, 'agenda': true,
                    'booking-kamar': true, 'booking-meeting': true, 'pembayaran': true, 'laporan': true, 'laporan-sales': true,
                    'manajemen-user': false, 'manajemen-inventaris': true, 'manajemen-pengaturan': false
                },
                'Admin': {
                    'dashboard': true, 'kalender': true, 'pelanggan': true, 'agenda': true,
                    'booking-kamar': true, 'booking-meeting': true, 'pembayaran': true, 'laporan': true, 'laporan-sales': true,
                    'manajemen-user': true, 'manajemen-inventaris': true, 'manajemen-pengaturan': true
                }
            }
        }
    };

    // --- GEMINI API INTEGRATION ---
    /**
     * A reusable function to call the Gemini API.
     * @param {string} prompt The prompt to send to the Gemini API.
     * @returns {Promise<string>} The text response from the API.
     */
    async function callGeminiAPI(prompt) {
        const apiKey = ""; // API key is handled by the environment.
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        
        const payload = {
            contents: [{
                role: "user",
                parts: [{ text: prompt }]
            }]
        };

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorBody = await response.json();
                console.error("Gemini API Error:", errorBody);
                throw new Error(`API request failed with status ${response.status}`);
            }

            const result = await response.json();
            
            if (result.candidates && result.candidates.length > 0 &&
                result.candidates[0].content && result.candidates[0].content.parts &&
                result.candidates[0].content.parts.length > 0) {
                return result.candidates[0].content.parts[0].text;
            } else {
                console.error("Unexpected API response structure:", result);
                return "Gagal mendapatkan respons dari AI. Struktur respons tidak valid.";
            }
        } catch (error) {
            console.error("Error calling Gemini API:", error);
            return `Terjadi kesalahan saat menghubungi AI: ${error.message}`;
        }
    }

    // --- DATA PERSISTENCE ---
    function saveData() {
        localStorage.setItem('hotelCrmData', JSON.stringify(db));
    }

    function loadData() {
        const savedData = localStorage.getItem('hotelCrmData');
        db = savedData ? JSON.parse(savedData) : JSON.parse(JSON.stringify(initialDb));
        if (!db.settings) {
            db.settings = JSON.parse(JSON.stringify(initialDb.settings));
        }
        if (!db.payments) { // Ensure payments array exists
            db.payments = [];
        }
        // Ensure rolePermissions exists
        if (!db.settings.rolePermissions) {
             db.settings.rolePermissions = JSON.parse(JSON.stringify(initialDb.settings.rolePermissions));
        }
    }

    // --- THEME LOGIC ---
    const themeToggle = document.getElementById('theme-toggle');
    const themeMenu = document.getElementById('theme-menu');
    const themeOptions = document.querySelectorAll('.theme-option');

    function setTheme(themeName) {
        document.documentElement.setAttribute('data-theme', themeName);
        localStorage.setItem('theme', themeName);
        if (currentUser) {
            renderAllCharts();
        }
        if (calendar) {
            calendar.render(); // Re-render calendar to apply theme
        }
    }

    function loadTheme() {
        const savedTheme = localStorage.getItem('theme') || 'dark-blue';
        setTheme(savedTheme);
    }

    themeToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        themeMenu.classList.toggle('hidden');
    });

    document.addEventListener('click', () => {
        themeMenu.classList.add('hidden');
    });

    themeOptions.forEach(option => {
        option.addEventListener('click', (e) => {
            e.preventDefault();
            setTheme(e.target.dataset.theme);
        });
    });


    // --- AUTH & SESSION ---
    const loginContainer = document.getElementById('login-container');
    const appContainer = document.getElementById('app-container');

    function checkSession() {
        const loggedInUserId = sessionStorage.getItem('loggedInUserId');
        if (loggedInUserId) {
            const user = db.users.find(u => u.id === parseInt(loggedInUserId));
            if (user) {
                showApp(user);
            } else {
                showLogin();
            }
        } else {
            showLogin();
        }
    }

    function showLogin() {
        loginContainer.classList.remove('hidden');
        loginContainer.classList.add('flex');
        appContainer.classList.add('hidden');
        appContainer.classList.remove('lg:flex');
    }

    function applyRolePermissions(userRole) {
        const permissions = db.settings.rolePermissions[userRole];
        if (!permissions) {
            console.error(`Role permissions for "${userRole}" not found.`);
            // Hide everything as a fallback
            document.querySelectorAll('.nav-link').forEach(link => {
                if (link.dataset.target !== 'dashboard') {
                    link.style.display = 'none';
                }
            });
            return;
        }

        let canManage = false;
        document.querySelectorAll('.nav-link').forEach(link => {
            const target = link.dataset.target;
            if (permissions[target]) {
                link.style.display = 'flex';
                if (target.startsWith('manajemen-')) {
                    canManage = true;
                }
            } else {
                link.style.display = 'none';
            }
        });

        // Hide the "Manajemen" header if no management links are visible
        const manajemenMenu = document.getElementById('manajemen-menu');
        if (manajemenMenu) {
            manajemenMenu.style.display = canManage ? 'block' : 'none';
        }
    }

    function showApp(user) {
        currentUser = user;
        loginContainer.classList.add('hidden');
        loginContainer.classList.remove('flex');
        appContainer.classList.remove('hidden');
        appContainer.classList.add('lg:flex');
        document.getElementById('user-name-display').textContent = user.name;
        document.getElementById('user-role-display').textContent = user.role;

        applyRolePermissions(user.role);

        renderAll();
        initializeCalendar();
    }

    document.getElementById('login-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const errorEl = document.getElementById('login-error');
        
        const user = db.users.find(u => u.email === email && u.password === password);

        if (user) {
            sessionStorage.setItem('loggedInUserId', user.id);
            errorEl.classList.add('hidden');
            showApp(user);
        } else {
            errorEl.classList.remove('hidden');
        }
    });

    document.getElementById('logout-button').addEventListener('click', function() {
        sessionStorage.removeItem('loggedInUserId');
        location.reload();
    });

    // --- UI/UX FUNCTIONS ---
    function showToast(message, type = 'success') {
        const toast = document.getElementById('toast-notification');
        const messageEl = document.getElementById('toast-message');
        messageEl.textContent = message;
        toast.className = toast.className.replace(/bg-\w+-\d+/, type === 'success' ? 'bg-green-600' : 'bg-red-600');
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-20px)';
        }, 3000);
    }

    function formatCurrency(number) {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
    }

    function formatPhoneNumberForWhatsApp(phone) {
        let formattedPhone = phone.replace(/[^0-9]/g, '');
        if (formattedPhone.startsWith('0')) {
            formattedPhone = '62' + formattedPhone.substring(1);
        }
        return formattedPhone;
    }
    
    function getEmptyState(message) {
        return `<div class="text-center py-10 px-6">
                    <i data-lucide="inbox" class="w-16 h-16 mx-auto text-[var(--text-secondary)] opacity-50"></i>
                    <p class="mt-4 text-lg font-semibold text-[var(--text-primary)]">Tidak Ada Data</p>
                    <p class="text-[var(--text-secondary)]">${message}</p>
                </div>`;
    }
    
    function getAgendaBadges(item) {
        const baseClasses = "text-xs font-semibold px-2.5 py-1 rounded-full";
        let statusBadge = '';
        let tipeBadge = '';

        switch (item.status) {
            case 'Definite': statusBadge = `<span class="bg-green-500/20 text-green-400 ${baseClasses}">Definite</span>`; break;
            case 'Tentative': statusBadge = `<span class="bg-yellow-500/20 text-yellow-400 ${baseClasses}">Tentative</span>`; break;
        }

        switch (item.tipe) {
            case 'visit': tipeBadge = `<span class="bg-blue-500/20 text-blue-400 ${baseClasses} flex items-center"><i data-lucide="map-pin" class="w-3 h-3 mr-1.5"></i>Visit</span>`; break;
            case 'telemarketing': tipeBadge = `<span class="bg-purple-500/20 text-purple-400 ${baseClasses} flex items-center"><i data-lucide="phone" class="w-3 h-3 mr-1.5"></i>Telemarketing</span>`; break;
        }
        return `<div class="flex items-center gap-2">${tipeBadge}${statusBadge}</div>`;
    }

    function getSegmentasiBadge(segmentasi) {
        const baseClasses = "text-xs font-medium px-2.5 py-0.5 rounded-full";
        switch (segmentasi) {
            case 'Corporate': return `<span class="bg-blue-500/20 text-blue-400 ${baseClasses}">Corporate</span>`;
            case 'Travel Agent': return `<span class="bg-green-500/20 text-green-400 ${baseClasses}">Travel Agent</span>`;
            case 'Government': return `<span class="bg-yellow-500/20 text-yellow-400 ${baseClasses}">Government</span>`;
            case 'Individual': return `<span class="bg-purple-500/20 text-purple-400 ${baseClasses}">Individual</span>`;
            default: return '';
        }
    }

    function getRoleBadge(role) {
        const baseClasses = "text-xs font-medium px-2.5 py-0.5 rounded-full";
        switch (role) {
            case 'Admin': return `<span class="bg-red-500/20 text-red-400 ${baseClasses}">Admin</span>`;
            case 'Manager': return `<span class="bg-yellow-500/20 text-yellow-400 ${baseClasses}">Manager</span>`;
            case 'Sales': return `<span class="bg-blue-500/20 text-blue-400 ${baseClasses}">Sales</span>`;
            default: return '';
        }
    }
    
    function getPaymentStatusBadge(status) {
        const baseClasses = "text-xs font-medium px-2.5 py-0.5 rounded-full";
        switch (status) {
            case 'Lunas': return `<span class="bg-green-500/20 text-green-400 ${baseClasses}">Lunas</span>`;
            case 'Menunggu Pelunasan': return `<span class="bg-yellow-500/20 text-yellow-400 ${baseClasses}">Menunggu Pelunasan</span>`;
            case 'Menunggu DP': return `<span class="bg-orange-500/20 text-orange-400 ${baseClasses}">Menunggu DP</span>`;
            case 'Batal': return `<span class="bg-red-500/20 text-red-400 ${baseClasses}">Batal</span>`;
            default: return `<span class="bg-gray-500/20 text-gray-400 ${baseClasses}">Baru</span>`;
        }
    }

    // --- RENDER FUNCTIONS ---
    function renderAll() {
        renderPelangganTable();
        renderInventarisTables();
        renderLaporanTable();
        renderPembayaranTable();
        renderAgenda();
        renderUserTable();
        renderSettingsForms();
        populateAllDropdowns();
        updateDashboardCards();
        renderAllCharts();
        if (calendar) {
            populateCalendar();
        }
        lucide.createIcons();
    }

    function renderPelangganTable(filter = '') {
        const container = document.getElementById('pelanggan-table-container');
        const filteredPelanggan = db.pelanggan.filter(p => 
            p.nama.toLowerCase().includes(filter.toLowerCase()) || 
            (p.perusahaan && p.perusahaan.toLowerCase().includes(filter.toLowerCase())) ||
            p.email.toLowerCase().includes(filter.toLowerCase())
        );

        if (filteredPelanggan.length === 0) {
            container.innerHTML = getEmptyState(filter ? 'Tidak ada pelanggan yang cocok dengan pencarian Anda.' : 'Silakan tambahkan pelanggan baru.');
            lucide.createIcons();
            return;
        }

        const canManage = currentUser && (currentUser.role === 'Admin' || currentUser.role === 'Manager');
        let tableHtml = `<table class="w-full text-left">
                                    <thead><tr class="border-b border-[var(--border-color)]"><th class="p-3">Nama</th><th class="p-3">Perusahaan</th><th class="p-3">Segmentasi</th><th class="p-3">Alamat</th><th class="p-3">Telepon</th><th class="p-3">Aksi</th></tr></thead>
                                    <tbody>`;

        filteredPelanggan.forEach(p => {
            const waNumber = formatPhoneNumberForWhatsApp(p.telepon);
            let aksiHtml = `<td class="p-3 flex space-x-1">
                                                <button onclick="openWhatsAppModal(${p.id})" title="Buat Pesan WhatsApp" class="p-2 text-purple-400 hover:text-purple-300 rounded-full hover:bg-[var(--bg-hover)] transition-colors"><i data-lucide="message-square-plus" class="w-4 h-4"></i></button>
                                                <button onclick="openPelangganModal(${p.id})" title="Edit Pelanggan" class="p-2 text-yellow-400 hover:text-yellow-300 rounded-full hover:bg-[var(--bg-hover)] transition-colors"><i data-lucide="edit" class="w-4 h-4"></i></button>
                                                ${canManage ? `<button onclick="confirmDelete('pelanggan', ${p.id})" title="Hapus Pelanggan" class="p-2 text-red-500 hover:text-red-400 rounded-full hover:bg-[var(--bg-hover)] transition-colors"><i data-lucide="trash-2" class="w-4 h-4"></i></button>` : ''}
                                            </td>`;

            tableHtml += `<tr class="border-b border-[var(--border-color)] hover:bg-[var(--bg-hover)]">
                <td class="p-3">${p.nama}</td>
                <td class="p-3">${p.perusahaan}</td>
                <td class="p-3">${getSegmentasiBadge(p.segmentasi)}</td>
                <td class="p-3 text-sm text-[var(--text-secondary)] max-w-xs truncate">${p.alamat}</td>
                <td class="p-3 flex items-center justify-between">
                    <span>${p.telepon}</span>
                    <a href="https://wa.me/${waNumber}" target="_blank" title="Kirim WhatsApp" class="p-2 text-green-400 hover:text-green-300">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                    </a>
                </td>
                ${aksiHtml}
            </tr>`;
        });
        tableHtml += `</tbody></table>`;
        container.innerHTML = tableHtml;
        lucide.createIcons();
    }
    
    function renderUserTable() {
        const container = document.getElementById('user-table-container');
        if (db.users.length === 0) {
             container.innerHTML = getEmptyState('Tidak ada data user. Silakan tambahkan user baru.');
             lucide.createIcons();
             return;
        }
        let tableHtml = `<table class="w-full text-left">
                                    <thead><tr class="border-b border-[var(--border-color)]"><th class="p-3">Nama</th><th class="p-3">Email</th><th class="p-3">Role</th><th class="p-3">Aksi</th></tr></thead>
                                    <tbody>`;
        db.users.forEach(user => {
            tableHtml += `<tr class="border-b border-[var(--border-color)] hover:bg-[var(--bg-hover)]">
                <td class="p-3">${user.name}</td>
                <td class="p-3">${user.email}</td>
                <td class="p-3">${getRoleBadge(user.role)}</td>
                <td class="p-3 flex space-x-2">
                    <button onclick="openUserModal(${user.id})" class="p-2 text-yellow-400 hover:text-yellow-300 rounded-full hover:bg-[var(--bg-hover)] transition-colors"><i data-lucide="edit" class="w-4 h-4"></i></button>
                    ${user.id !== currentUser.id ? `<button onclick="confirmDelete('user', ${user.id})" class="p-2 text-red-500 hover:text-red-400 rounded-full hover:bg-[var(--bg-hover)] transition-colors"><i data-lucide="trash-2" class="w-4 h-4"></i></button>` : ''}
                </td>
            </tr>`;
        });
        tableHtml += `</tbody></table>`;
        container.innerHTML = tableHtml;
        lucide.createIcons();
    }
    
    function renderInventarisTables() {
        const canManage = currentUser && (currentUser.role === 'Admin' || currentUser.role === 'Manager');
        const kamarContainer = document.getElementById('inventaris-kamar-table-container');
        let kamarTableHtml = '';
        if (Object.keys(db.roomTypes).length > 0) {
            kamarTableHtml = `<div class="overflow-x-auto"><table class="w-full text-left"><thead><tr class="border-b border-[var(--border-color)]"><th class="p-3">Tipe Kamar</th><th class="p-3">Corporate</th><th class="p-3">Aksi</th></tr></thead><tbody>`;
            for(const key in db.roomTypes) {
                const room = db.roomTypes[key];
                kamarTableHtml += `<tr class="border-b border-[var(--border-color)]">
                    <td class="p-3 font-semibold">${room.name}</td>
                    <td class="p-3">${formatCurrency(room.prices.corporate)}</td>
                    <td class="p-3 flex space-x-2">
                        <button onclick="openKamarModal('${key}')" class="p-2 text-yellow-400 rounded-full hover:bg-[var(--bg-hover)] transition-colors"><i data-lucide="edit" class="w-4 h-4"></i></button>
                        ${canManage ? `<button onclick="confirmDelete('kamar', '${key}')" class="p-2 text-red-500 rounded-full hover:bg-[var(--bg-hover)] transition-colors"><i data-lucide="trash-2" class="w-4 h-4"></i></button>` : ''}
                    </td>
                </tr>`;
            }
            kamarTableHtml += `</tbody></table></div>`;
        } else {
            kamarTableHtml = getEmptyState('Belum ada tipe kamar yang ditambahkan.');
        }
        kamarContainer.innerHTML = kamarTableHtml;

        const meetingContainer = document.getElementById('inventaris-meeting-table-container');
        let meetingTableHtml = '';
        if (Object.keys(db.meetingRooms).length > 0) {
            meetingTableHtml = `<table class="w-full text-left"><thead><tr class="border-b border-[var(--border-color)]"><th class="p-3">Nama Ruang</th><th class="p-3">Harga Sewa</th><th class="p-3">Aksi</th></tr></thead><tbody>`;
            for(const key in db.meetingRooms) {
                const room = db.meetingRooms[key];
                meetingTableHtml += `<tr class="border-b border-[var(--border-color)]"><td class="p-3">${room.name}</td><td class="p-3">${formatCurrency(room.rentalPrice)}</td><td class="p-3 flex space-x-2"><button onclick="openMeetingRoomModal('${key}')" class="p-2 text-yellow-400 rounded-full hover:bg-[var(--bg-hover)] transition-colors"><i data-lucide="edit" class="w-4 h-4"></i></button>${canManage ? `<button onclick="confirmDelete('meetingRoom', '${key}')" class="p-2 text-red-500 rounded-full hover:bg-[var(--bg-hover)] transition-colors"><i data-lucide="trash-2" class="w-4 h-4"></i></button>` : ''}</td></tr>`;
            }
             meetingTableHtml += `</tbody></table>`;
        } else {
            meetingTableHtml = getEmptyState('Belum ada ruang meeting yang ditambahkan.');
        }
        meetingContainer.innerHTML = meetingTableHtml;
        
        const paketMeetingContainer = document.getElementById('inventaris-paket-meeting-table-container');
        let paketMeetingTableHtml = '';
        if (Object.keys(db.meetingPackages).length > 0) {
            paketMeetingTableHtml = `<table class="w-full text-left"><thead><tr class="border-b border-[var(--border-color)]"><th class="p-3">Nama Paket</th><th class="p-3">Harga/Pax</th><th class="p-3">Aksi</th></tr></thead><tbody>`;
            for(const key in db.meetingPackages) {
                const paket = db.meetingPackages[key];
                const isReadOnly = key === 'only_room';
                let actionButtons = '';
                if (!isReadOnly) {
                    actionButtons = `<button onclick="openPaketMeetingModal('${key}')" class="p-2 text-yellow-400 rounded-full hover:bg-[var(--bg-hover)] transition-colors"><i data-lucide="edit" class="w-4 h-4"></i></button>`;
                    if (canManage) {
                       actionButtons += `<button onclick="confirmDelete('paketMeeting', '${key}')" class="p-2 text-red-500 rounded-full hover:bg-[var(--bg-hover)] transition-colors"><i data-lucide="trash-2" class="w-4 h-4"></i></button>`;
                    }
                }
                paketMeetingTableHtml += `<tr class="border-b border-[var(--border-color)]">
                    <td class="p-3">${paket.name}</td>
                    <td class="p-3">${paket.price > 0 ? formatCurrency(paket.price) : '-'}</td>
                    <td class="p-3 flex space-x-2">${actionButtons}</td>
                </tr>`;
            }
            paketMeetingTableHtml += `</tbody></table>`;
        } else {
            paketMeetingTableHtml = getEmptyState('Belum ada paket meeting yang ditambahkan.');
        }
        paketMeetingContainer.innerHTML = paketMeetingTableHtml;

        lucide.createIcons();
    }

    function renderLaporanTable(filter = '') {
        const container = document.getElementById('laporan-table-container');
        const allBookings = [...db.kamarBookings, ...db.meetingBookings].sort((a, b) => new Date(b.tanggalBooking) - new Date(a.tanggalBooking));

        const filteredBookings = allBookings.filter(b => {
            const customer = db.pelanggan.find(p => p.id === b.pelangganId);
            return b.id.toLowerCase().includes(filter.toLowerCase()) ||
                   (customer && customer.nama.toLowerCase().includes(filter.toLowerCase()));
        });

        if (filteredBookings.length === 0) {
            container.innerHTML = getEmptyState(filter ? 'Tidak ada booking yang cocok.' : 'Belum ada transaksi booking.');
            lucide.createIcons();
            return;
        }

        const canManage = currentUser && (currentUser.role === 'Admin' || currentUser.role === 'Manager');
        let tableHtml = `<table class="w-full text-left text-sm">
                            <thead>
                                <tr class="border-b border-[var(--border-color)]">
                                    <th class="p-3">ID Booking</th>
                                    <th class="p-3">Pelanggan</th>
                                    <th class="p-3">Total</th>
                                    <th class="p-3">Dibayar</th>
                                    <th class="p-3">Sisa</th>
                                    <th class="p-3">Status Bayar</th>
                                    <th class="p-3">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>`;

        filteredBookings.forEach(b => {
            const pelanggan = db.pelanggan.find(p => p.id === b.pelangganId);
            const paymentInfo = getPaymentInfo(b.id);
            const paymentStatus = getPaymentStatus(b, paymentInfo.totalPaid);

            let deleteButtonHtml = '';
            if (canManage) {
                deleteButtonHtml = `<button onclick="confirmDeleteBooking('${b.id}')" title="Hapus Transaksi" class="bg-red-700 hover:bg-red-800 text-white font-bold py-1 px-3 text-xs rounded-md flex items-center"><i data-lucide="trash-2" class="w-4 h-4 mr-1"></i> Hapus</button>`;
            }

            tableHtml += `<tr class="border-b border-[var(--border-color)] hover:bg-[var(--bg-hover)]">
                <td class="p-3 font-mono">${b.id}</td>
                <td class="p-3">${pelanggan ? pelanggan.nama : 'N/A'}</td>
                <td class="p-3">${formatCurrency(b.totalHarga)}</td>
                <td class="p-3 text-green-500">${formatCurrency(paymentInfo.totalPaid)}</td>
                <td class="p-3 text-red-500">${formatCurrency(paymentInfo.balance)}</td>
                <td class="p-3">${getPaymentStatusBadge(paymentStatus)}</td>
                <td class="p-3 flex flex-wrap gap-1">
                    <button onclick="openPaymentModal('${b.id}')" title="Input Pembayaran" class="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 text-xs rounded-md flex items-center disabled:opacity-50 disabled:cursor-not-allowed" ${paymentInfo.balance <= 0 ? 'disabled' : ''}><i data-lucide="dollar-sign" class="w-4 h-4 mr-1"></i> Bayar</button>
                    <button onclick="generateInvoice('${b.id}')" title="Cetak Invoice" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 text-xs rounded-md flex items-center"><i data-lucide="receipt" class="w-4 h-4 mr-1"></i> Invoice</button>
                    ${deleteButtonHtml}
                </td>
            </tr>`;
        });
        tableHtml += `</tbody></table>`;
        container.innerHTML = tableHtml;
        lucide.createIcons();
    }

    function renderPembayaranTable(filter = '') {
        const container = document.getElementById('pembayaran-table-container');
        const allBookings = [...db.kamarBookings, ...db.meetingBookings];

        // Filter for bookings with outstanding balance
        let bookingsWithBalance = allBookings.filter(b => {
            const paymentInfo = getPaymentInfo(b.id);
            return paymentInfo.balance > 0;
        }).sort((a, b) => new Date(b.tanggalBooking) - new Date(a.tanggalBooking));
        
        // Apply search filter
        if (filter) {
            bookingsWithBalance = bookingsWithBalance.filter(b => {
                const customer = db.pelanggan.find(p => p.id === b.pelangganId);
                return b.id.toLowerCase().includes(filter.toLowerCase()) ||
                       (customer && customer.nama.toLowerCase().includes(filter.toLowerCase()));
            });
        }

        if (bookingsWithBalance.length === 0) {
            container.innerHTML = getEmptyState(filter ? 'Tidak ada piutang yang cocok.' : 'Tidak ada piutang saat ini.');
            lucide.createIcons();
            return;
        }

        let tableHtml = `<table class="w-full text-left text-sm">
                            <thead>
                                <tr class="border-b border-[var(--border-color)]">
                                    <th class="p-3">ID Booking</th>
                                    <th class="p-3">Pelanggan</th>
                                    <th class="p-3">Total Tagihan</th>
                                    <th class="p-3">Sisa Tagihan</th>
                                    <th class="p-3">Status Bayar</th>
                                    <th class="p-3">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>`;

        bookingsWithBalance.forEach(b => {
            const pelanggan = db.pelanggan.find(p => p.id === b.pelangganId);
            const paymentInfo = getPaymentInfo(b.id);
            const paymentStatus = getPaymentStatus(b, paymentInfo.totalPaid);

            tableHtml += `<tr class="border-b border-[var(--border-color)] hover:bg-[var(--bg-hover)]">
                <td class="p-3 font-mono">${b.id}</td>
                <td class="p-3">${pelanggan ? pelanggan.nama : 'N/A'}</td>
                <td class="p-3">${formatCurrency(b.totalHarga)}</td>
                <td class="p-3 font-bold text-red-500">${formatCurrency(paymentInfo.balance)}</td>
                <td class="p-3">${getPaymentStatusBadge(paymentStatus)}</td>
                <td class="p-3">
                    <button onclick="openPaymentModal('${b.id}')" title="Input Pembayaran" class="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 text-xs rounded-md flex items-center">
                        <i data-lucide="dollar-sign" class="w-4 h-4 mr-1"></i> Bayar
                    </button>
                </td>
            </tr>`;
        });
        tableHtml += `</tbody></table>`;
        container.innerHTML = tableHtml;
        lucide.createIcons();
    }

    function renderAgenda() {
        const todayContainer = document.getElementById('agenda-hari-ini');
        const upcomingContainer = document.getElementById('agenda-akan-datang');
        const completedContainer = document.getElementById('agenda-selesai');
        todayContainer.innerHTML = ''; upcomingContainer.innerHTML = ''; completedContainer.innerHTML = '';
        
        const canManage = currentUser && (currentUser.role === 'Admin' || currentUser.role === 'Manager');
        const todayString = now.toISOString().split('T')[0];

        db.agenda.sort((a,b) => new Date(a.tanggal) - new Date(b.tanggal)).forEach(item => {
            const pelanggan = db.pelanggan.find(p => p.id === item.pelangganId);
            let lokasiHtml = '';
            if (item.lokasi) {
                if (/^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(item.lokasi)) {
                    lokasiHtml = `<a href="https://www.google.com/maps?q=${item.lokasi}" target="_blank" class="text-blue-400 hover:underline text-xs flex items-center"><i data-lucide="map-pin" class="w-3 h-3 mr-1"></i>Lihat Peta</a>`;
                } else {
                    lokasiHtml = `<p class="text-xs text-[var(--text-secondary)] mt-1 flex items-center"><i data-lucide="map-pin" class="w-3 h-3 mr-1"></i>${item.lokasi}</p>`;
                }
            }
            
            let actionButtons = `<div class="flex items-center space-x-1 flex-shrink-0 ml-4">`;
            if (item.status === 'Tentative') {
                actionButtons += `<button onclick="confirmSetDefinite(${item.id})" title="Set Definite" class="p-2 text-green-500 hover:bg-[var(--bg-hover)] rounded-full"><i data-lucide="shield-check" class="w-5 h-5"></i></button>`;
            }
            if (item.status !== 'selesai') {
                actionButtons += `<button onclick="markAgendaComplete(${item.id})" title="Tandai Selesai" class="p-2 text-blue-500 hover:bg-[var(--bg-hover)] rounded-full"><i data-lucide="check-circle-2" class="w-5 h-5"></i></button>`;
            }
            actionButtons += `<button onclick="openAgendaModal(${item.id})" title="Edit Agenda" class="p-2 text-yellow-400 hover:bg-[var(--bg-hover)] rounded-full"><i data-lucide="edit" class="w-5 h-5"></i></button>`;
            if (canManage) {
                actionButtons += `<button onclick="confirmDelete('agenda', ${item.id})" title="Hapus Agenda" class="p-2 text-red-500 hover:bg-[var(--bg-hover)] rounded-full"><i data-lucide="trash-2" class="w-5 h-5"></i></button>`;
            }
            actionButtons += `</div>`;

            const cardHtml = `<div class="bg-[var(--bg-tertiary)]/50 p-4 rounded-lg flex items-start justify-between">
                <div>
                    ${getAgendaBadges(item)}
                    <p class="font-semibold text-[var(--text-primary)] mt-2">${item.judul}</p>
                    <p class="text-sm text-[var(--text-secondary)]">Dengan: ${pelanggan ? pelanggan.nama : 'N/A'}</p>
                    <p class="text-sm text-[var(--text-secondary)]">${new Date(item.tanggal + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} | ${item.jamMulai} - ${item.jamSelesai}</p>
                    <div class="mt-2">${lokasiHtml}</div>
                    <p class="text-xs text-gray-500 mt-1">${item.catatan || ''}</p>
                </div>
                ${actionButtons}
            </div>`;

            if (item.status === 'selesai') { completedContainer.innerHTML += cardHtml; } 
            else if (item.tanggal === todayString) { todayContainer.innerHTML += cardHtml; } 
            else if (new Date(item.tanggal) > now) { upcomingContainer.innerHTML += cardHtml; } 
            else { completedContainer.innerHTML += cardHtml; }
        });
        if (!todayContainer.innerHTML) todayContainer.innerHTML = getEmptyState('Tidak ada agenda hari ini.');
        if (!upcomingContainer.innerHTML) upcomingContainer.innerHTML = getEmptyState('Tidak ada agenda yang akan datang.');
        if (!completedContainer.innerHTML) completedContainer.innerHTML = getEmptyState('Tidak ada agenda yang telah selesai.');
        lucide.createIcons();
    }

    function populateAllDropdowns() {
        const pelangganDropdowns = document.querySelectorAll('#bk-pelanggan, #bm-pelanggan, #agenda-pelanggan');
        pelangganDropdowns.forEach(d => { d.innerHTML = '<option value="">-- Pilih --</option>'; db.pelanggan.forEach(p => { d.innerHTML += `<option value="${p.id}">${p.nama} ${p.perusahaan !== '-' ? `(${p.perusahaan})` : ''}</option>`; }); });
        
        const kamarDropdown = document.querySelector('#room-rows-container .room-row:first-child select[name="bk-tipe-kamar"]');
        if (kamarDropdown) {
            populateRoomTypeDropdown(kamarDropdown);
        }

        const meetingPaketDropdown = document.getElementById('bm-paket');
        meetingPaketDropdown.innerHTML = '<option value="">-- Pilih --</option>';
        for (const key in db.meetingPackages) { meetingPaketDropdown.innerHTML += `<option value="${key}">${db.meetingPackages[key].name}</option>`; }
        const meetingRoomDropdown = document.getElementById('bm-tipe-ruang');
        meetingRoomDropdown.innerHTML = '<option value="">-- Pilih --</option>';
        for (const key in db.meetingRooms) { meetingRoomDropdown.innerHTML += `<option value="${key}">${db.meetingRooms[key].name}</option>`; }
    }

    function populateRoomTypeDropdown(selectElement) {
        selectElement.innerHTML = '<option value="">-- Pilih --</option>';
        for (const key in db.roomTypes) { selectElement.innerHTML += `<option value="${key}">${db.roomTypes[key].name}</option>`; }
    }
    
    function renderSettingsForms() {
        document.getElementById('tax-service-percentage').value = db.settings.taxAndServicePercentage;
        document.getElementById('invoice-logo-url').value = db.settings.invoiceSettings.logoUrl;
        document.getElementById('invoice-payment-notes').value = db.settings.invoiceSettings.paymentNotes;
        renderRoleSettings();
    }

    function renderRoleSettings() {
        const container = document.getElementById('role-settings-container');
        const permissions = db.settings.rolePermissions;
        const pageNames = {
            'dashboard': 'Dashboard', 'kalender': 'Kalender', 'pelanggan': 'Pelanggan', 'agenda': 'Agenda Meeting',
            'booking-kamar': 'Booking Kamar', 'booking-meeting': 'Booking Ruang Meeting', 'pembayaran': 'Pembayaran', 'laporan': 'Laporan & Invoice',
            'laporan-sales': 'Laporan Sales', 'manajemen-user': 'Manajemen User', 'manajemen-inventaris': 'Manajemen Inventaris',
            'manajemen-pengaturan': 'Pengaturan'
        };

        let html = '';
        for (const role in permissions) {
            html += `<div class="p-4 border border-[var(--border-color)] rounded-lg">
                        <h4 class="text-lg font-semibold mb-3">${role}</h4>
                        <div class="grid grid-cols-2 md:grid-cols-3 gap-4">`;
            
            for (const page in permissions[role]) {
                const isChecked = permissions[role][page];
                // Admin role cannot be edited
                const isDisabled = role === 'Admin' ? 'disabled' : '';
                html += `
                    <label class="flex items-center space-x-3">
                        <input type="checkbox" data-role="${role}" data-page="${page}" ${isChecked ? 'checked' : ''} ${isDisabled}
                            class="h-4 w-4 rounded border-gray-300 text-[var(--accent)] focus:ring-[var(--accent)]">
                        <span class="text-sm text-[var(--text-primary)]">${pageNames[page] || page}</span>
                    </label>
                `;
            }
            html += `</div></div>`;
        }
        container.innerHTML = html;
    }

    function updateDashboardCards() {
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
        const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

        const bookingsBulanIni = [...db.kamarBookings, ...db.meetingBookings].filter(b => {
            const bookingDate = new Date(b.tanggalBooking);
            return bookingDate >= firstDayOfMonth && bookingDate <= lastDayOfMonth;
        });
        
        const totalPendapatan = bookingsBulanIni.reduce((sum, b) => sum + b.totalHarga, 0);
        document.getElementById('dashboard-pendapatan').textContent = formatCurrency(totalPendapatan);
        document.getElementById('dashboard-booking').textContent = bookingsBulanIni.length;
        document.getElementById('dashboard-pelanggan').textContent = db.pelanggan.length;
        
        const todayString = now.toISOString().split('T')[0];
        const agendaHariIni = db.agenda.filter(item => item.tanggal === todayString && item.status !== 'selesai').length;
        document.getElementById('dashboard-agenda').textContent = agendaHariIni;

        // Calculate total outstanding payments (piutang)
        const allBookings = [...db.kamarBookings, ...db.meetingBookings];
        const totalPiutang = allBookings.reduce((sum, booking) => {
            const paymentInfo = getPaymentInfo(booking.id);
            return sum + paymentInfo.balance;
        }, 0);
        document.getElementById('dashboard-piutang').textContent = formatCurrency(totalPiutang);
    }

    // --- CHART LOGIC ---
    function renderAllCharts() {
        renderSalesTargetChart();
        renderSalespersonChart();
        renderSegmentChart();
    }

    function renderSalesTargetChart() {
        const ctx = document.getElementById('salesTargetChart').getContext('2d');
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        const targetKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

        const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
        const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

        const bookingsBulanIni = [...db.kamarBookings, ...db.meetingBookings].filter(b => {
            const bookingDate = new Date(b.tanggalBooking);
            return bookingDate >= firstDayOfMonth && bookingDate <= lastDayOfMonth;
        });
        const totalPendapatan = bookingsBulanIni.reduce((sum, b) => sum + b.totalHarga, 0);
        const targetAmount = (db.targets[targetKey] || 0) * 1000000;
        const sisaTarget = Math.max(0, targetAmount - totalPendapatan);

        const style = getComputedStyle(document.documentElement);
        const accentColor = style.getPropertyValue('--accent');
        const tertiaryBgColor = style.getPropertyValue('--bg-tertiary');
        const textColor = style.getPropertyValue('--text-primary');
        
        const targetDisplay = document.getElementById('sales-target-display');
        if (targetAmount > 0) {
            targetDisplay.textContent = `(Target: ${formatCurrency(targetAmount)})`;
        } else {
            targetDisplay.textContent = `(Target Belum Diatur)`;
        }

        const chartData = {
            labels: ['Pencapaian', 'Sisa Target'],
            datasets: [{
                data: [totalPendapatan, sisaTarget],
                backgroundColor: [accentColor, tertiaryBgColor],
                borderColor: style.getPropertyValue('--bg-secondary'),
                borderWidth: 4,
                hoverOffset: 8
            }]
        };

        if (salesTargetChartInstance) {
            salesTargetChartInstance.destroy();
        }

        salesTargetChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: textColor,
                            padding: 20,
                            font: {
                                size: 14
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: ${formatCurrency(context.raw)}`;
                            }
                        }
                    }
                }
            }
        });
    }

    function renderSalespersonChart() {
        const ctx = document.getElementById('salespersonChart').getContext('2d');
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
        const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

        const bookingsBulanIni = [...db.kamarBookings, ...db.meetingBookings].filter(b => {
            const bookingDate = new Date(b.tanggalBooking);
            return bookingDate >= firstDayOfMonth && bookingDate <= lastDayOfMonth;
        });

        const salesData = {};
        bookingsBulanIni.forEach(booking => {
            const user = db.users.find(u => u.id === booking.createdBy);
            if (user) {
                if (!salesData[user.name]) {
                    salesData[user.name] = 0;
                }
                salesData[user.name] += booking.totalHarga;
            }
        });

        const style = getComputedStyle(document.documentElement);
        const textColor = style.getPropertyValue('--text-primary');
        const chartColors = ['#3b82f6', '#22c55e', '#f97316', '#8b5cf6', '#ec4899'];

        const chartData = {
            labels: Object.keys(salesData),
            datasets: [{
                data: Object.values(salesData),
                backgroundColor: chartColors,
                borderColor: style.getPropertyValue('--bg-secondary'),
                borderWidth: 4,
                hoverOffset: 8
            }]
        };

        if (salespersonChartInstance) {
            salespersonChartInstance.destroy();
        }

        salespersonChartInstance = new Chart(ctx, {
            type: 'pie',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: textColor,
                            padding: 20,
                            font: { size: 14 }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: ${formatCurrency(context.raw)}`;
                            }
                        }
                    }
                }
            }
        });
    }

    function renderSegmentChart() {
        const ctx = document.getElementById('segmentChart').getContext('2d');
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
        const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

        const bookingsBulanIni = [...db.kamarBookings, ...db.meetingBookings].filter(b => {
            const bookingDate = new Date(b.tanggalBooking);
            return bookingDate >= firstDayOfMonth && bookingDate <= lastDayOfMonth;
        });

        const segmentData = { 'Individual': 0, 'Corporate': 0, 'Travel Agent': 0, 'Government': 0 };
        bookingsBulanIni.forEach(booking => {
            const customer = db.pelanggan.find(p => p.id === booking.pelangganId);
            if (customer && segmentData.hasOwnProperty(customer.segmentasi)) {
                segmentData[customer.segmentasi] += booking.totalHarga;
            }
        });

        const style = getComputedStyle(document.documentElement);
        const accentColor = style.getPropertyValue('--accent');
        const textColor = style.getPropertyValue('--text-primary');
        const gridColor = style.getPropertyValue('--border-color');

        const chartData = {
            labels: Object.keys(segmentData),
            datasets: [{
                label: 'Pendapatan',
                data: Object.values(segmentData),
                backgroundColor: accentColor,
                borderRadius: 4,
            }]
        };

        if (segmentChartInstance) {
            segmentChartInstance.destroy();
        }

        segmentChartInstance = new Chart(ctx, {
            type: 'bar',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: textColor },
                        grid: { color: gridColor }
                    },
                    x: {
                        ticks: { color: textColor },
                        grid: { display: false }
                    }
                },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `Pendapatan: ${formatCurrency(context.raw)}`;
                                }
                            }
                        }
                    }
                }
            });
    }

    // --- CALENDAR LOGIC ---
    function initializeCalendar() {
        const calendarEl = document.getElementById('calendar-container');
        if (!calendarEl) return;

        calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
            },
            events: [], // Will be populated by populateCalendar
            eventClick: function(info) {
                showEventDetails(info.event);
            },
            height: 'auto'
        });

        calendar.render();
        populateCalendar();
    }

    function populateCalendar() {
        if (!calendar) return;

        const events = [];
        // Agenda Meetings
        db.agenda.forEach(item => {
            const customer = db.pelanggan.find(p => p.id === item.pelangganId);
            let eventColor = '#3b82f6'; // Blue for Visit
            if (item.tipe === 'telemarketing') eventColor = '#8b5cf6'; // Purple for Telemarketing
            
            events.push({
                id: `agenda-${item.id}`,
                title: `Meeting: ${item.judul}`,
                start: `${item.tanggal}T${item.jamMulai}`,
                end: `${item.tanggal}T${item.jamSelesai}`,
                color: eventColor,
                className: item.status === 'Tentative' ? 'fc-event-tentative' : '',
                extendedProps: {
                    type: 'Agenda Meeting',
                    customer: customer ? customer.nama : 'N/A',
                    details: item.catatan || 'Tidak ada catatan.',
                    status: item.status
                }
            });
        });

        // Room Bookings (Check-ins)
        db.kamarBookings.forEach(booking => {
            const customer = db.pelanggan.find(p => p.id === booking.pelangganId);
            events.push({
                id: `kamar-${booking.id}`,
                title: `Check-in: ${customer ? customer.nama : 'N/A'}`,
                start: booking.checkin,
                end: booking.checkout,
                color: '#22c55e', // Green
                extendedProps: {
                    type: 'Booking Kamar',
                    customer: customer ? customer.nama : 'N/A',
                    details: `${booking.rooms.length} tipe kamar.`
                }
            });
        });

        // Meeting Room Bookings
        db.meetingBookings.forEach(booking => {
            const customer = db.pelanggan.find(p => p.id === booking.pelangganId);
            const room = db.meetingRooms[booking.roomKey];
            events.push({
                id: `meeting-${booking.id}`,
                title: `Ruang Meeting: ${room ? room.name.split('(')[0].trim() : ''}`,
                start: `${booking.tanggalMulai}T${booking.jamMulai}`,
                end: `${booking.tanggalBerakhir}T${booking.jamBerakhir}`,
                color: '#f97316', // Orange
                 extendedProps: {
                    type: 'Booking Ruang Meeting',
                    customer: customer ? customer.nama : 'N/A',
                    details: `Pax: ${booking.jumlahPax || 'N/A'}`
                }
            });
        });

        calendar.removeAllEvents();
        calendar.addEventSource(events);
    }
    
    function showEventDetails(event) {
        const modalTitle = document.getElementById('geminiModalTitle');
        const modalContent = document.getElementById('geminiModalContent');

        modalTitle.innerHTML = `<i data-lucide="info" class="w-5 h-5 mr-2 text-[var(--accent)]"></i> Detail Event`;
        modalContent.innerHTML = `
            <h4 class="font-bold text-lg">${event.title}</h4>
            <p><strong>Tipe:</strong> ${event.extendedProps.type}</p>
            ${event.extendedProps.status ? `<p><strong>Status:</strong> ${event.extendedProps.status}</p>` : ''}
            <p><strong>Pelanggan:</strong> ${event.extendedProps.customer}</p>
            <p><strong>Waktu Mulai:</strong> ${event.start ? event.start.toLocaleString() : 'N/A'}</p>
            <p><strong>Waktu Selesai:</strong> ${event.end ? event.end.toLocaleString() : 'N/A'}</p>
            <p><strong>Detail:</strong> ${event.extendedProps.details}</p>
        `;
        lucide.createIcons();
        openModal('geminiModal');
    }


    // --- CALCULATION & PAYMENT LOGIC ---
    function getPaymentInfo(bookingId) {
        const booking = [...db.kamarBookings, ...db.meetingBookings].find(b => b.id === bookingId);
        if (!booking) return { totalPaid: 0, balance: 0, payments: [] };

        const paymentsForBooking = db.payments.filter(p => p.bookingId === bookingId);
        const totalPaid = paymentsForBooking.reduce((sum, p) => sum + p.jumlah, 0);
        const balance = booking.totalHarga - totalPaid;

        return { totalPaid, balance: balance > 0.01 ? balance : 0, payments: paymentsForBooking };
    }

    function getPaymentStatus(booking, totalPaid) {
        if (booking.status === 'Batal') return 'Batal';
        
        const balance = booking.totalHarga - totalPaid;
        if (balance <= 0.01) return 'Lunas';
        if (totalPaid > 0) return 'Menunggu Pelunasan';
        return 'Menunggu DP';
    }

    function calculateRoomTotalPrice() {
        let subtotal = 0;
        const checkin = document.getElementById('bk-checkin').value;
        const checkout = document.getElementById('bk-checkout').value;
        const taxLabel = document.getElementById('bk-tax-label');
        const customerId = parseInt(document.getElementById('bk-pelanggan').value);
        const customer = db.pelanggan.find(p => p.id === customerId);
        const segmentasiDisplay = document.getElementById('bk-segmentasi-display');
        
        if (customer) {
            segmentasiDisplay.value = customer.segmentasi;
        } else {
            segmentasiDisplay.value = 'Belum Dipilih';
        }
        const segmentasi = customer ? customer.segmentasi.toLowerCase().replace(' ', '-') : 'individual';

        taxLabel.textContent = `Pajak & Layanan (${db.settings.taxAndServicePercentage}%)`;

        if (!checkin || !checkout || new Date(checkout) <= new Date(checkin) || !customer) {
            document.getElementById('bk-subtotal').textContent = formatCurrency(0);
            document.getElementById('bk-tax').textContent = formatCurrency(0);
            document.getElementById('bk-total-harga').textContent = formatCurrency(0);
            document.querySelectorAll('.room-row').forEach(row => {
                row.querySelector('input[name="bk-harga-kamar-display"]').value = '-';
            });
            return;
        }
        
        const nights = (new Date(checkout) - new Date(checkin)) / (1000 * 3600 * 24);
        
        document.querySelectorAll('.room-row').forEach(row => {
            const roomKey = row.querySelector('select[name="bk-tipe-kamar"]').value;
            const roomCount = parseInt(row.querySelector('input[name="bk-jumlah-kamar"]').value) || 0;
            const guestCount = parseInt(row.querySelector('input[name="bk-jumlah-tamu"]').value) || 0;
            const packageType = row.querySelector('select[name="bk-paket"]').value;
            const priceDisplay = row.querySelector('input[name="bk-harga-kamar-display"]');
            
            if (roomKey && roomCount > 0 && guestCount > 0) {
                const roomInfo = db.roomTypes[roomKey];
                let basePrice = roomInfo.prices[segmentasi] || roomInfo.prices.individual;
                priceDisplay.value = formatCurrency(basePrice);

                let pricePerNight = basePrice;
                if (packageType === 'breakfast') {
                    pricePerNight += roomInfo.breakfastPrice * guestCount;
                }
                subtotal += pricePerNight * roomCount * nights;
            } else {
                priceDisplay.value = '-';
            }
        });

        const tax = subtotal * (db.settings.taxAndServicePercentage / 100);
        const totalHarga = subtotal + tax;

        document.getElementById('bk-subtotal').textContent = formatCurrency(subtotal);
        document.getElementById('bk-tax').textContent = formatCurrency(tax);
        document.getElementById('bk-total-harga').textContent = formatCurrency(totalHarga);
    }

    function calculateMeetingTotalPrice() {
        const packageKey = document.getElementById('bm-paket').value, roomKey = document.getElementById('bm-tipe-ruang').value, paxCount = parseInt(document.getElementById('bm-jumlah-pax').value) || 0;
        const subtotalEl = document.getElementById('bm-subtotal'), taxEl = document.getElementById('bm-tax'), totalEl = document.getElementById('bm-total-harga'), priceDisplay = document.getElementById('bm-harga-paket');
        
        document.getElementById('bm-tax-label').textContent = `Pajak & Layanan (${db.settings.taxAndServicePercentage}%)`;

        if (!packageKey) { 
            priceDisplay.value = formatCurrency(0); 
            subtotalEl.textContent = formatCurrency(0);
            taxEl.textContent = formatCurrency(0);
            totalEl.textContent = formatCurrency(0);
            return; 
        }
        
        let subtotal = 0;
        if (packageKey === 'only_room') { 
            priceDisplay.value = "Sesuai Ruangan"; 
            subtotal = roomKey ? db.meetingRooms[roomKey].rentalPrice : 0; 
        } else { 
            const packagePrice = db.meetingPackages[packageKey].price; 
            priceDisplay.value = formatCurrency(packagePrice); 
            subtotal = packagePrice * paxCount; 
        }

        const tax = subtotal * (db.settings.taxAndServicePercentage / 100);
        const total = subtotal + tax;

        subtotalEl.textContent = formatCurrency(subtotal);
        taxEl.textContent = formatCurrency(tax);
        totalEl.textContent = formatCurrency(total);
    }

    // --- MODAL & CRUD LOGIC ---
    window.openModal = (modalId) => {
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

    window.closeModal = (modalId) => {
        const modal = document.getElementById(modalId);
        if(modal) {
            modal.classList.add('opacity-0');
            modal.querySelector('.modal-content').classList.add('scale-95');
            setTimeout(() => {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }, 300);
        }
    };
    
    window.openPelangganModal = (id = null) => {
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

    window.openKamarModal = (key = null) => {
        const form = document.getElementById('formKamar'); form.reset();
        const title = document.getElementById('kamarModalTitle'), idInput = document.getElementById('kamar-id');
        if (key && db.roomTypes[key]) {
            title.textContent = 'Edit Tipe Kamar'; idInput.value = key;
            document.getElementById('kamar-nama').value = db.roomTypes[key].name;
            document.getElementById('kamar-harga-individual').value = db.roomTypes[key].prices.individual;
            document.getElementById('kamar-harga-corporate').value = db.roomTypes[key].prices.corporate;
            document.getElementById('kamar-harga-travel').value = db.roomTypes[key].prices['travel-agent'];
            document.getElementById('kamar-harga-government').value = db.roomTypes[key].prices.government;
            document.getElementById('kamar-harga-sarapan').value = db.roomTypes[key].breakfastPrice;
        } else { title.textContent = 'Tambah Tipe Kamar'; idInput.value = ''; }
        openModal('kamarModal');
    }

    window.openMeetingRoomModal = (key = null) => {
        const form = document.getElementById('formMeetingRoom'); form.reset();
        const title = document.getElementById('meetingRoomModalTitle'), idInput = document.getElementById('meeting-room-id');
        if (key && db.meetingRooms[key]) {
            title.textContent = 'Edit Ruang Meeting'; idInput.value = key;
            document.getElementById('meeting-room-nama').value = db.meetingRooms[key].name;
            document.getElementById('meeting-room-harga').value = db.meetingRooms[key].rentalPrice;
        } else { title.textContent = 'Tambah Ruang Meeting'; idInput.value = ''; }
        openModal('meetingRoomModal');
    }
    
    window.openPaketMeetingModal = (key = null) => {
        const form = document.getElementById('formPaketMeeting');
        form.reset();
        const title = document.getElementById('paketMeetingModalTitle'),
              idInput = document.getElementById('paket-meeting-id');
        if (key && db.meetingPackages[key]) {
            title.textContent = 'Edit Paket Meeting';
            idInput.value = key;
            document.getElementById('paket-meeting-nama').value = db.meetingPackages[key].name;
            document.getElementById('paket-meeting-harga').value = db.meetingPackages[key].price;
        } else {
            title.textContent = 'Tambah Paket Meeting';
            idInput.value = '';
        }
        openModal('paketMeetingModal');
    }

    window.openAgendaModal = (id = null) => {
        const form = document.getElementById('formAgenda'); form.reset();
        const title = document.getElementById('agendaModalTitle'), idInput = document.getElementById('agenda-id');
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
            }
        } else { title.textContent = 'Tambah Agenda Baru'; idInput.value = ''; }
        openModal('agendaModal');
    }

    window.markAgendaComplete = (id) => { const item = db.agenda.find(a => a.id === id); if (item) { item.status = 'selesai'; saveData(); renderAll(); showToast('Agenda ditandai selesai.'); } }

    window.openUserModal = (id = null) => {
        const form = document.getElementById('formUser'); form.reset();
        const title = document.getElementById('userModalTitle'), idInput = document.getElementById('user-id');
        const passwordInput = document.getElementById('user-password');
        if (id) {
            const user = db.users.find(u => u.id === id);
            if (user) {
                title.textContent = 'Edit User';
                idInput.value = user.id;
                document.getElementById('user-nama').value = user.name;
                document.getElementById('user-email').value = user.email;
                document.getElementById('user-role').value = user.role;
                passwordInput.placeholder = "Kosongkan jika tidak diubah";
                passwordInput.required = false;
            }
        } else {
            title.textContent = 'Tambah User Baru';
            idInput.value = '';
            passwordInput.placeholder = "";
            passwordInput.required = true;
        }
        openModal('userModal');
    }

    window.openPaymentModal = (bookingId) => {
        const booking = [...db.kamarBookings, ...db.meetingBookings].find(b => b.id === bookingId);
        if (!booking) {
            showToast('Booking tidak ditemukan.', 'error');
            return;
        }
        const paymentInfo = getPaymentInfo(bookingId);

        document.getElementById('payment-booking-id').textContent = bookingId;
        document.getElementById('payment-booking-id-input').value = bookingId;
        document.getElementById('payment-total-tagihan').textContent = formatCurrency(booking.totalHarga);
        document.getElementById('payment-sudah-dibayar').textContent = formatCurrency(paymentInfo.totalPaid);
        document.getElementById('payment-sisa-tagihan').textContent = formatCurrency(paymentInfo.balance);
        
        const amountInput = document.getElementById('payment-jumlah');
        amountInput.value = paymentInfo.balance;
        amountInput.max = paymentInfo.balance;

        document.getElementById('payment-tanggal').value = new Date().toISOString().split('T')[0];

        openModal('paymentModal');
    };

    // --- CONFIRMATION & DELETE LOGIC ---
        let confirmCallback = null;
        
        window.confirmSetDefinite = (id) => {
            document.getElementById('confirm-title').textContent = 'Konfirmasi Status Definite';
            document.getElementById('confirm-message').textContent = 'Apakah Anda yakin data sudah benar dan ingin mengubah status agenda ini menjadi DEFINITE?';
            const okBtn = document.getElementById('confirm-ok-btn');
            okBtn.className = okBtn.className.replace(/bg-\w+-\d+/g, 'bg-green-600').replace(/hover:bg-\w+-\d+/g, 'hover:bg-green-700');
            
            openModal('confirmModal');
            confirmCallback = () => {
                const item = db.agenda.find(a => a.id === id);
                if (item) {
                    item.status = 'Definite';
                    saveData();
                    renderAll();
                    showToast('Status agenda telah diubah menjadi Definite.');
                }
                closeModal('confirmModal');
            };
        };

        window.confirmDelete = (type, id) => {
            const messageMap = {
                pelanggan: `Yakin ingin menghapus pelanggan ini? Semua booking terkait akan kehilangan referensi pelanggan.`,
                user: `Yakin ingin menghapus user ini?`,
                agenda: `Yakin ingin menghapus agenda ini?`,
                kamar: `Yakin hapus tipe kamar "${db.roomTypes[id]?.name}"?`,
                meetingRoom: `Yakin hapus ruang meeting "${db.meetingRooms[id]?.name}"?`,
                paketMeeting: `Yakin hapus paket meeting "${db.meetingPackages[id]?.name}"?`
            };
            document.getElementById('confirm-message').textContent = messageMap[type] || 'Apakah Anda yakin?';
            document.getElementById('confirm-title').textContent = 'Konfirmasi Hapus';
            const okBtn = document.getElementById('confirm-ok-btn');
            okBtn.className = okBtn.className.replace(/bg-\w+-\d+/g, 'bg-red-600').replace(/hover:bg-\w+-\d+/g, 'hover:bg-red-700');
            
            openModal('confirmModal');
            confirmCallback = () => {
                deleteItem(type, id);
                closeModal('confirmModal');
            };
        };
        
        window.confirmCancelBooking = (bookingId) => {
            document.getElementById('confirm-message').textContent = `Yakin ingin membatalkan booking ${bookingId}? Aksi ini tidak dapat diurungkan.`;
            document.getElementById('confirm-title').textContent = 'Konfirmasi Pembatalan';
            const okBtn = document.getElementById('confirm-ok-btn');
            okBtn.className = okBtn.className.replace(/bg-\w+-\d+/g, 'bg-yellow-600').replace(/hover:bg-\w+-\d+/g, 'hover:bg-yellow-700');
            openModal('confirmModal');
            confirmCallback = () => {
                cancelBooking(bookingId);
                closeModal('confirmModal');
            };
        };

        window.confirmDeleteBooking = (bookingId) => {
            document.getElementById('confirm-message').textContent = `Yakin ingin menghapus transaksi ${bookingId}? Aksi ini akan menghapus data secara permanen.`;
            document.getElementById('confirm-title').textContent = 'Konfirmasi Hapus Transaksi';
            const okBtn = document.getElementById('confirm-ok-btn');
            okBtn.className = okBtn.className.replace(/bg-\w+-\d+/g, 'bg-red-600').replace(/hover:bg-\w+-\d+/g, 'hover:bg-red-700');
            openModal('confirmModal');
            confirmCallback = () => {
                deleteBooking(bookingId);
                closeModal('confirmModal');
            };
        };

        function deleteItem(type, id) {
            switch(type) {
                case 'pelanggan': db.pelanggan = db.pelanggan.filter(p => p.id !== id); break;
                case 'user': db.users = db.users.filter(u => u.id !== id); break;
                case 'agenda': db.agenda = db.agenda.filter(a => a.id !== id); break;
                case 'kamar': delete db.roomTypes[id]; break;
                case 'meetingRoom': delete db.meetingRooms[id]; break;
                case 'paketMeeting': delete db.meetingPackages[id]; break;
            }
            saveData();
            renderAll();
            showToast('Item berhasil dihapus.');
        }

        function deleteBooking(bookingId) {
            const kamarIndex = db.kamarBookings.findIndex(b => b.id === bookingId);
            if (kamarIndex > -1) {
                db.kamarBookings.splice(kamarIndex, 1);
            } else {
                const meetingIndex = db.meetingBookings.findIndex(b => b.id === bookingId);
                if (meetingIndex > -1) {
                    db.meetingBookings.splice(meetingIndex, 1);
                }
            }
            // Also delete associated payments
            db.payments = db.payments.filter(p => p.bookingId !== bookingId);
            saveData();
            renderAll();
            showToast(`Transaksi ${bookingId} berhasil dihapus.`, 'success');
        }
        
        document.getElementById('confirm-ok-btn').addEventListener('click', () => {
            if (typeof confirmCallback === 'function') {
                confirmCallback();
            }
            confirmCallback = null;
        });

        // --- PDF & BOOKING ACTIONS ---
        window.confirmBooking = (bookingId) => {
            const booking = [...db.kamarBookings, ...db.meetingBookings].find(b => b.id === bookingId);
            if (booking) {
                booking.status = 'Terkonfirmasi';
                saveData();
                renderLaporanTable(document.getElementById('laporan-search').value);
                showToast(`Booking ${bookingId} telah dikonfirmasi.`);
            }
        };
        
        window.cancelBooking = (bookingId) => {
             const booking = [...db.kamarBookings, ...db.meetingBookings].find(b => b.id === bookingId);
            if (booking) {
                booking.status = 'Batal';
                saveData();
                renderLaporanTable(document.getElementById('laporan-search').value);
                showToast(`Booking ${bookingId} telah dibatalkan.`, 'error');
            }
        }

        window.generateInvoice = (bookingId) => {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            const booking = [...db.kamarBookings, ...db.meetingBookings].find(b => b.id === bookingId);
            if (!booking) return;
            const customer = db.pelanggan.find(p => p.id === booking.pelangganId);
            if (!customer) return;
            const paymentInfo = getPaymentInfo(bookingId);

            // Add Logo
            try {
                const logoUrl = db.settings.invoiceSettings.logoUrl;
                if (logoUrl) {
                    doc.addImage(logoUrl, 'PNG', 14, 15, 40, 13);
                }
            } catch (e) { console.error("Error adding logo to PDF:", e); }

            doc.setFontSize(20);
            doc.setFont("helvetica", "bold");
            doc.text("INVOICE", 140, 22);
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            
            doc.setFont("helvetica", "bold");
            doc.text("Kepada:", 140, 40);
            doc.setFont("helvetica", "normal");
            doc.text(customer.nama, 140, 46);
            doc.text(customer.perusahaan, 140, 50);
            doc.text(customer.alamat, 140, 54);
            
            doc.text(`Invoice #: ${booking.id}`, 14, 50);
            doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, 14, 54);
            
            let tableBody = [];
            if (booking.tipeBooking === 'Kamar' && booking.rooms) {
                // Calculate nights only if needed inside the loop
                booking.rooms.forEach(room => {
                    const nights = (new Date(booking.checkout) - new Date(booking.checkin)) / (1000 * 3600 * 24);
                    let pricePerNight = room.basePrice;
                    if (room.package === 'breakfast') {
                        pricePerNight += (db.roomTypes[room.type]?.breakfastPrice || 0) * room.guests;
                    }
                    const lineTotal = room.count * pricePerNight * nights;
                    tableBody.push([
                        `${room.name} (${room.package === 'breakfast' ? 'Sarapan' : 'Room Only'})`,
                        `${room.count} kamar x ${nights} malam`,
                        formatCurrency(pricePerNight),
                        formatCurrency(lineTotal)
                    ]);
                });
            } else { 
                 const subtotal = booking.totalHarga / (1 + (db.settings.taxAndServicePercentage / 100));
                 const details = `Sewa Ruang Meeting (${db.meetingRooms[booking.roomKey]?.name})`;
                 tableBody.push([details, `1 paket`, formatCurrency(subtotal), formatCurrency(subtotal)]);
            }

            doc.autoTable({
                startY: 70,
                head: [['Deskripsi', 'Kuantitas', 'Harga Satuan', 'Jumlah']],
                body: tableBody,
                theme: 'striped',
                headStyles: { fillColor: [31, 41, 55] }
            });

            let finalY = doc.lastAutoTable.finalY;
            const subtotal = booking.totalHarga / (1 + (db.settings.taxAndServicePercentage / 100));
            const tax = booking.totalHarga - subtotal;

            doc.setFontSize(10);
            doc.text("Subtotal:", 140, finalY + 10);
            doc.text(formatCurrency(subtotal), 190, finalY + 10, { align: 'right' });
            doc.text(`Pajak & Layanan (${db.settings.taxAndServicePercentage}%):`, 140, finalY + 15);
            doc.text(formatCurrency(tax), 190, finalY + 15, { align: 'right' });
            
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text("Total Tagihan:", 140, finalY + 22);
            doc.text(formatCurrency(booking.totalHarga), 190, finalY + 22, { align: 'right' });

            if (paymentInfo.totalPaid > 0) {
                doc.setFontSize(10);
                doc.setFont("helvetica", "normal");
                doc.text("Sudah Dibayar:", 140, finalY + 27);
                doc.text(formatCurrency(paymentInfo.totalPaid), 190, finalY + 27, { align: 'right' });
                
                doc.setFontSize(12);
                doc.setFont("helvetica", "bold");
                doc.text("Sisa Tagihan:", 140, finalY + 34);
                doc.text(formatCurrency(paymentInfo.balance), 190, finalY + 34, { align: 'right' });
                finalY += 12; // Add extra space
            }

            // Payment Notes
            const paymentNotes = db.settings.invoiceSettings.paymentNotes;
            if (paymentNotes) {
                doc.setFontSize(9);
                doc.setFont("helvetica", "normal");
                doc.text("Catatan Pembayaran:", 14, finalY + 40);
                doc.text(paymentNotes, 14, finalY + 44);
            }

            doc.save(`Invoice-${booking.id}.pdf`);
        };

        window.generateConfirmationLetter = (bookingId) => {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            const booking = db.kamarBookings.find(b => b.id === bookingId);
            if (!booking) return;
            const customer = db.pelanggan.find(p => p.id === booking.pelangganId);
            if (!customer) return;

            // Add Logo
            try {
                const logoUrl = db.settings.invoiceSettings.logoUrl;
                if (logoUrl) {
                    doc.addImage(logoUrl, 'PNG', 14, 15, 40, 13);
                }
            } catch (e) {
                console.error("Error adding logo to PDF:", e);
            }

            doc.setFontSize(20);
            doc.setFont("helvetica", "bold");
            doc.text("Surat Konfirmasi Booking", 105, 22, { align: 'center' });
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text(`No: ${booking.id}`, 105, 28, { align: 'center' });

            doc.line(14, 40, 196, 40);

            doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}`, 14, 48);
            
            doc.setFont("helvetica", "bold");
            doc.text("Kepada Yth.", 14, 60);
            doc.setFont("helvetica", "normal");
            doc.text(customer.nama, 14, 66);
            doc.text(customer.perusahaan, 14, 70);
            doc.text(customer.alamat, 14, 74);

            doc.text("Dengan hormat,", 14, 84);
            doc.text("Terima kasih telah memilih hotel kami. Dengan ini kami konfirmasikan detail pemesanan Anda sebagai berikut:", 14, 90, { maxWidth: 180 });

            const nights = (new Date(booking.checkout) - new Date(booking.checkin)) / (1000 * 3600 * 24);
            const tableBody = booking.rooms.map(room => {
                return [
                    room.name,
                    `${room.count} kamar`,
                    `${room.guests} tamu`,
                    room.package === 'breakfast' ? 'Termasuk Sarapan' : 'Tanpa Sarapan'
                ];
            });

            doc.autoTable({
                startY: 100,
                head: [['Tipe Kamar', 'Jumlah', 'Tamu', 'Paket']],
                body: tableBody,
                theme: 'grid',
                headStyles: { fillColor: [22, 163, 74] } // Forest Green accent
            });

            let finalY = doc.lastAutoTable.finalY + 10;
            
            doc.setFont("helvetica", "bold");
            doc.text("Tanggal Check-in:", 14, finalY);
            doc.setFont("helvetica", "normal");
            doc.text(new Date(booking.checkin + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }), 60, finalY);

            doc.setFont("helvetica", "bold");
            doc.text("Tanggal Check-out:", 14, finalY + 6);
            doc.setFont("helvetica", "normal");
            doc.text(new Date(booking.checkout + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }), 60, finalY + 6);
            
            doc.setFont("helvetica", "bold");
            doc.text("Total Biaya:", 14, finalY + 12);
            doc.setFont("helvetica", "normal");
            doc.text(`${formatCurrency(booking.totalHarga)} (Termasuk Pajak & Pelayanan)`, 60, finalY + 12);

            finalY += 25;
            doc.text("Hormat kami,", 14, finalY + 20);
            doc.text(currentUser.name, 14, finalY + 40);

            doc.save(`Konfirmasi-${booking.id}.pdf`);
        };
        
        // --- EVENT LISTENERS ---
        const sidebar = document.getElementById('sidebar'), sidebarToggle = document.getElementById('sidebar-toggle'), sidebarBackdrop = document.getElementById('sidebar-backdrop'), navLinks = document.querySelectorAll('.nav-link'), contentSections = document.querySelectorAll('.content-section'), pageTitle = document.getElementById('page-title');
        window.toggleSidebar = () => { sidebar.classList.toggle('-translate-x-full'); sidebarBackdrop.classList.toggle('hidden'); }
        sidebarToggle.addEventListener('click', window.toggleSidebar);
        sidebarBackdrop.addEventListener('click', window.toggleSidebar);
        navLinks.forEach(link => { link.addEventListener('click', (e) => { e.preventDefault(); navLinks.forEach(l => l.classList.remove('active')); link.classList.add('active'); const targetId = link.getAttribute('data-target'); pageTitle.textContent = link.textContent.trim(); contentSections.forEach(s => s.id === targetId ? s.classList.remove('hidden') : s.classList.add('hidden')); if (window.innerWidth < 1024) window.toggleSidebar(); }); });

        // Search Listeners
        document.getElementById('pelanggan-search').addEventListener('input', (e) => renderPelangganTable(e.target.value));
        document.getElementById('laporan-search').addEventListener('input', (e) => renderLaporanTable(e.target.value));
        document.getElementById('pembayaran-search').addEventListener('input', (e) => renderPembayaranTable(e.target.value));

        // Form Submissions
        document.getElementById('formTambahPelanggan').addEventListener('submit', function(e) { 
    e.preventDefault(); 

    const id = parseInt(document.getElementById('pelanggan-id').value);
    const pelangganData = { 
        nama: document.getElementById('pelanggan-nama').value, 
        perusahaan: document.getElementById('pelanggan-perusahaan').value || '-', 
        email: document.getElementById('pelanggan-email').value, 
        telepon: document.getElementById('pelanggan-telepon').value, 
        alamat: document.getElementById('pelanggan-alamat').value, 
        segmentasi: document.getElementById('pelanggan-segmentasi').value 
    };

    if (id) {
        const index = db.pelanggan.findIndex(p => p.id === id);
        db.pelanggan[index] = { ...db.pelanggan[index], ...pelangganData };
    } else {
        pelangganData.id = Date.now();
        db.pelanggan.push(pelangganData);

        // ✅ Simpan ke Firestore hanya untuk data baru
        simpanPelangganKeFirestore(pelangganData);
    }

    saveData(); 
    renderAll(); 
    closeModal('pelangganModal'); 
    showToast(`Pelanggan berhasil ${id ? 'diperbarui' : 'ditambahkan'}!`); 
    this.reset(); 
});


        document.getElementById('formPembayaran').addEventListener('submit', function(e) {
            e.preventDefault();
            const bookingId = document.getElementById('payment-booking-id-input').value;
            const jumlah = parseFloat(document.getElementById('payment-jumlah').value);
            const tanggal = document.getElementById('payment-tanggal').value;
            const metode = document.getElementById('payment-metode').value;
            const tipe = document.getElementById('payment-tipe').value;
            const catatan = document.getElementById('payment-catatan').value;
            if (!bookingId || isNaN(jumlah) || jumlah <= 0 || !tanggal || !metode || !tipe) {
                showToast('Harap lengkapi semua data pembayaran.', 'error');
                return;
            }
            db.payments.push({
                id: Date.now(),
                bookingId,
                tanggal,
                jumlah,
                metode,
                tipe,
                catatan,
                createdBy: currentUser.id
            });
            saveData();
            renderAll();
            closeModal('paymentModal');
            showToast('Pembayaran berhasil disimpan!');
        });

        document.getElementById('formBookingKamar').addEventListener('submit', function(e) {
            e.preventDefault();
            const totalHarga = parseFloat(document.getElementById('bk-total-harga').textContent.replace(/[^0-9,-]+/g, "").replace(',', '.'));
            if (totalHarga <= 0) {
                showToast('Total harga tidak boleh nol. Periksa kembali detail kamar.', 'error');
                return;
            }

            const rooms = [];
            let valid = true;
            document.querySelectorAll('.room-row').forEach(row => {
                const roomKey = row.querySelector('select[name="bk-tipe-kamar"]').value;
                const roomCount = parseInt(row.querySelector('input[name="bk-jumlah-kamar"]').value);
                const guestCount = parseInt(row.querySelector('input[name="bk-jumlah-tamu"]').value);
                const packageType = row.querySelector('select[name="bk-paket"]').value;

                if (roomKey && roomCount > 0 && guestCount > 0) {
                    const customerId = parseInt(document.getElementById('bk-pelanggan').value);
                    const customer = db.pelanggan.find(p => p.id === customerId);
                    const segmentasi = customer ? customer.segmentasi.toLowerCase().replace(' ', '-') : 'individual';
                    const basePrice = db.roomTypes[roomKey].prices[segmentasi] || db.roomTypes[roomKey].prices.individual;

                    rooms.push({
                        type: roomKey,
                        name: db.roomTypes[roomKey].name,
                        count: roomCount,
                        basePrice: basePrice,
                        package: packageType,
                        guests: guestCount
                    });
                } else {
                    valid = false;
                }
            });

            if (!valid || rooms.length === 0) {
                showToast('Harap lengkapi semua detail kamar.', 'error');
                return;
            }

            const newBookingId = `BK-${Date.now()}`;
            db.kamarBookings.push({
                id: newBookingId,
                tipeBooking: 'Kamar',
                pelangganId: parseInt(document.getElementById('bk-pelanggan').value),
                tanggalBooking: new Date().toISOString(),
                checkin: document.getElementById('bk-checkin').value,
                checkout: document.getElementById('bk-checkout').value,
                totalHarga: totalHarga,
                status: 'Baru',
                rooms: rooms,
                createdBy: currentUser.id
            });
            saveData();
            renderAll();
            showToast('Booking kamar berhasil disimpan!');
            
            // Show print buttons for the new booking
            lastRoomBookingId = newBookingId;
            document.getElementById('booking-actions-container').classList.remove('hidden');
        });

        document.getElementById('formBookingMeeting').addEventListener('submit', function(e) { 
            e.preventDefault();
            const total = parseFloat(document.getElementById('bm-total-harga').textContent.replace(/[^0-9,-]+/g,"").replace(',','.'));
            if (total <= 0) {
                showToast('Total harga tidak boleh nol.', 'error');
                return;
            }
            db.meetingBookings.push({
                id: `BM-${Date.now()}`,
                tipeBooking: 'Meeting',
                pelangganId: parseInt(document.getElementById('bm-pelanggan').value),
                tanggalBooking: new Date().toISOString(),
                tanggalMulai: document.getElementById('bm-tanggal-mulai').value,
                tanggalBerakhir: document.getElementById('bm-tanggal-berakhir').value,
                jamMulai: document.getElementById('bm-jam-mulai').value,
                jamBerakhir: document.getElementById('bm-jam-berakhir').value,
                totalHarga: total,
                status: 'Baru',
                roomKey: document.getElementById('bm-tipe-ruang').value,
                createdBy: currentUser.id
            });
            saveData();
            renderAll();
            showToast('Booking meeting berhasil disimpan!');
            this.reset();
            calculateMeetingTotalPrice();
        });
        
        document.getElementById('formKamar').addEventListener('submit', function(e) {
            e.preventDefault();
            const id = document.getElementById('kamar-id').value;
            const name = document.getElementById('kamar-nama').value;
            const prices = {
                individual: parseFloat(document.getElementById('kamar-harga-individual').value),
                corporate: parseFloat(document.getElementById('kamar-harga-corporate').value),
                'travel-agent': parseFloat(document.getElementById('kamar-harga-travel').value),
                government: parseFloat(document.getElementById('kamar-harga-government').value),
            };
            const breakfastPrice = parseFloat(document.getElementById('kamar-harga-sarapan').value);
            const key = id || name.toLowerCase().replace(/\s+/g, '-');
            db.roomTypes[key] = { name, prices, breakfastPrice };
            saveData();
            renderAll();
            closeModal('kamarModal');
            showToast(`Tipe kamar ${id ? 'diperbarui' : 'ditambahkan'}!`);
        });

        document.getElementById('formMeetingRoom').addEventListener('submit', function(e) { e.preventDefault(); const id = document.getElementById('meeting-room-id').value; const name = document.getElementById('meeting-room-nama').value; const rentalPrice = parseFloat(document.getElementById('meeting-room-harga').value); const key = id || name.toLowerCase().replace(/\s+/g, '-'); db.meetingRooms[key] = { name, rentalPrice }; saveData(); renderAll(); closeModal('meetingRoomModal'); showToast(`Ruang meeting ${id ? 'diperbarui' : 'ditambahkan'}!`); });
        
        document.getElementById('formPaketMeeting').addEventListener('submit', function(e) { e.preventDefault(); const id = document.getElementById('paket-meeting-id').value; const name = document.getElementById('paket-meeting-nama').value; const price = parseFloat(document.getElementById('paket-meeting-harga').value); const key = id || name.toLowerCase().replace(/\s+/g, '-'); db.meetingPackages[key] = { name, price }; saveData(); renderAll(); closeModal('paketMeetingModal'); showToast(`Paket meeting ${id ? 'diperbarui' : 'ditambahkan'}!`); });

        document.getElementById('formAgenda').addEventListener('submit', function(e) {
            e.preventDefault();
            const id = parseInt(document.getElementById('agenda-id').value);
            const agendaData = {
                judul: document.getElementById('agenda-judul').value,
                tipe: document.getElementById('agenda-tipe').value,
                pelangganId: parseInt(document.getElementById('agenda-pelanggan').value),
                tanggal: document.getElementById('agenda-tanggal').value,
                jamMulai: document.getElementById('agenda-jam-mulai').value,
                jamSelesai: document.getElementById('agenda-jam-selesai').value,
                lokasi: document.getElementById('agenda-lokasi').value,
                catatan: document.getElementById('agenda-catatan').value,
            };
            if (id) {
                const index = db.agenda.findIndex(a => a.id === id);
                // Preserve existing status when editing
                agendaData.status = db.agenda[index].status;
                db.agenda[index] = { ...db.agenda[index], ...agendaData };
            } else {
                agendaData.id = Date.now();
                agendaData.status = 'Tentative'; // New agendas are always tentative
                db.agenda.push(agendaData);
            }
            saveData();
            renderAll();
            closeModal('agendaModal');
            showToast(`Agenda berhasil ${id ? 'diperbarui' : 'disimpan'}!`);
        });

        document.getElementById('targetForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const bulan = document.getElementById('target-bulan').value;
            const tahun = document.getElementById('target-tahun').value;
            const target = parseFloat(document.getElementById('sales-target-input').value);
            const key = `${tahun}-${bulan}`;
            db.targets[key] = target;
            saveData();
            renderAll();
            closeModal('targetModal');
            showToast(`Target untuk ${key} berhasil disimpan!`);
        });
        document.getElementById('formUser').addEventListener('submit', function(e) {
            e.preventDefault();
            const id = parseInt(document.getElementById('user-id').value);
            const name = document.getElementById('user-nama').value;
            const email = document.getElementById('user-email').value;
            const password = document.getElementById('user-password').value;
            const role = document.getElementById('user-role').value;
            
            if (id) {
                const user = db.users.find(u => u.id === id);
                if (user) {
                    user.name = name;
                    user.email = email;
                    user.role = role;
                    if (password) {
                        user.password = password;
                    }
                }
            } else {
                db.users.push({ id: Date.now(), name, email, role, password });
            }
            saveData();
            renderAll();
            closeModal('userModal');
            showToast(`User berhasil ${id ? 'diperbarui' : 'ditambahkan'}!`);
        });

        document.getElementById('formPajak').addEventListener('submit', function(e) {
            e.preventDefault();
            const newPercentage = parseFloat(document.getElementById('tax-service-percentage').value);
            if (isNaN(newPercentage) || newPercentage < 0) {
                showToast('Harap masukkan nilai persentase yang valid.', 'error');
                return;
            }
            db.settings.taxAndServicePercentage = newPercentage;
            saveData();
            renderAll();
            showToast('Pengaturan pajak & pelayanan berhasil diperbarui!');
        });
        
        document.getElementById('formInvoiceSettings').addEventListener('submit', function(e) {
            e.preventDefault();
            db.settings.invoiceSettings.logoUrl = document.getElementById('invoice-logo-url').value;
            db.settings.invoiceSettings.paymentNotes = document.getElementById('invoice-payment-notes').value;
            saveData();
            renderAll();
            showToast('Pengaturan invoice berhasil diperbarui!');
        });
        
        document.getElementById('formRoleSettings').addEventListener('submit', function(e) {
            e.preventDefault();
            const checkboxes = document.querySelectorAll('#role-settings-container input[type="checkbox"]');
            checkboxes.forEach(cb => {
                const role = cb.dataset.role;
                const page = cb.dataset.page;
                if (db.settings.rolePermissions[role]) {
                    db.settings.rolePermissions[role][page] = cb.checked;
                }
            });
            saveData();
            applyRolePermissions(currentUser.role); // Re-apply permissions for current user
            showToast('Hak akses berhasil diperbarui!');
        });

        // Dynamic Price Calculation & Room Row Listeners
        document.getElementById('formBookingKamar').addEventListener('input', (e) => {
            if (e.target.id !== 'bk-pelanggan') { // Hide buttons if user modifies form after saving
                document.getElementById('booking-actions-container').classList.add('hidden');
                lastRoomBookingId = null;
            }
            if (e.target.closest('.room-row') || e.target.id === 'bk-checkin' || e.target.id === 'bk-checkout' || e.target.id === 'bk-pelanggan') {
                calculateRoomTotalPrice();
            }
        });

        document.getElementById('add-room-row-btn').addEventListener('click', () => {
            const container = document.getElementById('room-rows-container');
            const firstRow = container.querySelector('.room-row');
            const newRow = firstRow.cloneNode(true);
            
            newRow.querySelector('select[name="bk-tipe-kamar"]').selectedIndex = 0;
            newRow.querySelector('select[name="bk-paket"]').selectedIndex = 0;
            newRow.querySelector('input[name="bk-jumlah-tamu"]').value = 1;
            newRow.querySelector('input[name="bk-jumlah-kamar"]').value = 1;
            newRow.querySelector('input[name="bk-harga-kamar-display"]').value = '-';
            
            const removeBtn = newRow.querySelector('.remove-room-row-btn');
            removeBtn.classList.remove('hidden');
            removeBtn.addEventListener('click', () => {
                newRow.remove();
                calculateRoomTotalPrice();
            });

            container.appendChild(newRow);
            lucide.createIcons();
        });

        document.getElementById('formBookingMeeting').addEventListener('input', calculateMeetingTotalPrice);

        // Geolocation Listener
        document.getElementById('get-gps-location').addEventListener('click', function() {
            const locationInput = document.getElementById('agenda-lokasi');
            if (!navigator.geolocation) {
                showToast('Geolocation tidak didukung oleh browser Anda.', 'error');
                return;
            }
            this.disabled = true;
            locationInput.value = "Mendapatkan lokasi...";
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    locationInput.value = `${lat}, ${lon}`;
                    this.disabled = false;
                },
                () => {
                    showToast('Tidak dapat mengambil lokasi. Pastikan izin lokasi telah diberikan.', 'error');
                    locationInput.value = "";
                    this.disabled = false;
                }
            );
        });

        // Settings Tab Listener
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', () => {
                document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.id === button.dataset.target ? content.classList.remove('hidden') : content.classList.add('hidden');
                });
            });
        });

        // Post-booking action buttons
        document.getElementById('print-confirmation-btn').addEventListener('click', () => {
            if (lastRoomBookingId) {
                generateConfirmationLetter(lastRoomBookingId);
            }
        });
        document.getElementById('print-invoice-btn').addEventListener('click', () => {
            if (lastRoomBookingId) {
                generateInvoice(lastRoomBookingId);
            }
        });

        document.getElementById('new-booking-btn').addEventListener('click', () => {
            document.getElementById('formBookingKamar').reset();
            const container = document.getElementById('room-rows-container');
            while (container.children.length > 1) {
                container.removeChild(container.lastChild);
            }
            container.querySelector('.remove-room-row-btn').classList.add('hidden');
            document.getElementById('booking-actions-container').classList.add('hidden');
            lastRoomBookingId = null;
            calculateRoomTotalPrice();
        });
        
        // --- SALES REPORT LOGIC ---
        document.getElementById('generate-sales-report-btn').addEventListener('click', () => {
            const startDate = document.getElementById('report-start-date').value;
            const endDate = document.getElementById('report-end-date').value;

            if (!startDate || !endDate) {
                showToast('Harap pilih tanggal mulai dan selesai.', 'error');
                return;
            }

            const start = new Date(startDate + 'T00:00:00');
            const end = new Date(endDate + 'T23:59:59');

            const allBookings = [...db.kamarBookings, ...db.meetingBookings];
            currentSalesReportData = allBookings.filter(b => {
                const bookingDate = new Date(b.tanggalBooking);
                return bookingDate >= start && bookingDate <= end;
            });

            renderSalesReportTable(currentSalesReportData);
        });

        function renderSalesReportTable(data) {
            const container = document.getElementById('sales-report-container');
            const actionsContainer = document.getElementById('sales-report-actions');
            const aiContainer = document.getElementById('ai-summary-container');

            // Hide AI summary when a new report is generated
            aiContainer.classList.add('hidden');

            if (data.length === 0) {
                container.innerHTML = getEmptyState('Tidak ada data penjualan untuk periode yang dipilih.');
                actionsContainer.classList.add('hidden');
                lucide.createIcons();
                return;
            }

            let totalRevenue = 0;
            let tableHtml = `<table class="w-full text-left">
                <thead><tr class="border-b border-[var(--border-color)]">
                    <th class="p-3">ID Booking</th>
                    <th class="p-3">Tanggal</th>
                    <th class="p-3">Pelanggan</th>
                    <th class="p-3">Tipe</th>
                    <th class="p-3">Sales</th>
                    <th class="p-3 text-right">Total</th>
                </tr></thead>
                <tbody>`;

            data.forEach(b => {
                const customer = db.pelanggan.find(p => p.id === b.pelangganId);
                const sales = db.users.find(u => u.id === b.createdBy);
                totalRevenue += b.totalHarga;

                tableHtml += `<tr class="border-b border-[var(--border-color)] hover:bg-[var(--bg-hover)]">
                    <td class="p-3">${b.id}</td>
                    <td class="p-3">${new Date(b.tanggalBooking).toLocaleDateString('id-ID')}</td>
                    <td class="p-3">${customer ? customer.nama : 'N/A'}</td>
                    <td class="p-3">${b.tipeBooking}</td>
                    <td class="p-3">${sales ? sales.name : 'N/A'}</td>
                    <td class="p-3 text-right">${formatCurrency(b.totalHarga)}</td>
                </tr>`;
            });

            tableHtml += `</tbody><tfoot>
                <tr class="border-t-2 border-[var(--border-color)] font-bold">
                    <td class="p-3" colspan="5">Total Pendapatan</td>
                    <td class="p-3 text-right">${formatCurrency(totalRevenue)}</td>
                </tr>
            </tfoot></table>`;
            
            container.innerHTML = tableHtml;
            actionsContainer.classList.remove('hidden');
            lucide.createIcons();
        }

        document.getElementById('print-sales-report-btn').addEventListener('click', () => {
            if (currentSalesReportData.length === 0) return;

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            const startDate = document.getElementById('report-start-date').value;
            const endDate = document.getElementById('report-end-date').value;

            doc.setFontSize(18);
            doc.text('Laporan Pencapaian Sales', 14, 22);
            doc.setFontSize(11);
            doc.text(`Periode: ${startDate} s/d ${endDate}`, 14, 30);

            const tableData = currentSalesReportData.map(b => {
                const customer = db.pelanggan.find(p => p.id === b.pelangganId);
                const sales = db.users.find(u => u.id === b.createdBy);
                return [
                    b.id,
                    new Date(b.tanggalBooking).toLocaleDateString('id-ID'),
                    customer ? customer.nama : 'N/A',
                    b.tipeBooking,
                    sales ? sales.name : 'N/A',
                    formatCurrency(b.totalHarga)
                ];
            });

            const totalRevenue = currentSalesReportData.reduce((sum, b) => sum + b.totalHarga, 0);
            tableData.push([
                { content: 'Total Pendapatan', colSpan: 5, styles: { fontStyle: 'bold', halign: 'right' } },
                { content: formatCurrency(totalRevenue), styles: { fontStyle: 'bold' } }
            ]);

            doc.autoTable({
                startY: 38,
                head: [['ID Booking', 'Tanggal', 'Pelanggan', 'Tipe', 'Sales', 'Total']],
                body: tableData,
                headStyles: { fillColor: [31, 41, 55] },
                footStyles: { fontStyle: 'bold' }
            });

            doc.save(`Laporan-Sales-${startDate}-to-${endDate}.pdf`);
        });

        document.getElementById('export-sales-report-btn').addEventListener('click', () => {
            if (currentSalesReportData.length === 0) return;

            const startDate = document.getElementById('report-start-date').value;
            const endDate = document.getElementById('report-end-date').value;

            const dataToExport = currentSalesReportData.map(b => {
                const customer = db.pelanggan.find(p => p.id === b.pelangganId);
                const sales = db.users.find(u => u.id === b.createdBy);
                return {
                    'ID Booking': b.id,
                    'Tanggal Booking': new Date(b.tanggalBooking).toLocaleDateString('id-ID'),
                    'Pelanggan': customer ? customer.nama : 'N/A',
                    'Perusahaan': customer ? customer.perusahaan : 'N/A',
                    'Segmentasi': customer ? customer.segmentasi : 'N/A',
                    'Tipe Booking': b.tipeBooking,
                    'Sales': sales ? sales.name : 'N/A',
                    'Total Harga': b.totalHarga
                };
            });

            const worksheet = XLSX.utils.json_to_sheet(dataToExport);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Sales');

            // Set column widths
            worksheet['!cols'] = [
                { wch: 20 }, { wch: 15 }, { wch: 25 }, { wch: 25 }, 
                { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 15 } 
            ];

            XLSX.writeFile(workbook, `Laporan-Sales-${startDate}-to-${endDate}.xlsx`);
        });

        // --- AI FEATURE LISTENERS ---
        document.getElementById('generate-ai-summary-btn').addEventListener('click', async function() {
            const aiContainer = document.getElementById('ai-summary-container');
            const aiContent = document.getElementById('ai-summary-content');
            
            aiContainer.classList.remove('hidden');
            aiContent.innerHTML = `<div class="flex items-center justify-center p-4"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)]"></div><p class="ml-4">AI sedang menganalisis data...</p></div>`;
            this.disabled = true;

            const dataForPrompt = currentSalesReportData.map(b => {
                const customer = db.pelanggan.find(p => p.id === b.pelangganId);
                const sales = db.users.find(u => u.id === b.createdBy);
                return {
                    tanggal: b.tanggalBooking.split('T')[0],
                    pelanggan: customer ? customer.nama : 'N/A',
                    segmentasi: customer ? customer.segmentasi : 'N/A',
                    tipe: b.tipeBooking,
                    sales: sales ? sales.name : 'N/A',
                    total: b.totalHarga
                };
            });

            const prompt = `Anda adalah seorang analis penjualan ahli untuk sebuah hotel. Berdasarkan data penjualan berikut dalam format JSON, berikan ringkasan performa penjualan dalam Bahasa Indonesia.
            Fokus pada:
            1. Total pendapatan dan jumlah booking.
            2. Performa penjualan oleh masing-masing sales (siapa yang paling top).
            3. Segmen pelanggan mana yang paling banyak berkontribusi.
            4. Berikan 2-3 insight atau saran yang bisa ditindaklanjuti untuk meningkatkan penjualan di periode berikutnya.
            Gunakan format ringkas dengan poin-poin (gunakan markdown untuk heading dan list).
            Data: ${JSON.stringify(dataForPrompt, null, 2)}`;

            const summary = await callGeminiAPI(prompt);
            aiContent.innerHTML = summary.replace(/\n/g, '<br>'); // Simple formatting
            aiContent.classList.add('fade-in');
            this.disabled = false;
        });

        window.openWhatsAppModal = (customerId) => {
            const customer = db.pelanggan.find(p => p.id === customerId);
            if (!customer) return;
            
            const modalTitle = document.getElementById('geminiModalTitle');
            const modalContent = document.getElementById('geminiModalContent');
            
            modalTitle.innerHTML = `<i data-lucide="sparkles" class="w-5 h-5 mr-2 text-purple-400"></i> Asisten AI`;
            modalContent.innerHTML = `
                <p class="text-sm text-[var(--text-secondary)]">Buat pesan WhatsApp untuk: <strong class="text-[var(--text-primary)]">${customer.nama}</strong></p>
                <div>
                    <label for="wa-template-select" class="block text-sm font-medium text-[var(--text-secondary)] mb-2">Pilih Template Pesan</label>
                    <select id="wa-template-select" class="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-md px-3 py-2 text-[var(--text-primary)]">
                        <option value="follow_up">Follow-up Penawaran</option>
                        <option value="promo">Promo Baru</option>
                        <option value="thank_you">Ucapan Terima Kasih (setelah menginap)</option>
                    </select>
                </div>
                <button id="generate-wa-btn" class="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold py-2 px-4 rounded-md flex items-center justify-center">
                    <i data-lucide="sparkles" class="w-4 h-4 mr-2"></i> Buat Pesan
                </button>
                <div id="wa-result-container" class="hidden">
                    <label class="block text-sm font-medium text-[var(--text-secondary)] mb-2">Hasil Pesan:</label>
                    <textarea id="wa-result-textarea" rows="6" class="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-md px-3 py-2 text-[var(--text-primary)]"></textarea>
                    <button id="copy-wa-btn" class="mt-2 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md flex items-center text-sm">
                        <i data-lucide="copy" class="w-4 h-4 mr-2"></i> Salin Pesan
                    </button>
                </div>
            `;
            lucide.createIcons();
            openModal('geminiModal');

            document.getElementById('generate-wa-btn').addEventListener('click', async function() {
                const templateSelect = document.getElementById('wa-template-select');
                const templateText = templateSelect.options[templateSelect.selectedIndex].text;
                const resultContainer = document.getElementById('wa-result-container');
                const resultTextarea = document.getElementById('wa-result-textarea');
                
                resultContainer.classList.remove('hidden');
                resultTextarea.value = "AI sedang menulis pesan...";
                this.disabled = true;

                const prompt = `Anda adalah seorang sales hotel yang ramah dan profesional bernama ${currentUser.name}. Buat sebuah pesan WhatsApp singkat untuk pelanggan bernama ${customer.nama} dari ${customer.perusahaan || 'pribadi'}.
                Tujuan pesan: ${templateText}.
                Gunakan sapaan yang sesuai (Bapak/Ibu). Sebut nama pelanggan agar terasa personal. Jaga agar pesan tetap singkat, jelas, dan ramah. Akhiri dengan nama Anda.`;

                const message = await callGeminiAPI(prompt);
                resultTextarea.value = message;
                this.disabled = false;
            });
            document.getElementById('copy-wa-btn').addEventListener('click', async function() {
                const textarea = document.getElementById('wa-result-textarea');
                try {
                    await navigator.clipboard.writeText(textarea.value);
                    showToast('Pesan berhasil disalin!');
                } catch (err) {
                    showToast('Gagal menyalin pesan.', 'error');
                    console.error('Fallback: Oops, unable to copy', err);
                }
            });
        };

        // --- INITIALIZATION ---
        function initTargetModal() {
            const bulanSelect = document.getElementById('target-bulan');
            const tahunSelect = document.getElementById('target-tahun');
            const bulanNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
            
            bulanSelect.innerHTML = '';
            bulanNames.forEach((nama, index) => {
                const monthValue = String(index + 1).padStart(2, '0');
                bulanSelect.innerHTML += `<option value="${monthValue}">${nama}</option>`;
            });

            tahunSelect.innerHTML = '';
            const currentYear = now.getFullYear();
            for (let i = currentYear - 2; i <= currentYear + 3; i++) {
                tahunSelect.innerHTML += `<option value="${i}">${i}</option>`;
            }

            bulanSelect.value = String(now.getMonth() + 1).padStart(2, '0');
            tahunSelect.value = now.getFullYear();

            function loadTargetValue() {
                const key = `${tahunSelect.value}-${bulanSelect.value}`;
                const targetInput = document.getElementById('sales-target-input');
                targetInput.value = db.targets[key] || '';
            }

            bulanSelect.addEventListener('change', loadTargetValue);
            tahunSelect.addEventListener('change', loadTargetValue);
            
            }

        loadData();
        initTargetModal();
        loadTheme();
        checkSession();
    });


async function simpanPelangganKeFirestore(pelanggan) {
  console.log("📦 Menyimpan pelanggan ke Firestore:", pelanggan);
  try {
    const ref = await firestore.collection("pelanggan").add(pelanggan);
    console.log("✅ Pelanggan berhasil disimpan dengan ID:", ref.id);
  } catch (error) {
    console.error("❌ Gagal simpan ke Firestore:", error);
  }
}


