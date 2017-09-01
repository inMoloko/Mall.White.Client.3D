(function () {
    'use strict';
    var service = function ($rootScope, $http, settings, dbService) {
        this._$http = $http;
        this._settings = settings;
        this._dbService = dbService;
    };
    service.prototype.get = function () {
        let self = this;
        // if (!self.promise) {
        // } else self.promise;
        // self.promise = self._$http.get(`${self._settings.webApiBaseUrl}/SystemSetting/MenuItems?CustomerID=${self._settings.customerID}`, {cache: true}).then(function (response) {
        //     let items = response.data;
        //     items.restaurantId = items['Рестораны и кафе'] || -1;
        //     items.entertainmentId = items['Развлечения и услуги'] || -1;
        //     items.serviceId = items['Сервисы'] || -1;
        //     Object.assign(items, {
        //         init: function (categories) {
        //             this.restaurantCategories = categories.find(i => i.CategoryID === this.restaurantId).ChildrenIds;
        //             this.entertainmentCategories = categories.find(i => i.CategoryID === this.entertainmentId).ChildrenIds;
        //             this.serviceCategories = categories.find(i => i.CategoryID === this.serviceId).ChildrenIds;
        //         },
        //         getType: function (categoryId) {
        //             if (this.restaurantCategories.includes(categoryId)) {
        //                 return 'restaurant';
        //             } else if (this.entertainmentCategories.includes(categoryId)) {
        //                 return 'entertainment';
        //             } else if (this.serviceCategories.includes(categoryId)) {
        //                 return 'service';
        //             } else {
        //                 return 'shop';
        //             }
        //         }
        //     });
        //     return items;
        // });
        // return self.promise;
        return this._dbService.getData().then(data => {
            return data.SystemSettings.TERMINAL_MENU_ITEMS;
        });
    };
    service.$inject = ['$rootScope', '$http', 'settings', 'dbService'];
    angular.module('app').service('mainMenuService', service);
})();