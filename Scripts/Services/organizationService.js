(function () {
    'use strict';
    var service = function ($http, $q, settings, dbService, $linq) {
        this.$http = $http;
        this.$q = $q;
        this.settings = settings;
        this.dbService = dbService;
        this.$linq = $linq;
    };
    service.prototype.get = function (id) {
        let self = this;
        return this.$http.get(this.settings.webApiBaseUrl + '/Organization/GetDetail/' + id).then(i => {
            self.organization = i.data;
            return i.data;
        });

    };
    service.prototype.getByVisioglobeId = function (id) {
        let self = this;
        return self.dbService.getData().then(data => {
            let result;
            for (let k in data.Organizations) {
                if (data.Organizations[k].VisioglobeID === id) {
                    result = data.Organizations[k];
                    break;
                }
            }
            if (result)
                result.OrganizationType = self.dbService.getOrganizationTypeSync(data, result);
            return result;
        });
    };
    service.prototype.getFilter = function (filter = '', categoryID = '') {
        return this.$http.get(this.settings.webApiBaseUrl + '/Organization/GetFilter?CustomerID=' + this.settings.customerID + '&Filter=' + filter + '&CategoryID=' + categoryID, {cache: true}).then(i => i.data);
    };
    service.prototype.getDetailFilter = function (filter) {
        //return this.$http.post(this.settings.webApiBaseUrl + '/Organization/DetailFilter', data, {cache: true}).then(i => i.data);
        let self = this;
        return self.dbService.getData().then(data => {
            let result;
            result = self.$linq.Enumerable().From(data.Organizations).Select(i => i.Value).Where(i => self.$linq.Enumerable().From(i.Categories).Select(i => i.CategoryID).Intersect(filter.Categories).Count() !== 0);
            if (filter.HasProposals == true) {
                result = result.Where(i => i.Proposals.length !== 0)
            }
            return {Result: result.ToArray()};
        });
    };
    angular
        .module('app')
        .service('organizationService', service);

    service.$inject = ['$http', '$q', 'settings', 'dbService', '$linq'];
})();