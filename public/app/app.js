var firebaseUrl = 'https://unit-answers.firebaseio.com/';
var ref = new Firebase(firebaseUrl);
var answersRef = ref.child('answers');
var questionsRef = ref.child('questions');

var app = angular.module('questionApp', ['firebase']);

app
  .factory('Auth', ['$firebaseAuth', function($firebaseAuth) {
      return $firebaseAuth(ref);
    }
  ])
  .filter('capitalize', function(){
    return function(input, scope){
      if ( input ) {
        return input.substring(0,1).toUpperCase() + input.substring(1);
      }
    };
  })
  .controller('QuestionsController', function($scope, Auth, $firebaseArray){
    var query = questionsRef.orderByChild('createdAt').limitToLast(25);
    $scope.questions = $firebaseArray(query);

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
  .controller('AnswerController', function($scope, Auth, $firebaseArray){

    var questionId = document.getElementById('questionId').getAttribute('value');

    $scope.auth = Auth;
    $scope.auth.$onAuth(function(authData){
      $scope.authData = authData;
    });

    questionsRef.child(questionId).on('value', function(snap){
      $scope.question = snap.val();

      var query = answersRef.orderByChild('question').equalTo(snap.key());
      $scope.answers = $firebaseArray(query);
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
        });
      }
    };
  });
