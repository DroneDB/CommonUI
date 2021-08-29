module.exports = function($){
    $.__menu = require('./menu');
    $.__shell = require('./shell');
    $.__pathutils = require('./pathutils');
    $.__env = require('./env');
}