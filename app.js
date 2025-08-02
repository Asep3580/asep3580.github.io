document.addEventListener('DOMContentLoaded', function() {
    // --- GLOBAL STATE & DATABASE ---
    let db = {};
    let currentUser = null;
    let pelangganSort = { key: 'nama', order: 'asc' };
    let agendaMap = null;
    let agendaMarker = null;
    let salesTargetChartInstance = null;
    let bookingTypeChartInstance = null;
    let segmentTargetChartInstance = null;
    let lastRoomBookingId = null;
    let currentSalesReportData = [];
    let lastMeetingBookingId = null;
    let calendar = null;
    const now = new Date('2025-07-29T11:58:00'); // Set specific date for demo consistency

    const initialDb = {
        pelanggan: [
            { id: 1, nama: 'Budi Santoso', perusahaan: 'PT. Maju Mundur', email: 'budi.s@majumundur.com', telepon: '081234567890', alamat: 'Jl. Jenderal Sudirman Kav. 52-53, Jakarta Selatan', segmentasi: 'Corporate' },
            { id: 2, nama: 'Ani Wijaya', perusahaan: '-', email: 'ani.wijaya@gmail.com', telepon: '089876543210', alamat: 'Jl. Gatot Subroto No. 12, Bandung', segmentasi: 'Individual' }
        ],
        agenda: [
            { id: 1, judul: 'Follow Up Penawaran Event', pelangganId: 1, tanggal: '2025-07-29', jamMulai: '10:00', jamSelesai: '11:00', catatan: 'Meeting di lobi', status: 'Definite', tipe: 'Visit Sales Call', lokasi: '-6.917464, 107.619125', fotoUrl: null, createdBy: 1 },
            { id: 2, judul: 'Presentasi Paket Wedding', pelangganId: 2, tanggal: '2025-07-29', jamMulai: '14:00', jamSelesai: '15:30', catatan: 'Ruang Jasmine', status: 'Tentative', tipe: 'Telemarketing', lokasi: 'Kantor Klien', fotoUrl: null, createdBy: 1 }
        ],
        kamarBookings: [
             { id: 'BK-1721800000000', tipeBooking: 'Kamar', pelangganId: 1, tanggalBooking: '2025-07-24T10:00:00.000Z', checkin: '2025-07-28', checkout: '2025-07-30', totalHarga: 5000000, status: 'Terkonfirmasi', rooms: [{type: 'deluxe', name: 'Deluxe Room', count: 1, basePrice: 1100000, package: 'breakfast', guests: 2}, {type: 'suite', name: 'Executive Suite', count: 1, basePrice: 2200000, package: 'room_only', guests: 1}], createdBy: 1, cancellationReason: null, cancelledBy: null }
        ],
        meetingBookings: [
            { id: 'BM-1721900000000', tipeBooking: 'Meeting', pelangganId: 2, tanggalBooking: '2025-07-25T11:00:00.000Z', tanggalMulai: '2025-07-29', tanggalBerakhir: '2025-07-29', jamMulai: '09:00', jamBerakhir: '17:00', totalHarga: 5445000, status: 'Terkonfirmasi', roomKey: 'jasmine', packageKey: 'fullday', jumlahPax: 10, createdBy: 1, cancellationReason: null, cancelledBy: null }
        ],
        payments: [
            { id: 1, bookingId: 'BK-1721800000000', tanggal: '2025-07-25', jumlah: 2500000, metode: 'Transfer Bank', tipe: 'DP', catatan: 'DP 50%', createdBy: 1, proofUrl: null, verified: false, verifiedBy: null, verificationNote: null }
        ],
        roomTypes: {
            "deluxe": { 
                name: "Deluxe Room", 
                prices: { individual: 1250000, corporate: 1100000, "travel-agent": 1000000, government: 1050000 },
                breakfastPrice: 150000,
                priceHistory: []
            },
            "suite": { 
                name: "Executive Suite", 
                prices: { individual: 2500000, corporate: 2200000, "travel-agent": 2000000, government: 2100000 },
                breakfastPrice: 200000,
                priceHistory: []
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
            { id: 2, name: 'Admin Hotel', email: 'gm@hotel.com', role: 'Manager', password: 'password123' },
            { id: 3, name: 'Accounting', email: 'acct@hotel.com', role: 'Accounting', password: 'password123' }
            { id: 4, name: 'Developer', email: 'dev@hotel.com', role: 'Admin', password: 'devpassword' }
        ],
        targets: {
            "2025-07": {
                overall: 200000000, // Target 200 Juta
                sales: { "1": 75000000 }, // Target 75 Juta untuk user dengan id 1 (Siti Saleha)
                segments: {
                    "Corporate": 100000000,
                    "Individual": 20000000,
                    "Travel Agent": 50000000,
                    "Government": 30000000
                }
            }
        },
        settings: {
            companyProfile: {
                name: 'CRM Hotel Anda',
                logoUrl: 'https://www.smartsalescrm.com/assets/images/logo/smart-sales-crm-software-logo.png',
                phone: '021-1234-5678',
                address: 'Jl. CRM Sejahtera No. 1, Jakarta, Indonesia'
            },
            taxAndServicePercentage: 21,
            invoiceSettings: {
                logoUrl: 'https://crm.kagum-hotel.com/images/kagum-logo.png',
                paymentNotes: 'Pembayaran dapat ditransfer ke:\nBank ABC\nNo. Rek: 123-456-7890\nA/N: PT. Hotel Sejahtera'
            },
            rolePermissions: {
                'Sales': {
                    'dashboard': true, 'kalender': true, 'pelanggan': true, 'agenda': true,
                    'booking-kamar': true, 'booking-meeting': true, 'pembayaran': true, 'laporan': true, 'laporan-sales': true,
                    'manajemen-user': false, 'manajemen-inventaris': false, 'manajemen-pengaturan': false, 'manajemen-target': false,
                    'can_verify_payment': false
                },
                'Manager': {
                    'dashboard': true, 'kalender': true, 'pelanggan': true, 'agenda': true,
                    'booking-kamar': true, 'booking-meeting': true, 'pembayaran': true, 'laporan': true, 'laporan-sales': true,
                    'manajemen-user': false, 'manajemen-inventaris': true, 'manajemen-pengaturan': true, 'manajemen-target': true,
                    'can_verify_payment': true
                },
                'Accounting': {
                    'dashboard': true, 'kalender': true, 'pelanggan': true, 'agenda': false,
                    'booking-kamar': false, 'booking-meeting': false, 'pembayaran': true, 'laporan': true, 'laporan-sales': true,
                    'manajemen-user': false, 'manajemen-inventaris': false, 'manajemen-pengaturan': false, 'manajemen-target': false,
                    'can_verify_payment': true
                },
                'Admin': {
                    'dashboard': true, 'kalender': true, 'pelanggan': true, 'agenda': true,
                    'booking-kamar': true, 'booking-meeting': true, 'pembayaran': true, 'laporan': true, 'laporan-sales': true,
                    'manajemen-user': true, 'manajemen-inventaris': true, 'manajemen-pengaturan': true, 'manajemen-target': true,
                    'can_verify_payment': true
                }
            }
        },
        agendaTypes: [
            { id: 1, name: 'Telemarketing' },
            { id: 2, name: 'Visit Sales Call' }
        ],
        notifications: []
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
        
        // --- Data Migration & Defaulting ---
        // Ensure settings object exists
        if (!db.settings) {
            db.settings = JSON.parse(JSON.stringify(initialDb.settings));
        }
        if (!db.settings.companyProfile) {
            db.settings.companyProfile = JSON.parse(JSON.stringify(initialDb.settings.companyProfile));
        }
        // Ensure nested settings objects exist
        if (!db.settings.invoiceSettings) {
            db.settings.invoiceSettings = JSON.parse(JSON.stringify(initialDb.settings.invoiceSettings));
        }
        if (!db.settings.rolePermissions) {
             db.settings.rolePermissions = JSON.parse(JSON.stringify(initialDb.settings.rolePermissions));
        } else {
            // Ensure all default roles exist in the loaded data.
            // This handles adding new roles to existing localStorage data.
            for (const role in initialDb.settings.rolePermissions) {
                if (!db.settings.rolePermissions[role]) { // If role doesn't exist, copy it entirely
                    db.settings.rolePermissions[role] = JSON.parse(JSON.stringify(initialDb.settings.rolePermissions[role]));
                } else { // If role exists, check for and add missing permission keys
                    for (const perm in initialDb.settings.rolePermissions[role]) {
                        if (db.settings.rolePermissions[role][perm] === undefined) {
                            db.settings.rolePermissions[role][perm] = initialDb.settings.rolePermissions[role][perm];
                        }
                    }
                }
            }
        }

        // Ensure other top-level arrays exist
        if (!db.payments) {
            db.payments = [];
        }
        if (!db.agendaTypes) {
            db.agendaTypes = JSON.parse(JSON.stringify(initialDb.agendaTypes));
        }
        if (!db.notifications) {
            db.notifications = [];
        }
        // Data migration for targets from old format (number) to new format (object)
        if (db.targets) {
            for (const key in db.targets) {
                // If it's an old number-based target, convert it completely.
                if (typeof db.targets[key] === 'number' || db.targets[key] === null) {
                    const oldTargetValue = db.targets[key] || 0;
                    db.targets[key] = {
                        overall: oldTargetValue * 1000000, // Assuming old value was in millions
                        sales: {},
                        segments: {}
                    };
                    continue; // Move to the next key
                }
                // For object-based targets, ensure all sub-objects exist.
                if (typeof db.targets[key] === 'object' && db.targets[key] !== null) {
                    if (typeof db.targets[key].sales === 'undefined') { db.targets[key].sales = {}; }
                    if (typeof db.targets[key].segments === 'undefined') { db.targets[key].segments = {}; }
                }
            }
        }

    }

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

        // Handle the inventory dropdown menu
        const inventarisMenuLink = document.getElementById('nav-manajemen-inventaris');
        if (inventarisMenuLink) {
            if (permissions['manajemen-inventaris']) {
                inventarisMenuLink.style.display = 'flex';
                canManage = true;
            } else {
                inventarisMenuLink.style.display = 'none';
            }
        }

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
        checkAndCreateAgendaReminders(); // Check for agenda reminders
        checkAndCreatePaymentReminders(); // Check for reminders on app load
        
        renderAll();
        renderNotifications(); // Call it here to set initial state
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
    
    function logout() {   
        sessionStorage.removeItem('loggedInUserId');
        currentUser = null;
        location.reload();
    }

    document.getElementById('sidebar-logout-button').addEventListener('click', logout);

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

    function formatCompactCurrency(number) {
        if (number >= 1_000_000_000) {
            return (number / 1_000_000_000).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' Miliar';
        }
        if (number >= 1_000_000) {
            return (number / 1_000_000).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' Juta';
        }
        if (number >= 1_000) {
            return (number / 1_000).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' Ribu';
        }
        return number.toString();
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
    
    function getAgendaTipeBadge(tipe) {
        const baseClasses = "text-xs font-semibold px-2.5 py-1 rounded-full flex items-center";
        if (!tipe) return '';
        const tipeLower = tipe.toLowerCase();

        if (tipeLower.includes('visit')) {
            return `<span class="bg-blue-500/20 text-blue-400 ${baseClasses}"><i data-lucide="map-pin" class="w-3 h-3 mr-1.5"></i>${tipe}</span>`;
        }
        if (tipeLower.includes('telemarketing') || tipeLower.includes('call')) {
            return `<span class="bg-purple-500/20 text-purple-400 ${baseClasses}"><i data-lucide="phone" class="w-3 h-3 mr-1.5"></i>${tipe}</span>`;
        }
        if (tipeLower.includes('email')) {
            return `<span class="bg-green-500/20 text-green-400 ${baseClasses}"><i data-lucide="mail" class="w-3 h-3 mr-1.5"></i>${tipe}</span>`;
        }
        // Default badge
        return `<span class="bg-gray-500/20 text-gray-400 ${baseClasses}"><i data-lucide="tag" class="w-3 h-3 mr-1.5"></i>${tipe}</span>`;
    }

    function getAgendaStatusBadge(status) {
        const baseClasses = "text-xs font-semibold px-2.5 py-1 rounded-full";
        switch (status) {
            case 'Definite': return `<span class="bg-green-500/20 text-green-400 ${baseClasses}">Definite</span>`;
            case 'Tentative': return `<span class="bg-yellow-500/20 text-yellow-400 ${baseClasses}">Tentative</span>`;
            default: return '';
        }
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
            case 'Accounting': return `<span class="bg-cyan-500/20 text-cyan-400 ${baseClasses}">Accounting</span>`;
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

    function timeAgo(date) {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " tahun lalu";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " bulan lalu";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " hari lalu";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " jam lalu";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " menit lalu";
        return "Baru saja";
    }

    function updateGlobalLogo(logoUrl) {
        const defaultLogo = 'https://www.smartsalescrm.com/assets/images/logo/smart-sales-crm-software-logo.png';
        const finalLogoUrl = logoUrl || defaultLogo;

        const loginLogo = document.getElementById('login-logo');
        const sidebarLogo = document.getElementById('sidebar-logo');

        if (loginLogo) loginLogo.src = finalLogoUrl;
        if (sidebarLogo) sidebarLogo.src = finalLogoUrl;
    }

    function updatePageTitle(companyName) {
        const baseTitle = 'CRM Hotel';
        if (companyName) {
            document.title = `${companyName} - ${baseTitle}`;
        } else {
            document.title = `${baseTitle} by Asep Suhendar`; // Fallback to original title
        }
    }

    // --- RENDER FUNCTIONS ---
    function renderAll() {
        renderPelangganTable();
        renderInventarisKamarTable();
        renderInventarisMeetingRoomTable();
        renderInventarisPaketMeetingTable();
        renderLaporanTable();
        renderPembayaranTable();
        renderAgenda();
    renderDashboardAgendaList();
        renderUserTable();
        renderSettingsForms();
        populateAllDropdowns();
        populateSalesFilterDropdown();
        populatePembayaranSalesFilter();
        updateDashboardCards();
        renderAllCharts();
        renderNotifications();
        if (calendar) {
            renderIndividualSalesTargets();
            populateCalendar();
        }
        lucide.createIcons();
    }

    function renderPelangganTable(filter = '') {
        const container = document.getElementById('pelanggan-table-container');

        // 1. Sort the data based on the global sort state
        const sortedPelanggan = [...db.pelanggan].sort((a, b) => {
            const key = pelangganSort.key;
            const order = pelangganSort.order;
            
            // Handle cases where the key might not exist or is a placeholder
            const valA = (a[key] && a[key] !== '-') ? a[key] : '';
            const valB = (b[key] && b[key] !== '-') ? b[key] : '';

            if (order === 'asc') {
                return valA.localeCompare(valB, 'id-ID', { sensitivity: 'base' });
            } else {
                return valB.localeCompare(valA, 'id-ID', { sensitivity: 'base' });
            }
        });

        // 2. Filter the sorted data
        const filteredPelanggan = sortedPelanggan.filter(p => 
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

        // 3. Helper function to create sort indicator icons
        const getSortIcon = (key) => {
            if (pelangganSort.key !== key) {
                return '<i data-lucide="arrow-up-down" class="w-3 h-3 ml-2 text-[var(--text-secondary)] opacity-50"></i>';
            }
            if (pelangganSort.order === 'asc') {
                return '<i data-lucide="arrow-up" class="w-4 h-4 ml-2 text-[var(--accent)]"></i>';
            }
            return '<i data-lucide="arrow-down" class="w-4 h-4 ml-2 text-[var(--accent)]"></i>';
        };

        // 4. Build the table with sortable headers
        let tableHtml = `<table class="w-full text-left">
                            <thead>
                                <tr class="border-b border-[var(--border-color)]">
                                    <th class="p-3 cursor-pointer hover:bg-[var(--bg-hover)] transition-colors" data-sort="nama"><div class="flex items-center">Nama ${getSortIcon('nama')}</div></th>
                                    <th class="p-3 cursor-pointer hover:bg-[var(--bg-hover)] transition-colors" data-sort="perusahaan"><div class="flex items-center">Perusahaan ${getSortIcon('perusahaan')}</div></th>
                                    <th class="p-3">Segmentasi</th>
                                    <th class="p-3">Alamat</th>
                                    <th class="p-3">Telepon</th>
                                    <th class="p-3">Aksi</th>
                                </tr>
                            </thead>
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

        // 5. Add event listeners for sorting
        container.querySelectorAll('th[data-sort]').forEach(th => {
            th.addEventListener('click', () => {
                const newKey = th.dataset.sort;
                if (pelangganSort.key === newKey) {
                    // Toggle the order if the same key is clicked
                    pelangganSort.order = pelangganSort.order === 'asc' ? 'desc' : 'asc';
                } else {
                    // Otherwise, set new key and default to 'asc'
                    pelangganSort.key = newKey;
                    pelangganSort.order = 'asc';
                }
                // Re-render the table with the new sort settings
                renderPelangganTable(document.getElementById('pelanggan-search').value);
            });
        });
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
    
    function renderInventarisKamarTable() {
        const canManage = currentUser && (currentUser.role === 'Admin' || currentUser.role === 'Manager');
        const kamarContainer = document.getElementById('inventaris-kamar-table-container');
        let kamarTableHtml = '';
        if (Object.keys(db.roomTypes).length > 0) {
            kamarTableHtml = `<div class="overflow-x-auto"><table class="w-full text-left text-sm">
                <thead>
                    <tr class="border-b border-[var(--border-color)]">
                        <th class="p-3">Tipe Kamar</th>
                        <th class="p-3 text-right">Individual</th>
                        <th class="p-3 text-right">Corporate</th>
                        <th class="p-3 text-right">Travel Agent</th>
                        <th class="p-3 text-right">Government</th>
                        <th class="p-3 text-right">Sarapan/Pax</th>
                        <th class="p-3 text-center">Aksi</th>
                    </tr>
                </thead>
                <tbody>`;
            for(const key in db.roomTypes) {
                const room = db.roomTypes[key];
                kamarTableHtml += `<tr class="border-b border-[var(--border-color)] hover:bg-[var(--bg-hover)]">
                    <td class="p-3 font-semibold">${room.name}</td>
                    <td class="p-3 text-right">${formatCurrency(room.prices.individual)}</td>
                    <td class="p-3 text-right">${formatCurrency(room.prices.corporate)}</td>
                    <td class="p-3 text-right">${formatCurrency(room.prices['travel-agent'])}</td>
                    <td class="p-3 text-right">${formatCurrency(room.prices.government)}</td>
                    <td class="p-3 text-right">${formatCurrency(room.breakfastPrice)}</td>
                    <td class="p-3 flex justify-center space-x-2">
                        <button onclick="openPriceHistoryModal('${key}')" title="Riwayat Harga" class="p-2 text-blue-400 rounded-full hover:bg-[var(--bg-hover)] transition-colors"><i data-lucide="history" class="w-4 h-4"></i></button>
                        <button onclick="openKamarModal('${key}')" title="Edit Harga" class="p-2 text-yellow-400 rounded-full hover:bg-[var(--bg-hover)] transition-colors"><i data-lucide="edit" class="w-4 h-4"></i></button>
                        ${canManage ? `<button onclick="confirmDelete('kamar', '${key}')" title="Hapus Tipe Kamar" class="p-2 text-red-500 rounded-full hover:bg-[var(--bg-hover)] transition-colors"><i data-lucide="trash-2" class="w-4 h-4"></i></button>` : ''}
                    </td>
                </tr>`;
            }
            kamarTableHtml += `</tbody></table></div>`;
        } else {
            kamarTableHtml = getEmptyState('Belum ada tipe kamar yang ditambahkan.');
        }
        kamarContainer.innerHTML = kamarTableHtml;
        lucide.createIcons();
    }

    function renderInventarisMeetingRoomTable() {
        const canManage = currentUser && (currentUser.role === 'Admin' || currentUser.role === 'Manager');
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
        lucide.createIcons();
    }

    function renderInventarisPaketMeetingTable() {
        const canManage = currentUser && (currentUser.role === 'Admin' || currentUser.role === 'Manager');
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
            // Also clear the totals if no data
            document.getElementById('laporan-total-pendapatan').textContent = formatCurrency(0);
            document.getElementById('laporan-total-dibayar').textContent = formatCurrency(0);
            document.getElementById('laporan-total-sisa').textContent = formatCurrency(0);
            lucide.createIcons();
            return;
        }

        // Calculate totals based on filtered bookings
        let totalPendapatan = 0;
        let totalDibayar = 0;
        let totalSisa = 0;

        filteredBookings.forEach(b => {
            totalPendapatan += b.totalHarga;
            const paymentInfo = getPaymentInfo(b.id);
            totalDibayar += paymentInfo.totalVerifiedPaid;
            totalSisa += paymentInfo.balance;
        });

        // Render totals
        document.getElementById('laporan-total-pendapatan').textContent = formatCurrency(totalPendapatan);
        document.getElementById('laporan-total-dibayar').textContent = formatCurrency(totalDibayar);
        document.getElementById('laporan-total-sisa').textContent = formatCurrency(totalSisa);

        const canManage = currentUser && (currentUser.role === 'Admin' || currentUser.role === 'Manager');
        let tableHtml = `<table class="w-full text-left text-sm">
                            <thead>
                                <tr class="border-b border-[var(--border-color)]">
                                    <th class="p-3">ID Booking</th>
                                    <th class="p-3">Pelanggan</th>
                                    <th class="p-3">Sales</th>
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
            const sales = db.users.find(u => u.id === b.createdBy);
            const paymentInfo = getPaymentInfo(b.id);
            const paymentStatus = getPaymentStatus(b, paymentInfo.totalVerifiedPaid);

            let aksiHtml = '';
            if (b.status === 'Batal') {
                const cancelledByUser = db.users.find(u => u.id === b.cancelledBy);
                const reasonText = b.cancellationReason || 'Tidak ada alasan';
                const cancelledByText = cancelledByUser ? `oleh ${cancelledByUser.name}` : '';
                aksiHtml = `<span class="text-red-400 text-xs italic flex items-center" title="Dibatalkan ${cancelledByText}. Alasan: ${reasonText}">
                                <i data-lucide="x-circle" class="w-4 h-4 mr-1"></i> Dibatalkan
                            </span>`;
            } else {
                aksiHtml = `<button onclick="generateInvoice('${b.id}')" title="Cetak Invoice" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 text-xs rounded-md flex items-center"><i data-lucide="receipt" class="w-4 h-4 mr-1"></i> Invoice</button>
                            <button onclick="openCancellationModal('${b.id}')" title="Batalkan Booking" class="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-1 px-3 text-xs rounded-md flex items-center"><i data-lucide="ban" class="w-4 h-4 mr-1"></i> Batalkan</button>`;
            }

            tableHtml += `<tr class="border-b border-[var(--border-color)] hover:bg-[var(--bg-hover)]">
                <td class="p-3 font-mono">${b.id}</td>
                <td class="p-3">${pelanggan ? pelanggan.nama : 'N/A'}</td>
                <td class="p-3">${sales ? sales.name : 'N/A'}</td>
                <td class="p-3">${formatCurrency(b.totalHarga)}</td>
                <td class="p-3 text-green-500">${formatCurrency(paymentInfo.totalVerifiedPaid)}</td>
                <td class="p-3 text-red-500">${formatCurrency(paymentInfo.balance)}</td>
                <td class="p-3">${getPaymentStatusBadge(paymentStatus)}</td>
                <td class="p-3 flex flex-wrap gap-1">${aksiHtml}</td>
            </tr>`;
        });
        tableHtml += `</tbody></table>`;
        container.innerHTML = tableHtml;
        lucide.createIcons();
    }

    function renderPembayaranTable(filter = '', salesId = 'all') {
        const container = document.getElementById('pembayaran-table-container');
        const allBookings = [...db.kamarBookings, ...db.meetingBookings];

        // Filter for bookings with outstanding balance
        let bookingsWithBalance = allBookings.filter(b => {
            const paymentInfo = getPaymentInfo(b.id);
            // Also filter out cancelled bookings from piutang
            return paymentInfo.balance > 0 && b.status !== 'Batal';
        }).sort((a, b) => new Date(b.tanggalBooking) - new Date(a.tanggalBooking));

        // Calculate and render summary totals from the full piutang list
        const totalTagihanPiutang = bookingsWithBalance.reduce((sum, b) => sum + b.totalHarga, 0);
        const totalSisaPiutang = bookingsWithBalance.reduce((sum, b) => sum + getPaymentInfo(b.id).balance, 0);
        const totalTransaksiPiutang = bookingsWithBalance.length;

        document.getElementById('pembayaran-total-tagihan').textContent = formatCurrency(totalTagihanPiutang);
        document.getElementById('pembayaran-total-sisa').textContent = formatCurrency(totalSisaPiutang);
        document.getElementById('pembayaran-total-transaksi').textContent = totalTransaksiPiutang;
        
        // Apply search filter
        if (filter) {
            bookingsWithBalance = bookingsWithBalance.filter(b => {
                const customer = db.pelanggan.find(p => p.id === b.pelangganId);
                const sales = db.users.find(u => u.id === b.createdBy);
                return b.id.toLowerCase().includes(filter.toLowerCase()) ||
                       (customer && customer.nama.toLowerCase().includes(filter.toLowerCase())) ||
                       (sales && sales.name.toLowerCase().includes(filter.toLowerCase()));
            });
        }

        // Apply sales filter
        if (salesId !== 'all') {
            const numericSalesId = parseInt(salesId);
            bookingsWithBalance = bookingsWithBalance.filter(b => b.createdBy === numericSalesId);
        }

        if (bookingsWithBalance.length === 0) {
            container.innerHTML = getEmptyState(filter || salesId !== 'all' ? 'Tidak ada piutang yang cocok dengan filter.' : 'Tidak ada piutang saat ini.');
            lucide.createIcons();
            return;
        }

        let tableHtml = `<table class="w-full text-left text-sm">
                            <thead>
                                <tr class="border-b border-[var(--border-color)]">
                                    <th class="p-3">ID Booking</th>
                                    <th class="p-3">Pelanggan</th>
                                    <th class="p-3">Sales</th>
                                    <th class="p-3">Tanggal Event</th>
                                    <th class="p-3">Total Tagihan</th>
                                    <th class="p-3">Sisa Tagihan</th>
                                    <th class="p-3">Status Bayar</th>
                                    <th class="p-3">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>`;

        bookingsWithBalance.forEach(b => {
            const pelanggan = db.pelanggan.find(p => p.id === b.pelangganId);
            const sales = db.users.find(u => u.id === b.createdBy);
            const paymentInfo = getPaymentInfo(b.id);
            const paymentStatus = getPaymentStatus(b, paymentInfo.totalVerifiedPaid);

            const eventDate = b.tipeBooking === 'Kamar' ? b.checkin : b.tanggalMulai;
            const formattedEventDate = new Date(eventDate + 'T00:00:00').toLocaleDateString('id-ID', {
                day: '2-digit', month: 'short', year: 'numeric'
            });

            const hasUnverifiedPayments = paymentInfo.payments.some(p => !p.verified);
            const canVerify = db.settings.rolePermissions[currentUser.role]?.can_verify_payment;
            let verificationButton = '';
            if (hasUnverifiedPayments && canVerify) {
                verificationButton = `<button onclick="openVerificationModal('${b.id}')" title="Verifikasi Pembayaran" class="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-1 px-3 text-xs rounded-md flex items-center">
                    <i data-lucide="shield-check" class="w-4 h-4 mr-1"></i> Verifikasi
                </button>`;
            }

            // Check for payments with proof
            const paymentsWithProof = paymentInfo.payments.filter(p => p.proofUrl);
            let viewProofButton = '';
            if (paymentsWithProof.length > 0) {
                // Just show a button for the latest proof for simplicity
                const latestPaymentWithProof = paymentsWithProof.sort((a, b) => b.id - a.id)[0];
                viewProofButton = `<button onclick="openProofModal(${latestPaymentWithProof.id})" title="Lihat Bukti Bayar" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 text-xs rounded-md flex items-center">
                    <i data-lucide="image" class="w-4 h-4 mr-1"></i> Bukti
                </button>`;
            }

            tableHtml += `<tr class="border-b border-[var(--border-color)] hover:bg-[var(--bg-hover)]" data-booking-id="${b.id}">
                <td class="p-3 font-mono">${b.id}</td>
                <td class="p-3">${pelanggan ? pelanggan.nama : 'N/A'}</td>
                <td class="p-3">${sales ? sales.name : 'N/A'}</td>
                <td class="p-3">${formattedEventDate}</td>
                <td class="p-3">${formatCurrency(b.totalHarga)}</td>
                <td class="p-3 font-bold text-red-500">${formatCurrency(paymentInfo.balance)}</td>
                <td class="p-3">${getPaymentStatusBadge(paymentStatus)}</td>
                <td class="p-3 flex space-x-1">
                    <button onclick="openPaymentModal('${b.id}')" title="Input Pembayaran" class="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 text-xs rounded-md flex items-center">
                        <i data-lucide="dollar-sign" class="w-4 h-4 mr-1"></i> Bayar
                    </button>
                    ${verificationButton}
                    ${viewProofButton}
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

            let fotoHtml = '';
            if (item.fotoUrl) {
                fotoHtml = `<button onclick="openAgendaPhotoModal(${item.id})" class="mt-2 text-xs text-blue-400 hover:underline flex items-center"><i data-lucide="camera" class="w-3 h-3 mr-1"></i>Lihat Foto</button>`;
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

            const cardHtml = `<div class="bg-[var(--bg-tertiary)]/50 p-4 rounded-lg flex items-start justify-between" data-agenda-id="${item.id}">
                <div>
                    <div class="flex items-center gap-2">${getAgendaTipeBadge(item.tipe)}${getAgendaStatusBadge(item.status)}</div>
                    <p class="font-semibold text-[var(--text-primary)] mt-2">${item.judul}</p>
                    <p class="text-sm text-[var(--text-secondary)]">Dengan: ${pelanggan ? pelanggan.nama : 'N/A'}</p>
                    <p class="text-sm text-[var(--text-secondary)]">${new Date(item.tanggal + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} | ${item.jamMulai} - ${item.jamSelesai}</p>
                    <div class="mt-2">${lokasiHtml}</div>
                    <p class="text-xs text-gray-500 mt-1">${item.catatan || ''}</p>
                    ${fotoHtml}
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

    function renderDashboardAgendaList() {
        const container = document.getElementById('dashboard-agenda-list');
        if (!container) return;

        const todayString = now.toISOString().split('T')[0];
        const tomorrow = new Date(now);
        tomorrow.setDate(now.getDate() + 1);
        const tomorrowString = tomorrow.toISOString().split('T')[0];

        const priorityAgendas = db.agenda
            .filter(a => (a.tanggal === todayString || a.tanggal === tomorrowString) && a.status !== 'selesai')
            .sort((a, b) => {
                const dateA = new Date(`${a.tanggal}T${a.jamMulai}`);
                const dateB = new Date(`${b.tanggal}T${b.jamMulai}`);
                return dateA - dateB;
            });

        if (priorityAgendas.length === 0) {
            container.innerHTML = getEmptyState('Tidak ada agenda prioritas untuk hari ini atau besok.');
            lucide.createIcons();
            return;
        }

        let html = '';
        priorityAgendas.forEach(item => {
            const pelanggan = db.pelanggan.find(p => p.id === item.pelangganId);
            const isToday = item.tanggal === todayString;

            html += `
                <div class="p-3 rounded-md bg-[var(--bg-tertiary)]/60 border-l-4 ${isToday ? 'border-[var(--accent-blue)]' : 'border-[var(--accent-yellow)]'}">
                    <p class="font-semibold text-sm truncate">${item.judul}</p>
                    <div class="flex justify-between items-center text-xs text-[var(--text-secondary)] mt-1">
                        <span><i data-lucide="user" class="w-3 h-3 inline-block mr-1"></i>${pelanggan ? pelanggan.nama : 'N/A'}</span>
                        <span><i data-lucide="clock" class="w-3 h-3 inline-block mr-1"></i>${item.jamMulai}</span>
                    </div>
                </div>`;
        });
        container.innerHTML = html;
        lucide.createIcons();
    }

    function populateAllDropdowns() {
        const pelangganDropdowns = document.querySelectorAll('#bk-pelanggan, #bm-pelanggan, #agenda-pelanggan');
        pelangganDropdowns.forEach(d => { d.innerHTML = '<option value="">-- Pilih --</option>'; db.pelanggan.forEach(p => { d.innerHTML += `<option value="${p.id}">${p.nama} ${p.perusahaan !== '-' ? `(${p.perusahaan})` : ''}</option>`; }); });
        
        populateAgendaTypeDropdown();

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

    function populatePembayaranSalesFilter() {
        const salesFilterDropdown = document.getElementById('pembayaran-sales-filter');
        if (!salesFilterDropdown) return;

        salesFilterDropdown.innerHTML = '<option value="all">Semua Sales</option>';
        const salesUsers = db.users.filter(u => u.role === 'Sales');

        salesUsers.forEach(user => {
            salesFilterDropdown.innerHTML += `<option value="${user.id}">${user.name}</option>`;
        });
    }

    function populateAgendaTypeDropdown() {
        const agendaTipeDropdown = document.getElementById('agenda-tipe');
        if (!agendaTipeDropdown) return;
        agendaTipeDropdown.innerHTML = '<option value="">-- Pilih Tipe --</option>';
        if (db.agendaTypes) {
            db.agendaTypes.forEach(type => {
                agendaTipeDropdown.innerHTML += `<option value="${type.name}">${type.name}</option>`;
            });
        }
    }

    function populateRoomTypeDropdown(selectElement) {
        selectElement.innerHTML = '<option value="">-- Pilih --</option>';
        for (const key in db.roomTypes) { selectElement.innerHTML += `<option value="${key}">${db.roomTypes[key].name}</option>`; }
    }
    
    function populateSalesFilterDropdown() {
        const salesFilterDropdown = document.getElementById('report-sales-filter');
        if (!salesFilterDropdown) return;

        salesFilterDropdown.innerHTML = '<option value="all">Semua Sales</option>';
        const salesUsers = db.users.filter(u => u.role === 'Sales');

        salesUsers.forEach(user => {
            salesFilterDropdown.innerHTML += `<option value="${user.id}">${user.name}</option>`;
        });
    }

    function renderSettingsForms() {
        document.getElementById('tax-service-percentage').value = db.settings.taxAndServicePercentage;
        document.getElementById('invoice-payment-notes').value = db.settings.invoiceSettings.paymentNotes;
        renderCompanyProfileSettings();
        renderRoleSettings();
        renderAgendaTypeTable();
    }

    function renderCompanyProfileSettings() {
        const profile = db.settings.companyProfile;
        if (profile) {
            document.getElementById('profil-nama').value = profile.name || '';
            document.getElementById('profil-telepon').value = profile.phone || '';
            document.getElementById('profil-alamat').value = profile.address || '';
            const logoPreview = document.getElementById('profil-logo-preview');
            logoPreview.src = profile.logoUrl || 'https://placehold.co/200x60/cccccc/ffffff?text=Logo';
        }
    }

    function renderRoleSettings() {
        const container = document.getElementById('role-settings-container');
        const permissions = db.settings.rolePermissions;
        const pageNames = {
            'dashboard': 'Dashboard', 'kalender': 'Kalender', 'pelanggan': 'Pelanggan', 'agenda': 'Agenda Meeting',
            'booking-kamar': 'Booking Kamar', 'booking-meeting': 'Booking Ruang Meeting', 'pembayaran': 'Pembayaran', 'laporan': 'Laporan & Invoice',
            'laporan-sales': 'Laporan Sales', 'manajemen-user': 'Manajemen User', 'manajemen-target': 'Manajemen Target', 'manajemen-inventaris': 'Manajemen Inventaris',
            'manajemen-pengaturan': 'Pengaturan',
            // Action Permissions
            'can_verify_payment': 'Verifikasi Pembayaran'
        };

        let html = '';
        for (const role in permissions) {
            html += `<div class="p-4 border border-[var(--border-color)] rounded-lg">
                        <h4 class="text-lg font-semibold mb-4">${role}</h4>`;
            
            // Page Access Section
            html += `<p class="text-sm font-semibold text-[var(--text-secondary)] mb-2">Akses Halaman</p>
                     <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-3 mb-4 border-b border-[var(--border-color)] pb-4">`;
            for (const page in permissions[role]) {
                if (page.startsWith('can_')) continue; // Skip action permissions
                const isChecked = permissions[role][page];
                const isDisabled = role === 'Admin' ? 'disabled' : '';
                html += `<label class="flex items-center space-x-2">
                            <input type="checkbox" data-role="${role}" data-page="${page}" ${isChecked ? 'checked' : ''} ${isDisabled}
                                class="h-4 w-4 rounded border-gray-300 text-[var(--accent)] focus:ring-[var(--accent)]">
                            <span class="text-sm text-[var(--text-primary)]">${pageNames[page] || page}</span>
                         </label>`;
            }
            html += `</div>`;

            // Action Permissions Section
            html += `<p class="text-sm font-semibold text-[var(--text-secondary)] mb-2">Hak Aksi Spesifik</p>
                     <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-3">`;
            for (const page in permissions[role]) {
                if (!page.startsWith('can_')) continue; // Only show action permissions
                const isChecked = permissions[role][page];
                const isDisabled = role === 'Admin' ? 'disabled' : '';
                html += `<label class="flex items-center space-x-2">
                            <input type="checkbox" data-role="${role}" data-page="${page}" ${isChecked ? 'checked' : ''} ${isDisabled}
                                class="h-4 w-4 rounded border-gray-300 text-[var(--accent)] focus:ring-[var(--accent)]">
                            <span class="text-sm text-[var(--text-primary)]">${pageNames[page] || page}</span>
                         </label>`;
            }
            html += `</div></div>`; // Close grid and role container
        }
        container.innerHTML = html;
    }

    function renderAgendaTypeTable() {
        const container = document.getElementById('pengaturan-agenda-table-container');
        const canManage = currentUser && (currentUser.role === 'Admin' || currentUser.role === 'Manager');

        if (!db.agendaTypes || db.agendaTypes.length === 0) {
            container.innerHTML = getEmptyState('Belum ada tipe agenda yang ditambahkan.');
            lucide.createIcons();
            return;
        }

        let tableHtml = `<table class="w-full text-left">
                            <thead>
                                <tr class="border-b border-[var(--border-color)]">
                                    <th class="p-3">Nama Tipe Agenda</th>
                                    <th class="p-3 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>`;

        db.agendaTypes.forEach(type => {
            tableHtml += `<tr class="border-b border-[var(--border-color)] hover:bg-[var(--bg-hover)]">
                <td class="p-3">${type.name}</td>
                <td class="p-3 flex justify-center space-x-2">
                    <button onclick="openAgendaTypeModal(${type.id})" title="Edit Tipe" class="p-2 text-yellow-400 hover:text-yellow-300 rounded-full hover:bg-[var(--bg-hover)] transition-colors"><i data-lucide="edit" class="w-4 h-4"></i></button>
                    ${canManage ? `<button onclick="confirmDelete('agendaType', ${type.id})" title="Hapus Tipe" class="p-2 text-red-500 hover:text-red-400 rounded-full hover:bg-[var(--bg-hover)] transition-colors"><i data-lucide="trash-2" class="w-4 h-4"></i></button>` : ''}
                </td>
            </tr>`;
        });
        tableHtml += `</tbody></table>`;
        container.innerHTML = tableHtml;
        lucide.createIcons();
    }

    function checkAndCreateAgendaReminders() {
        const todayString = now.toISOString().split('T')[0];
        const todaysAgendas = db.agenda.filter(a => a.tanggal === todayString && a.status !== 'selesai');

        todaysAgendas.forEach(agenda => {
            // Periksa apakah pengingat untuk agenda ini sudah ada
            const reminderExists = db.notifications.some(n =>
                n.type === 'agenda_reminder' && n.targetId === agenda.id
            );

            if (!reminderExists) {
                createNotification(
                    `Agenda hari ini: ${agenda.judul} pada jam ${agenda.jamMulai}.`,
                    'agenda_reminder',
                    agenda.id
                );
            }
        });
    }

    function checkAndCreatePaymentReminders() {
        const allBookings = [...db.kamarBookings, ...db.meetingBookings];
        const reminderThresholdDays = 3; // Ingatkan 3 hari sebelum jatuh tempo

        allBookings.forEach(booking => {
            const paymentInfo = getPaymentInfo(booking.id);
            // Hanya buat pengingat untuk booking yang memiliki sisa tagihan dan tidak dibatalkan
            if (paymentInfo.balance <= 0 || booking.status === 'Batal') {
                return;
            }

            const dueDate = new Date((booking.tipeBooking === 'Kamar' ? booking.checkin : booking.tanggalMulai) + 'T00:00:00');
            const timeDiff = dueDate.getTime() - now.getTime();
            const daysUntilDue = Math.ceil(timeDiff / (1000 * 3600 * 24));

            if (daysUntilDue > 0 && daysUntilDue <= reminderThresholdDays) {
                // Periksa apakah pengingat untuk booking ini sudah ada
                const reminderExists = db.notifications.some(n =>
                    n.type === 'payment_reminder' && n.targetId === booking.id
                );

                if (!reminderExists) {
                    const formattedDueDate = dueDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
                    const customer = db.pelanggan.find(p => p.id === booking.pelangganId);
                    const customerName = customer ? customer.nama : `Booking ID ${booking.id}`;
                    
                    createNotification(
                        `Pembayaran untuk ${customerName} jatuh tempo pada ${formattedDueDate}.`,
                        'payment_reminder',
                        booking.id
                    );
                }
            }
        });
    }

    function createNotification(message, type, targetId) {
        const newNotification = {
            id: Date.now(),
            message: message,
            type: type, // 'verification', 'payment_reminder', atau 'agenda_reminder'
            targetId: targetId,
            timestamp: new Date().toISOString(),
            readBy: []
        };
        db.notifications.push(newNotification);
    }

    function renderNotifications() {
        const container = document.getElementById('notification-container');
        const list = document.getElementById('notification-list');
        const badge = document.getElementById('notification-badge');

        if (!currentUser || (currentUser.role !== 'Admin' && currentUser.role !== 'Manager')) {
            container.classList.add('hidden');
            return;
        }
        container.classList.remove('hidden');

        const unreadNotifications = db.notifications.filter(n => !n.readBy.includes(currentUser.id));

        badge.classList.toggle('hidden', unreadNotifications.length === 0);

        list.innerHTML = '';
        if (unreadNotifications.length === 0) {
            list.innerHTML = `<p class="p-4 text-sm text-center text-[var(--text-secondary)]">Tidak ada notifikasi baru.</p>`;
        } else {
            [...unreadNotifications].reverse().forEach(n => {
                list.innerHTML += `
                    <a href="#" class="notification-item block p-3 hover:bg-[var(--bg-hover)] border-b border-[var(--border-color)] cursor-pointer" data-id="${n.id}" data-target-id="${n.targetId}" data-type="${n.type}">
                        <p class="text-sm">${n.message}</p>
                        <p class="text-xs text-[var(--text-secondary)] mt-1">${timeAgo(n.timestamp)}</p>
                    </a>`;
            });
        }
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
        document.getElementById('dashboard-pendapatan').textContent = formatCompactCurrency(totalPendapatan);
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
        document.getElementById('dashboard-piutang').textContent = formatCompactCurrency(totalPiutang);
    }

    // --- CHART LOGIC ---
    function renderAllCharts() {
        renderSalesTargetChart();
        renderSegmentTargetChart();
        renderBookingTypeChart();
    }

    function renderSalesTargetChart() {
        const ctx = document.getElementById('salesTargetChart')?.getContext('2d');
        if (!ctx) return;

        // Custom plugin to draw text in the center of the gauge, behind the datasets.
        const gaugeText = {
            id: 'gaugeText',
            beforeDatasetsDraw(chart, args, options) {
                const { ctx, chartArea: { top, bottom, left, right, width, height } } = chart;
                ctx.save();
                const value = chart.data.datasets[0].data[0];
                const target = chart.data.datasets[0].data[0] + chart.data.datasets[0].data[1];
                const percentage = target > 0 ? ((value / target) * 100).toFixed(1) : 0;

                // Percentage Text
                ctx.font = `bold ${width / 8}px sans-serif`;
                ctx.fillStyle = options.textColor;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const x = width / 2 + left;
                const y = height + top - (height / 4);
                ctx.fillText(`${percentage}%`, x, y);

                // "Pencapaian" Text
                ctx.font = `normal ${width / 15}px sans-serif`;
                ctx.fillStyle = options.secondaryColor;
                ctx.fillText('Pencapaian', x, y - (width / 9));
                ctx.restore();
            }
        };

        if (salesTargetChartInstance) {
            salesTargetChartInstance.destroy();
        }

        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        const targetKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
        const bookingsBulanIni = [...db.kamarBookings, ...db.meetingBookings].filter(b => new Date(b.tanggalBooking).getMonth() === currentMonth && new Date(b.tanggalBooking).getFullYear() === currentYear);
        const totalPendapatan = bookingsBulanIni.reduce((sum, b) => sum + b.totalHarga, 0);        
        const targetAmount = db.targets[targetKey]?.overall || 0;
        const sisaTarget = Math.max(0, targetAmount - totalPendapatan);

        const style = getComputedStyle(document.documentElement);
        const accentColor = style.getPropertyValue('--accent');
        const textColor = style.getPropertyValue('--text-primary');
        const secondaryTextColor = style.getPropertyValue('--text-secondary');
        // Make the 'Sisa Target' track color slightly visible for better animation feel
        const sisaTargetColor = style.getPropertyValue('--border-color');
        
        document.getElementById('sales-target-display').textContent = targetAmount > 0 ? `(Target: ${formatCurrency(targetAmount)})` : `(Target Belum Diatur)`;

        salesTargetChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Pencapaian', 'Sisa Target'],
                datasets: [{
                    // Add a tiny value if sisaTarget is 0 to ensure the gauge shape is maintained
                    data: [totalPendapatan, sisaTarget > 0 ? sisaTarget : 0.00001],
                    backgroundColor: [accentColor, sisaTargetColor],
                    borderColor: style.getPropertyValue('--bg-secondary'),
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                rotation: -90,
                circumference: 180,
                cutout: '75%',
                animation: {
                    duration: 1200,
                    easing: 'easeInOutCubic'
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        enabled: true, // Re-enable tooltip for interactivity
                        callbacks: {
                            label: function(context) {
                                // Hide tooltip for the tiny fake segment if target is met/exceeded
                                if (context.label === 'Sisa Target' && context.raw < 1) return null;
                                return `${context.label}: ${formatCurrency(context.raw)}`;
                            }
                        }
                    },
                    gaugeText: { textColor: textColor, secondaryColor: secondaryTextColor }
                }
            },
            plugins: [gaugeText]
        });
    }

    function renderSegmentTargetChart() {
        const ctx = document.getElementById('segmentTargetChart')?.getContext('2d');
        if (!ctx) return;

        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        const targetKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
        
        const segmentTargets = db.targets[targetKey]?.segments || {};
        const segments = ['Corporate', 'Individual', 'Travel Agent', 'Government'];

        // Calculate actual achievements per segment
        const segmentAchievements = { 'Corporate': 0, 'Individual': 0, 'Travel Agent': 0, 'Government': 0 };
        const bookingsBulanIni = [...db.kamarBookings, ...db.meetingBookings].filter(b => {
            const bookingDate = new Date(b.tanggalBooking);
            return bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear;
        });
        bookingsBulanIni.forEach(booking => {
            const customer = db.pelanggan.find(p => p.id === booking.pelangganId);
            if (customer && segmentAchievements.hasOwnProperty(customer.segmentasi)) {
                segmentAchievements[customer.segmentasi] += booking.totalHarga;
            }
        });

        const style = getComputedStyle(document.documentElement);
        const accentColor = style.getPropertyValue('--accent');
        const textColor = style.getPropertyValue('--text-primary');
        const gridColor = style.getPropertyValue('--border-color');
        const targetColor = style.getPropertyValue('--bg-tertiary');

        if (segmentTargetChartInstance) {
            segmentTargetChartInstance.destroy();
        }

        segmentTargetChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: segments,
                datasets: [
                    { label: 'Pencapaian', data: segments.map(s => segmentAchievements[s]), backgroundColor: accentColor, borderRadius: 4 },
                    { label: 'Target', data: segments.map(s => segmentTargets[s] || 0), backgroundColor: targetColor, borderRadius: 4 }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, ticks: { color: textColor }, grid: { color: gridColor } },
                    x: { ticks: { color: textColor }, grid: { display: false } }
                },
                plugins: {
                    legend: { position: 'bottom', labels: { color: textColor } },
                    tooltip: {
                        callbacks: {
                            label: (context) => `${context.dataset.label}: ${formatCurrency(context.raw)}`
                        }
                    }
                }
            }
        });
    }

    function renderBookingTypeChart() {
        const ctx = document.getElementById('bookingTypeChart')?.getContext('2d');
        if (!ctx) return;

        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        const roomBookingsRevenue = db.kamarBookings.filter(b => {
            const bookingDate = new Date(b.tanggalBooking);
            return bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear;
        }).reduce((sum, b) => sum + b.totalHarga, 0);

        const meetingBookingsRevenue = db.meetingBookings.filter(b => {
            const bookingDate = new Date(b.tanggalBooking);
            return bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear;
        }).reduce((sum, b) => sum + b.totalHarga, 0);

        const style = getComputedStyle(document.documentElement);
        const textColor = style.getPropertyValue('--text-primary');
        const color1 = style.getPropertyValue('--accent-blue');
        const color2 = style.getPropertyValue('--accent-green');
        const borderColor = style.getPropertyValue('--bg-secondary');

        if (bookingTypeChartInstance) {
            bookingTypeChartInstance.destroy();
        }

        bookingTypeChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Booking Kamar', 'Booking Meeting'],
                datasets: [{
                    data: [roomBookingsRevenue, meetingBookingsRevenue],
                    backgroundColor: [color1, color2],
                    borderColor: borderColor,
                    borderWidth: 4,
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: textColor, padding: 20, font: { size: 14 } }
                    },
                    tooltip: {
                        callbacks: { label: (context) => `${context.label}: ${formatCurrency(context.raw)}` }
                    }
                }
            }
        });
    }

    function renderIndividualSalesTargets() {
        const container = document.getElementById('individual-sales-targets');
        if (!container) return;

        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        const targetKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
        
        const monthlyTargets = db.targets[targetKey]?.sales || {};
        const salesUsers = db.users.filter(u => u.role === 'Sales');

        if (salesUsers.length === 0) {
            container.innerHTML = getEmptyState('Tidak ada user dengan role "Sales".');
            lucide.createIcons();
            return;
        }

        // Pre-calculate sales per person for the current month
        const salesAchievements = {};
        const bookingsBulanIni = [...db.kamarBookings, ...db.meetingBookings].filter(b => {
            const bookingDate = new Date(b.tanggalBooking);
            return bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear;
        });
        bookingsBulanIni.forEach(booking => {
            if (!salesAchievements[booking.createdBy]) {
                salesAchievements[booking.createdBy] = 0;
            }
            salesAchievements[booking.createdBy] += booking.totalHarga;
        });

        let html = `<h3 class="text-lg font-semibold mb-4">Pencapaian Target Sales Individual (Bulan Ini)</h3><div class="space-y-4">`;

        salesUsers.forEach(user => {
            const target = monthlyTargets[user.id] || 0;
            const achievement = salesAchievements[user.id] || 0;
            const percentage = target > 0 ? (achievement / target) * 100 : 0;

            html += `
                <div>
                    <div class="flex justify-between items-center mb-1 text-sm">
                        <span class="font-semibold">${user.name}</span>
                        <span class="text-[var(--text-secondary)]">${formatCurrency(achievement)} / <span class="font-medium text-[var(--text-primary)]">${formatCurrency(target)}</span></span>
                    </div>
                    <div class="w-full bg-[var(--bg-tertiary)] rounded-full h-2.5">
                        <div class="bg-[var(--accent)] h-2.5 rounded-full" style="width: ${Math.min(percentage, 100)}%"></div>
                    </div>
                </div>
            `;
        });

        html += `</div>`;
        container.innerHTML = html;
    }

    // --- CALENDAR LOGIC ---
    function initializeCalendar() {
        const calendarEl = document.getElementById('calendar-container');
        if (!calendarEl) return;

        calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'timeGridWeek',
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
        if (!booking) return { totalPaid: 0, totalVerifiedPaid: 0, balance: 0, payments: [] };

        const paymentsForBooking = db.payments.filter(p => p.bookingId === bookingId);
        const totalPaid = paymentsForBooking.reduce((sum, p) => sum + p.jumlah, 0);
        const totalVerifiedPaid = paymentsForBooking
            .filter(p => p.verified)
            .reduce((sum, p) => sum + p.jumlah, 0);
        
        // Balance is now calculated against verified payments
        const balance = booking.totalHarga - totalVerifiedPaid;

        return { totalPaid, totalVerifiedPaid, balance: balance > 0.01 ? balance : 0, payments: paymentsForBooking };
    }

    function getPaymentStatus(booking, totalVerifiedPaid) {
        if (booking.status === 'Batal') return 'Batal';
        
        // The balance is now correctly calculated against verified payments
        const balance = booking.totalHarga - totalVerifiedPaid;
        if (balance <= 0.01) return 'Lunas'; // Based on verified payments
        if (totalVerifiedPaid > 0) return 'Menunggu Pelunasan';
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
                // Cleanup map on close
                if (modalId === 'agendaModal' && agendaMap) {
                    agendaMap.remove();
                    agendaMap = null;
                    agendaMarker = null;
                }
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

    window.openAgendaTypeModal = (id = null) => {
        const form = document.getElementById('formAgendaType');
        form.reset();
        const title = document.getElementById('agendaTypeModalTitle');
        const idInput = document.getElementById('agenda-type-id');
        
        if (id) {
            const type = db.agendaTypes.find(t => t.id === id);
            if (type) {
                title.textContent = 'Edit Tipe Agenda';
                idInput.value = type.id;
                document.getElementById('agenda-type-nama').value = type.name;
            }
        } else {
            title.textContent = 'Tambah Tipe Agenda';
            idInput.value = '';
        }
        openModal('agendaTypeModal');
    };

    window.openAgendaModal = (id = null) => {
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

        initializeAgendaMap(initialCoords, initialZoom);
        if (hasInitialMarker) {
            updateMapAndMarker(initialCoords, false);
        }
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
        document.getElementById('payment-sudah-dibayar').textContent = formatCurrency(paymentInfo.totalVerifiedPaid);
        document.getElementById('payment-menunggu-verifikasi').textContent = formatCurrency(paymentInfo.totalPaid - paymentInfo.totalVerifiedPaid);
        document.getElementById('payment-sisa-tagihan').textContent = formatCurrency(paymentInfo.balance);
        
        const amountInput = document.getElementById('payment-jumlah');
        const remainingToPay = booking.totalHarga - paymentInfo.totalPaid;
        amountInput.value = remainingToPay > 0.01 ? remainingToPay : '';
        amountInput.max = remainingToPay;

        document.getElementById('payment-tanggal').value = new Date().toISOString().split('T')[0];

        // Reset file input and preview
        const proofUpload = document.getElementById('payment-proof-upload');
        const proofPreview = document.getElementById('payment-proof-preview');
        proofUpload.value = ''; // Clear the file input
        proofPreview.src = '#';
        proofPreview.classList.add('hidden');

        openModal('paymentModal');
    };

    window.openPriceHistoryModal = (key) => {
        const room = db.roomTypes[key];
        if (!room) return;

        const titleEl = document.getElementById('priceHistoryModalTitle');
        const contentEl = document.getElementById('priceHistoryContent');

        titleEl.textContent = `Riwayat Harga: ${room.name}`;

        if (!room.priceHistory || room.priceHistory.length === 0) {
            contentEl.innerHTML = getEmptyState('Belum ada riwayat perubahan harga untuk tipe kamar ini.');
            lucide.createIcons();
            openModal('priceHistoryModal');
            return;
        }

        let historyHtml = '';
        // Loop through history in reverse to show newest first
        [...room.priceHistory].reverse().forEach(entry => {
            const user = db.users.find(u => u.id === entry.changedBy);
            historyHtml += `
                <div class="p-4 bg-[var(--bg-tertiary)]/50 rounded-lg border border-[var(--border-color)]">
                    <div class="flex justify-between items-center mb-2">
                        <p class="font-semibold text-sm">${new Date(entry.date).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}</p>
                        <p class="text-xs text-[var(--text-secondary)]">Diubah oleh: ${user ? user.name : 'N/A'}</p>
                    </div>
                    <ul class="list-disc list-inside space-y-1 text-sm text-[var(--text-secondary)]">
                        ${entry.changes.map(change => `<li>${change.replace(/->/g, '&rarr;')}</li>`).join('')}
                    </ul>
                </div>`;
        });

        contentEl.innerHTML = historyHtml;
        openModal('priceHistoryModal');
    };

    window.openAgendaPhotoModal = (agendaId) => {
        const agenda = db.agenda.find(a => a.id === agendaId);
        if (!agenda || !agenda.fotoUrl) {
            showToast('Foto agenda tidak ditemukan.', 'error');
            return;
        }

        const modalTitle = document.getElementById('geminiModalTitle');
        const modalContent = document.getElementById('geminiModalContent');

        modalTitle.innerHTML = `<i data-lucide="image" class="w-5 h-5 mr-2 text-[var(--accent)]"></i> Foto Agenda`;
        modalContent.innerHTML = `
            <p class="text-sm text-[var(--text-secondary)]">Agenda: <strong class="text-[var(--text-primary)]">${agenda.judul}</strong></p>
            <div class="mt-4">
                <img src="${agenda.fotoUrl}" alt="Foto Agenda" class="rounded-lg max-w-full h-auto mx-auto">
            </div>
        `;
        lucide.createIcons();
        openModal('geminiModal');
    };

    window.openVerificationModal = (bookingId) => {
        const paymentInfo = getPaymentInfo(bookingId);
        const unverifiedPayments = paymentInfo.payments.filter(p => !p.verified);

        if (unverifiedPayments.length === 0) {
            showToast('Tidak ada pembayaran yang perlu diverifikasi untuk booking ini.', 'info');
            return;
        }

        document.getElementById('verification-booking-id').value = bookingId;
        document.getElementById('formVerifikasi').reset();
        const listContainer = document.getElementById('verification-payment-list');
        listContainer.innerHTML = '';

        unverifiedPayments.forEach(p => {
            const paymentHtml = `
                <label class="flex items-center space-x-3 p-2 bg-[var(--bg-primary)] rounded-md hover:bg-[var(--bg-hover)] cursor-pointer">
                    <input type="checkbox" name="payment-to-verify" value="${p.id}" class="h-4 w-4 rounded border-gray-300 text-[var(--accent)] focus:ring-[var(--accent)]">
                    <div class="flex-1 flex justify-between items-center text-sm">
                        <span>${formatCurrency(p.jumlah)} - ${new Date(p.tanggal + 'T00:00:00').toLocaleDateString('id-ID')} (${p.metode})</span>
                        ${p.proofUrl ? `<button type="button" onclick="openProofModal(${p.id})" class="text-xs text-blue-400 hover:underline">Lihat Bukti</button>` : ''}
                    </div>
                </label>
            `;
            listContainer.innerHTML += paymentHtml;
        });

        openModal('verificationModal');
    };

    window.openProofModal = (paymentId) => {
        const payment = db.payments.find(p => p.id === paymentId);
        if (!payment || !payment.proofUrl) {
            showToast('Bukti pembayaran tidak ditemukan.', 'error');
            return;
        }

        const modalTitle = document.getElementById('geminiModalTitle');
        const modalContent = document.getElementById('geminiModalContent');

        modalTitle.innerHTML = `<i data-lucide="image" class="w-5 h-5 mr-2 text-[var(--accent)]"></i> Bukti Pembayaran`;
        modalContent.innerHTML = `
            <p class="text-sm text-[var(--text-secondary)]">Booking ID: <strong class="text-[var(--text-primary)]">${payment.bookingId}</strong></p>
            <p class="text-sm text-[var(--text-secondary)]">Tanggal Bayar: <strong class="text-[var(--text-primary)]">${new Date(payment.tanggal + 'T00:00:00').toLocaleDateString('id-ID')}</strong></p>
            <p class="text-sm text-[var(--text-secondary)]">Jumlah: <strong class="text-[var(--text-primary)]">${formatCurrency(payment.jumlah)}</strong></p>
            <div class="mt-4">
                <img src="${payment.proofUrl}" alt="Bukti Pembayaran" class="rounded-lg max-w-full h-auto mx-auto">
            </div>
        `;
        lucide.createIcons();
        openModal('geminiModal');
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
                paketMeeting: `Yakin hapus paket meeting "${db.meetingPackages[id]?.name}"?`,
                agendaType: `Yakin ingin menghapus tipe agenda ini? Ini tidak akan menghapus agenda yang sudah ada, tetapi mungkin menyebabkan tampilan tipe menjadi generik.`
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
                case 'agendaType': 
                    db.agendaTypes = db.agendaTypes.filter(t => t.id !== id); 
                    populateAgendaTypeDropdown(); // Refresh dropdowns after delete
                    break;
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
        window.generateInvoice = (bookingId) => {
            try {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();
                
                const booking = [...db.kamarBookings, ...db.meetingBookings].find(b => b.id === bookingId);
                if (!booking) {
                    showToast('Booking tidak ditemukan.', 'error');
                    return;
                }
                const companyProfile = db.settings.companyProfile;
                const customer = db.pelanggan.find(p => p.id === booking.pelangganId);
                if (!customer) {
                    showToast('Pelanggan untuk booking ini tidak ditemukan.', 'error');
                    return;
                }
                const sales = db.users.find(u => u.id === booking.createdBy);
                const paymentInfo = getPaymentInfo(bookingId);

                // This is the existing invoice layout
                try {
                    const logoUrl = companyProfile.logoUrl;
                    if (logoUrl) doc.addImage(logoUrl, 'PNG', 14, 15, 40, 13);
                } catch (e) { console.error("Error adding logo to PDF:", e); }

                doc.setFontSize(10);
                doc.setFont("helvetica", "bold");
                doc.text(companyProfile.name || 'Nama Perusahaan', 14, 35);
                doc.setFont("helvetica", "normal");
                const addressLines = doc.splitTextToSize(companyProfile.address || 'Alamat Perusahaan', 80);
                doc.text(addressLines, 14, 40);
                const addressHeight = addressLines.length * 5;
                doc.text(`Telp: ${companyProfile.phone || 'N/A'}`, 14, 40 + addressHeight);

                doc.setFontSize(20);
                doc.setFont("helvetica", "bold");
                doc.text("INVOICE", 140, 22);
                doc.setFontSize(10);
                
                doc.setFont("helvetica", "bold");
                doc.text("Kepada:", 140, 40);
                doc.setFont("helvetica", "normal");
                doc.text(customer.nama, 140, 46);
                doc.text(customer.perusahaan, 140, 50);
                doc.text(customer.alamat, 140, 54);
                
                doc.text(`Invoice #: ${booking.id}`, 14, 70);
                doc.text(`Tanggal: ${new Date(booking.tanggalBooking).toLocaleDateString('id-ID')}`, 14, 75);
                doc.text(`Sales: ${sales ? sales.name : 'N/A'}`, 14, 80);
                
                let tableBody = [];
                if (booking.tipeBooking === 'Kamar' && booking.rooms) {
                    booking.rooms.forEach(room => {
                        const nights = (new Date(booking.checkout) - new Date(booking.checkin)) / (1000 * 3600 * 24);
                        let pricePerNight = room.basePrice;
                        if (room.package === 'breakfast') {
                            pricePerNight += (db.roomTypes[room.type]?.breakfastPrice || 0) * room.guests;
                        }
                        const lineTotal = room.count * pricePerNight * nights;
                        tableBody.push([`${room.name} (${room.package === 'breakfast' ? 'Sarapan' : 'Room Only'})`, `${room.count} kamar x ${nights} malam`, formatCurrency(pricePerNight), formatCurrency(lineTotal)]);
                    });
                } else { 
                     const subtotal = booking.totalHarga / (1 + (db.settings.taxAndServicePercentage / 100));
                     const details = `Sewa Ruang Meeting (${db.meetingRooms[booking.roomKey]?.name})`;
                     tableBody.push([details, `1 paket`, formatCurrency(subtotal), formatCurrency(subtotal)]);
                }

                doc.autoTable({ startY: 85, head: [['Deskripsi', 'Kuantitas', 'Harga Satuan', 'Jumlah']], body: tableBody, theme: 'striped', headStyles: { fillColor: [31, 41, 55] } });

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
                    doc.text(formatCurrency(paymentInfo.totalVerifiedPaid), 190, finalY + 27, { align: 'right' });
                    
                    doc.setFontSize(12);
                    doc.setFont("helvetica", "bold");
                    doc.text("Sisa Tagihan:", 140, finalY + 34);
                    doc.text(formatCurrency(paymentInfo.balance), 190, finalY + 34, { align: 'right' });
                    finalY += 12;
                }

                const paymentNotes = db.settings.invoiceSettings.paymentNotes;
                if (paymentNotes) {
                    doc.setFontSize(9);
                    doc.setFont("helvetica", "normal");
                    doc.text("Catatan Pembayaran:", 14, finalY + 40);
                    doc.text(paymentNotes, 14, finalY + 44);
                }

                doc.save(`Invoice-${booking.id}.pdf`);
            } catch (error) {
                console.error("Gagal membuat PDF invoice:", error);
                showToast('Terjadi kesalahan saat membuat invoice. Periksa console untuk detail.', 'error');
            }
        };
        function printPiutangReport() {
            const filter = document.getElementById('pembayaran-search').value;
            const salesId = document.getElementById('pembayaran-sales-filter').value;
            const allBookings = [...db.kamarBookings, ...db.meetingBookings];

            // Reuse filtering logic from renderPembayaranTable
            let bookingsWithBalance = allBookings.filter(b => {
                const paymentInfo = getPaymentInfo(b.id);
                return paymentInfo.balance > 0 && b.status !== 'Batal';
            }).sort((a, b) => new Date(b.tanggalBooking) - new Date(a.tanggalBooking));
            
            if (filter) {
                bookingsWithBalance = bookingsWithBalance.filter(b => {
                    const customer = db.pelanggan.find(p => p.id === b.pelangganId);
                    const sales = db.users.find(u => u.id === b.createdBy);
                    return b.id.toLowerCase().includes(filter.toLowerCase()) ||
                           (customer && customer.nama.toLowerCase().includes(filter.toLowerCase())) ||
                           (sales && sales.name.toLowerCase().includes(filter.toLowerCase()));
                });
            }

            if (salesId !== 'all') {
                const numericSalesId = parseInt(salesId);
                bookingsWithBalance = bookingsWithBalance.filter(b => b.createdBy === numericSalesId);
            }

            if (bookingsWithBalance.length === 0) {
                showToast('Tidak ada data piutang untuk dicetak.', 'info');
                return;
            }

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            doc.setFontSize(18);
            doc.text('Laporan Piutang', 14, 22);
            doc.setFontSize(11);
            doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 14, 30);

            let totalPiutang = 0;
            const tableBody = bookingsWithBalance.map(b => {
                const pelanggan = db.pelanggan.find(p => p.id === b.pelangganId);
                const sales = db.users.find(u => u.id === b.createdBy);
                const paymentInfo = getPaymentInfo(b.id);
                const eventDate = b.tipeBooking === 'Kamar' ? b.checkin : b.tanggalMulai;
                const formattedEventDate = new Date(eventDate + 'T00:00:00').toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
                totalPiutang += paymentInfo.balance;

                return [ b.id, pelanggan ? pelanggan.nama : 'N/A', sales ? sales.name : 'N/A', formattedEventDate, formatCurrency(b.totalHarga), formatCurrency(paymentInfo.balance) ];
            });

            const tableFooter = [
                [{ content: 'Total Piutang', colSpan: 5, styles: { fontStyle: 'bold', halign: 'right' } },
                 { content: formatCurrency(totalPiutang), styles: { fontStyle: 'bold' } }]
            ];

            doc.autoTable({ startY: 40, head: [['ID Booking', 'Pelanggan', 'Sales', 'Tanggal Event', 'Total Tagihan', 'Sisa Tagihan']], body: tableBody, foot: tableFooter, headStyles: { fillColor: [31, 41, 55] } });

            doc.save(`Laporan-Piutang-${new Date().toISOString().split('T')[0]}.pdf`);
        }

        window.generateConfirmationLetter = (bookingId) => {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            const booking = db.kamarBookings.find(b => b.id === bookingId);
            if (!booking) return;
            const customer = db.pelanggan.find(p => p.id === booking.pelangganId);
            if (!customer) return;
            const sales = db.users.find(u => u.id === booking.createdBy);
            const companyProfile = db.settings.companyProfile;

            // Add Logo
            try {
                const logoUrl = companyProfile.logoUrl;
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

            // Company Info (Top-Right)
            doc.setFontSize(9);
            doc.setFont("helvetica", "bold");
            doc.text(companyProfile.name || 'Nama Perusahaan', 196, 15, { align: 'right' });
            doc.setFont("helvetica", "normal");
            const addressLines = doc.splitTextToSize(companyProfile.address || 'Alamat Perusahaan', 60);
            doc.text(addressLines, 196, 19, { align: 'right' });
            const addressHeight = addressLines.length * 4;
            doc.text(`Telp: ${companyProfile.phone || 'N/A'}`, 196, 19 + addressHeight, { align: 'right' });

            doc.line(14, 40, 196, 40); // Separator line
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
            doc.text(sales ? sales.name : (currentUser.name || 'N/A'), 14, finalY + 40);
            doc.text(companyProfile.name || 'Nama Perusahaan', 14, finalY + 45);

            doc.save(`Konfirmasi-${booking.id}.pdf`);
        };
        
        window.generateMeetingConfirmationLetter = (bookingId) => {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            const booking = db.meetingBookings.find(b => b.id === bookingId);
            if (!booking) return;
            const customer = db.pelanggan.find(p => p.id === booking.pelangganId);
            if (!customer) return;
            const sales = db.users.find(u => u.id === booking.createdBy);
            const companyProfile = db.settings.companyProfile;
            const meetingRoom = db.meetingRooms[booking.roomKey];
            const meetingPackage = db.meetingPackages[booking.packageKey];

            // Add Logo
            try {
                const logoUrl = companyProfile.logoUrl;
                if (logoUrl) {
                    doc.addImage(logoUrl, 'PNG', 14, 15, 40, 13);
                }
            } catch (e) {
                console.error("Error adding logo to PDF:", e);
            }

            doc.setFontSize(20);
            doc.setFont("helvetica", "bold");
            doc.text("Surat Konfirmasi Booking Ruang Meeting", 105, 22, { align: 'center' });
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text(`No: ${booking.id}`, 105, 28, { align: 'center' });

            // Company Info (Top-Right)
            doc.setFontSize(9);
            doc.setFont("helvetica", "bold");
            doc.text(companyProfile.name || 'Nama Perusahaan', 196, 15, { align: 'right' });
            doc.setFont("helvetica", "normal");
            const addressLines = doc.splitTextToSize(companyProfile.address || 'Alamat Perusahaan', 60);
            doc.text(addressLines, 196, 19, { align: 'right' });
            const addressHeight = addressLines.length * 4;
            doc.text(`Telp: ${companyProfile.phone || 'N/A'}`, 196, 19 + addressHeight, { align: 'right' });

            doc.line(14, 40, 196, 40); // Separator line
            doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}`, 14, 48);
            
            doc.setFont("helvetica", "bold");
            doc.text("Kepada Yth.", 14, 60);
            doc.setFont("helvetica", "normal");
            doc.text(customer.nama, 14, 66);
            doc.text(customer.perusahaan, 14, 70);
            doc.text(customer.alamat, 14, 74);

            doc.text("Dengan hormat,", 14, 84);
            doc.text("Terima kasih telah memilih hotel kami untuk acara Anda. Dengan ini kami konfirmasikan detail pemesanan sebagai berikut:", 14, 90, { maxWidth: 180 });

            const tableBody = [
                ['Nama Ruang', meetingRoom ? meetingRoom.name : 'N/A'],
                ['Paket Meeting', meetingPackage ? meetingPackage.name : 'N/A'],
                ['Jumlah Peserta', `${booking.jumlahPax} orang`],
                ['Tanggal Acara', `${new Date(booking.tanggalMulai + 'T00:00:00').toLocaleDateString('id-ID')} s/d ${new Date(booking.tanggalBerakhir + 'T00:00:00').toLocaleDateString('id-ID')}`],
                ['Waktu Acara', `${booking.jamMulai} - ${booking.jamBerakhir}`],
                ['Total Biaya', `${formatCurrency(booking.totalHarga)} (Termasuk Pajak & Layanan)`],
            ];

            doc.autoTable({ startY: 100, body: tableBody, theme: 'grid', styles: { cellPadding: 2 }, columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 }, 1: { cellWidth: 'auto' } } });

            let finalY = doc.lastAutoTable.finalY;
            doc.text("Hormat kami,", 14, finalY + 20);
            doc.text(sales ? sales.name : (currentUser.name || 'N/A'), 14, finalY + 40);
            doc.text(companyProfile.name || 'Nama Perusahaan', 14, finalY + 45);
            doc.save(`Konfirmasi-Meeting-${booking.id}.pdf`);
        };
        // --- EVENT LISTENERS ---
        const sidebar = document.getElementById('sidebar'), sidebarToggle = document.getElementById('sidebar-toggle'), sidebarBackdrop = document.getElementById('sidebar-backdrop'), navLinks = document.querySelectorAll('.nav-link'), contentSections = document.querySelectorAll('.content-section'), pageTitle = document.getElementById('page-title');
        window.toggleSidebar = () => { sidebar.classList.toggle('-translate-x-full'); sidebarBackdrop.classList.toggle('hidden'); }
        sidebarToggle.addEventListener('click', window.toggleSidebar);
        sidebarBackdrop.addEventListener('click', window.toggleSidebar);

        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                const targetId = link.getAttribute('data-target');
                pageTitle.textContent = link.textContent.trim();
                contentSections.forEach(s => s.id === targetId ? s.classList.remove('hidden') : s.classList.add('hidden'));

                // Secara otomatis menyembunyikan sidebar saat item menu diklik pada layar kecil
                if (window.innerWidth < 1024) {
                    window.toggleSidebar();
                }
            });
        });

        // Search Listeners
        document.getElementById('pelanggan-search').addEventListener('input', (e) => renderPelangganTable(e.target.value));
        document.getElementById('laporan-search').addEventListener('input', (e) => renderLaporanTable(e.target.value));
        
        const pembayaranSearchInput = document.getElementById('pembayaran-search');
        const pembayaranSalesFilter = document.getElementById('pembayaran-sales-filter');
        const handlePembayaranFilterChange = () => {
            renderPembayaranTable(pembayaranSearchInput.value, pembayaranSalesFilter.value);
        };
        pembayaranSearchInput.addEventListener('input', handlePembayaranFilterChange);
        pembayaranSalesFilter.addEventListener('change', handlePembayaranFilterChange);

        // Dashboard Card Click Listeners
        const piutangCard = document.getElementById('dashboard-piutang-card');
        if (piutangCard) {
            piutangCard.addEventListener('click', () => {
                document.querySelector('.nav-link[data-target="pembayaran"]').click();
            });
        }

        document.getElementById('print-piutang-btn').addEventListener('click', printPiutangReport);

        // Notification Toggle Listener
        const notificationToggle = document.getElementById('notification-toggle');
        const notificationPanel = document.getElementById('notification-panel');

        notificationToggle.addEventListener('click', (e) => {
            e.stopPropagation(); // Mencegah event klik menyebar ke document
            notificationPanel.classList.toggle('hidden');
        });

        // Menutup panel notifikasi jika klik di luar area
        document.addEventListener('click', (e) => {
            if (!notificationPanel.contains(e.target) && !notificationToggle.contains(e.target)) {
                notificationPanel.classList.add('hidden');
            }
        });

        // Notification Listeners
        document.getElementById('notification-list').addEventListener('click', function(e) {
            const item = e.target.closest('.notification-item');
            if (!item) return;
            e.preventDefault();

            const notificationId = parseInt(item.dataset.id);
            const targetId = item.dataset.targetId;
            const type = item.dataset.type;

            // Tandai sudah dibaca
            const notification = db.notifications.find(n => n.id === notificationId);
            if (notification && !notification.readBy.includes(currentUser.id)) {
                notification.readBy.push(currentUser.id);
                saveData();
                renderNotifications();
            }

            // Aksi saat notifikasi diklik
            if (type === 'verification' || type === 'payment_reminder') {
                document.querySelector('.nav-link[data-target="pembayaran"]').click();
                
                setTimeout(() => {
                    const row = document.querySelector(`#pembayaran-table-container tr[data-booking-id="${targetId}"]`);
                    if (row) {
                        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        row.classList.add('highlight');
                        setTimeout(() => row.classList.remove('highlight'), 2500);
                    } else {
                        showToast(`Booking ID ${targetId} tidak ditemukan di daftar piutang.`, 'info');
                    }
                }, 100);
            } else if (type === 'agenda_reminder') {
                document.querySelector('.nav-link[data-target="agenda"]').click();

                setTimeout(() => {
                    const card = document.querySelector(`#agenda [data-agenda-id="${targetId}"]`);
                    if (card) {
                        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        card.classList.add('highlight-card');
                        setTimeout(() => card.classList.remove('highlight-card'), 2500);
                    } else {
                        showToast(`Agenda ID ${targetId} tidak ditemukan.`, 'info');
                    }
                }, 100);
            }

            document.getElementById('notification-panel').classList.add('hidden');
        });

        document.getElementById('mark-all-read-btn').addEventListener('click', function(e) {
            e.preventDefault();
            db.notifications.forEach(n => { if (!n.readBy.includes(currentUser.id)) { n.readBy.push(currentUser.id); } });
            saveData(); renderNotifications(); showToast('Semua notifikasi ditandai telah dibaca.');
        });

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
            }
            saveData(); 
            // --- Optimization: Call specific render functions ---
            renderPelangganTable();
            updateDashboardCards();
            populateAllDropdowns(); // Pelanggan dropdown needs update
            closeModal('pelangganModal'); 
            showToast(`Pelanggan berhasil ${id ? 'diperbarui' : 'ditambahkan'}!`); 
            this.reset(); 
        });

        document.getElementById('formCancellation').addEventListener('submit', function(e) {
            e.preventDefault();
            const bookingId = document.getElementById('cancel-booking-id-input').value;
            const reason = document.getElementById('cancellation-reason').value;

            const booking = [...db.kamarBookings, ...db.meetingBookings].find(b => b.id === bookingId);
            if (booking) {
                booking.status = 'Batal';
                booking.cancellationReason = reason;
                booking.cancelledBy = currentUser.id;
                saveData();
                renderAll();
                closeModal('cancellationModal');
                showToast(`Booking ${bookingId} berhasil dibatalkan.`, 'success');
            } else {
                showToast('Booking tidak ditemukan.', 'error');
            }
        });

        document.getElementById('formPembayaran').addEventListener('submit', function(e) {
            e.preventDefault();
            const bookingId = document.getElementById('payment-booking-id-input').value;
            const jumlah = parseFloat(document.getElementById('payment-jumlah').value);
            const tanggal = document.getElementById('payment-tanggal').value;
            const metode = document.getElementById('payment-metode').value;
            const tipe = document.getElementById('payment-tipe').value;
            const catatan = document.getElementById('payment-catatan').value;
            const proofPreview = document.getElementById('payment-proof-preview');
            const proofUrl = proofPreview.src.startsWith('data:image') ? proofPreview.src : null;
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
                proofUrl,
                verified: false,
                verifiedBy: null,
                verificationNote: null,
                createdBy: currentUser.id
            });

            const booking = [...db.kamarBookings, ...db.meetingBookings].find(b => b.id === bookingId);
            const customer = db.pelanggan.find(p => p.id === booking.pelangganId);
            const customerName = customer ? customer.nama : `Booking ID ${bookingId}`;
            createNotification(
                `Pembayaran baru ${formatCurrency(jumlah)} dari ${customerName} perlu diverifikasi.`,
                'verification',
                bookingId
            );

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
                cancellationReason: null,
                cancelledBy: null,
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
            const newBookingId = `BM-${Date.now()}`;
            db.meetingBookings.push({
                id: newBookingId,
                tipeBooking: 'Meeting',
                pelangganId: parseInt(document.getElementById('bm-pelanggan').value),
                tanggalBooking: new Date().toISOString(),
                tanggalMulai: document.getElementById('bm-tanggal-mulai').value,
                tanggalBerakhir: document.getElementById('bm-tanggal-berakhir').value,
                jamMulai: document.getElementById('bm-jam-mulai').value,
                jamBerakhir: document.getElementById('bm-jam-berakhir').value,
                totalHarga: total,
                status: 'Baru',
                cancellationReason: null,
                cancelledBy: null,
                roomKey: document.getElementById('bm-tipe-ruang').value,
                packageKey: document.getElementById('bm-paket').value,
                jumlahPax: parseInt(document.getElementById('bm-jumlah-pax').value) || 0,
                createdBy: currentUser.id
            });
            saveData();
            renderAll();
            showToast('Booking meeting berhasil disimpan!');
            lastMeetingBookingId = newBookingId;
            document.getElementById('meeting-booking-actions-container').classList.remove('hidden');
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
            const newBreakfastPrice = parseFloat(document.getElementById('kamar-harga-sarapan').value);
            const key = id || name.toLowerCase().replace(/\s+/g, '-');

            // Track price history for existing rooms
            if (id) {
                const oldRoom = db.roomTypes[key];
                if (oldRoom) {
                    const historyEntry = {
                        date: new Date().toISOString(),
                        changedBy: currentUser.id,
                        changes: []
                    };

                    // Compare segment prices
                    for (const segment in prices) {
                        if (prices[segment] !== oldRoom.prices[segment]) {
                            historyEntry.changes.push(
                                `Harga ${segment.replace('-', ' ')}: ${formatCurrency(oldRoom.prices[segment])} -> ${formatCurrency(prices[segment])}`
                            );
                        }
                    }

                    // Compare breakfast price
                    if (newBreakfastPrice !== oldRoom.breakfastPrice) {
                        historyEntry.changes.push(
                            `Harga Sarapan: ${formatCurrency(oldRoom.breakfastPrice)} -> ${formatCurrency(newBreakfastPrice)}`
                        );
                    }

                    if (historyEntry.changes.length > 0) {
                        if (!db.roomTypes[key].priceHistory) db.roomTypes[key].priceHistory = [];
                        db.roomTypes[key].priceHistory.push(historyEntry);
                    }
                }
            }

            const roomData = { name, prices, breakfastPrice: newBreakfastPrice };
            if (!id) roomData.priceHistory = []; // Ensure new rooms have the history array
            db.roomTypes[key] = { ...db.roomTypes[key], ...roomData };

            saveData();
            renderAll();
            closeModal('kamarModal');
            showToast(`Tipe kamar ${id ? 'diperbarui' : 'ditambahkan'}!`);
        });

        document.getElementById('formMeetingRoom').addEventListener('submit', function(e) { e.preventDefault(); const id = document.getElementById('meeting-room-id').value; const name = document.getElementById('meeting-room-nama').value; const rentalPrice = parseFloat(document.getElementById('meeting-room-harga').value); const key = id || name.toLowerCase().replace(/\s+/g, '-'); db.meetingRooms[key] = { name, rentalPrice }; saveData(); renderAll(); closeModal('meetingRoomModal'); showToast(`Ruang meeting ${id ? 'diperbarui' : 'ditambahkan'}!`); });
        
        document.getElementById('formPaketMeeting').addEventListener('submit', function(e) { e.preventDefault(); const id = document.getElementById('paket-meeting-id').value; const name = document.getElementById('paket-meeting-nama').value; const price = parseFloat(document.getElementById('paket-meeting-harga').value); const key = id || name.toLowerCase().replace(/\s+/g, '-'); db.meetingPackages[key] = { name, price }; saveData(); renderAll(); closeModal('paketMeetingModal'); showToast(`Paket meeting ${id ? 'diperbarui' : 'ditambahkan'}!`); });

        document.getElementById('formAgendaType').addEventListener('submit', function(e) {
            e.preventDefault();
            const id = parseInt(document.getElementById('agenda-type-id').value);
            const name = document.getElementById('agenda-type-nama').value;

            if (!name.trim()) {
                showToast('Nama tipe agenda tidak boleh kosong.', 'error');
                return;
            }

            if (id) {
                const index = db.agendaTypes.findIndex(t => t.id === id);
                if (index > -1) {
                    db.agendaTypes[index].name = name;
                }
            } else {
                db.agendaTypes.push({ id: Date.now(), name: name });
            }
            saveData();
            renderAgendaTypeTable();
            populateAgendaTypeDropdown();
            closeModal('agendaTypeModal');
            showToast(`Tipe agenda berhasil ${id ? 'diperbarui' : 'ditambahkan'}!`);
        });

        document.getElementById('formVerifikasi').addEventListener('submit', function(e) {
            e.preventDefault();
            const selectedCheckboxes = document.querySelectorAll('input[name="payment-to-verify"]:checked');
            const verificationNote = document.getElementById('verification-note').value;

            if (selectedCheckboxes.length === 0) {
                showToast('Pilih setidaknya satu pembayaran untuk diverifikasi.', 'error');
                return;
            }
            if (!verificationNote.trim()) {
                showToast('Catatan verifikasi tidak boleh kosong.', 'error');
                return;
            }

            selectedCheckboxes.forEach(cb => {
                const paymentId = parseInt(cb.value);
                const payment = db.payments.find(p => p.id === paymentId);
                if (payment) {
                    payment.verified = true;
                    payment.verifiedBy = currentUser.id;
                    payment.verificationNote = verificationNote;
                }
            });

            saveData();
            renderAll();
            closeModal('verificationModal');
            showToast('Pembayaran berhasil diverifikasi!');
        });

        document.getElementById('formAgenda').addEventListener('submit', function(e) {
            e.preventDefault();
            const id = parseInt(document.getElementById('agenda-id').value);
            const fotoPreview = document.getElementById('agenda-foto-preview');
            const fotoUrl = fotoPreview.src.startsWith('data:image') ? fotoPreview.src : null;

            const agendaData = {
                judul: document.getElementById('agenda-judul').value,
                tipe: document.getElementById('agenda-tipe').value,
                pelangganId: parseInt(document.getElementById('agenda-pelanggan').value),
                tanggal: document.getElementById('agenda-tanggal').value,
                jamMulai: document.getElementById('agenda-jam-mulai').value,
                jamSelesai: document.getElementById('agenda-jam-selesai').value,
                lokasi: document.getElementById('agenda-lokasi').value,
                catatan: document.getElementById('agenda-catatan').value,
                fotoUrl: fotoUrl
            };
            if (id) {
                const index = db.agenda.findIndex(a => a.id === id);
                // Preserve existing photo if no new one is uploaded
                if (!fotoUrl) {
                    agendaData.fotoUrl = db.agenda[index].fotoUrl;
                }
                // Preserve existing status when editing
                agendaData.status = db.agenda[index].status;
                db.agenda[index] = { ...db.agenda[index], ...agendaData };
            } else {
                agendaData.id = Date.now();
                agendaData.status = 'Tentative'; // New agendas are always tentative
                agendaData.createdBy = currentUser.id;
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
            const overallTarget = parseFloat(document.getElementById('sales-target-input').value) || 0;
            const key = `${tahun}-${bulan}`;

            // Initialize target object for the month if it doesn't exist
            if (!db.targets[key]) {
                db.targets[key] = { overall: 0, sales: {}, segments: {} };
            }

            // Save overall target
            db.targets[key].overall = overallTarget * 1000000;

            // Save individual sales targets
            db.targets[key].sales = {}; // Reset sales targets for the month
            const salesTargetInputs = document.querySelectorAll('.sales-target-input');
            salesTargetInputs.forEach(input => {
                const salesId = input.dataset.salesId;
                const salesTarget = parseFloat(input.value) || 0;
                if (salesId && salesTarget > 0) {
                    db.targets[key].sales[salesId] = salesTarget * 1000000;
                }
            });

            // Save segment targets
            db.targets[key].segments = {}; // Reset segment targets for the month
            const segmentTargetInputs = document.querySelectorAll('.segment-target-input');
            segmentTargetInputs.forEach(input => {
                const segmentName = input.dataset.segmentName;
                const segmentTarget = parseFloat(input.value) || 0;
                if (segmentName && segmentTarget > 0) {
                    db.targets[key].segments[segmentName] = segmentTarget * 1000000;
                }
            });

            saveData();
            renderAll();
            showToast(`Target untuk bulan ${bulan}/${tahun} berhasil disimpan!`);
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
            db.settings.invoiceSettings.paymentNotes = document.getElementById('invoice-payment-notes').value;
            saveData();
            renderAll();
            showToast('Pengaturan berhasil diperbarui!');
        });

        document.getElementById('formProfilPerusahaan').addEventListener('submit', function(e) {
            e.preventDefault();
            const newName = document.getElementById('profil-nama').value;
            const newPhone = document.getElementById('profil-telepon').value;
            const newAddress = document.getElementById('profil-alamat').value;
            const newLogoUrl = document.getElementById('profil-logo-preview').src;

            db.settings.companyProfile.name = newName;
            db.settings.companyProfile.phone = newPhone;
            db.settings.companyProfile.address = newAddress;
            db.settings.companyProfile.logoUrl = newLogoUrl;

            saveData();
            showToast('Profil perusahaan berhasil diperbarui!');
            updateGlobalLogo(newLogoUrl);
            updatePageTitle(newName);
        });

        document.getElementById('profil-logo-upload').addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                // --- Validation Start ---
                const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
                const maxSizeInBytes = 1 * 1024 * 1024; // 1MB

                if (!allowedTypes.includes(file.type)) {
                    showToast('Tipe file tidak valid. Harap unggah file gambar (JPG, PNG, GIF, WEBP, SVG).', 'error');
                    e.target.value = ''; // Clear the input
                    return;
                }

                if (file.size > maxSizeInBytes) {
                    showToast('Ukuran file terlalu besar. Maksimal 1MB.', 'error');
                    e.target.value = ''; // Clear the input
                    return;
                }
                // --- Validation End ---

                const reader = new FileReader();
                const preview = document.getElementById('profil-logo-preview');
                reader.onload = function(event) {
                    preview.src = event.target.result;
                }
                reader.readAsDataURL(file);
            }
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
                    updateMapAndMarker([lat, lon]);
                    this.disabled = false;
                },
                () => {
                    showToast('Tidak dapat mengambil lokasi. Pastikan izin lokasi telah diberikan.', 'error');
                    locationInput.value = "";
                    this.disabled = false;
                }
            );
        });

        document.getElementById('agenda-lokasi').addEventListener('change', function(e) {
            const value = e.target.value;
            if (/^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(value)) {
                const coords = value.split(',').map(Number);
                updateMapAndMarker(coords);
            }
        });

        document.getElementById('agenda-foto-upload').addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                const preview = document.getElementById('agenda-foto-preview');
                reader.onload = function(event) {
                    preview.src = event.target.result;
                    preview.classList.remove('hidden');
                }
                reader.readAsDataURL(file);
            }
        });

        // Settings Tab Listener
        document.querySelectorAll('.settings-tab-button').forEach(button => {
            button.addEventListener('click', () => {
                document.querySelectorAll('.settings-tab-button').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                document.querySelectorAll('#manajemen-pengaturan .tab-content').forEach(content => {
                    content.classList.add('hidden');
                });
                document.getElementById(button.dataset.target).classList.remove('hidden');
            });
        });

        // User Management Tab Listener
        document.querySelectorAll('.user-tab-button').forEach(button => {
            button.addEventListener('click', () => {
                document.querySelectorAll('.user-tab-button').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                document.querySelectorAll('#manajemen-user .user-tab-content').forEach(content => {
                    content.classList.add('hidden');
                });
                document.getElementById(button.dataset.target).classList.remove('hidden');
            });
        });

        // Inventory Tab Listener
        document.querySelectorAll('.inventory-tab-button').forEach(button => {
            button.addEventListener('click', () => {
                document.querySelectorAll('.inventory-tab-button').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                document.querySelectorAll('#manajemen-inventaris .inventory-tab-content').forEach(content => {
                    content.classList.add('hidden');
                });
                document.getElementById(button.dataset.target).classList.remove('hidden');
            });
        });

        // Post-booking action buttons
        document.getElementById('print-confirmation-btn').addEventListener('click', () => {
            if (lastRoomBookingId) {
                generateConfirmationLetter(lastRoomBookingId);
            }
        });

        document.getElementById('print-meeting-confirmation-btn').addEventListener('click', () => {
            if (lastMeetingBookingId) {
                generateMeetingConfirmationLetter(lastMeetingBookingId);
            }
        });

        document.getElementById('new-meeting-booking-btn').addEventListener('click', () => {
            document.getElementById('formBookingMeeting').reset();
            document.getElementById('meeting-booking-actions-container').classList.add('hidden');
            lastMeetingBookingId = null;
            calculateMeetingTotalPrice();
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

        // Inject highlight style
        const style = document.createElement('style');
        style.innerHTML = `
            .highlight {
                background-color: var(--accent) !important;
                transition: background-color 0.5s ease-in-out;
            }
            .highlight-card {
                background-color: var(--accent) !important;
                transition: background-color 0.5s ease-in-out;
            }`;
        document.head.appendChild(style);
        
        // --- SALES REPORT LOGIC ---
        document.getElementById('generate-sales-report-btn').addEventListener('click', () => {
            const startDate = document.getElementById('report-start-date').value;
            const endDate = document.getElementById('report-end-date').value;
            const salesId = document.getElementById('report-sales-filter').value;

            if (!startDate || !endDate) {
                showToast('Harap pilih tanggal mulai dan selesai.', 'error');
                return;
            }

            const start = new Date(startDate + 'T00:00:00');
            const end = new Date(endDate + 'T23:59:59');

            const allBookings = [...db.kamarBookings, ...db.meetingBookings];
            let filteredBookings = allBookings.filter(b => {
                const bookingDate = new Date(b.tanggalBooking);
                return bookingDate >= start && bookingDate <= end;
            });

            let filteredAgendas = db.agenda.filter(a => {
                const agendaDate = new Date(a.tanggal + 'T00:00:00');
                return agendaDate >= start && agendaDate <= end;
            });

            if (salesId !== 'all') {
                const numericSalesId = parseInt(salesId);
                filteredBookings = filteredBookings.filter(b => b.createdBy === numericSalesId);
                filteredAgendas = filteredAgendas.filter(a => a.createdBy === numericSalesId);
            }

            currentSalesReportData = filteredBookings;
            currentSalesAgendaData = filteredAgendas;

            renderSalesReportTable(currentSalesReportData);
            renderSalesAgendaReportTable(currentSalesAgendaData);
        });

        function renderSalesReportTable(data) {
            const container = document.getElementById('sales-report-container');
            const actionsContainer = document.getElementById('sales-report-actions');
            const aiContainer = document.getElementById('ai-summary-container');
            document.getElementById('sales-agenda-report-section').classList.add('hidden');

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

        function renderSalesAgendaReportTable(data) {
            const container = document.getElementById('sales-agenda-report-container');
            const section = document.getElementById('sales-agenda-report-section');

            if (data.length === 0) {
                section.classList.add('hidden');
                return;
            }

            let tableHtml = `<table class="w-full text-left">
                <thead><tr class="border-b border-[var(--border-color)]">
                    <th class="p-3">Tanggal</th>
                    <th class="p-3">Judul</th>
                    <th class="p-3">Pelanggan</th>
                    <th class="p-3">Tipe</th>
                    <th class="p-3">Status</th>
                    <th class="p-3">Sales</th>
                </tr></thead>
                <tbody>`;

            data.forEach(a => {
                const customer = db.pelanggan.find(p => p.id === a.pelangganId);
                const sales = db.users.find(u => u.id === a.createdBy);

                tableHtml += `<tr class="border-b border-[var(--border-color)] hover:bg-[var(--bg-hover)]">
                    <td class="p-3">${new Date(a.tanggal + 'T00:00:00').toLocaleDateString('id-ID')}</td>
                    <td class="p-3">${a.judul}</td>
                    <td class="p-3">${customer ? customer.nama : 'N/A'}</td>
                    <td class="p-3">${getAgendaTipeBadge(a.tipe)}</td>
                    <td class="p-3">${getAgendaStatusBadge(a.status)}</td>
                    <td class="p-3">${sales ? sales.name : 'N/A'}</td>
                </tr>`;
            });

            tableHtml += `</tbody></table>`;
            container.innerHTML = tableHtml;
            section.classList.remove('hidden');
            lucide.createIcons();
        }

        document.getElementById('print-sales-report-btn').addEventListener('click', () => {
            if (currentSalesReportData.length === 0) return;

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            const startDate = document.getElementById('report-start-date').value;
            const endDate = document.getElementById('report-end-date').value;
            const salesFilterEl = document.getElementById('report-sales-filter');
            const selectedSalesName = salesFilterEl.value === 'all' ? 'Semua Sales' : salesFilterEl.options[salesFilterEl.selectedIndex].text;

            doc.setFontSize(18);
            doc.text('Laporan Pencapaian Sales', 14, 22);
            doc.setFontSize(11);
            doc.text(`Periode: ${startDate} s/d ${endDate}`, 14, 30);
            doc.text(`Sales: ${selectedSalesName}`, 14, 35);

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
                startY: 43,
                head: [['ID Booking', 'Tanggal', 'Pelanggan', 'Tipe', 'Sales', 'Total']],
                body: tableData,
                headStyles: { fillColor: [31, 41, 55] },
                footStyles: { fontStyle: 'bold' }
            });

            if (currentSalesAgendaData.length > 0) {
                doc.addPage();
                doc.setFontSize(18);
                doc.text('Laporan Detail Agenda Meeting', 14, 22);
                doc.setFontSize(11);
                doc.text(`Periode: ${startDate} s/d ${endDate}`, 14, 30);
                doc.text(`Sales: ${selectedSalesName}`, 14, 35);

                const agendaTableData = currentSalesAgendaData.map(a => {
                    const customer = db.pelanggan.find(p => p.id === a.pelangganId);
                    const sales = db.users.find(u => u.id === a.createdBy);
                    return [
                        new Date(a.tanggal + 'T00:00:00').toLocaleDateString('id-ID'),
                        a.judul,
                        customer ? customer.nama : 'N/A',
                        a.tipe,
                        a.status,
                        sales ? sales.name : 'N/A'
                    ];
                });

                doc.autoTable({
                    startY: 43,
                    head: [['Tanggal', 'Judul', 'Pelanggan', 'Tipe', 'Status', 'Sales']],
                    body: agendaTableData,
                    headStyles: { fillColor: [31, 41, 55] }
                });
            }

            doc.save(`Laporan-Sales-${startDate}-to-${endDate}.pdf`);
        });

        document.getElementById('export-sales-report-btn').addEventListener('click', () => {
            if (currentSalesReportData.length === 0) return;

            const startDate = document.getElementById('report-start-date').value;
            const endDate = document.getElementById('report-end-date').value;
            const salesFilterEl = document.getElementById('report-sales-filter');
            const selectedSalesName = salesFilterEl.value === 'all' ? 'Semua-Sales' : salesFilterEl.options[salesFilterEl.selectedIndex].text.replace(/\s+/g, '-');

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
            // Set column widths
            worksheet['!cols'] = [
                { wch: 20 }, { wch: 15 }, { wch: 25 }, { wch: 25 }, 
                { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 15 } 
            ];

            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Sales');

            if (currentSalesAgendaData.length > 0) {
                const agendaDataToExport = currentSalesAgendaData.map(a => {
                    const customer = db.pelanggan.find(p => p.id === a.pelangganId);
                    const sales = db.users.find(u => u.id === a.createdBy);
                    return {
                        'Tanggal': new Date(a.tanggal + 'T00:00:00').toLocaleDateString('id-ID'),
                        'Judul': a.judul,
                        'Pelanggan': customer ? customer.nama : 'N/A',
                        'Tipe': a.tipe,
                        'Status': a.status,
                        'Sales': sales ? sales.name : 'N/A',
                        'Catatan': a.catatan
                    };
                });
                const agendaWorksheet = XLSX.utils.json_to_sheet(agendaDataToExport);
                agendaWorksheet['!cols'] = [ { wch: 15 }, { wch: 30 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 40 } ];
                XLSX.utils.book_append_sheet(workbook, agendaWorksheet, 'Laporan Agenda');
            }

            XLSX.writeFile(workbook, `Laporan-Sales-${selectedSalesName}-${startDate}-to-${endDate}.xlsx`);
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
        function initTargetPage() {
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

            function loadTargetValues() {
                const key = `${tahunSelect.value}-${bulanSelect.value}`;
                const monthlyTarget = db.targets[key];

                // Load overall target
                const overallTargetInput = document.getElementById('sales-target-input');
                overallTargetInput.value = monthlyTarget?.overall ? monthlyTarget.overall / 1000000 : '';

                // Load individual sales targets
                const salesListContainer = document.getElementById('sales-target-list');
                salesListContainer.innerHTML = '';
                const salesUsers = db.users.filter(u => u.role === 'Sales');
                
                salesUsers.forEach(user => {
                    const userTarget = monthlyTarget?.sales?.[user.id] ? monthlyTarget.sales[user.id] / 1000000 : '';
                    const userHtml = `
                        <div class="flex items-center gap-4">
                            <label for="sales-target-${user.id}" class="w-1/3 text-sm text-[var(--text-secondary)]">${user.name}</label>
                            <input type="number" id="sales-target-${user.id}" data-sales-id="${user.id}" value="${userTarget}" class="sales-target-input w-2/3 bg-[var(--bg-secondary)] border-[var(--border-color)] rounded-md p-2" placeholder="Target (Juta)">
                        </div>`;
                    salesListContainer.innerHTML += userHtml;
                });

                // Load segment targets
                const segmentListContainer = document.getElementById('segment-target-list');
                segmentListContainer.innerHTML = '';
                const segments = ['Corporate', 'Individual', 'Travel Agent', 'Government'];

                segments.forEach(segment => {
                    const segmentKey = segment;
                    const segmentTarget = monthlyTarget?.segments?.[segmentKey] ? monthlyTarget.segments[segmentKey] / 1000000 : '';
                    const segmentHtml = `
                        <div class="flex items-center gap-4">
                            <label for="segment-target-${segmentKey.replace(' ', '')}" class="w-1/3 text-sm text-[var(--text-secondary)]">${segment}</label>
                            <input type="number" id="segment-target-${segmentKey.replace(' ', '')}" data-segment-name="${segmentKey}" value="${segmentTarget}" class="segment-target-input w-2/3 bg-[var(--bg-secondary)] border-[var(--border-color)] rounded-md p-2" placeholder="Target (Juta)">
                        </div>`;
                    segmentListContainer.innerHTML += segmentHtml;
                });
            }

            bulanSelect.addEventListener('change', loadTargetValues);
            tahunSelect.addEventListener('change', loadTargetValues);
            
            }

        loadData();
        updateGlobalLogo(db.settings.companyProfile.logoUrl);
        updatePageTitle(db.settings.companyProfile.name);
        initTargetPage();
        checkSession();

        // Disable right-click context menu
        document.addEventListener('contextmenu', event => event.preventDefault());

    });


