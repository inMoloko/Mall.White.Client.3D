(function () {
    "use strict";
    let app = angular.module('app');
    let queryDict = {};
    let encoded = location.search.replace(/&amp;/g, '&');
    encoded.substr(1).split("&").forEach(function (item) {
        queryDict[item.split("=")[0]] = decodeURI(item.split("=")[1]);
    });
    app.constant('settings', {
        webApiBaseUrl: 'api/api',
        webApiODataUrl: 'api/odata',
        defaultPage: '/Monitoring',
        //Доступные темы. Первая тема принимается темой по умолчанию
        colorThemes: ['colorTheme_color', 'colorTheme_blackLite'],
        //formatThemes: ['formatTheme_horizontal', 'formatTheme_horizontalSmall'],
        formatThemes: ['formatTheme_vertical', 'formatTheme_verticalSmall', 'formatTheme_horizontal', 'formatTheme_horizontalSmall'],
        //Скорость человечка
        manVelocity: 30,
        //Дельта смещения точки прикосновения. Если смещение меньше дельты - срабатывает событие клик
        deltaDistanceTouchMoveAsClick: 100,
        customerID: queryDict.CustomerID,
        terminalID: queryDict.TerminalID,
        token: queryDict.Token,
        displayKeyboard: true,
        autoReset: true,
        mapScale: 1,
        resourceFolder: 'Content/Backup',
        dbPath: `http://lk.inmoloko.ru/api/Backup/Get?TerminalID=${queryDict.TerminalID || 4}`,
        preventStatistic: true,
        useGeo: true,
        visioglobeImagePath: 'Content/images'
        // dbPath: `http://lk.inmoloko.ru/api/Backup/GetByCustomer?CustomerID=${queryDict.CustomerID}`
    });
})();
