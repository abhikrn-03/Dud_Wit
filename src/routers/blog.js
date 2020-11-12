const express = require('express')
const Blog = require('../models/blog')
const connectEnsureLogin = require('connect-ensure-login')
const router = new express.Router()
const _ = require('lodash')
const User = require('../models/user')

let blogs = []

router.get('/compose', connectEnsureLogin.ensureLoggedIn('/users/login'), async (req, res) => {
    try {
        await res.render('compose', {
            title: 'Blogging',
            blogTitle: null,
            blogBody: null,
            penName: req.user.penName,
            name: req.user.name,
            avatar: req.user.avatar,
            age: req.user.age,
            email: req.user.email
        })
    } catch (e) {
        res.status(500).send(e)
    }
})

router.get('/community', async (req, res) => {
    try {
        blogs = await Blog.find({})
        blogs.reverse()
        if (req.user){
            await res.render('community', {
            title: 'They are something more than just blogs..',
            penName: req.user.penName,
            name: req.user.name,
            email: req.user.email,
            avatar: req.user.avatar,
            age: req.user.age,
            Flag: true,
            blogs
        })
        }
        else {
            await res.render('community', {
            title: 'They are something more than just blogs..',
            name: null,
            penName: null,
            email: null,
            avatar: null,
            Flag: true,
            age: null,
            blogs
        })
        } 
    } catch(e) {
        res.status(500).send(e)
    }
})

router.post('/compose', connectEnsureLogin.ensureLoggedIn('/users/login'), async (req, res) => {
    const blog = new Blog({
        'title': req.body.postTitle,
        'body': req.body.postBody,
        'penName': req.user.penName,
        'likedPens': ["jkbl"]
    })

    try {
        await blog.save()
        blogs = await Blog.find({})
        res.status(201).redirect('/users/'+req.user.penName+'/profile/')
    } catch (e) {
        res.status(400).send(e)
    }
})

router.get('/edit/:blogger/:title/:blog_id', connectEnsureLogin.ensureLoggedIn('/users/login'), async (req, res) => {
    try {
        if(req.user.penName != req.params.blogger){
            return await res.render('404', {
                name: 'Not Anyone'
            })
        }
        _id = req.params.blog_id
        blog = await Blog.findById(_id)
        const blogTitle = blog.title
        const blogBody = blog.body
        await Blog.deleteOne({_id: _id})
        await res.render('compose', {
            title: 'Blogging',
            blogTitle: blogTitle,
            blogBody: blogBody,
            penName: req.user.penName,
            age: req.user.age,
            name: req.user.name,
            avatar: req.user.avatar,
            email: req.user.email
        })
    } catch (e) {
        res.status(400).send(e)
    }
})

router.get('/delete/:id', connectEnsureLogin.ensureLoggedIn('/users/login'), async (req, res) => {
    try{
        _id = req.params.id
        await Blog.deleteOne({_id: _id})
        res.redirect('/users/'+req.user.penName+'/profile/')
    } catch (e) {
        res.status(400).send(e)
    }
})

