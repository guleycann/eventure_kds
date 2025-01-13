let pieChart; // Grafik nesnesi için global bir değişken tanımlayın

document.addEventListener('DOMContentLoaded', () => {
    // En Popüler Etkinlikler Grafiği
    fetch('/api/reports/en-populer-etkinlikler')
        .then(response => response.json())
        .then(data => {
            const labels = data.map(item => item.EtkinlikTuru); // Etiketler
            const values = data.map(item => item.TalepSayisi); // Değerler

            const ctx = document.getElementById('pieChart').getContext('2d');

            // Eğer daha önce bir grafik varsa, yok et
            if (pieChart) {
                pieChart.destroy();
            }

            // Yeni grafik oluştur
            pieChart = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: labels,
                    datasets: [{
                        data: values,
                        backgroundColor: ['#6A0DAD', '#FF4500', '#FF8C00', '#B22222', '#8B008B', '#1E90FF'],
                        borderColor: '#FFFFFF',
                        borderWidth: 2
                    }]
                },
                options: {
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                font: { size: 14 },
                                color: '#000'
                            }
                        }
                    },
                    onClick: (event, elements) => {
                        if (elements.length > 0) {
                            const index = elements[0].index; // Tıklanan dilimin indeksi
                            const selectedCategory = labels[index]; // Tıklanan kategorinin adı
                            // Detay sayfasına yönlendirme
                            window.location.href = `/category-detail.html?category=${encodeURIComponent(selectedCategory)}`;
                        }
                    }
                }
            });
        })
        .catch(error => console.error('Veri alınırken hata oluştu:', error));
});

let barChart; // Bar grafik nesnesi

document.addEventListener('DOMContentLoaded', () => {
    // API'den veri çek
    fetch('/api/reports/bar-chart-data')
        .then(response => response.json())
        .then(data => {
            const ctx = document.getElementById('barChart').getContext('2d');

            // Mevcut grafik varsa yok et
            if (barChart) barChart.destroy();

            // Yeni grafik oluştur
            barChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: data.labels, // Ay isimleri
                    datasets: data.datasets.map(dataset => ({
                        ...dataset, // Diğer özellikleri koru
                        backgroundColor: dataset.backgroundColor || "#000000" // API'den gelen rengi ata veya varsayılan kullan
                    }))
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true // Y ekseni sıfırdan başlasın
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'bottom', // Grafiğin altına yerleştir
                        }
                    }
                }
            });
        })
        .catch(error => console.error('Etkinlik Türlerine Göre Kişi Kapasiteleri verisi alınırken hata oluştu:', error));
});

let lineChart; // Line grafik nesnesi

document.addEventListener('DOMContentLoaded', () => {
    // API'den veri çek
    fetch('/api/reports/gelir-getirileri-data')
        .then(response => response.json())
        .then(data => {
            const ctx = document.getElementById('lineChart').getContext('2d');

            // Mevcut grafik varsa yok et
            if (lineChart) lineChart.destroy();

            // Yeni grafik oluştur
            lineChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.labels, // Ay isimleri
                    datasets: data.datasets // Her etkinlik türü için veri seti
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true, // Y ekseni sıfırdan başlasın
                            min: 0, // Minimum değer
                            max: 350000, // Maximum değer (331,000'i kapsayacak şekilde ayarladık)
                            ticks: {
                                stepSize: 50000 // Her bir adım 50,000 artacak
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'top' // Legend'i üstte göster
                        }
                    }
                }
            });
        })
        .catch(error => console.error('Gelir Getirileri verisi alınırken hata oluştu:', error));
});
