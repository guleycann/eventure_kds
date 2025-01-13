const mysql = require('mysql2');

// Veritabanı bağlantısını oluşturun
const db = mysql.createConnection({
  host: 'localhost',       // MySQL sunucunuzun adresi (genelde localhost)
  user: 'root',            // MySQL kullanıcı adı
  password: '',            // MySQL şifresi (eğer varsa)
  database: 'eventure'     // Kullanacağınız veritabanı adı
});

// Bağlantıyı test edin
db.connect((err) => {
  if (err) {
    console.error('MySQL bağlantı hatası:', err.message);
  } else {
    console.log('MySQL bağlantısı başarılı!');
  }
});

module.exports = db;
