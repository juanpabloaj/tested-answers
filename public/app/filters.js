/*jshint strict: false */
angular.module('app.filters', [])

.filter('capitalize', function(){
  return function(input, scope){
    if ( input ) {
      return input.substring(0,1).toUpperCase() + input.substring(1);
    }
  };
})

.filter('urlEncode', function(){
  return window.encodeURIComponent;
});
