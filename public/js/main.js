function sonAktiviteleriYukle() {
    fetch('/api/mekan-son-aktiviteler') // Backend'deki API'ye bağlan
        .then(response => response.json())
        .then(data => {
            const aktivitelerListesi = document.getElementById('son-aktiviteler-listesi'); // Listeyi seç

            // Listeyi temizle
            aktivitelerListesi.innerHTML = '';

            // Gelen verilerle listeyi doldur
            data.forEach((aktivite) => {
                const listItem = document.createElement('li'); // Yeni bir <li> oluştur
                listItem.textContent = `"${aktivite.mekan_adi}" için işbirliği talebi oluşturuldu (${new Date(aktivite.talep_tarihi).toLocaleString('tr-TR')})`;
                aktivitelerListesi.appendChild(listItem); // Listeye ekle
            });
        })
        .catch(error => {
            console.error('Son aktiviteler yüklenirken hata oluştu:', error); // Hata varsa konsola yaz
        });
}

// Sayfa yüklendiğinde "Son Aktiviteler" alanını doldur
document.addEventListener('DOMContentLoaded', sonAktiviteleriYukle);
