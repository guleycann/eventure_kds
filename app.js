const express = require('express');
const path = require('path');
const db = require('./db'); // db.js dosyasını dahil ettik
const cors = require('cors'); // cors modülünü import ettik

const app = express();
const port = 3000;

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Statik dosyalar için 'public' klasörü
app.use(express.static('public'));


app.use('/js', express.static(path.join(__dirname, 'public', 'js'), {
    setHeaders: (res, path) => {
      if (path.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
      }
    },
  }));
  


// HTML dosyasını işlemek için route
app.get('/paket_analizi', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'paket_analizi.html'));
  });


// Routes
app.use('/', require('./routes/index'));

// Ana sayfa için yönlendirme
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'category-dashboard.html'));
});

app.get('/yeni_talep', (req, res) => {
    res.sendFile(__dirname + '/views/yeni_talep.html'); // Yeni Talep Oluştur sayfası
});

// Views klasörünü static olarak dahil etme
app.use(express.static(path.join(__dirname, 'views')));

// Veritabanı bağlantısını test eden bir endpoint
app.get('/test-db', (req, res) => {
    db.query('SELECT 1 + 1 AS solution', (err, results) => {
        if (err) {
            console.error('Veritabanı hatası:', err.message);
            res.status(500).send('Veritabanı bağlantı hatası');
        } else {
            res.send(`Veritabanı bağlantısı başarılı! Sonuç: ${results[0].solution}`);
        }
    });
});



// Middleware
app.use(cors());
app.use(express.json());


app.post('/get-analysis', (req, res) => {
    const { eventType, capacity, year } = req.body;
     // Gelen parametreleri kontrol edin:
     console.log('Event Type:', eventType);
     console.log('Capacity:', capacity);
     console.log('Year:', year);
 

    console.log('Request Body:', req.body);

    const kapasiteButceQuery = `
        SELECT 
            CASE
                WHEN kisi_kapasitesi <= 100 THEN '0-100'
                WHEN kisi_kapasitesi <= 200 THEN '101-200'
                ELSE '201+'
            END AS kapasite_grubu,
            AVG(butce) AS ort_butce
        FROM talepler
        WHERE etkinlik_turu = ?
        GROUP BY kapasite_grubu;
    `;

    const mekanQuery = `
        SELECT 
            mekan_adi, 
            mekan_kapasite_min, 
            mekan_kapasite_max, 
            fiyat, 
            fiyat_tipi, 
            CASE 
                WHEN fiyat_tipi = 'kapasite' THEN fiyat_kişi_başı * ?
                ELSE fiyat
            END AS hesaplanan_fiyat
        FROM mekanlar
        WHERE etkinlik_turu = ? AND mekan_kapasite_min <= ? AND mekan_kapasite_max >= ?;
    `;

    db.query(kapasiteButceQuery, [eventType], (err, kapasiteButceResults) => {
        if (err) {
            console.error('Error executing kapasiteButceQuery:', err);
            return res.status(500).send('Kapasite Bütçe sorgusu çalıştırılamadı.');
        }

        db.query(mekanQuery, [capacity, eventType, capacity, capacity], (err, mekanResults) => {
            if (err) {
                console.error('Error executing mekanQuery:', err);
                return res.status(500).send('Mekan sorgusu çalıştırılamadı.');
            }

            const kapasiteGruplari = kapasiteButceResults.map((row) => row.kapasite_grubu);
            const ortBütceler = kapasiteButceResults.map((row) => row.ort_butce);

            const mekanlar = mekanResults.map((row) => ({
                mekan_adi: row.mekan_adi,
                mekan_kapasite_min: row.mekan_kapasite_min,
                mekan_kapasite_max: row.mekan_kapasite_max,
                fiyat: row.hesaplanan_fiyat,
                fiyat_tipi: row.fiyat_tipi,
            }));

            const sabitFiyatlar = mekanResults
            .filter((row) => row.fiyat_tipi.toLowerCase() === 'sabit')
            .map((row) => parseFloat(row.hesaplanan_fiyat));
        
            const kisiBasiFiyatlar = mekanResults
            .filter((row) => row.fiyat_tipi.toLowerCase() === 'kapasite')
            .map((row) => parseFloat(row.hesaplanan_fiyat));
        

            res.json({
                kapasiteButce: { kapasiteGruplari, ortBütceler },
                mekanFiyat: { kapasiteGruplari, sabitFiyatlar, kisiBasiFiyatlar },
                mekanListesi: mekanlar,
            });
        });
    });
});






