(function () {
    'use strict';
    var service = function ($http, $q, settings, dbService, $linq) {
        this.$http = $http;
        this.$linq = $linq;
        this.$q = $q;
        this.settings = settings;
        this.dbService = dbService;
    };
    service.prototype.get = function (id) {
        // let deferred = this.$q.defer();
        // this.$http.get(this.settings.webApiBaseUrl + `/Proposal/GetById/${id}`).then(function (data) {
        //     deferred.resolve(data.data);
        // }, function (err) {
        //     deferred.reject(err);
        // });
        // return deferred.promise;
        let self = this;
        return self.dbService.getData().then(data => {
            return data.Proposals[id];
        });
    };
    service.prototype.getAll = function () {
        let dt = new Date().toISOString();
        var filter = `(DateEnd ge DateTime'${dt}' or DateEnd eq null) and (DateBegin le DateTime'${dt}' or DateBegin eq null)`;
        return this.$http.get(this.settings.webApiBaseUrl + `/Proposal?$expand=Organization&$select=ProposalID,DateBegin,DateEnd,Name,Summary,Organization/Name&$filter=${filter}&CustomerID=${this.settings.customerID}`).then(function (data) {
            return data.data;
        });
    };
    service.prototype.getFilter = function (term) {
        // return this.$http.get(this.settings.webApiBaseUrl + `/Proposal/GetFilter?CustomerID=${this.settings.customerID}&term=${term}`, {cache: true}).then(function (data) {
        //     return data.data;
        // });
        let self = this;
        return self.dbService.getData().then(data => {
            let result = self.$linq.Enumerable().From(data.Proposals).Select(i => i.Value);
            let date = new Date();
            result = result.Where(i => (moment(i.DateBegin).isBefore(date)) && (moment(i.DateEnd).isAfter(date)));
            if (term) {
                term = term.toLowerCase();
                result = result.Where(i => (i.Name && i.Name.toLowerCase().includes(term)) || (i.Summary && i.Summary.toLowerCase().includes(term)) || (i.KeyWords && i.KeyWords.toLowerCase().includes(term)))
            }
            return result.OrderBy(i => i.DateEnd).ToArray();
        });
    };
    service.prototype.getByOrganization = function (id) {
        // let deferred = this.$q.defer();
        // let dt = new Date().toISOString();
        // let filter = `OrganizationID eq ${id} and DateEnd ge DateTime'${dt}' and DateBegin le DateTime'${dt}'`;
        // this.$http.get(this.settings.webApiBaseUrl + `/Proposal?$select=ProposalID,DateBegin,DateEnd,Name,Summary,Organization/OrganizationID&$expand=Organization&$filter=${filter}`).then(function (data) {
        //     deferred.resolve(data.data);
        // }, function (err) {
        //     deferred.reject(err);
        // });
        // return deferred.promise;
        let self = this;
        return self.dbService.getData().then(data => {
            let result = self.$linq.Enumerable().From(data.Proposals).Select(i => i.Value);
            let date = new Date();
            result = result.Where(i => (moment(i.DateBegin).isBefore(date)) && (moment(i.DateEnd).isAfter(date))).Where(i => i.Organization.OrganizationID == id);

            return result.OrderBy(i => i.DateEnd).ToArray();
        });
    };
    service.prototype.getDetailFilter = function (filter) {
        //return this.$http.post(this.settings.webApiBaseUrl + '/Proposal/DetailFilter', data, {cache: true}).then(i => i.data);
        let self = this;
        return self.dbService.getData().then(data => {
            return self.$linq.Enumerable().From(data.Proposals)
                .Select(i => i.Value)
                .Where(i => (moment(i.DateBegin).isBefore()) && (moment(i.DateEnd).isAfter()))
                .Where(i => self.$linq.Enumerable().From(i.Organization.Categories).Intersect(filter.Categories).Count() !== 0)
                .OrderBy(i => i.DateEnd).ToArray();
        });
    };
    angular
        .module('app')
        .service('proposalService', service);

    service.$inject = ['$http', '$q', 'settings', 'dbService', '$linq'];
})();