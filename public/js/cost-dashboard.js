let costChart; // Ortalama Maliyetler Grafiği
let detailChart; // Detay Grafiği
let spendingPieChart; // Harcama Dağılımı Grafiği

// Ortalama Maliyetler Grafiğini Çiz
function renderAverageCostChart(year) {
    fetch(`/api/reports/average-costs?year=${year}`)
        .then(response => response.json())
        .then(data => {
            const ctx = document.getElementById('costChart').getContext('2d');

            if (costChart) costChart.destroy(); // Mevcut grafik varsa yok et

            costChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: data.labels || [], // Etkinlik türleri
                    datasets: [{
                        label: 'Ortalama Maliyet (₺)',
                        data: data.data || [], // Ortalama maliyetler
                        backgroundColor: ['#AD6FE4', '#F77591', '#FED271', '#C4C6DB', '#85E3FF', '#A8DF65'],
                        borderRadius: 5
                    }]
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
                            ticks: {
                                callback: function (value) {
                                    return Math.round(value).toLocaleString('tr-TR'); // Küsüratsız değerler
                                }
                            }
                        }
                    },
                    onClick: (event, elements) => {
                        if (elements.length > 0) {
                            const index = elements[0].index;
                            const selectedCategory = data.labels[index];

                            renderDetailChart(selectedCategory, year); // Detay grafiği çiz
                            renderSpendingDistributionChart(selectedCategory, year); // Harcama Dağılımı grafiği çiz

                            // Zamanlayıcı ile ikinci tıklama sorununu önle
                            setTimeout(() => {
                                renderSpendingDistributionChart(selectedCategory, year);
                            }, 100);
                        }
                    }
                }
            });
        })
        .catch(error => console.error('Ortalama Maliyet Grafiği verisi alınamadı:', error));
}

// Yıl seçildiğinde grafiği güncelle
document.getElementById('yearSelect').addEventListener('change', (event) => {
    const selectedYear = event.target.value; // Seçili yıl
    renderAverageCostChart(selectedYear); // Seçilen yıla göre grafiği yeniden çiz
});


// Detay Grafiği Çiz
function renderDetailChart(category, year) {
    fetch(`/api/reports/capacity-costs?category=${encodeURIComponent(category)}&year=${year}`)
        .then(response => response.json())
        .then(data => {
            const ctx = document.getElementById('detailChart').getContext('2d');

            if (detailChart) detailChart.destroy(); // Mevcut grafik varsa yok et

            if (category === 'Düğün') {
                detailChart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: data.labels, // Sabit kişi kapasitesi aralıkları
                        datasets: [
                            { label: 'Kır Düğünü', data: data.kirDugunu || [], borderColor: '#FF6384', type: 'line', fill: false },
                            { label: 'Sahil Düğünü', data: data.sahilDugunu || [], borderColor: '#36A2EB', type: 'line', fill: false },
                            { label: 'Salon Düğünü', data: data.salonDugunu || [], borderColor: '#FFCE56', type: 'line', fill: false },
                            { label: 'Toplam Maliyet', data: data.toplamMaliyet || [], backgroundColor: '#5E60CE', type: 'bar' }
                        ]
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
                                ticks: {
                                    callback: function (value) {
                                        return Math.round(value).toLocaleString('tr-TR');
                                    }
                                }
                            }
                        }
                    }
                });
            } else {
                detailChart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: data.labels || [], // Sabit kişi kapasitesi aralıkları
                        datasets: [{
                            label: `${category} Maliyetleri`,
                            data: data.toplamMaliyet || [],
                            backgroundColor: '#5E60CE'
                        }]
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
                                ticks: {
                                    callback: function (value) {
                                        return Math.round(value).toLocaleString('tr-TR');
                                    }
                                }
                            }
                        }
                    }
                });
            }

            // Detay Başlığını Güncelle
            document.getElementById('detail-title').innerText = `${category} Detayları - Kişi Kapasitesine Bağlı Maliyetler`;
            document.getElementById('details').style.display = 'block';
        })
        .catch(error => console.error('Detay Maliyet Grafiği verisi alınamadı:', error));
}

// Harcama Dağılımı Grafiği Çiz
// Harcama Dağılımı Grafiği Çiz
function renderSpendingDistributionChart(category, year) {
    const pieChartElement = document.getElementById('pieChart');
    const secondDetails = document.getElementById('second-details');

    if (!pieChartElement || !secondDetails) {
        console.error('Gerekli DOM elemanları bulunamadı.');
        return;
    }

    fetch(`/api/reports/spending-distribution?category=${encodeURIComponent(category)}&year=${year}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`API hatası! Durum: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            const ctx = pieChartElement.getContext('2d');

            // Mevcut grafik varsa yok et
            if (spendingPieChart) {
                spendingPieChart.destroy();
            }

            // Veri yoksa uyarı ver ve DOM'u güncelle
            if (!data.labels.length) {
                console.warn(`"${category}" kategorisi için harcama dağılımı verisi bulunamadı.`);
                secondDetails.style.display = 'none';
                return;
            }

            // Yeni grafik oluştur
            spendingPieChart = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: data.labels,
                    datasets: [{
                        data: data.data,
                        backgroundColor: ['#5B4FBE', '#F76C6C', '#F9B85C', '#4ECDC4']
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top'
                        }
                    }
                }
            });

            // Grafiği görünür yap
            secondDetails.style.display = 'block';
        })
        .catch(error => {
            console.error('Harcama Dağılımı Grafiği verisi alınamadı:', error);

            if (spendingPieChart) {
                spendingPieChart.destroy();
                spendingPieChart = null;
            }

            secondDetails.style.display = 'none';
        });
}

// Sayfa Yüklendiğinde Ortalama Maliyetler Grafiğini Göster
document.addEventListener('DOMContentLoaded', () => {
    const defaultYear = document.getElementById('yearSelect').value;
    renderAverageCostChart(defaultYear);
});