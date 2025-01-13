const express = require('express');
const path = require('path');
const router = express.Router();

// Login Sayfası
router.get('/', (req, res) => res.sendFile(path.join(__dirname, '../views/login.html')));

// Ana Sayfa
router.get('/main', (req, res) => res.sendFile(path.join(__dirname, '../views/main.html')));


// Agreements Sayfası
router.get('/agreements', (req, res) => res.sendFile(path.join(__dirname, '../views/agreements.html')));

// Kategori Analizleri Sayfası
router.get('/category-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/category-dashboard.html'));
});



router.get('/category-details', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/category-details.html'));
});

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/index.html'));
});

router.get('/cost-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/cost-dashboard.html'));
});






// Gereksiz Rotayı Kaldır (Örneğin Time-Dashboard ve Cost-Dashboard)
module.exports = router;
