let seasonalChart; // Grafik nesnesi

document.addEventListener('DOMContentLoaded', () => {
    // Seçilen kategoriye göre başlığı güncelle
    updateSeasonalTitle(getSelectedCategory());

    // API'den verileri al
    fetch(`/api/reports/seasonal-demands?category=${getSelectedCategory()}`)
        .then(response => response.json())
        .then(data => {
            const ctx = document.getElementById('seasonalChart').getContext('2d');

            if (seasonalChart) seasonalChart.destroy(); // Önceki grafiği yok et

            // Yeni grafik oluştur
            seasonalChart = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: data.labels, // Mevsimler
                    datasets: [{
                        data: data.values, // Talep Sayıları
                        backgroundColor: ['#0B3D91', '#50A1FF', '#A9D8FF', '#00416A'], // Mevsimler için renkler
                        borderColor: '#FFFFFF',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                font: { size: 14 },
                                color: '#000'
                            }
                        }
                    }
                }
            });
        })
        .catch(error => console.error('Mevsimlere Göre Talepler verisi alınırken hata oluştu:', error));
});

// Başlık güncelleme fonksiyonu
function updateSeasonalTitle(category) {
    const seasonTitleElement = document.getElementById('season-title');
    seasonTitleElement.textContent = `Mevsimlere Göre ${category} Talepleri`;
}

// URL'den Seçilen Kategoriyi Al
function getSelectedCategory() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('category') || 'default';
}


let conceptChart, monthlyChart;

document.addEventListener('DOMContentLoaded', () => {
    const conceptCtx = document.getElementById('conceptChart').getContext('2d');
    const monthlyCtx = document.getElementById('monthlyChart').getContext('2d');

    // Konsept Chart Başlangıç
    conceptChart = new Chart(conceptCtx, {
        type: 'bar',
        data: { labels: [], datasets: [] },
        options: {
            responsive: true,
            plugins: {
                legend: { display: true, position: 'top' }
            },
            scales: { y: { beginAtZero: true } }
        }
    });

    // Aylık Talepler Chart Başlangıç
    monthlyChart = new Chart(monthlyCtx, {
        type: 'line',
        data: { labels: [], datasets: [] },
        options: {
            responsive: true,
            plugins: {
                legend: { display: true, position: 'top' }
            },
            scales: { y: { beginAtZero: true } }
        }
    });

    updateConceptChart();
});

// Konsept ve Aylık Talepler Grafiği Güncelleme Fonksiyonu
function updateConceptChart() {
    const year = document.getElementById('yearSelect').value;
    const selectedCategory = getSelectedCategory();

    if (selectedCategory === 'Düğün') {
        // Konsept Talepleri
        fetch('/api/reports/concept-demands')
            .then(response => response.json())
            .then(data => {
                // Konsol çıktısı
                console.log('Konsept Talepleri Verisi:', data);

                conceptChart.data.labels = data.labels; // API'den gelen etiketler
                conceptChart.data.datasets = data.datasets; // API'den gelen veri setleri
                conceptChart.update();

                // Grafik Görünürlüğü
                document.getElementById('conceptChart').parentElement.style.display = 'block';
                document.getElementById('monthlyChartBox').style.display = 'none';
            })
            .catch(error => console.error('Konsept talepleri verisi alınırken hata:', error));
    } else {
        // Aylık Talepler
        const apiUrl = `/api/reports/aylik-talepler?category=${encodeURIComponent(selectedCategory)}`;
        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                monthlyChart.data.labels = data.labels;
                monthlyChart.data.datasets = data.datasets;
                monthlyChart.update();

                // Grafik Görünürlüğü
                document.getElementById('conceptChart').parentElement.style.display = 'none';
                document.getElementById('monthlyChartBox').style.display = 'block';
            })
            .catch(error => console.error('Aylık talepler verisi alınırken hata:', error));
    }
}




let revenueChart;

document.addEventListener('DOMContentLoaded', () => {
    const selectedCategory = new URLSearchParams(window.location.search).get('category');
    if (!selectedCategory) {
        console.error('Kategori parametresi eksik!');
        return;
    }

    // API'den veri çek
    const apiUrl = `/api/reports/revenue-data?category=${encodeURIComponent(selectedCategory)}`;
    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            console.log('Gelir Getirileri Verisi:', data); // Konsola yazdır

            const ctx = document.getElementById('revenueLineChart').getContext('2d');

            if (revenueChart) revenueChart.destroy(); // Mevcut grafik varsa yok et

            revenueChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.labels, // Ay isimleri
                    datasets: data.datasets // Gelir verileri
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            min: data.min, // API'den gelen min değeri kullan
                            max: data.max, // API'den gelen max değeri kullan
                            ticks: {
                                stepSize: Math.ceil((data.max - data.min) / 5) // 5 adımlı aralık oluştur
                            }
                        }
                    }
                }
            });
        })
        .catch(error => console.error('Gelir Getirileri verisi alınırken hata oluştu:', error));
});
