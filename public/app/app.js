var firebaseUrl = 'https://unit-answers.firebaseio.com/';
var ref = new Firebase(firebaseUrl);
var answersRef = ref.child('answers');
var questionsRef = ref.child('questions');
var messagesRef = ref.child('messages');

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
  .controller('QuestionsController', function($scope, Auth, CountState, $firebaseArray){
    var query = questionsRef.orderByChild('createdAt').limitToLast(25);
    $scope.questions = $firebaseArray(query);

    $scope.questions.$loaded().then(function(){
      angular.forEach($scope.questions, function(value, key){
        var ref = answersRef.orderByChild('question').equalTo(value.$id);
        var list = new CountState(ref);
        list.$loaded().then(function(){
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
    $scope.languages = [{name:'javascript'}, {name:'python2.7'}];

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
  .controller('AnswerController', function($scope, $window, Auth, $firebaseArray){

    var questionId = document.getElementById('questionId').getAttribute('value');

    questionsRef.child(questionId).on('value', function(snap){
      if ( snap.val() ) {
        $scope.auth = Auth;

        $scope.auth.$onAuth(function(authData){
          $scope.authData = authData;
        });

        $scope.question = snap.val();
        $scope.langClass = 'language-' + $scope.question.language.replace(/[0-9].*/,'');

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
