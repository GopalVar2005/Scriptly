const Joi = require('joi');

const registerSchema = Joi.object({
    username: Joi.string().min(3), // optional display name
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
});

const noteSchema = Joi.object({
    content: Joi.string().min(1).required(),
    keywords: Joi.array().items(Joi.string())
});

module.exports = { registerSchema, noteSchema };
