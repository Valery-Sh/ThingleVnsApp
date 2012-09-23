var resource = require(global.approot + '/common/resource');

resource.api_resources('things', {
    '/pictures/upload': {verb:'get', action:'pictures_upload'},
    'share': {verb:'post', action:'share'}
})
    .add_sub_resource('comments')
    .add_sub_resource('revisions', function(subres, methods) {
        subres.map('get', '/:revision_id/revert', methods.revert);
    })
    .add_sub_resource('likes', function(subres, methods) {
        subres.map('delete', '/', methods.destroy);
    });

resource.api_resources('categories')
    .add_sub_resource('decks')
    .add_sub_resource('things');

resource.api_resources('decks')
    .add_sub_resource('things');

resource.api_resources('profile', {
    '/things/liked': {verb: 'get', action: 'liked_things'},
    '/friends': {verb: 'get', action: 'friends'},
    '/friends/things': {verb: 'get', action: 'friends_things'}
});
resource.api_resources('users')
    .add_sub_resource('things')
    .add_sub_resource('decks')
    .add_sub_resource('followers')
    .add_sub_resource('followings', function(subres, methods) {
        subres.map('get', '/things', methods.things);})
    .add_sub_resource('fbinvites');

resource.api_resources('profile/notifications');

resource.api_resources('mingle', {
    '/fbcanvas': {verb: 'post', action: 'fbcanvaspost'}
});
/** For later expansion
    .add_sub_resource('thingle')
    .add_sub_resource('fbinvites');
*/

resource.api_resource('tags')
    .add_sub_resource('things');


resource.api_resource('session');
resource.method('get', 'api/search/sync');

resource.method('post', 'api/image_postback');
resource.method('post', 'api/drag_proxy');
resource.method('get', 'api/config');
resource.method('get', 'proxy');

resource.route('get', /^\/sitemap\.xml$/, "sitemap", "index");
resource.route('get', /^\/sitemap-[\w-]+\.xml$/, "sitemap", "sitemap");

resource.route('get', '*', "error-page", "404");
