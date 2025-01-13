const express = require('express');
const router = express.Router();
const db = require('../db'); // Veritabanı bağlantısını içe aktar

// Sabit Renk Haritası
const renkHaritasi = {
    "Düğün": "#FFC107",
    "Doğum Günü": "#28A745",
    "Kurumsal Etkinlik": "#17A2B8",
    "Müzayede": "#DC3545",
    "Nişan": "#6610F2",
    "Evlilik Teklifi": "#6C757D"
};


const renkHaritasiKisiKapasiteleri = {
    "Düğün": "#FFC107",          // Doğru
    "Doğum Günü": "#28A745",     // Doğru
    "Kurumsal Etkinlik": "#17A2B8",
    "Antika Müzayedesi": "#DC3545",
    "Nişan": "#6610F2",
    "Evlilik Teklifi": "#6C757D"
};

const renkHaritasiGelirGrafiği = {
    "Düğün": "#28A745",          // Doğru
    "Doğum Günü": "#6A0DAD",     // Doğru
    "Kurumsal Etkinlik": "#00BCD4",
    "Antika Müzayedesi": "#FF4500",
    "Nişan": "#FFC107",
    "Evlilik Teklifi": "#DC3545"
};

const konseptgrafiği = {
    "Kır Düğünü Konsepti": "#8BC34A",
    "Sahil Düğünü Konsepti": "#00BCD4",
    "Salon Düğünü Konsepti": "#1E88E5"
};


// API: En Popüler Etkinlikler
router.get('/en-populer-etkinlikler', (req, res) => {
    const sql = `CALL EtkinlikTuruTalepSayisi()`; // Saklı yordamı çağır
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Saklı yordam hatası:', err.message);
            res.status(500).json({ error: 'Veri alınamadı' });
        } else {
            // Veriyi renk haritasına göre düzenle
            const enrichedResults = results[0].map(row => ({
                ...row,
                backgroundColor: renkHaritasi[row.EtkinlikTuru] || "#000000"
            }));
            res.json(enrichedResults); // İlk sonuç kümesini döndürüyoruz
        }
    });
});

// API: Etkinlik Türlerine Göre Kişi Kapasiteleri
router.get('/bar-chart-data', (req, res) => {
    const sql = `CALL AylaraGoreKapasite()`; // Saklı yordamı çağır
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Veri alınırken hata oluştu:', err.message);
            res.status(500).json({ error: 'Veri alınamadı' });
        } else {
            const labels = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasim', 'Aralık'];
            const datasets = [];

            // Veritabanından dönen sonuçları işle
            results[0].forEach(row => {
                // Aynı etkinlik türü için bir dataset varsa, veriyi ekle
                const existingDataset = datasets.find(d => d.label === row.etkinlik_turu);
                if (existingDataset) {
                    existingDataset.data.push(row.ortalama_kapasite); // Veriyi ekle
                } else {
                    // Yeni bir etkinlik türü için dataset oluştur
                    datasets.push({
                        label: row.etkinlik_turu,
                        data: [row.ortalama_kapasite],
                        backgroundColor: renkHaritasiKisiKapasiteleri[row.etkinlik_turu.trim()] || "#000000"
                    });
                }
            });

            res.json({
                labels: labels,
                datasets: datasets
            });
        }
    });
});


// API: Gelir Getirileri Grafiği
router.get('/gelir-getirileri-data', (req, res) => {
    const sql = `CALL GelirGetirileriGrafik()`; // Saklı yordamı çağır
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Veri alınırken hata oluştu:', err.message);
            res.status(500).json({ error: 'Veri alınamadı' });
        } else {
            const labels = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
            const datasets = [];

            // Veritabanından dönen sonuçları işleyin
            results[0].forEach(row => {
                const existingDataset = datasets.find(d => d.label === row.EtkinlikTuru);
                if (existingDataset) {
                    // Mevcut dataset varsa veri ekle
                    existingDataset.data[row.Ay - 1] = parseFloat(row.ToplamGelir);
                } else {
                    // Yeni bir dataset oluştur
                    const data = Array(12).fill(0); // 12 ay için başlangıç verileri
                    data[row.Ay - 1] = parseFloat(row.ToplamGelir);
                    datasets.push({
                        label: row.EtkinlikTuru,
                        data: data, // Veriler
                        borderColor: renkHaritasiGelirGrafiği[row.EtkinlikTuru.trim()] || "#000000",
                        fill: false
                    });
                }
            });

            // JSON'u frontend için döndür
            res.json({
                labels: labels,
                datasets: datasets
            });
        }
    });
});


