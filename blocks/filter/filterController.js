/**
 * Created by Nekrasov on 04.04.2017.
 */
(function () {
    "use strict";

    class FilterController {
        constructor($rootScope, $scope, categoryService, $state, $linq, $timeout, organizationService) {
            let self = this;

            self.full = false;
            self.$scope = $scope;
            self.$state = $state;
            self.$linq = $linq;
            self.$timeout = $timeout;
            self.organizationService = organizationService;

            if ($state.current.name.includes('shop')) {
                self.filterName = 'shopFilter';
            } else if ($state.current.name.includes('restaurant')) {
                self.filterName = 'restaurantFilter';
            } else if ($state.current.name.includes('entertainment')) {
                self.filterName = 'entertainmentFilter';
            }

            if ($state.params[self.filterName]) {
                self.categories = $state.params[self.filterName].Categories;
                self.full = $state.params[self.filterName].full;
                self.limmited = !self.full ? self.$linq.Enumerable().From(self.categories).Take(20).ToArray() : self.categories;
                self.allSelected = self.categories ? self.categories.some(i => i.select) : false;
                self.proposals = $state.params[self.filterName].HasProposals;
                self.filter();
            }
            else
                categoryService.getFilterCategories($state.params.CategoryID).then(i => {
                    self.categories = i;
                    self.limmited = !self.full ? self.$linq.Enumerable().From(self.categories).Take(20).ToArray() : self.categories;
                    self.filter();
                });
        }

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
            self.filter();
        }

        select(category) {
            let self = this;
            category.select = !category.select;
            if (category.select)
                self.allSelected = true;
            self.filter();
        }

        changeLimit() {
            let self = this;
            self.full = !self.full;
            self.limmited = !self.full ? self.$linq.Enumerable().From(self.categories).Take(20).ToArray() : self.categories;
        }

        includeProposals() {
            let self = this;
            self.proposals = !self.proposals;
            this.filter();
        }

        filter() {
            let self = this;
            if (!self.categories)
                return;
            let categories = self.categories.filter(i => i.select == true);
            self.organizationService.getDetailFilter({
                HasProposals: self.proposals,
                Categories: categories.length == 0 ? [+self.$state.params.CategoryID] /*self.categories.map(i => i.CategoryID) */ : categories.map(i => i.CategoryID)
            }).then(i => {
                self.$state.go(".", {
                    Organizations: i.Result,
                    [self.filterName]: {HasProposals: self.proposals, full: self.full, Categories: self.categories}
                });
            });
        }
    }

    FilterController.$inject = ['$rootScope', '$scope', 'categoryService', '$state', '$linq', '$timeout', 'organizationService'];
    angular.module('app').controller('filterController', FilterController);
})();