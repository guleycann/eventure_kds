console.log('JavaScript Yüklendi');
document.getElementById('analizYap').addEventListener('click', () => {
    console.log('Butona Tıklandı');
});


document.getElementById('analizYap').addEventListener('click', async () => {
    // Kullanıcıdan giriş alın
    const eventType = document.getElementById('etkinlikTuru').value;
    const capacity = parseInt(document.getElementById('kisiKapasitesi').value);
    const year = document.getElementById('yil').value;

    // Kullanıcı girişini doğrula
    if (!capacity || capacity <= 0) {
        alert('Lütfen geçerli bir kişi kapasitesi girin.');
        return;
    }

    try {
        // Backend'e POST isteği gönder
        const response = await fetch('/get-analysis', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                eventType, // Backend'de eventType ile eşleşiyor
                capacity,  // Backend'de capacity ile eşleşiyor
                year,      // Backend'de year ile eşleşiyor
            }),
        });

        if (!response.ok) {
            throw new Error(`Sunucu hatası: ${response.status}`);
        }

        const data = await response.json(); // JSON yanıtını çözümle
        console.log('Backend\'den Gelen Veri:', data); // Debug için logla

        // Backend'den dönen verileri kontrol et
        if (data.kapasiteButce && data.mekanFiyat && data.mekanListesi) {
            createKapasiteButceGrafik(data.kapasiteButce);
            createMekanFiyatGrafik(data.mekanFiyat);
            updateMekanListesi(data.mekanListesi);
        } else {
            alert('Backend\'den eksik veri döndü.');
            console.error('Eksik veri:', data);
        }

    } catch (error) {
        console.error('Sunucuyla bağlantıda bir hata oluştu:', error);
        alert('Sunucuyla bağlantıda bir hata oluştu. Lütfen tekrar deneyin.');
    }
});

// Talep Kapasite ve Bütçe Analizi Grafiği Oluşturma
function createKapasiteButceGrafik(data) {
    const ctx = document.getElementById('kapasiteButceGrafik').getContext('2d');

    // Eğer daha önce grafik oluşturulmuşsa yok et
    if (window.kapasiteButceChart) {
        window.kapasiteButceChart.destroy();
    }

    window.kapasiteButceChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.kapasiteGruplari,
            datasets: [
                {
                    label: 'Ortalama Bütçe',
                    data: data.ortBütceler.map(Number), // String değerleri sayıya çevir
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                },
            ],
        },
        options: { responsive: true },
    });
}

// Mekan Fiyat Analizi Grafiği Oluşturma
function createMekanFiyatGrafik(data) {
    const ctx = document.getElementById('mekanFiyatGrafik').getContext('2d');

    // Eğer daha önce grafik oluşturulmuşsa yok et
    if (window.mekanFiyatChart) {
        window.mekanFiyatChart.destroy();
    }

    window.mekanFiyatChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.kapasiteGruplari, // Backend'den gelen kapasite grupları
            datasets: [
                {
                    label: 'Sabit Fiyatlar',
                    data: data.sabitFiyatlar.length ? data.sabitFiyatlar.map(Number) : [0, 0, 0], // Boşsa varsayılan değer
                    backgroundColor: 'rgba(255, 99, 132, 0.6)',
                },
                {
                    label: 'Kişi Başı Fiyatlar',
                    data: data.kisiBasiFiyatlar.length ? data.kisiBasiFiyatlar.map(Number) : [0, 0, 0], // Boşsa varsayılan değer
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                },
            ],
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                },
            },
        },
    });
}


// Mekan Listesini Güncelleme
function updateMekanListesi(mekanlar) {
    const tbody = document.getElementById('mekanListesi');
    if (!tbody) {
        console.error('Mekan listesi için uygun bir tablo bulunamadı.');
        return;
    }

    tbody.innerHTML = ''; // Önceki verileri temizle
    mekanlar.forEach((mekan) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${mekan.mekan_adi}</td>
            <td>${mekan.mekan_kapasite_min}</td>
            <td>${mekan.mekan_kapasite_max}</td>
            <td>${parseFloat(mekan.fiyat).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</td>
            <td>${mekan.fiyat_tipi}</td>
            <td><button>Talep Et</button></td>
        `;


        const button = row.querySelector('button');
        button.addEventListener('click', () => {
            // Talep bilgilerini API'ye gönder
            fetch('/api/mekan-isbirligi', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mekan_adi: mekan.mekan_adi,
                    kapasite_min: mekan.mekan_kapasite_min,
                    kapasite_max: mekan.mekan_kapasite_max,
                    fiyat: mekan.fiyat,
                    fiyat_tipi: mekan.fiyat_tipi
                })
            })
            .then(response => {
                if (response.ok) {
                    alert('Mekan işbirliği talebiniz başarıyla oluşturuldu!');
                } else {
                    alert('Bir hata oluştu, lütfen tekrar deneyin.');
                }
            });
        });







        tbody.appendChild(row);
    });
}
