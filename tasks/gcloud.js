/*
 * grunt-gcloud
 * https://github.com/ubilabs/grunt-gcloud
 *
 * Copyright (c) 2014 Frank Mecklenburg Ubilabs
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {
  var fs = require('fs'),
    async = require('async'),
    storage, bucket, asyncTasks = [];

  grunt.registerMultiTask('gcloud', 'Grunt wrapper for google-gcloud.', function() {
    var done = this.async(),
      options = this.options({
        keyFilename: '.gcloud.json',
        metadata: {},
        defaultAcl: null,
        makePublic: false
      }),
      gcloud = require('gcloud'),
      storage = gcloud({
        projectId: options.projectId,
        keyFilename: options.keyFilename
      }).storage(),
      bucket = storage.bucket(options.bucket);

    if(options.makePublic && !options.defaultAcl) {
      options.defaultAcl = {
        scope: 'allUsers',
        role: 'READER'
      };
    }

    this.files.forEach(function(filePair) {
      filePair.src.forEach(function(src) {
        var srcFile = filePair.cwd + '/' + src,
          destFile = filePair.dest + src;

        if (!grunt.file.isDir(srcFile)) {
          asyncTasks.push(
            function(callback) {
              var metadata = JSON.parse(JSON.stringify(options.metadata));

              bucket.upload(srcFile, destFile, metadata, function(err, file) {
                if (err) {
                  grunt.fail.warn(err);
                }

                if (options.defaultAcl) {
                  file.acl.add(options.defaultAcl, function(err) {
                    if(err) {
                      grunt.fail.warn(err);
                    }
                    callback();
                  });
                } else {
                  callback();
                }
              });
            });
        }
      });
    });

    async.parallel(asyncTasks, function() {
      done();
    });
  });
};
