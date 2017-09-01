/**
 * Created by Nekrasov on 7/27/2017.
 */
(function () {
    'use strict';

    class VgIdService {
        constructor($q, $http, settings, $linq) {
            this.$q = $q;
            this.$http = $http;
            this.settings = settings;
            this.$linq = $linq;
        }

        get() {
            let self = this;
            return self.$http.get(`Content/Backup/ids.json`, {cache: true}).then(i => i.data);
        }
    }

    angular
        .module('app')
        .service('vgIdService', VgIdService);

    VgIdService.$inject = ['$q', '$http', 'settings', '$linq'];
})();