let bubbleChart;

// Backend'den verileri çek ve grafiği güncelle
async function fetchData(eventType, year) {
  if (!eventType || !year) {
      console.error("Etkinlik türü veya yıl seçilmedi!");
      alert("Lütfen etkinlik türü ve yılı seçin.");
      return;
  }

  try {
      const response = await fetch(`/api/getData?eventType=${eventType}&year=${year}`);
      if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!Array.isArray(data) || data.length === 0) {
          console.warn('Boş veya hatalı veri alındı:', data);
          updateChart([]);
          return;
      }

      // Tercih oranlarını kontrol ederek güncelle
      data.forEach((item) => {
          const preferenceSpan = document.getElementById(`slider${item.label.slice(-1)}Preference`);
          if (preferenceSpan) {
              // Eğer item.preference sayısal değilse, varsayılan 0 kullan
              const preference = typeof item.preference === "number" ? item.preference : 0;
              preferenceSpan.textContent = preference.toFixed(2); // Dinamik tercih oranı
          }
      });

      updateChart(data);
  } catch (error) {
      console.error('Veri çekme hatası:', error);
      alert('Veriler alınırken bir hata oluştu. Lütfen tekrar deneyin.');
      updateChart([]);
  }
}


// Grafiği güncelle
function updateChart(data) {
  const ctx = document.getElementById('bubbleChart').getContext('2d');

  if (bubbleChart) {
    bubbleChart.destroy();
  }

  bubbleChart = new Chart(ctx, {
    type: 'bubble',
    data: {
      datasets: data.map((item) => ({
        label: item.label,
        data: [
          {
            x: parseFloat(item.price),
            y: parseFloat(item.preference),
            r: Math.max(Math.min(item.profit / 500, 50), 5), // Min 5, Max 50
            label: item.label,
            details: item.details,
            cost: parseFloat(item.price) - parseFloat(item.profit), // Maliyet
          },
        ],
        backgroundColor: item.color,
      })),
    },
    options: {
        responsive: true,
        scales: {
            x: {
                title: { display: true, text: "Fiyat (₺)" },
                min: 5000,
                max: 200000,
            },
            y: {
                title: { display: true, text: "Tercih Oranı (%)" },
                min: 0,
                max: 100,
            },
        },
      plugins: {
        tooltip: {
          callbacks: {
            label: function (context) {
              const data = context.raw;
              const price = parseFloat(data.x) || 0;
              const preference = parseFloat(data.y) || 0;
              const profit = (data.r || 0) * 500;
              return [
                `${context.dataset.label}`,
                `Fiyat: ${price.toFixed(2)}₺`,
                `Tercih Oranı: ${preference.toFixed(2)}%`,
                `Karlılık: ${profit.toFixed(2)}₺`,
              ];
            },
          },
        },
      },
      onClick: (event, elements) => {
        if (elements.length > 0) {
          const elementIndex = elements[0].index;
          const datasetIndex = elements[0].datasetIndex;
          const dataset = bubbleChart.data.datasets[datasetIndex];
          const selectedData = dataset.data[elementIndex];

          if (selectedData) {
            console.log('Tıklanan Balon:', selectedData);
            showPackageDetails(selectedData);
          }
        } else {
          console.log('Hiçbir balon seçilmedi.');
        }
      },
    },
  });
}

// Paket detaylarını göster
function showPackageDetails(data) {
  const titleElement = document.getElementById('packageTitle');
  const detailsElement = document.getElementById('packageDetails');

  if (!data || !data.label || !data.details) {
    titleElement.textContent = 'Seçili Paket Detayları Bulunamadı';
    detailsElement.innerHTML = '<li>Detaylar bulunamadı</li>';
    return;
  }

  const price = parseFloat(data.x) || 0;
  const preference = parseFloat(data.y) || 0;
  const profit = (data.r || 0) * 500;

  const additionalDetails = `
    <li>Fiyat: ${price.toFixed(2)}₺</li>
    <li>Tercih Oranı: ${preference.toFixed(2)}%</li>
    <li>Karlılık: ${profit.toFixed(2)}₺</li>
  `;

  titleElement.textContent = `${data.label} Detayları`;
  detailsElement.innerHTML =
    data.details.length > 0
      ? data.details.map((detail) => `<li>${detail}</li>`).join('') + additionalDetails
      : '<li>Detaylar bulunamadı</li>';
}

