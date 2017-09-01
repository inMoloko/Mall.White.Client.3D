(function () {
    "use strict";

    class RemainComponent {
        constructor() {
            this.alarm = false;
            this.text = '';
        }

        set start(value) {
            this._start = value;
            this.init();
        }

        set stop(value) {
            this._stop = value;
            this.init();
        }

        day(days) {
            let expressions = ['день', 'дня', 'дней'];
            let result;
            let count = days % 100;
            if (count >= 5 && count <= 20) {
                result = expressions[2];
            } else {
                count = count % 10;
                if (count == 1) {
                    result = expressions[0];
                } else if (count >= 2 && count <= 4) {
                    result = expressions[1];
                } else {
                    result = expressions[2];
                }
            }
            return result;
        };

        init() {
            let st = moment(this._start);
            let end = moment(this._stop);
            let now = moment();

            if (st.isAfter() && this._stop == null) {
                this.text = `${st.format('DD MMMM')}`;
                this.alarm = false;
                return;
            }
            let remain = end.diff(now, 'days');
            if (now.isBetween(st, end)) {
                if (remain <= 20) {
                    this.text = `${remain} ${this.day(remain)}`;
                    this.alarm = true;
                    return;
                }
                else {
                    if (st.isSame(end, 'day')) {
                        this.text = `${st.format('DD MMMM')}`;
                    }
                    else {
                        this.text = `${st.format('DD MMMM')} - ${end.format('DD MMMM')}`;
                    }
                    this.alarm = false;
                    return;
                }
            }
            if (st.isAfter() && stop != null) {
                if (st.isSame(end, 'day')) {
                    this.text = `${st.format('DD MMMM')}`;
                }
                else {
                    this.text = `${st.format('DD MMMM')} - ${end.format('DD MMMM')}`;
                }
                this.alarm = false;
                return;
            }
        }
    }

    const definition = {
        // вместо scope + bindToController: true
        // у нас появился более удобный способ объявлять биндинги
        bindings: {
            'start': '=',
            'stop': '=',
        },
        template: `<img src="Content/images/icn_alarm_red.png" ng-if="$ctrl.alarm">
                   <span ng-bind="$ctrl.text" ng-class="{'_interval':!$ctrl.alarm}"></span>`,

        controller: RemainComponent
    };


    angular.module('app').component('remainComponent', definition);
})();