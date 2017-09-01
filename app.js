(function () {
    "use strict";
    let app = angular.module('app', ['ui.router', 'ngIdle', 'angular-linq', 'ngScrollbars', 'indexedDB']);
    app.config(['$indexedDBProvider', '$httpProvider', function ($indexedDBProvider, $httpProvider) {
        $indexedDBProvider.connection('localDb')
            .upgradeDatabase(1, function (event, db, tx) {
                let objStore = db.createObjectStore('statistics', {keyPath: "Date"});

            });
        //$httpProvider.defaults.withCredentials = true;
    }]);
})();