// Resetleme fonksiyonu
// Resetleme fonksiyonu
// Resetleme Fonksiyonu
async function resetBubble(packageName) {
  if (!bubbleChart) return;

  const eventType = document.getElementById('eventType').value;
  const year = document.getElementById('yearSelect').value;

  if (!eventType || !year) {
      alert("Lütfen etkinlik türü ve yılı seçin!");
      return;
  }

  try {
      const response = await fetch(`/api/getInitialData?eventType=${eventType}&year=${year}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const initialData = await response.json();
      if (!initialData[packageName]) {
          console.error(`Başlangıç verileri ${packageName} için bulunamadı.`);
          return;
      }

      const dataset = bubbleChart.data.datasets.find((d) => d.label === packageName);
      if (!dataset) {
          console.error(`Grafikte ${packageName} bulunamadı.`);
          return;
      }

      const initial = initialData[packageName];
      const initialPrice = parseFloat(initial.price);

      // Resetleme işlemleri
      dataset.data[0].x = initialPrice;
      dataset.data[0].y = parseFloat(initial.preference);
      dataset.data[0].r = Math.max(Math.min(parseFloat(initial.profit) / 500, 50), 5);

      // Slider başlangıç değerine dönüyor
      const sliderId = `slider${packageName.slice(-1)}`;
      const sliderElement = document.getElementById(sliderId);
      sliderElement.value = initialPrice; // Slider başlangıç değerini ayarla

      // Görünen metin ve değerleri güncelle
      document.getElementById(`${sliderId}Value`).textContent = `${initialPrice.toFixed(2)}₺`;
      document.getElementById(`${sliderId}Effect`).innerHTML = `
          <li>Değişim: 0₺</li>
          <li>Karlılık: ${parseFloat(initial.profit).toFixed(2)}₺</li>
          <li>Tercih Oranı: ${parseFloat(initial.preference).toFixed(2)}%</li>
      `;

      bubbleChart.update(); // Grafiği güncelle
  } catch (error) {
      console.error('Başlangıç verisi çekme hatası:', error);
      alert('Başlangıç verileri alınamadı. Lütfen daha sonra tekrar deneyin.');
  }
}

// Slider Değişim Mantığı
// Slider için yardımcı fonksiyon
// Slider için yardımcı fonksiyon
function handleSliderInput(sliderId, packageName) {
  const slider = document.getElementById(sliderId);
  const valueDisplay = document.getElementById(`${sliderId}Value`);
  const effectDisplay = document.getElementById(`${sliderId}Effect`);

  slider.addEventListener('input', (e) => {
      const newValue = parseFloat(e.target.value);
      const dataset = bubbleChart.data.datasets.find((d) => d.label === packageName);
      if (!dataset) return;

      const originalPrice = dataset.data[0].x; // Başlangıç fiyatı
      const basePreference = dataset.data[0].y; // Başlangıç tercih oranı
      const cost = dataset.data[0].cost || 0;

      // Hassasiyet faktörü ve fiyat değişimine göre tercih oranı hesaplama
      const sensitivityFactor = 0.1; // Fiyat değişiminin tercih oranına etkisi
      const priceChangePercentage = (newValue - originalPrice) / originalPrice; // Fiyat değişim yüzdesi
      const newPreference = Math.max(Math.min(basePreference * (1 - priceChangePercentage * sensitivityFactor), 100), 0);

      // Yeni kar hesaplama
      const newProfit = Math.max(newValue - cost, 0);

      // Baloncuk boyutunu ayarla
      const newBubbleSize = Math.max(Math.min(newProfit / 500, 50), 5);

      // Güncellenmiş değerleri ekrana yansıt
      valueDisplay.textContent = `${newValue.toFixed(2)}₺`;
      effectDisplay.innerHTML = `
          <li>Değişim: ${(newValue - originalPrice).toFixed(2)}₺</li>
          <li>Karlılık: ${newProfit.toFixed(2)}₺</li>
          <li>Tercih Oranı: ${newPreference.toFixed(2)}%</li>
      `;

      // Grafikteki baloncuk değerlerini güncelle
      dataset.data[0].x = newValue;
      dataset.data[0].y = newPreference;
      dataset.data[0].r = newBubbleSize;

      bubbleChart.update();
  });
}



// Slider'lar için etkinlik bağlama
handleSliderInput('sliderA', 'Paket A');
handleSliderInput('sliderB', 'Paket B');
handleSliderInput('sliderC', 'Paket C');


// Event listeners
document.getElementById('eventType').addEventListener('change', (e) => {
  const eventType = e.target.value;
  const year = document.getElementById('yearSelect').value;

  if (eventType) {
    fetchData(eventType, year);
  } else {
    updateChart([]);
  }
});

document.getElementById('yearSelect').addEventListener('change', (e) => {
  const eventType = document.getElementById('eventType').value;
  const year = e.target.value;

  if (eventType) {
    fetchData(eventType, year);
  }
});





// İlk yükleme
updateChart([]);



