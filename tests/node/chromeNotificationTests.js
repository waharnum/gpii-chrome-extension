/*
 * GPII Chrome Extension for Google Chrome
 *
 * Copyright 2017 OCAD University
 *
 * Licensed under the New BSD license. You may not use this file except in
 * compliance with this license.
 *
 * You may obtain a copy of the license at
 * https://github.com/GPII/gpii-chrome-extension/blob/master/LICENSE.txt
 */

/* eslint-env node */
/* global require */

"use strict";

var fluid = require("infusion");
var chrome = fluid.require("sinon-chrome"); // eslint-disable-line no-unused-vars
var jqUnit = fluid.require("node-jqunit", require, "jqUnit"); // eslint-disable-line no-unused-vars
var gpii = fluid.registerNamespace("gpii");

require("./testUtils.js");
require("../../extension/src/lib/chromeEvented.js");
require("../../extension/src/lib/chromeNotification.js");

fluid.defaults("gpii.tests.chrome.notification", {
    gradeNames: ["gpii.chrome.notification"],
    strings: {
        title: "Test notifications",
        message: "Install %name"
    },
    model: {
        type: "basic",
        iconUrl: "images/icon.png"
    },
    members: {
        messageData: {
            name: "testExtension"
        }
    }
});

fluid.defaults("gpii.tests.chromeNotificationTests", {
    gradeNames: ["gpii.tests.testEnvironmentWithSetup"],
    events: {
        startTest: {
            events: {
                onTestCaseStart: "{chromeNotificationTester}.events.onTestCaseStart",
                afterSetup: "afterSetup"
            }
        }
    },
    components: {
        chromeNotification: {
            type: "gpii.tests.chrome.notification",
            createOnEvent: "startTest"
        },
        chromeNotificationTester: {
            type: "gpii.tests.chromeNotificationTester"
        }
    },
    invokers: {
        setup: "gpii.tests.chromeNotificationTests.setup",
        tearDown: "gpii.tests.chromeNotificationTests.tearDown"
    }
});

gpii.tests.chromeNotificationTests.setup = function (that) {
    chrome.extension.getURL.returns("./");
    that.events.afterSetup.fire();
};

gpii.tests.chromeNotificationTests.tearDown = function () {
    chrome.extension.getURL.resetBehavior;
    chrome.notifications.create.resetBehavior;
};

gpii.tests.chromeNotificationTests.expectedModel = {
    type: "basic",
    title: "Test notifications",
    message: "Install testExtension",
    iconUrl: "./images/icon.png"
};

gpii.tests.chromeNotificationTests.expectedUpdatedModel = {
    type: "basic",
    title: "Test notifications",
    message: "Install testExtension",
    iconUrl: "./icons/icon.png"
};

fluid.defaults("gpii.tests.chromeNotificationTester", {
    gradeNames: ["fluid.test.testCaseHolder"],
    modules: [{
        name: "GPII Chrome Extension chromeNotification unit tests",
        tests: [{
            name: "Creation",
            expect: 6,
            sequence: [{
                event: "{chromeNotificationTests chromeNotification}.events.onCreate",
                priority: "last:testing",
                listener: "jqUnit.assertDeepEq",
                args: ["The initial model should be set", gpii.tests.chromeNotificationTests.expectedModel, "{chromeNotification}.model"]
            }, {
                func: "jqUnit.assertValue",
                args: ["The notificationID should be generated", "{chromeNotification}.notificationID"]
            }, {
                func: "gpii.tests.utils.assertEventRelayBound",
                args: ["{chromeNotification}", "{chromeNotification}.options.eventRelayMap"]
            }, {
                // Trigger onNotificationCreated event firer callback
                func: "gpii.tests.utils.triggerCallback",
                args: [chrome.notifications.create, 2]
            }, {
                event: "{chromeNotification}.events.onNotificationCreated",
                listener: "gpii.tests.chromeNotificationTester.assertNotificationCall",
                args: ["create", "{chromeNotification}.notificationID", "{chromeNotification}.model", "{chromeNotification}.events.onNotificationCreated.fire"]
            }]
        }, {
            name: "Interact with Notification",
            expect: 5,
            sequence: [{
                func: "{chromeNotification}.applier.change",
                args: ["iconUrl", "icons/icon.png"]
            }, {
                changeEvent: "{chromeNotification}.applier.modelChanged",
                path: "iconUrl",
                listener: "jqUnit.assertDeepEq",
                args: ["The model should have been updated", gpii.tests.chromeNotificationTests.expectedUpdatedModel, "{chromeNotification}.model"]
            }, {
                // Trigger onNotificationUpdated event firer callback
                func: "gpii.tests.utils.triggerCallback",
                args: [chrome.notifications.update, 2]
            }, {
                event: "{chromeNotification}.events.onNotificationUpdated",
                listener: "gpii.tests.chromeNotificationTester.assertNotificationCall",
                args: ["update", "{chromeNotification}.notificationID", "{chromeNotification}.model", "{chromeNotification}.events.onNotificationUpdated.fire"]
            }, {
                // Trigger onClicked event firer callback
                func: "gpii.tests.utils.triggerCallback",
                args: [chrome.notifications.onClicked.addListener, 0, "{chromeNotification}.notificationID"]
            }, {
                event: "{chromeNotification}.events.onClicked",
                listener: "jqUnit.assert",
                args: ["The onClicked event was fired"]
            }, {
                // Trigger onButtonClicked event firer callback
                func: "gpii.tests.utils.triggerCallback",
                args: [chrome.notifications.onButtonClicked.addListener, 0, "{chromeNotification}.notificationID"]
            }, {
                event: "{chromeNotification}.events.onButtonClicked",
                listener: "jqUnit.assert",
                args: ["The onButtonClicked event was fired"]
            }, {
                // Trigger onClosed event firer callback
                func: "gpii.tests.utils.triggerCallback",
                args: [chrome.notifications.onClosed.addListener, 0, "{chromeNotification}.notificationID"]
            }, {
                event: "{chromeNotification}.events.onClosed",
                listener: "jqUnit.assert",
                args: ["The onClosed event was fired"]
            }]
        }, {
            name: "onDestroy",
            expect: 4,
            sequence: [{
                func: "{chromeNotification}.destroy"
            }, {
                event: "{chromeNotification}.events.onDestroy",
                priority: "last:testing",
                listener: "gpii.tests.chromeNotificationTester.assertDestroy",
                args: ["{chromeNotification}"]
            }]
        }]
    }]
});

gpii.tests.chromeNotificationTester.assertNotificationCall = function (type, id, options, callback) {
    var wasCalled = chrome.notifications[type].calledWithExactly(id, options, callback);
    jqUnit.assertTrue("The " + type + " function should have been called with the correct arguments", wasCalled);
};

gpii.tests.chromeNotificationTester.assertDestroy = function (that) {
    var cleared = chrome.notifications.clear.calledWithExactly(that.notificationID);
    jqUnit.assertTrue("The clear function should have been called with the correct arguments", cleared);

    gpii.tests.utils.assertEventRelayUnbound(that, that.options.eventRelayMap);
};


fluid.test.runTests([
    "gpii.tests.chromeNotificationTests"
]);
