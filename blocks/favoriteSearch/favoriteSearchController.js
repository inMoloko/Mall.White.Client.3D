/**
 * Created by Nekrasov on 17.03.2017.
 */
(function () {
    "use strict";

    class FavoriteSearchController {
        constructor($rootScope, $state) {
            let self = this;
            self._$state = $state;
            self._$rootScope = $rootScope;
            self.favorites = [
                'одежда',
                'туалет',
                'Ашан',
                'Adidas',
            ];
        };

        select(term) {
            let self = this;
            self._$rootScope.currentFilter = term;
            self._$state.go('.searchResult', {
                CategoryID: self._$rootScope.currentCategory ? self._$rootScope.currentCategory.CategoryID : undefined,
                Filter: self._$rootScope.currentFilter
            }, {
                reload: false,
            });
        };
    }

    FavoriteSearchController.$inject = ['$rootScope', '$state'];
    angular.module('app').controller('favoriteSearchController', FavoriteSearchController);
})();