/**
 * Created by Nekrasov on 22.03.2017.
 */
(function () {
    "use strict";
    var controller = function ($scope, $http, settings, $rootScope, $state, $stateParams, $linq, mainMenuService, organizationService) {
        let self = this;
        this.$state = $state;
        self.$rootScope = $rootScope;
        self.organizationService = organizationService;

        mainMenuService.get().then(i => {
            self.menuItems = i;
            self.categoryID = self.menuItems['Магазины'];
        });
    };
    controller.prototype.getTitle = function () {
        let self = this;
        if (!self.organizationService.organization)
            return "Магазины";
        if (!self.$state.current.name.includes("favoriteSearch"))
            return "Магазины";

        let cats = self.organizationService.organization.Categories.map(i => i.CategoryID);
        if (cats.length > 1)
            return "Магазины";
        let ids = self.$rootScope.categories.find(i => i.CategoryID == self.menuItems['Сервисы']).ChildrenIds;
        if (ids.includes(cats[0])) {
            return "Сервисы";
        }
        ids = self.$rootScope.categories.find(i => i.CategoryID == self.menuItems['Рестораны и кафе']).ChildrenIds;
        if (ids.includes(cats[0])) {
            return "Еда";
        }
        ids = self.$rootScope.categories.find(i => i.CategoryID == self.menuItems['Развлечения и услуги']).ChildrenIds;
        if (ids.includes(cats[0])) {
            return "Развлечения";
        }
        return "Магазины";
    };
    controller.prototype.goBack = function () {
        this.$state.go("^");
    };
    controller.prototype.goSearch = function () {
        if (this.$state.current.name.includes("organization")) {
            this.$state.go("^");
        }
        else
            this.$state.go(".searchResult");
    };
    controller.$inject = ['$scope', '$http', 'settings', '$rootScope', '$state', '$stateParams', '$linq', 'mainMenuService', 'organizationService'];
    angular.module('app').controller('shopHeadingController', controller);
})();