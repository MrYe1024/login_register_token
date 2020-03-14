const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

mongoose.connect('mongodb://localhost:27017/register_login', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true
});

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: { type: String, 
    set(val) {
    return bcrypt.hashSync(val, 10);
  }
}
})

const User = mongoose.model('User', userSchema)

module.exports = { User }