var answersRef = new Firebase('https://unit-answers.firebaseio.com/answers');
var questionsRef = new Firebase('https://unit-answers.firebaseio.com/questions');

var app = angular.module('questionApp', ['firebase']);

app
  .controller('NewQuestion', function($scope, $window, $firebaseArray){
    $scope.languages = [{name:'javascript'}];

    $scope.newQuestion = {
      language:$scope.languages[0]
    };

    $scope.questions = $firebaseArray(questionsRef);

    $scope.submitQuestion = function(){
      $scope.questions.$add({
        title: $scope.newQuestion.title,
        body: $scope.newQuestion.body,
        input: $scope.newQuestion.input,
        expected: $scope.newQuestion.expected,
        language: $scope.newQuestion.language.name
      }).then(function(p){
        $window.location.href = "/questions/" + p.name();
      });

    };
  })
  .controller('AnswerController', function($scope, $firebaseArray){

    var questionId = document.getElementById('questionId').getAttribute('value');

    questionsRef.child(questionId).on('value', function(snap){
      $scope.question = snap.val();

      var query = answersRef.orderByChild('question').equalTo(snap.key());
      $scope.answers = $firebaseArray(query);
    });

    $scope.addAnswer = function(){
      $scope.answers.$add({
        body:$scope.newAnswer.body,
        code:$scope.newAnswer.code,
        question:questionId,
        state:'waiting'
      });
    };
  });
