const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');

const Profile = require('../../models/Profile');
const User = require('../../models/User');
const Post = require('../../models/Post');


// @route    GET api/posts
// @desc     Test route
// @access   Public 

router.get('/', (req, res) => res.send('Posts route'));

module.exports = router;