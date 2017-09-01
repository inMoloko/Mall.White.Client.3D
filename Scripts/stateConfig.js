(function () {
    "use strict";
    var app = angular.module('app');
    app.config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {

        $urlRouterProvider.otherwise('/navigation');

        // States
        $stateProvider
            .state('navigation', {
                params: {
                    proposalFilter: null
                },
                url: "/navigation",
                // templateUrl: 'navigation.html',
                views: {
                    'search': {
                        templateUrl: 'blocks/searchControlMainPage/searchControlMainPage.html',
                        controller: 'searchControlMainPageController',
                        controllerAs: 'controller'
                    },
                    'searchResult': {
                        templateUrl: 'blocks/sideMenu/sideMenu.html',
                    },
                    'navigation': {
                        templateUrl: 'blocks/navigation/navigation.html',
                    }
                },
                // templateUrl:'blocks/appContainer/appContainer.html',
                resetMap: true
            });
        ['shop', 'restaurant', 'entertainment'].forEach(i => {
            $stateProvider.state('navigation.' + i, {
                url: `/${i}/:OrganizationID?MapObjectID`,
                views: {
                    'search@': {
                        templateUrl: `blocks/${i}Heading/${i}Heading.html`,
                        controller: `${i}HeadingController`,
                        controllerAs: 'controller'
                    },
                    'searchResult@': {
                        templateUrl: `blocks/${i}/${i}.html`,
                        controller: `${i}Controller`,
                        controllerAs: 'controller'
                    }
                }
            })
                .state(`navigation.${i}s`, {
                    url: `/${i}s?CategoryID`,
                    params: {
                        Organizations: {array: true},
                        [i + 'Filter']: null,
                    },
                    views: {
                        'search@': {
                            templateUrl: `blocks/${i}Heading/${i}Heading.html`,
                            controller: `${i}HeadingController`,
                            controllerAs: 'controller'
                        },
                        'searchResult@': {
                            templateUrl: 'blocks/organizationsList/organizationsList.html',
                            controller: 'organizationsListController',
                            controllerAs: 'controller'
                        }
                    }
                })
                .state(`navigation.${i}s.filter`, {
                    url: '/filter',
                    params: {
                        Organizations: {array: true},
                    },
                    views: {
                        'search@': {
                            templateUrl: 'blocks/filterHeading/filterHeading.html',
                            controller: 'filterHeadingController',
                            controllerAs: 'controller'
                        },
                        'searchResult@': {
                            templateUrl: 'blocks/filter/filter.html',
                            controller: 'filterController',
                            controllerAs: 'controller'
                        },
                        'navigation@': {
                            templateUrl: 'blocks/filterFooter/filterFooter.html',
                            controller: 'filterFooterController',
                            controllerAs: 'controller'
                        }
                    }
                })
                .state(`navigation.${i}s.filter.filterList`, {
                    url: '/filterList',
                    params: {
                        Organizations: {array: true}
                    },
                    views: {
                        'search@': {
                            templateUrl: `blocks/${i}Heading/${i}Heading.html`,
                            controller: `${i}HeadingController`,
                            controllerAs: 'controller'
                        },
                        'searchResult@': {
                            templateUrl: 'blocks/organizationsList/organizationsList.html',
                            controller: 'filterListController',
                            controllerAs: 'controller'
                        },
                        'navigation@': {
                            templateUrl: 'blocks/navigation/navigation.html',
                        }
                    }
                })
                .state(`navigation.${i}s.filter.filterList.organization`, {
                    url: '/organization/:OrganizationID',
                    views: {
                        'search@': {
                            templateUrl: `blocks/${i}Heading/${i}Heading.html`,
                            controller: `${i}HeadingController`,
                            controllerAs: 'controller'
                        },
                        'searchResult@': {
                            templateUrl: `blocks/${i}/${i}.html`,
                            controller: `${i}Controller`,
                            controllerAs: 'controller'
                        }
                    }
                })
                .state(`navigation.${i}s.searchResult`, {
                    url: '/searchResult?Filter',
                    params: {
                        Organizations: {array: true}
                    },
                    views: {
                        'search@': {
                            templateUrl: 'blocks/searchControlFilter/searchControlFilter.html',
                            controller: 'searchControlFilterController',
                            controllerAs: 'controller'
                        },
                        'searchResult@': {
                            templateUrl: 'blocks/organizationsList/organizationsList.html',
                            controller: 'organizationsListController',
                            controllerAs: 'controller'
                        }
                    },
                    reloadOnSearch: false
                })
                .state(`navigation.${i}s.searchResult.${i}`, {
                    url: '/organization/:OrganizationID',
                    views: {
                        'search@': {
                            templateUrl: `blocks/${i}Heading/${i}Heading.html`,
                            controller: `${i}HeadingController`,
                            controllerAs: 'controller'
                        },
                        'searchResult@': {
                            templateUrl: `blocks/${i}/${i}.html`,
                            controller: `${i}Controller`,
                            controllerAs: 'controller'
                        }
                    }
                })
                .state(`navigation.${i}s.${i}`, {
                    url: `/${i}/:OrganizationID`,
                    views: {
                        'search@': {
                            templateUrl: `blocks/${i}Heading/${i}Heading.html`,
                            controller: `${i}HeadingController`,
                            controllerAs: 'controller'
                        },
                        'searchResult@': {
                            templateUrl: `blocks/${i}/${i}.html`,
                            controller: `${i}Controller`,
                            controllerAs: 'controller'
                        }
                    }
                })
                .state(`navigation.${i}s.${i}.proposals`, {
                    url: '/proposals/:OrganizationID',
                    views: {
                        'search@': {
                            templateUrl: 'blocks/proposalsHeading/proposalsHeading.html'
                        },
                        'searchResult@': {
                            templateUrl: 'blocks/proposalListControl/proposalListControl.html',
                            controller: 'proposalListController',
                            controllerAs: 'controller'
                        }
                    }
                })
                .state(`navigation.${i}s.${i}.proposals.proposal`, {
                    url: '/proposal/:ProposalID?OrganizationID',
                    views: {
                        'search@': {
                            templateUrl: 'blocks/proposalsHeading/proposalsHeading.html'
                        },
                        'searchResult@': {
                            templateUrl: 'blocks/proposal/proposal.html',
                            controller: 'proposalController',
                            controllerAs: 'controller'
                        }
                    }
                });
        });


        /* Сюда переходим когда выбранна оргия на карте*/


        $stateProvider.state('navigation.favoriteSearch', {
            url: '/favoriteSearch',
            views: {
                'search@': {
                    templateUrl: 'blocks/searchControlFilter/searchControlFilter.html',
                    controller: 'searchControlFilterController',
                    controllerAs: 'controller'
                },
                'searchResult@': {
                    templateUrl: 'blocks/favoriteSearch/favoriteSearch.html',
                    controller: 'favoriteSearchController',
                    controllerAs: 'controller'
                }
            },
            reloadOnSearch: false
        })
            .state('navigation.favoriteSearch.searchResult', {
                url: '/searchResult?Filter',
                params: {
                    Organizations: {array: true}
                },
                views: {
                    'search@': {
                        templateUrl: 'blocks/searchControlFilter/searchControlFilter.html',
                        controller: 'searchControlFilterController',
                        controllerAs: 'controller'
                    },
                    'searchResult@': {
                        templateUrl: 'blocks/organizationsList/organizationsList.html',
                        controller: 'organizationsListController',
                        controllerAs: 'controller'
                    }
                },
            })
            //=====================Proposal=====================
            .state('navigation.proposals', {
                url: '/proposals/:OrganizationID',
                params: {OrganizationID: null},
                views: {
                    'search@': {
                        templateUrl: 'blocks/proposalsHeading/proposalsHeading.html'
                    },
                    'searchResult@': {
                        templateUrl: 'blocks/proposalListControl/proposalListControl.html',
                        controller: 'proposalListController',
                        controllerAs: 'controller'
                    }

                }
            })
            .state('navigation.proposals.filter', {
                url: '/filter',
                params: {
                    Proposals: {array: true},
                },
                views: {
                    'search@': {
                        templateUrl: 'blocks/filterHeading/filterHeading.html',
                        controller: 'filterHeadingController',
                        controllerAs: 'controller'
                    },
                    'searchResult@': {
                        templateUrl: 'blocks/proposalFilter/proposalFilter.html',
                        controller: 'proposalFilterController',
                        controllerAs: 'controller'
                    },
                    'navigation@': {
                        templateUrl: 'blocks/proposalFilterFooter/proposalFilterFooter.html',
                        controller: 'proposalFilterFooterController',
                        controllerAs: 'controller'
                    }
                }
            })
            .state('navigation.proposals.filter.filterList', {
                url: '/filterList',
                views: {
                    'search@': {
                        templateUrl: 'blocks/proposalsHeading/proposalsHeading.html',
                        controllerAs: 'controller'
                    },
                    'searchResult@': {
                        templateUrl: 'blocks/proposalFilterList/proposalFilterList.html',
                        controller: 'proposalFilterListController',
                        controllerAs: 'controller'
                    },
                    'navigation@': {
                        templateUrl: 'blocks/navigation/navigation.html',
                    }
                }
            })
            .state('navigation.proposals.filter.filterList.proposal', {
                url: '/proposal/:ProposalID?OrganizationID',
                views: {
                    'search@': {
                        templateUrl: 'blocks/proposalsHeading/proposalsHeading.html'
                    },
                    'searchResult@': {
                        templateUrl: 'blocks/proposal/proposal.html',
                        controller: 'proposalController',
                        controllerAs: 'controller'
                    }

                }
            })
            .state('navigation.proposals.proposal', {
                url: '/proposal/:ProposalID?OrganizationID',
                views: {
                    'search@': {
                        templateUrl: 'blocks/proposalsHeading/proposalsHeading.html'
                    },
                    'searchResult@': {
                        templateUrl: 'blocks/proposal/proposal.html',
                        controller: 'proposalController',
                        controllerAs: 'controller'
                    }

                }
            })
            .state('navigation.proposals.searchResult', {
                url: '/searchResult?Filter',
                views: {
                    'search@': {
                        templateUrl: 'blocks/searchControlFilter/searchControlFilter.html',
                        controller: 'searchControlFilterController',
                        controllerAs: 'controller'
                    },
                    'searchResult@': {
                        templateUrl: 'blocks/proposalListControl/proposalListControl.html',
                        controller: 'proposalListController',
                        controllerAs: 'controller'
                    }

                }
            })
            .state('navigation.proposals.searchResult.proposal', {
                url: '/proposal/:ProposalID?OrganizationID',
                views: {
                    'search@': {
                        templateUrl: 'blocks/proposalsHeading/proposalsHeading.html'
                    },
                    'searchResult@': {
                        templateUrl: 'blocks/proposal/proposal.html',
                        controller: 'proposalController',
                        controllerAs: 'controller'
                    }

                }
            })

            //=====================Перезод на разные карточки===========
            .state('navigation.favoriteSearch.searchResult.shop', {
                url: '/organization/:OrganizationID?CategoryID',
                views: {
                    'search@': {
                        templateUrl: 'blocks/shopHeading/shopHeading.html',
                        controller: 'shopHeadingController',
                        controllerAs: 'controller'
                    },
                    'searchResult@': {
                        templateUrl: 'blocks/shop/shop.html',
                        controller: 'shopController',
                        controllerAs: 'controller'
                    }
                }
            })
            .state('navigation.favoriteSearch.searchResult.entertainment', {
                url: '/entertainment/:OrganizationID?CategoryID',
                views: {
                    'search@': {
                        templateUrl: 'blocks/entertainmentHeading/entertainmentHeading.html',
                        controller: 'entertainmentHeadingController',
                        controllerAs: 'controller'
                    },
                    'searchResult@': {
                        templateUrl: 'blocks/entertainment/entertainment.html',
                        controller: 'entertainmentController',
                        controllerAs: 'controller'
                    }
                }
            })
            .state('navigation.favoriteSearch.searchResult.service', {
                url: '/service/:OrganizationID?CategoryID',
                views: {
                    'search@': {
                        templateUrl: 'blocks/servicesHeading/servicesHeading.html',
                    },
                    'searchResult@': {
                        templateUrl: 'blocks/service/service.html',
                        controller: 'serviceController',
                        controllerAs: 'controller'
                    }
                }
            })

            .state('navigation.shop.proposals', {
                url: '/proposals/:OrganizationID',
                views: {
                    'search@': {
                        templateUrl: 'blocks/proposalsHeading/proposalsHeading.html'
                    },
                    'searchResult@': {
                        templateUrl: 'blocks/proposalListControl/proposalListControl.html',
                        controller: 'proposalListController',
                        controllerAs: 'controller'
                    }
                }
            })
            //=====================Services=================
            .state('navigation.service', {
                url: '/service/:OrganizationID',
                views: {
                    'search@': {
                        templateUrl: 'blocks/servicesHeading/servicesHeading.html'
                    },
                    'searchResult@': {
                        templateUrl: 'blocks/service/service.html',
                        controller: 'shopController',
                        controllerAs: 'controller'
                    }
                }
            })
            .state('navigation.services', {
                url: '/services/:CategoryID',
                params: {
                    Organizations: {array: true}
                },
                views: {
                    'search@': {
                        templateUrl: 'blocks/servicesHeading/servicesHeading.html',
                    },
                    'searchResult@': {
                        templateUrl: 'blocks/servicesList/servicesList.html',
                        controller: 'servicesListController',
                        controllerAs: 'controller'
                    }
                }
            })
            .state('navigation.services.organization', {
                url: '/organization/:OrganizationID',
                params: {},
                views: {}
            })
            .state('navigation.services.searchResult', {
                url: '/searchResult?Filter',
                params: {
                    Organizations: {array: true}
                },
                views: {
                    'search@': {
                        templateUrl: 'blocks/searchControlFilter/searchControlFilter.html',
                        controller: 'searchControlFilterController',
                        controllerAs: 'controller'
                    },
                    'searchResult@': {
                        templateUrl: 'blocks/servicesList/servicesList.html',
                        controller: 'servicesListController',
                        controllerAs: 'controller'
                    }
                },
                reloadOnSearch: true
            })
            .state('navigation.services.searchResult.organization', {
                url: '/organization/:OrganizationID',
                params: {},
                views: {}
            })
            //=====================more=====================
            .state('navigation.more', {
                url: '/more',
                views: {
                    'search@': {
                        templateUrl: 'blocks/moreHeading/moreHeading.html'
                    },
                    'searchResult@': {
                        templateUrl: 'blocks/more/more.html'
                    }
                },
            })
            //=====================schedule===================
            .state('navigation.more.schedule', {
                url: '/schedule',
                views: {
                    'search@': {
                        templateUrl: 'blocks/scheduleHeading/scheduleHeading.html'
                    },
                    'searchResult@': {
                        templateUrl: 'blocks/schedule/schedule.html'
                    }
                },
            })
            //=====================feedback===================
            .state('navigation.more.feedback', {
                url: '/feedback',
                views: {
                    'search@': {
                        templateUrl: 'blocks/feedbackHeading/feedbackHeading.html'
                    },
                    'searchResult@': {
                        templateUrl: 'blocks/feedback/feedback.html',
                        controller: 'feedbackController',
                        controllerAs: 'controller'
                    }
                },
            })
            .state('navigation.more.feedback.final', {
                url: '/final',
                params: {
                    feedback: {}
                },
                views: {
                    'search@': {
                        templateUrl: 'blocks/feedbackFinalHeading/feedbackFinalHeading.html'
                    },
                    'searchResult@': {
                        templateUrl: 'blocks/feedbackFinal/feedbackFinal.html',
                        controller: 'feedbackFinalController',
                        controllerAs: 'controller'
                    }
                },
            })
            //=====================events=====================
            .state('navigation.more.events', {
                url: '/events',
                views: {
                    'search@': {
                        templateUrl: 'blocks/eventsHeading/eventsHeading.html'
                    },
                    'searchResult@': {
                        templateUrl: 'blocks/eventsList/eventsList.html',
                        controller: 'eventsListController',
                        controllerAs: 'controller'
                    }
                },
            })
            .state('navigation.more.events.event', {
                url: '/event/:EventID',
                views: {
                    'search@': {
                        templateUrl: 'blocks/eventsHeading/eventsHeading.html'
                    },
                    'searchResult@': {
                        templateUrl: 'blocks/event/event.html',
                        controller: 'eventController',
                        controllerAs: 'controller'
                    }
                }
            })
            .state('navigation.more.events.searchResult', {
                url: '/searchResult?Filter',
                views: {
                    'search@': {
                        templateUrl: 'blocks/searchControlFilter/searchControlFilter.html',
                        controller: 'searchControlFilterController',
                        controllerAs: 'controller'
                    },
                    'searchResult@': {
                        templateUrl: 'blocks/eventsList/eventsList.html',
                        controller: 'eventsListController',
                        controllerAs: 'controller'
                    }
                },
            })
            .state('navigation.more.events.searchResult.event', {
                url: '/event/:EventID',
                views: {
                    'search@': {
                        templateUrl: 'blocks/eventsHeading/eventsHeading.html'
                    },
                    'searchResult@': {
                        templateUrl: 'blocks/event/event.html',
                        controller: 'eventController',
                        controllerAs: 'controller'
                    }
                },
            });
    }]);
})();
