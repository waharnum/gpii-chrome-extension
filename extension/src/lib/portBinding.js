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

/* global fluid, chrome */
"use strict";

(function ($, fluid) {
    var gpii = fluid.registerNamespace("gpii");

    // The main component to handle settings that require DOM manipulations.
    // It contains various subcomponents for handling various settings.
    fluid.defaults("gpii.chrome.portBinding", {
        gradeNames: ["fluid.modelComponent"],
        connectionName: "",
        events: {
            onIncomingMessage: null
        },
        listeners: {
            "onCreate.bindPortEvents": "gpii.chrome.portBinding.bindPortEvents",
            "onIncomingMessage.updateModel": {
                changePath: "remote",
                value: "{arguments}.0",
                source: "onIncomingMessage"
            }
        },
        invokers: {
            postMessage: {
                funcName: "gpii.chrome.portBinding.postMessage",
                args: ["{that}", "{arguments}.0"]
            }
        }
    });

    gpii.chrome.portBinding.bindPortEvents = function (that) {
        that.port = chrome.runtime.connect({name: that.options.connectionName + "-" + that.id});
        that.port.onMessage.addListener(that.events.onIncomingMessage.fire);
    };

    gpii.chrome.portBinding.postMessage = function (that, message) {
        // TODO: handle case where the port hasn't been created yet
        if (that.port) {
            that.port.postMessage(message);
        }
    };

    /***************************
     * port binding data store *
     ***************************/

    fluid.defaults("gpii.chrome.portBinding.store", {
        gradeNames: ["fluid.prefs.tempStore", "gpii.chrome.portBinding"],
        // The model relay between the "preferences" and "remote" model paths must be supplied by the integrator
        // modelRelay: []
        invokers: {
            set: {
                funcName: "gpii.chrome.portBinding.store.set",
                args: ["{that}", "{arguments}.0"]
            }
        }
    });

    gpii.chrome.portBinding.store.set = function (that, settings) {
        var transaction = that.applier.initiate();
        transaction.fireChangeRequest({path: "preferences", type: "DELETE"});
        transaction.fireChangeRequest({path: "panelIndex", value: settings.panelIndex, type: "ADD"});
        transaction.change("preferences", settings.preferences);
        transaction.commit();
        that.postMessage(that.model.remote);
    };
})(jQuery, fluid);
