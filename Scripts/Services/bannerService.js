/**
 * Created by Nekrasov on 22.03.2017.
 */
(function () {
    'use strict';
    var service = function ($http, $q, settings) {
        this.$http = $http;
        this.$q = $q;
        this.settings = settings;
    };
    service.prototype.get = function () {
        if (this.promise)
            return this.promise;
        this.promise = this.$http.get(this.settings.webApiBaseUrl + '/Banner/GetAllActual?CustomerID=' + this.settings.customerID).then(i => i.data);
        return this.promise;
    };
    angular
        .module('app')
        .service('bannerService', service);

    service.$inject = ['$http', '$q', 'settings'];
})();