router.post('/blogs/like/:user/:blogName/:blog_id', connectEnsureLogin.ensureLoggedIn('/users/login'), async (req, res) => {
    const user = await User.findOne({penName: req.user.penName})
    const blog = await Blog.findOne({penName: req.params.user})
    const likers = blog.likedPens
    let likes = blog.likedPens.length-1
    try {
        if (likers.includes(user.penName)&&(user.penName==blog.penName)){
            res.render('post', {
                title: blog.title,
                body: blog.body,
                _id: blog._id,
                blogger: blog.penName,
                likes,
                penName: req.user.penName,
                name: req.user.name,
                age: req.user.age,
                email: req.user.email,
                avatar: req.user.avatar,
                Flag: true
            })
        } else if (!likers.includes(user.penName)&&(user.penName==blog.penName)){
            likes = likes+1
            likers.push(user.penName)
            await Blog.findByIdAndUpdate(blog._id, { likedPens: likers })
            res.render('post', {
                title: blog.title,
                body: blog.body,
                _id: blog._id,
                blogger: blog.penName,
                likes,
                penName: req.user.penName,
                name: req.user.name,
                age: req.user.age,
                email: req.user.email,
                avatar: req.user.avatar,
                Flag: true
            })
        } else if (likers.includes(user.penName)&&(user.penName!=blog.penName)) {
            res.render('post', {
                title: blog.title,
                body: blog.body,
                _id: blog._id,
                blogger: blog.penName,
                likes,
                penName: req.user.penName,
                name: req.user.name,
                age: req.user.age,
                email: req.user.email,
                avatar: req.user.avatar,
                Flag: false
            })
        } else {
            likes = likes+1
            likers.push(user.penName)
            await Blog.findByIdAndUpdate(blog._id, { likedPens: likers })
            res.render('post', {
                title: blog.title,
                body: blog.body,
                _id: blog._id,
                blogger: blog.penName,
                likes,
                penName: req.user.penName,
                name: req.user.name,
                age: req.user.age,
                email: req.user.email,
                avatar: req.user.avatar,
                Flag: false
            })
        }
    } catch (e) {
        console.log(likers)
        res.status(500).send(e)
    }
})

router.get('/search/:type/:query', async(req, res) => {
    try {
        const query = req.params.query.toLowerCase()
        const keywords = query.split(" ")
        var blogs = await Blog.find({})
        if (req.params.type === 'byTags'){
            var matches = blogs.filter((blog) => {
                var tags = blog.tags
                for (i = 0; i < keywords.length; i++){
                    if (tags.includes(keywords[i])){
                        return true
                    }
                }
                return false
            })
        }
        if (req.params.type === 'byTitle'){
            var matches = blogs.filter((blog) => {
                var title = blog.title
                title = title.toLowerCase()
                for (i = 0; i < keywords.length; i++){
                    if (title.includes(keywords[i])){
                        return true
                    }
                }
                return false
            })
        }
        if (req.user){
            await res.render('community', {
            title: 'They are something more than just blogs..',
            penName: req.user.penName,
            name: req.user.name,
            email: req.user.email,
            avatar: req.user.avatar,
            age: req.user.age,
            Flag: true,
            blogs: matches
        })
        }
        else {
            await res.render('community', {
            title: 'They are something more than just blogs..',
            name: null,
            penName: null,
            email: null,
            Flag: true,
            avatar: null,
            age: null,
            blogs: matches
        })
        } 
    } catch (e) {
        res.status(400).send(e)
    }
})

router.get('/blogs/:user/:blogName/:blog_id', async (req, res) => {
    _id = req.params.blog_id
    blog = await Blog.findById(_id)
    if (!blog) {
        await res.render('404', {
            name: 'Not Anyone'
        })
    }
    if (blog.penName != req.params.user && blog.title != req.params.blogName){
        await res.render('404', {
            name: 'Not Anyone'
        })
    }

    try {
        if(req.user == undefined){
            return await res.render('post', {
                title: blog.title,
                body: blog.body,
                _id: blog._id,
                blogger: blog.penName,
                likes: blog.likedPens.length-1,
                penName: null,
                name: null,
                age: null,
                email: null,
                avatar: null,
                Flag: false,
            })
        }
        else if ((req.user) && (req.user.penName == blog.penName)){
            return await res.render('post', {
                title: blog.title,
                body: blog.body,
                _id: blog._id,
                blogger: blog.penName,
                penName: req.user.penName,
                likes: blog.likedPens.length-1,
                name: req.user.name,
                age: req.user.age,
                email: req.user.email,
                avatar: req.user.avatar,
                Flag: true
            })
        }
        else {
            return await res.render('post', {
                title: blog.title,
                body: blog.body,
                _id: blog._id,
                blogger: blog.penName,
                penName: req.user.penName,
                likes: blog.likedPens.length-1,
                name: req.user.name,
                age: req.user.age,
                email: req.user.email,
                avatar: req.user.avatar,
                Flag: false
            })
        }
    } catch (e) {
        res.status(500).send(e)
    }
})

module.exports = router