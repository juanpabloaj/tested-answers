var express = require('express');
var site = express.Router();

site.use(function(req, res, next){
  if (req.url === '/favicon.ico') {
    res.writeHead(200, {'Content-Type': 'image/x-icon'} );
    res.end(/* icon content here */);
  } else if ( req.url === '/robots.txt' ) {
    res.type('text/plain');
    res.send('User-agent: *\nDisallow:');
  } else {
    next();
  }
});

site.route('/questions/new')
  .get(function(req, res){
    res.render('new');
  });

site.route('/questions/:questionId')
  .get(function(req, res){
    var questionId = req.params.questionId;
    res.render('question', {question: questionId});
  });

site.route('/questions')
  .get(function(req, res){
    var questionId = req.params.questionId;
    res.render('questions');
  });

site.route('/')
  .get(function(req, res){
    var questionId = req.params.questionId;
    res.render('index');
  });

site.route('*')
  .get(function(req, res){
    res.redirect('/');
  });

module.exports = site;
