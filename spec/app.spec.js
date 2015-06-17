
describe('app', function() {
    'use strict';

    var app = require('../lib/app'),
        App = app;

    describe('#', function() {

        it('should be function', function() {
            expect(typeof app).toEqual('function');
        });

        it('is function that return app instance', function() {
            expect(app() instanceof app).toEqual(true);
        });

        it('is constructor of app', function() {
            expect((new App()) instanceof app).toEqual(true);
        });

        it('has default cwd', function() {
            var anApp = app();
            expect(anApp.cwd).toEqual(process.cwd());
        });
    });

    describe('#config', function() {
        var anApp;
        beforeEach(function() {
            anApp = app();
        });

        it('returns list of config with no arg', function() {
            var conf = anApp.config();
            expect(typeof conf).toEqual('object');
        });

        it('returns config entry by key', function() {
            var entry = anApp.config('home');
            expect(typeof entry).toEqual('string');
        });

        it('sets config entry by key', function() {
            var fs = require('fs');
            spyOn(fs, 'writeFileSync');
            var next = anApp.config('home', '/static/path');
            expect(fs.writeFileSync).toHaveBeenCalled();
            expect(anApp.config('home')).toEqual('/static/path');
            expect(next).toEqual(anApp);
        });
    });

    describe('#option', function() {
        // FIXME define this
    });

    describe('#arg', function() {
        // FIXME define this
    });

    describe('#run', function() {
        it('should create suitable task and run', function() {
            var anApp = app();

            var taskSpy = {
                run: function() {
                    return Promise.resolve();
                }
            };

            spyOn(taskSpy, 'run').and.callThrough();
            spyOn(anApp, 'generateTask_').and.returnValue(taskSpy);

            anApp.arg(['test']);
            anApp.run();

            expect(anApp.generateTask_).toHaveBeenCalled();
            expect(taskSpy.run).toHaveBeenCalled();
        });
    });

    describe('#generateTask_', function() {
        it('should create help task if no arg', function() {
            var anApp = app();
            var task = anApp.generateTask_();
            expect(task.id).toEqual('help');
        });

        it('should create version task if option v', function() {
            var anApp = app();
            anApp.option('v', true);
            var task = anApp.generateTask_();
            expect(task.id).toEqual('version');
        });
    });

    describe('#task', function() {

        it('should create version task if id version', function() {
            var anApp = app('version');

            var task = anApp.task(anApp.id);
            expect(task.id).toEqual('version');
        });
    });

    describe('#onDone', function() {
        it('should emit exit', function() {
            var anApp = app();

            var onExit = jasmine.createSpy('');

            anApp.on('exit', onExit);
            anApp.onDone();

            expect(onExit).toHaveBeenCalled();
        });
    });

    describe('#onError', function() {
        it('should emit exit', function() {
            var anApp = app();

            var error = new Error('Some error');
            var onError = jasmine.createSpy('');

            var log = require('../lib/log');

            log.writer(function() {}, function() {});

            anApp.on('error', onError);
            anApp.onError(error);

            expect(onError).toHaveBeenCalledWith(error);
        });
    });
});