// API: Mevsimlere Göre Talepler
router.get('/seasonal-demands', (req, res) => {
    const category = req.query.category; // URL'den seçilen kategori
    const sql = `CALL MevsimlereGoreTalepler(?)`; // Saklı yordamı çağır

    db.query(sql, [category], (err, results) => {
        if (err) {
            console.error('Veri alınırken hata oluştu:', err.message);
            res.status(500).json({ error: 'Veri alınamadı' });
        } else {
            // Veriyi frontend için düzenleyin
            res.json({
                labels: results[0].map(row => row.Mevsim), // Mevsimler
                values: results[0].map(row => row.TalepSayisi) // Talep Sayıları
            });
        }
    });
});


router.get('/concept-demands', (req, res) => {
    const sql = `CALL KonseptTalepleriAylaraGore();`;

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Veri alınırken hata oluştu:', err.message);
            res.status(500).json({ error: 'Veri alınamadı' });
        } else {
            console.log('Dönen Konsept Talepleri:', results[0]); // Konsola yazdırın
            const labels = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
            const datasets = [];

            const groupedData = {};
            results[0].forEach(row => {
                if (!groupedData[row.KonseptAdi]) {
                    groupedData[row.KonseptAdi] = Array(12).fill(0);
                }
                groupedData[row.KonseptAdi][row.Ay - 1] = row.TalepSayisi;
            });

            Object.keys(groupedData).forEach(konsept => {
                datasets.push({
                    label: konsept,
                    data: groupedData[konsept],
                    backgroundColor: getKonseptColor(konsept)
                });
            });

            res.json({ labels, datasets });
        }
    });
});



// Konseptlere özel renk atamaları
function getKonseptColor(konsept) {
    const colors = {
        "Kır Düğünü Konsepti": "#8BC34A",
        "Sahil Düğünü Konsepti": "#00BCD4",
        "Salon Düğünü Konsepti": "#1E88E5"
    };
    return colors[konsept] || "#CCCCCC"; // Anahtar bulunamazsa varsayılan renk
}


// API: Aylık Talepler Grafiği
// API: Aylık Talepler Grafiği
router.get('/aylik-talepler', (req, res) => {
    const category = req.query.category;
    if (!category) {
        res.status(400).json({ error: 'Kategori parametresi eksik!' });
        return;
    }

    const sql = `CALL AylikTalepler(?)`; // Saklı yordamı çağır
    db.query(sql, [category], (err, results) => {
        if (err) {
            console.error('Veri alınırken hata oluştu:', err.message);
            res.status(500).json({ error: 'Veri alınamadı' });
        } else {
            const labels = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
            const data = Array(12).fill(0);

            // Saklı yordam sonuçlarını işle
            results[0].forEach(row => {
                data[row.Ay - 1] = row.TalepSayisi;
            });

            console.log('Dönen Aylık Talepler:', data); // Konsola yazdır

            res.json({
                labels: labels,
                datasets: [
                    {
                        label: `Aylık Talepler (${category})`,
                        data: data,
                        backgroundColor: '#1E88E5'
                    }
                ]
            });
        }
    });
});




// API: Detay Gelir Getirileri Grafiği
router.get('/revenue-data', (req, res) => {
    const category = req.query.category;
    if (!category) {
        res.status(400).json({ error: 'Kategori parametresi eksik!' });
        return;
    }

    const sql = `CALL detaygelirgetirileri(?)`; // Saklı yordamı çağır
    db.query(sql, [category], (err, results) => {
        if (err) {
            console.error('Veri alınırken hata oluştu:', err.message);
            res.status(500).json({ error: 'Veri alınamadı' });
        } else {
            const labels = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
            const data = Array(12).fill(0);

            // Saklı yordam sonuçlarını işleyerek grafik verilerini hazırla
            results[0].forEach(row => {
                data[row.Ay - 1] = parseFloat(row.ToplamGelir);
            });

            // Min ve max değerleri hesapla
            const minValue = Math.min(...data.filter(value => value > 0)) || 0;
            const maxValue = Math.max(...data) || 1000; // Varsayılan max değeri 1000

            res.json({
                labels: labels,
                datasets: [
                    {
                        label: `Gelir Getirileri (${category})`,
                        data: data,
                        borderColor: '#4CAF50',
                        backgroundColor: 'transparent',
                        tension: 0.3,
                        fill: false
                    }
                ],
                min: minValue,
                max: maxValue
            });
        }
    });
});





