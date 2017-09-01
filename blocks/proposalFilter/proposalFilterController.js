/**
 * Created by Nekrasov on 06.04.2017.
 */
(function () {
    "use strict";

    class ProposalFilterController {
        constructor($rootScope, $scope, categoryService, $state, $linq, $timeout, mainMenuService, proposalService, $q) {
            let self = this;

            self.full = false;
            self.$scope = $scope;
            self.$state = $state;
            self.$linq = $linq;
            self.$timeout = $timeout;
            self.mainMenuService = mainMenuService;
            self.categoryService = categoryService;
            self.proposalService = proposalService;
            self.$q = $q;

            self.map = {
                'shopFilter': 'Магазины',
                'restaurantFilter': 'Рестораны и кафе',
                'entertainmentFilter': 'Развлечения и услуги'
            };

            if ($state.params.proposalFilter) {
                self.selectFilter($state.params.proposalFilter.filterName);
            }
            else {
                $q.all([self.initCategory('restaurantFilter'), self.initCategory('entertainmentFilter')]).then(function () {
                    self.selectFilter('shopFilter');
                });

            }
        }

        selectFilter(filter) {
            let self = this;
            self.filterName = filter;

            if (self.$state.params.proposalFilter && self.$state.params.proposalFilter[filter]) {
                self.categories = self.$state.params.proposalFilter[filter].Categories;
                self.full = self.$state.params.proposalFilter[filter].full;
                self.limmited = !self.full ? self.$linq.Enumerable().From(self.categories).Take(20).ToArray() : self.categories;
                self.allSelected = self.categories ? self.categories.some(i => i.select) : false;
            }
            else
                self.mainMenuService.get().then(function (result) {

                    self.categoryService.getFilterCategories(result[self.map[filter]]).then(i => {
                        self.categories = i;
                        self.limmited = !self.full ? self.$linq.Enumerable().From(self.categories).Take(20).ToArray() : self.categories;
                        self.filter();
                    });

                });

        }

        selectedCategories(filterName) {
            let self = this;
            let result;
            if (!self.$state.params.proposalFilter || !self.$state.params.proposalFilter[filterName]) {
                result = 0;
            }
            else
                result = self.$state.params.proposalFilter[filterName].Categories.filter(i => i.select == true).length;
            return result == 0 ? '' : '(' + result + ')';
        };

        /**
         * Выбрать все категории/снять выделение  во вкладке
         */
        selectAll() {
            let self = this;
            if (!self.categories)
                return;
            if (self.allSelected) {
                self.categories.forEach(i => {
                    i.select = false;
                });
            }
            else {
                self.categories.forEach(i => {
                    i.select = true;
                });
            }
            self.allSelected = !self.allSelected;
            self.resetCollections();
            self.filter();
        }

        resetCollections() {
            let self = this;
            let items = ['shopFilter', 'restaurantFilter', 'entertainmentFilter'];
            items.forEach(i => {
                let tmp = self.$state.params.proposalFilter[i];
                if (tmp) {
                    if (!self.$state.params.proposalFilter[i].Categories.some(j => j.select == true)) {
                        self.$state.params.proposalFilter[i].Proposals = [];
                    }
                }
            });
        }

        select(category) {
            let self = this;
            category.select = !category.select;
            if (category.select)
                self.allSelected = true;
            self.resetCollections();
            self.filter();
        }

        emptyAll(filterName) {
            let self = this;
            let tmp = self.$state.params.proposalFilter;
            let items = ['shopFilter', 'restaurantFilter', 'entertainmentFilter'];
            if (filterName)
                items.splice(items.indexOf(filterName), 1);
            return self.$linq.Enumerable().From(items).SelectMany(i => tmp[i] ? tmp[i].Categories : []).All(i => i.select != true);
        }

        changeLimit() {
            let self = this;
            self.full = !self.full;
            self.limmited = !self.full ? self.$linq.Enumerable().From(self.categories).Take(20).ToArray() : self.categories;
        }

        /**
         * Заполняет колекцию название фильтра, категории, спецпредложения
         * @param filterName - название фильтра 'shopFilter', 'restaurantFilter', 'entertainmentFilter'
         * @returns {Promise}
         */
        initCategory(filterName) {
            let self = this;
            let deferred = self.$q.defer();
            self.mainMenuService.get().then(function (result) {
                self.categoryService.getFilterCategories(result[self.map[filterName]]).then(i => {
                    let categories = i;
                    self.proposalService.getDetailFilter({
                        Categories: i.map(i => i.CategoryID)
                    }).then(i => {
                        let proposalFilter = self.$state.params.proposalFilter || {};
                        proposalFilter[filterName] = {
                            Categories: categories,
                            Proposals: i
                        };
                        self.$state.params.proposalFilter = proposalFilter;
                        deferred.resolve();
                    });
                });
            });
            return deferred.promise;
        }

        filter() {
            let self = this;
            if (!self.categories)
                return;
            let categories = self.categories.filter(i => i.select == true);

            //Нужно обработать случай когда ничего не выбранно в одной категории но есть в других.
            if (categories.length == 0 && !self.emptyAll(self.filterName)) {
                let proposalFilter = self.$state.params.proposalFilter || {};
                proposalFilter.filterName = self.filterName;
                proposalFilter[self.filterName] = {
                    full: self.full, Categories: self.categories,
                    Proposals: []
                };

                self.$state.go(".", {
                    proposalFilter: proposalFilter
                }, {reload: true});
            }
            else if (self.emptyAll()) {
                self.$q.all([self.initCategory('restaurantFilter'), self.initCategory('entertainmentFilter'), self.initCategory('shopFilter')]).then(function () {
                    let proposalFilter = self.$state.params.proposalFilter || {};
                    proposalFilter.filterName = self.filterName;
                    self.$state.go(".", {
                        proposalFilter: proposalFilter
                    }, {reload: true});
                });
            }
            else {
                self.proposalService.getDetailFilter({
                    Categories: categories.length == 0 ? self.categories.map(i => i.CategoryID) : categories.map(i => i.CategoryID)
                }).then(i => {

                    let proposalFilter = self.$state.params.proposalFilter || {};
                    proposalFilter.filterName = self.filterName;
                    proposalFilter[self.filterName] = {
                        full: self.full,
                        Categories: self.categories,
                        Proposals: i
                    };

                    self.$state.go(".", {
                        proposalFilter: proposalFilter
                    }, {reload: true});
                });
            }
        }
    }

    ProposalFilterController.$inject = ['$rootScope', '$scope', 'categoryService', '$state', '$linq', '$timeout', 'mainMenuService', 'proposalService', '$q'];
    angular.module('app').controller('proposalFilterController', ProposalFilterController);
})();