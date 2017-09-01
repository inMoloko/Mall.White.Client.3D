/**
 * Created by Nekrasov on 5/25/2017.
 */
(function () {
    'use strict';

    class StatisticService {
        constructor($q, $indexedDB, $http, settings, $linq) {
            this.$q = $q;
            this.$indexedDB = $indexedDB;
            this.$http = $http;
            this.settings = settings;
            this.$linq = $linq;
        }

        addStatistic(statics) {
            let self = this;
            if (self.settings.preventStatistic === true)
                return;
            self.$indexedDB.openStore('statistics', (store) => {
                store.insert(statics).then(() => {
                    console.log('insert, ' + statics.Date);
                }, err => {
                    console.error(err);
                });
            });
        }

        getAll() {
            let self = this;
            let deferred = self.$q.defer();
            self.$indexedDB.openStore('statistics', (store) => {
                store.getAll().then(statistics => {
                    deferred.resolve(statistics);
                });
            });
            return deferred.promise;
        }

        delete(statistic) {
            let self = this;
            let deferred = self.$q.defer();
            self.$indexedDB.openStore('statistics', (store) => {
                store.delete(statistic.Date).then(function () {
                    deferred.resolve();
                }, function (err) {
                    deferred.reject(err);
                });
            });
            return deferred.promise;
        }

        executeRequest(statistics, token) {
            let self = this;
            return self.$http({
                method: 'POST',
                url: self.settings.webApiBaseUrl + '/TerminalService/SendStatistics',
                data: {
                    ClientTime: new Date(),
                    Statistics: statistics.map(j => {
                        return {
                            Action: j.Action,
                            Date: j.Date,
                            ParamsAsJson: angular.toJson(j.ParamsAsJson)
                        }
                    })
                },
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json'
                }
            });
        }

        getToken() {
            let self = this;
            return self.$http({
                method: 'POST',
                url: self.settings.authUrl + `/Token`,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                data: `grant_type=password&username=${self.settings.serialNumber}&password=${self.settings.token}`
            }).then(response => response.data.access_token);
        }

        sendStatistics() {
            let self = this;
            if (!self.settings.token)
                return;
            let promise = self.getAll().then(statistics => {
                if (statistics.length === 0) {
                    console.log('нет записей статистики');
                    return statistics;
                }
                //Нужно ограничивать пакеты
                statistics = self.$linq.Enumerable().From(statistics).Take(1000).ToArray();

                return self.getToken().then(token => {
                    return self.executeRequest(statistics, token).then(result => statistics)
                });
            });
            promise.then(statistics => {
                self.$indexedDB.openStore('statistics', (store) => {
                    statistics.forEach(st => {
                        store.delete(st.Date);
                    });
                });
            }, err => {
                console.error(err);
            });
        }
    }

    angular
        .module('app')
        .service('statisticService', StatisticService);

    StatisticService.$inject = ['$q', '$indexedDB', '$http', 'settings', '$linq'];
})();