// Ortalama Maliyetler API
router.get('/average-costs', (req, res) => {
    const year = req.query.year || 2024; // Varsayılan yıl
    const sql = `CALL OrtalamaMaliyetByYear(?)`;

    db.query(sql, [year], (err, results) => {
        if (err) {
            console.error('Ortalama Maliyetler verisi alınırken hata oluştu:', err.message);
            res.status(500).json({ error: 'Veri alınamadı' });
        } else if (!results[0] || results[0].length === 0) {
            console.warn(`Seçilen yıl (${year}) için veri bulunamadı.`);
            res.json({ labels: [], data: [], min: 0, max: 0 }); // Boş grafik için JSON döndür
        } else {
            const labels = results[0].map(row => row.EtkinlikTuru); // Etkinlik türlerini al
            const data = results[0].map(row => parseFloat(row.OrtalamaMaliyet)); // Ortalama maliyetleri al

            // Min ve max değerleri hesapla
            const min = Math.min(...data);
            const max = Math.max(...data);

            res.json({ labels, data, min, max }); // JSON olarak frontend'e döndür
        }
    });
});


// Kişi Kapasitesine Bağlı Maliyetler API
router.get('/capacity-costs', (req, res) => {
    const category = req.query.category; // Tıklanan kategori
    const year = req.query.year || new Date().getFullYear(); // Varsayılan olarak mevcut yıl
    const sql = category === 'Düğün' 
        ? `CALL KapasiteVeKonseptGoreMaliyet(?)` 
        : `CALL KapasiteyeGoreMaliyet(?, ?)`;

    const params = category === 'Düğün' ? [category] : [category, year];

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error('Kişi Kapasitesine Bağlı Maliyetler verisi alınırken hata oluştu:', err.message);
            res.status(500).json({ error: 'Veri alınamadı' });
        } else if (!results[0] || results[0].length === 0) {
            console.error('Veritabanı boş sonuç döndürdü.');
            res.status(404).json({ error: 'Veri bulunamadı' });
        } else if (category === 'Düğün') {
            // Sabit kişi kapasitesi aralıkları
            const fixedRanges = ['0-50', '50-100', '100-300', '300-500'];
            const groupedData = {
                kirDugunu: Array(fixedRanges.length).fill(0),
                sahilDugunu: Array(fixedRanges.length).fill(0),
                salonDugunu: Array(fixedRanges.length).fill(0),
                toplamMaliyet: Array(fixedRanges.length).fill(0)
            };

            // Gelen veriyi sabit aralıklara grupla
            results[0].forEach(row => {
                const capacity = parseInt(row.KisiKapasitesi, 10);
                const rangeIndex = 
                    capacity <= 50 ? 0 :
                    capacity <= 100 ? 1 :
                    capacity <= 300 ? 2 : 3;

                groupedData.kirDugunu[rangeIndex] += parseFloat(row.KirDugunu) || 0;
                groupedData.sahilDugunu[rangeIndex] += parseFloat(row.SahillDugunu) || 0;
                groupedData.salonDugunu[rangeIndex] += parseFloat(row.SalonDugunu) || 0;
                groupedData.toplamMaliyet[rangeIndex] += parseFloat(row.ToplamMaliyet) || 0;
            });

            console.log('Düğün için API Yanıtı:', { fixedRanges, groupedData });

            res.json({ 
                labels: fixedRanges, 
                ...groupedData
            });
        } else {
            // Diğer kategoriler için sabit kişi kapasitesi aralıklarına göre grupla
            const fixedRanges = ['0-50', '50-100', '100-300', '300-500'];
            const groupedData = Array(fixedRanges.length).fill(0);

            results[0].forEach(row => {
                const capacity = parseInt(row.KisiKapasitesi, 10);
                const rangeIndex = 
                    capacity <= 50 ? 0 :
                    capacity <= 100 ? 1 :
                    capacity <= 300 ? 2 : 3;

                groupedData[rangeIndex] += parseFloat(row.OrtalamaMaliyet) || 0;
            });

            console.log('Diğer Kategoriler için API Yanıtı:', { fixedRanges, groupedData });

            res.json({
                labels: fixedRanges,
                toplamMaliyet: groupedData
            });
        }
    });
});






// Harcama Dağılımı API
router.get('/spending-distribution', (req, res) => {
    const category = req.query.category;
    const year = req.query.year || new Date().getFullYear();
    const sql = `CALL HarcamaDagilimiByYearAndEvent(?, ?)`;

    console.log(`Harcama Dağılımı API çağrısı: Kategori = ${category}, Yıl = ${year}`);

    db.query(sql, [category, year], (err, results) => {
        if (err) {
            console.error('Harcama Dağılımı verisi alınırken hata oluştu:', err.message);
            return res.status(500).json({ error: 'Veri alınamadı' });
        }

        if (!results || !results[0] || results[0].length === 0) {
            console.warn(`Kategori "${category}" ve yıl "${year}" için veri bulunamadı.`);
            return res.json({ labels: [], data: [] });
        }

        const labels = results[0].map(row => row.MaliyetTuru);
        const data = results[0].map(row => parseFloat(row.ToplamTutar) || 0);

        console.log('Harcama Dağılımı API yanıtı:', { labels, data });
        res.json({ labels, data });
    });
});









module.exports = router;
