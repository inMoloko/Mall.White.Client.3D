(function () {
    'use strict';
    var service = function ($rootScope, $http, settings, $q, statisticService) {
        this._$http = $http;
        this._settings = settings;
        this._$q = $q;
        this._statisticService = statisticService;
    };
    service.prototype.post = function (feedback) {
        let self = this;
        // return self._$http.post(this._settings.webApiBaseUrl + '/Feedback/?CustomerID=' + self._settings.customerID,
        //     {
        //         FeedbackCommentText: feedback.text,
        //         ApplicantName: 'MEGA client',
        //         FeedbackMark: feedback.rating,
        //         SelectedFeedbackCategory:-1
        //     });
        let obj = {
            FeedbackCommentText: feedback.text,
            ApplicantName: 'MEGA client',
            FeedbackMark: feedback.rating,
            SelectedFeedbackCategory: -1
        };
        self._statisticService.addStatistic({
            Action: 'SendCommentCommand',
            ParamsAsJson: obj,
            Date: new Date()
        });
        return self._$q.resolve(obj);
    };
    service.$inject = ['$rootScope', '$http', 'settings', '$q', 'statisticService'];
    angular.module('app').service('feedbackService', service);
})();