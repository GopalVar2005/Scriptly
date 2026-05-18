const Joi = require('joi');

const registerSchema = Joi.object({
    username: Joi.string().min(3).messages({
        'string.min': 'Username must be at least 3 characters.'
    }), // optional display name
    email: Joi.string().email().required().messages({
        'string.email': 'Please enter a valid email address.',
        'any.required': 'Email is required.'
    }),
    password: Joi.string().min(6).required().messages({
        'string.min': 'Password must be at least 6 characters.',
        'any.required': 'Password is required.'
    })
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
