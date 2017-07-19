var AWS = require('aws-sdk');
require('amazon-cognito-js');

CognitoLambdaManager = (function() {
    var LambdaDatasets = function (identityPoolId, identityId, callback) {
        var _this = this;

        var callbackFn = callback || function() {};

        _this.datasets = {};
        _this.localSyncData = new AWS.CognitoSyncManager.LocalStorage();
        _this.remoteSyncData = new AWS.CognitoSyncManager.RemoteStorage(identityPoolId, {
            identityId: identityId
        });

        _this.remoteSyncData.getDatasets(function (err, datasets) {
            var metadata = [];
            var request = function (ds) {
                _this.localSyncData.updateDatasetMetadata(identityId, ds, response);
            };
            var response = function (err, md) {
                metadata.push(md);
                if (datasets.length > 0) {
                    request(datasets.shift());
                }
                else {
                    callbackFn();
                }
            };
            if (datasets.length > 0) {
                request(datasets.shift(), callbackFn);
            } else {
                callbackFn();
            }
        });
    };

    LambdaDatasets.prototype.getDataset = function(datasetName) {
        var _this = this;
        return new Promise((resolve, reject) => {
            if (_this.datasets[datasetName]) {
                resolve(_this.datasets[datasetName]);
                return;
            }
            historyDataset = new AWS.CognitoSyncManager.Dataset(
                datasetName, 
                { identityId: _this.remoteSyncData.provider.identityId }, 
                _this.localSyncData, _this.remoteSyncData);
            historyDataset.synchronize({
                'onFailure': function(err) {
                    reject(err);
                },
                'onSuccess': function(dataset, updates) {
                    _this.datasets[datasetName] = historyDataset;
                    resolve(historyDataset);
                }
            });
        });
    };

    return LambdaDatasets;
})();