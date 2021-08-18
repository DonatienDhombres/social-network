const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');

const Profile = require('../../models/Profile');
const User = require('../../models/User');
const Post = require('../../models/Post');


// @route    POST api/posts
// @desc     Create post
// @access   Private 

router.post('/', [
    auth,
    [
        check('text', 'Text is required')
            .not()
            .isEmpty()
    ]
],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const user = await User.findById(req.user.id).select('-password');

            const newPost = {
                text: req.body.text,
                name: user.name,
                avatar: user.avatar,
                user: req.user.id
            }


            //Create
            const post = new Post(newPost);
            await post.save();
            res.json(post);

            //Update
            // let existingPost = await Post.findOne({});
            // if (existingPost) {
            //     //Update
            //     return res.json(existingPost)
            // }





        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server error')
        }
    });

router.get('/:post_id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.post_id);
        res.send(post);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error')
    }
});


module.exports = router;