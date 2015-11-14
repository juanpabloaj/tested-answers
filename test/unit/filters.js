describe('filters', function(){
  beforeEach(module('app.filters'));

  var $filter;

  beforeEach(inject(function(_$filter_){
    $filter = _$filter_;
  }));

  it('capitalize', function(){
    var capitalize = $filter('capitalize');

    expect(capitalize('hello world')).toEqual('Hello world');
  });

  it('urlEncode', function(){
    var urlEncode = $filter('urlEncode');

    expect(urlEncode('hello world')).toEqual('hello%20world');
  });

});
