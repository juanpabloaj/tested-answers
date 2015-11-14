angular.module('app.directives', [])

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
});
