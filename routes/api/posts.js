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


// @route    GET api/posts
// @desc     Get all posts 
// @access   Private 

router.get('/', auth, async (req, res) => {
    try {
        const posts = await Post.find().sort({ date: -1 });
        res.json(posts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error')
    }
});

// @route    GET api/posts/:id
// @desc     Get post by id 
// @access   Private 

router.get('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        res.json(post);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Post not found' });
        }
        res.status(500).send('Server error')
    }
});

// @route    DELETE api/posts
// @desc     Delete all posts 
// @access   Private 

router.delete('/', auth, async (req, res) => {
    try {
        await Post.deleteMany();
        res.send('Posts sucessfully deleted');
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error')
    }
});

// @route    DELETE api/posts/:id
// @desc     Delete post by id 
// @access   Private 

router.delete('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        //Check user
        if (post.user.toString() !== req.user.id) {
            //toString() est important car post.user est un ObjectId, ce n'est pas une string
            return res.status(401).json({ msg: 'User not authorized' });
        }

        await post.remove();
        // ce que j'avais fait :
        // await Post.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Post removed' });

    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Post not found' });
        }
        res.status(500).send('Server error')
    }
});

// @route    PUT api/posts/like/:id
// @desc     Like a post 
// @access   Private 

router.put('/like/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            res.status(404).json({ msg: "post not found" });
        }

        //Check if the post has already been liked
        const likeIndex = post.likes.map(likeObject => likeObject.user._id).indexOf(req.user.id);
        if (likeIndex == -1) {
            // if (post.likes.filter(likeObject => likeObject.user.toString() === req.user.id).length > 0) {
            post.likes.unshift({ user: req.user.id })
            await post.save();
            return res.json(post.likes);
        }

        //Delete
        post.likes.splice(likeIndex, 1);
        await post.save();
        res.json({ msg: 'Like deleted', post: post })


    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error')
    }
})

// @route    POST api/posts/comment/:id
// @desc     Add comment to a post 
// @access   Private 

router.post('/comment/:id', [
    auth,
    [
        check('text', 'Text is required').not().isEmpty()
    ]
],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const post = await Post.findById(req.params.id);
            const user = await User.findById(req.user.id).select('-password');

            if (!post) {
                return res.status(404).json({ msg: 'Post not found' })
            }

            const commentFields = {
                text: req.body.text,
                user: req.user.id,
                name: user.name,
                avatar: user.avatar
            };

            post.comments.unshift(commentFields);
            await post.save();
            res.json(post.comments);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server error');

        }
    })

// @route    DELETE api/posts/comment/:id/:comment_id
// @desc     Delete comment of a post 
// @access   Private 

router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ msg: 'Post not found' })
        }

        //Check comment
        // const comment = post.comments.find(comment => comment.id === req.params.comment_id);
        const commentIndex = post.comments.map(comment => comment._id.toString()).indexOf(req.params.comment_id);
        if (commentIndex == -1) {
            return res.status(404).send('Comment not found')
        }


        //Check user of the post vs user of the request
        if (post.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized to delete the post' });
        };


        post.comments = post.comments.filter(comment => comment._id.toString() !== req.params.comment_id);
        await post.save();

        res.json(post.comments);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
})


module.exports = router;