const bcrypt = require('bcryptjs');
(async () => {
  const ok = await bcrypt.compare('test123', '$2b$10$BO9ZXzCyf4l05qDsvEPBfeSRx7XlSsIdOOqFpbw5JR4GRzeXJ4BxK');
  console.log(ok);
})();
