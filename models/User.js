const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new mongoose.Schema({
    // keep username as an optional display name; use email as the passport usernameField
    username: { type: String, trim: true },
    email: { type: String, required: true, unique: true, trim: true }
}, { timestamps: true });

// Configure passport-local-mongoose to use email as the login field
userSchema.plugin(passportLocalMongoose, { usernameField: 'email' }); // use email for authentication

const User = mongoose.model('User', userSchema);
module.exports = User;
