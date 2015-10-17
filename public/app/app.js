var firebaseUrl = 'https://unit-answers.firebaseio.com/';
var ref = new Firebase(firebaseUrl);
var answersRef = ref.child('answers');
var questionsRef = ref.child('questions');
var messagesRef = ref.child('messages');

function validId(id){
  return ! Boolean(id.match(/\.|#|\$|\[|\]/));
}

var app = angular.module('questionApp', ['firebase']);

app
  .factory('Auth', ['$firebaseAuth', function($firebaseAuth) {
      return $firebaseAuth(ref);
    }
  ])
  .factory('CountState', function($firebaseArray){
    return $firebaseArray.$extend({
      countStates: function(){
        var numPassed = 0;
        var numFailed = 0;
        angular.forEach(this.$list, function(rec){
          if ( rec.state === 'passed' ){
            numPassed += 1;
          }
          if ( rec.state === 'failed' ){
            numFailed += 1;
          }
        });
        return {failed:numFailed, passed:numPassed};
      }
    });
  })
  .filter('capitalize', function(){
    return function(input, scope){
      if ( input ) {
        return input.substring(0,1).toUpperCase() + input.substring(1);
      }
    };
  })
  .filter('urlEncode', function(){
    return window.encodeURIComponent;
  })
  .controller('QuestionsController', function($scope, Auth, CountState, $firebaseArray){
    var query = questionsRef.orderByChild('createdAt').limitToLast(25);
    $scope.questions = $firebaseArray(query);

    $scope.questions.$loaded().then(function(){
      angular.forEach($scope.questions, function(value, key){
        var ref = answersRef.orderByChild('question').equalTo(value.$id);
        var list = new CountState(ref);
        list.$watch(function(){
          var states = list.countStates();
          value.failed = states.failed;
          value.passed = states.passed;
        });
      });
    });

    $scope.auth = Auth;
    $scope.auth.$onAuth(function(authData){
      $scope.authData = authData;
    });
  })
  .controller('NewQuestion', function($scope, $window, Auth, $firebaseArray){
    $scope.languages = [
      {name:'javascript'}, {name:'python2.7'}, {name: 'elixir'}
    ];

    $scope.newQuestion = {
      language:$scope.languages[0]
    };

    $scope.auth = Auth;
    $scope.auth.$onAuth(function(authData){
      $scope.authData = authData;
    });

    $scope.questions = $firebaseArray(questionsRef);

    $scope.submitQuestion = function(){
      if ( $scope.authData ) {
        $scope.questions.$add({
          title: $scope.newQuestion.title,
          body: $scope.newQuestion.body,
          input: $scope.newQuestion.input || '',
          expected: $scope.newQuestion.expected,
          language: $scope.newQuestion.language.name,
          createdAt: new Date().getTime(),
          author: $scope.authData.github.username
        }).then(function(p){
          $window.location.href = "/questions/" + p.name();
        });
      }
    };
  })
  .directive('ngPrism',['$interpolate', function ($interpolate) {
    "use strict";
    return {
      restrict: 'E',
      template: '<pre><code ng-transclude></code></pre>',
      replace:true,
      transclude:true
    };
  }])
  .directive('ngMarkdown', function($compile){
    return {
      link: function(scope, ele, attrs){
        scope.$watch(attrs.ngMarkdown, function(md){
          if (md){
            ele.html(markdown.toHTML(md));
            $compile(ele.contents())(scope);
          }
        });
      }
    };
  })
  .controller('AnswerController', function($scope, $window, Auth, $firebaseArray){

    var questionId = document.getElementById('questionId').getAttribute('value');

    if ( ! validId(questionId) ) {
      $window.location.href = '/questions/new';
    }

    questionsRef.child(questionId).on('value', function(snap){
      if ( snap.val() ) {
        $scope.auth = Auth;

        $scope.auth.$onAuth(function(authData){
          $scope.authData = authData;
          if (authData) {
            $scope.username = authData.github.username;
          }
        });

        $scope.question = snap.val();
        $scope.question.$id = snap.key();

        var language = $scope.question.language.replace(/[0-9].*/,'');
        $scope.langClass = 'language-' + language;
        $scope.shareMessage = $scope.question.title + ' #' + language;

        var query = answersRef.orderByChild('question').equalTo(snap.key());
        $scope.answers = $firebaseArray(query);
        $scope.answers.$loaded().then(function(){
          setTimeout(function(){
            Prism.highlightAll();
          }, 200);
        });
      } else {
        $window.location.href = "/questions/new";
      }
    });

    $scope.editQuestion = function(question) {
      $scope.editable = true;
      $scope.toSaveQuestion = {};
      $scope.toSaveQuestion.title = $scope.question.title;
      $scope.toSaveQuestion.body = $scope.question.body;
      $scope.toSaveQuestion.input = $scope.question.input;
      $scope.toSaveQuestion.expected = $scope.question.expected;
    };

    $scope.saveQuestion = function(question) {

      if ( $scope.authData) {
        var questions = $firebaseArray(questionsRef);
        questions.$loaded().then(function(){
          var questionToSave = questions.$getRecord(question.$id);
          questionToSave.title = $scope.toSaveQuestion.title;
          questionToSave.body = $scope.toSaveQuestion.body;
          questionToSave.input = $scope.toSaveQuestion.input;
          questionToSave.expected = $scope.toSaveQuestion.expected;
          questionToSave.editedAt = new Date().getTime();
          questions.$save(questionToSave).then(function(ref){
            $scope.question.title = $scope.toSaveQuestion.title;
            $scope.question.body = $scope.toSaveQuestion.body;
            $scope.question.input = $scope.toSaveQuestion.input;
            $scope.question.expected = $scope.toSaveQuestion.expected;
            $scope.editable = false;
          });
        });
      }

    };

    $scope.cancelEdit = function(question) {
      if ( $scope.authData) {
        $scope.editable = false;
      }
    };

    $scope.addAnswer = function(){
      if ( $scope.authData) {
        $scope.answers.$add({
          body:$scope.newAnswer.body || '',
          code:$scope.newAnswer.code,
          question:questionId,
          state:'waiting',
          createdAt: new Date().getTime(),
          author: $scope.authData.github.username
        }).then(function(ref){
          $scope.newAnswer.body = '';
          $scope.newAnswer.code = '';

          var messages = $firebaseArray(messagesRef);
          var newMessage = {
            createdAt: new Date().getTime(),
            question:questionId,
            answer:ref.key(),
            from:$scope.authData.github.username,
            to:$scope.question.author,
            read:false
          };
          messages.$add(newMessage);
        });

      }
    };
  })
  .controller('InboxController', function($scope, Auth, $firebaseArray){
    $scope.auth = Auth;
    $scope.auth.$onAuth(function(authData){
      $scope.authData = authData;

      if ( $scope.authData ) {

        var query = messagesRef.orderByChild('to').equalTo(authData.github.username);

        var messages = $firebaseArray(query);
        messages.$watch(function(){
          $scope.messages = messages;

          var unread = false;

          angular.forEach($scope.messages, function(message, key){
            questionsRef.child(message.question).on('value', function(snap){
              message.questionTitle = snap.val().title;
            });

            if ( ! message.read ) {
              unread = true;
            }
          });

          $scope.unread = unread;

        });

      }
    });

    $scope.asRead = function(message){

      if ( ! message.read ) {

        var messages = $firebaseArray(messagesRef);
        messages.$loaded().then(function(){
          var messageToSave = messages.$getRecord(message.$id);
          messageToSave.read = true;
          messages.$save(messageToSave);
        });

      }
    };

  });
