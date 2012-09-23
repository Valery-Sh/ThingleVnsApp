({
    baseUrl: "./",
    name: "app",
    findNestedDependencies: true,
    mainConfigFile: 'app.js',
    include: [
        'app', 'helpers', 'models', 'helpers/layout',
        'views/categories-menu', 'views/shelf', 'views/user-controls', 'views/auth',
        'views/things/index', 'views/things/new',
        'views/things/show',
        'views/decks/index',
        'views/activity_stream',
        'views/bookmarklet/index',
        'views/profile/decks', 'views/profile/best_things', 'views/profile/friends_things',
        'views/followings/things',
        'views/static',
        'views/mingle/mingle-root', 'views/mingle/facebook/invite',
        'views/popups/addnew', 'views/popups/decks-new', 'views/popups/login', 'views/popups/repost',
        'views/popups/success', 'views/popups/welcome',
        'views/popups/thingles/drag-image',
        'views/popups/thingles/new-popup-1',
        'views/popups/thingles/new-popup-2'
    ],
    out: '../../dist/public/js/app.js'
})