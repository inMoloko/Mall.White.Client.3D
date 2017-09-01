(function () {
    "use strict";
    let app = angular.module('app');
    let queryDict = {};
    let encoded = location.search.replace(/&amp;/g, '&');
    encoded.substr(1).split("&").forEach(function (item) {
        queryDict[item.split("=")[0]] = decodeURI(item.split("=")[1]);
    });
    app.constant('settings', {
        webApiBaseUrl: 'http://lk.inmoloko.ru/api',
        authUrl: 'http://lk.inmoloko.ru',
        //Скорость человечка
        manVelocity: 10,
        //Дельта смещения точки прикосновения. Если смещение меньше дельты - срабатывает событие клик
        deltaDistanceTouchMoveAsClick: 100,
        customerID: queryDict.CustomerID,
        terminalID: queryDict.TerminalID,
        serialNumber: queryDict.SerialNumber,
        token: queryDict.Token,
        displayKeyboard: true,
        autoReset: true,
        mapScale: 1,
        resourceFolder: 'C:/MOLOKO.Content', //'Content/Backup',
        dbPath: `C:/MOLOKO.Content/db/${queryDict.SerialNumber}.json`,
        useGeo: true,
        visioglobeImagePath: 'Content/images'
    });
})();
