var START_TIME = new Date().getTime();

global.deltaT = function() {
    'use strict';

    return (new Date().getTime() - START_TIME) / 1000;
};
