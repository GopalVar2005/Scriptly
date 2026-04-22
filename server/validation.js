const Joi = require('joi');

const registerSchema = Joi.object({
    username: Joi.string().min(3), // optional display name
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
});

const noteSchema = Joi.object({
    title: Joi.string().allow('', null).optional(),
    transcription: Joi.string().min(1).required(),
    summary: Joi.string().allow('', null).optional(),
    keywords: Joi.array().items(Joi.string()).optional()
}).unknown(true);

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

const youtubeSchema = Joi.object({
    url: Joi.string().uri().required()  //Uniform Resource Identifier, more general than URL
});

module.exports = { registerSchema, loginSchema, noteSchema, youtubeSchema };
