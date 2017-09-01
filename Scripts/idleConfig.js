(function () {
    "use strict";
    var app = angular.module('app');
    app.config(['IdleProvider', 'KeepaliveProvider', function (IdleProvider, KeepaliveProvider) {
        // configure Idle settings
        IdleProvider.idle(30); // in seconds
        IdleProvider.timeout(30); // in seconds
        KeepaliveProvider.interval(30); // in seconds
    }])
        .run(['Idle', 'settings', function (Idle, settings) {
            if (settings.autoReset)
                Idle.watch();
        }]);
})();
