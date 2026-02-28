const bcrypt = require('bcryptjs');
(async () => {
  const hash = '$2b$10$x0KoYtruBcU/7BH9.iHbvumnjf4mR5Nx81SZngBBpW11ndT3rypRG';
  const plain = 'admin123';
  console.log('hash:', hash);
  const match = await bcrypt.compare(plain, hash);
  console.log('match', match);
})();