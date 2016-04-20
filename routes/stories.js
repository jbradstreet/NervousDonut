var express = require('express');
var router = express.Router();
var validations = require('../lib/validations');
var knex = require('../db/knex');
var rp = require('request-promise');

function Stories() {
  return knex('stories');
}

function Users() {
  return knex('users');
}

router.get('/', function(req, res, next) {
  res.render('stories/index');
});

router.get('/new', function(req, res, next) {
  var imageUrl = 'https://api.unsplash.com/photos/random?client_id=' + process.env.app_id;

  Promise.all([
    rp({uri: imageUrl, json: true}),
    rp({uri: imageUrl, json: true}),
    rp({uri: imageUrl, json: true})
  ]).then(function(images) {
    res.render('stories/new', {
      image1: images[0],
      image2: images[1],
      image3: images[2]
    });
  }).catch(function(err) {
    console.log(err);
  });
});

router.get('/top', function(req, res, next) {
  Stories().select().innerJoin('users', 'stories.user_id', 'users.id').orderBy('likes', 'desc').then(function(topStories) {
    res.render('stories/top', {
      topStories: topStories
    });
  });
});

router.get('/latest', function(req, res, next) {
  Stories().select().innerJoin('users', 'stories.user_id', 'users.id').orderBy('created_at', 'desc').then(function(latestStories) {
    res.render('stories/latest', {
      latestStories: latestStories
    });
  });
});

router.get('/new/save', function(req, res, next) {
  res.render('stories');
});

router.get('/new', function(req, res, next) {
  res.render('new');
});

router.post('/new/save', function(req, res, next) {
  var d = new Date();
  var isoDate = d.toISOString();
  var errors = [];

  errors.push(validations.titleIsNotBlank(req.body.title));
  errors.push(validations.storyIsNotBlank(req.body.text));

  for(var i = 0; i < errors.length; i++) {
    if(errors[i] === '') {
      errors.splice(i, 1);
      i--;
    }
  }

  if (errors.length) {
    res.render('stories/new', {
      title: req.body.title,
      text: req.body.text
    })
  } else {
    Stories().insert({
      title: req.body.title,
      created_at: isoDate,
      updated_at: isoDate,
      image_1: req.body.image_1,
      image_2: req.body.image_2,
      image_3: req.body.image_3,
      text: req.body.text,
      user_id: 1,
      likes: 0,
      published: false
    }).then(function(){
      res.redirect('/stories')
    })
  }
});

router.post('/new/publish', function(req, res, next) {
  var d = new Date();
  var isoDate = d.toISOString();
  Stories().insert({
    title: req.body.title,
    created_at: isoDate,
    updated_at: isoDate,
    image_1: req.body.image_1,
    image_2: req.body.image_2,
    image_3: req.body.image_3,
    text: req.body.text,
    user_id: 1,
    likes: 0,
    published: true
  }, '*').then(function(newStory){
    res.redirect('/stories/' + newStory[0].id)
  })
});

router.put('/:id/edit/save', function(req, res, next) {
  var d = new Date();
  var isoDate = d.toISOString();

  Stories().pluck('created_at').where('id', req.params.id).then(function(createdAt) {
    console.log(createdAt);
    Stories().where({id: req.params.id}).update({
      title: req.body.title,
      created_at: createdAt[0],
      updated_at: isoDate,
      image_1: req.body.image_1,
      image_2: req.body.image_2,
      image_3: req.body.image_3,
      text: req.body.text,
      user_id: req.body.user_id,
      likes: req.body.likes,
      published: false
    }).then(function(){
      res.redirect('/stories');
    });
  });
});

router.put('/:id/edit/publish', function(req, res, next) {
  var d = new Date();
  var isoDate = d.toISOString();
  Stories().where({id: req.params.id}).update({
    title: req.body.title,
    created_at: req.body.created_at,
    updated_at: isoDate,
    image_1: req.body.image_1,
    image_2: req.body.image_2,
    image_3: req.body.image_3,
    text: req.body.text,
    user_id: req.body.user_id,
    likes: req.body.likes,
    published: true
  }).then(function(){
    res.redirect('/stories/' + req.params.id);
  });
});

router.get('/:id', function(req, res, next) {
  Stories().first().where('id', req.params.id).then(function(story) {
    Users().first('username').where('id', story.user_id).then(function(user) {
      res.render('stories/show', {
        story: story,
        user: user
      });
    });
  });
});

router.get('/:id/edit', function(req, res, next) {
  Stories().first().where('id', req.params.id).then(function(story){
    res.render('stories/edit', {
      story: story
    });
  })
});

module.exports = router;