app.post('/api/mekan-isbirligi', (req, res) => {
  const { mekan_adi, kapasite_min, kapasite_max, fiyat, fiyat_tipi } = req.body;

  // Veriyi mekan_işbirliği tablosuna ekle
  const query = `
       INSERT INTO \`mekan_işbirliği\` (mekan_adi, kapasite_min, kapasite_max, fiyat, fiyat_tipi) 
        VALUES (?, ?, ?, ?, ?)
  `;
  db.query(query, [mekan_adi, kapasite_min, kapasite_max, fiyat, fiyat_tipi], (err, result) => {
      if (err) {
          console.error('Mekan işbirliği eklenirken hata:', err);
          return res.status(500).json({ message: 'Bir hata oluştu' });
      }
      res.status(201).json({ message: 'Mekan işbirliği talebi başarıyla kaydedildi' });
  });
});










app.get('/api/mekan-son-aktiviteler', (req, res) => {
  const query = `
      SELECT mekan_adi, talep_tarihi 
      FROM \`mekan_işbirliği\` 
      ORDER BY talep_tarihi DESC 
      LIMIT 5
  `;

  db.query(query, (err, results) => {
      if (err) {
          console.error('Son aktiviteler alınırken hata:', err);
          return res.status(500).json({ message: 'Bir hata oluştu' });
      }
      res.status(200).json(results);
  });
});










app.get('/api/getData', (req, res) => {
    const { eventType, year } = req.query;
  
    // Gelen parametreleri kontrol et
    if (!eventType || !year) {
      console.error(`Eksik parametre: { eventType: '${eventType}', year: '${year}' }`);
      return res.status(400).json({ error: 'Etkinlik türü veya yıl eksik!' });
    }
  
    // Saklı yordamı çağır
    db.query('CALL GetPaketData(?, ?)', [eventType, year], (err, results) => {
      if (err) {
        console.error('Saklı yordam hatası:', err.message);
        res.status(500).send('Internal Server Error');
        return;
      }
  
      // MySQL saklı yordam genelde iç içe bir dizi döndürür
      const rows = results[0]; // İlk sonuç kümesini alıyoruz
  
      // Eğer veri yoksa boş bir dizi döndür
      if (!rows || rows.length === 0) {
        console.warn('Saklı yordamdan boş veri döndü.');
        res.json([]);
        return;
      }
  
      // Veriyi işleyip JSON olarak döndür
      res.json(
        rows.map((row) => ({
          label: row.label,
          price: row.price,
          preference: row.preference,
          profit: row.profit,
          details: row.details.split(', '), // Açıklamaları listeye çevir
          color: `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.5)`, // Rastgele renk
        }))
      );
    });
  });






  app.get('/api/getInitialData', (req, res) => {
    const { eventType, year } = req.query;

    if (!eventType || !year) {
        console.error(`Eksik parametre: { eventType: '${eventType}', year: '${year}' }`);
        return res.status(400).json({ error: 'Etkinlik türü ve yıl gereklidir.' });
    }

    const query = 'CALL GetPaketData(?, ?)';
    db.query(query, [eventType, parseInt(year)], (error, results) => {
        if (error) {
            console.error('MySQL sorgu hatası:', error.message);
            return res.status(500).json({ error: 'Veriler alınırken bir hata oluştu.' });
        }

        if (!results[0] || results[0].length === 0) {
            console.error('Başlangıç verileri boş döndü.');
            return res.status(404).json({ error: 'Başlangıç verileri bulunamadı.' });
        }

        const initialData = {};
        results[0].forEach((item) => {
            initialData[item.label] = {
                price: item.price,
                preference: item.preference,
                profit: item.profit,
            };
        });

        res.json(initialData);
    });
});
















const reportsRouter = require('./routes/reports');
app.use('/api/reports', reportsRouter);

// Start server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});


//////