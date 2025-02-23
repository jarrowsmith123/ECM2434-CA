module.exports = function() {
    return new Collection();
}

var Promise = require('bluebird'),
        _ = require('lodash'),
        url = require('url');

var rfUtils = require('./utils');

Collection = function() {
}

Collection.prototype.resolvePagination = function(req, count) {
    return new Promise(function(resolve, reject) {
        var page = parseInt(req.query.page);
        var limit = parseInt(req.query.limit);

        if (isNaN(page) || !_.isNumber(page)) {
            page = 1;
        }
        if (isNaN(limit) || !_.isNumber(limit)) {
            limit = 10;
        }

        var since = req.query.since != undefined ? req.query.since : null;
        var before = req.query.before != undefined ? req.query.before : null;
        var until = req.query.until != undefined ? req.query.until : null;


        limit = Math.max(limit, 1);
        var maxPage = Math.max(Math.ceil(count / limit), 1);
        page = Math.min(Math.max(page, 1), maxPage);

        var pagination = {
            offset: (page - 1) * limit,
            limit: limit,
            page: page,
            count: count,
            lastPage: Math.max(Math.ceil(count / limit), 1),
            since: since,
            before: before,
            until: until
        };

        resolve(pagination);
    });
}

Collection.prototype.generateLinks = function(req, pagination) {
    var components = url.parse(req.protocol + '://' + req.get('host') + req.originalUrl, true);
    delete components.search;
    var queryObj = components.query;

    var getLink = function(page) {
        var newQueryObj = _.extend(queryObj, {page: page, limit: pagination.limit});
        return url.format(_.extend(components, {query: newQueryObj}));
    }

    var links = {};
    links.first = getLink(1);
    links.last = getLink(pagination.lastPage);
    links.current = getLink(pagination.page);

    if (pagination.page > 1) {
        links.prev = getLink(pagination.page - 1);
    }
    if (pagination.page < pagination.lastPage) {
        links.next = getLink(pagination.page + 1);
    }

    return Promise.resolve(links);
}

Collection.prototype.generateTimestampLinks = function(req, items, dateExtractor, pagination) {

    var components = url.parse(req.protocol + '://' + req.get('host') + req.originalUrl, true);
    delete components.search;
    var queryObj = components.query;

    var getLink = function(name, value) {

        delete queryObj.since;
        delete queryObj.before;
        delete queryObj.until;

        var newQueryObj = _.extend(queryObj, {limit: pagination.limit});

        newQueryObj[name] = value;
        return url.format(_.extend(components, {query: newQueryObj}));
    }

    var getLink2 = function(params) {

        delete queryObj.since;
        delete queryObj.before;
        delete queryObj.until;


        var newQueryObj = _.extend(queryObj, _.extend(params, {limit: pagination.limit}));

        return url.format(_.extend(components, {query: newQueryObj}));
    }

    hasFirst = function() {
        if (items.length == 0) {
            return false;
        }

        return pagination.before || pagination.since ? true : false;
    }


    hasLast = function() {
        return (items.length != 0) ? true : false;
    };

    hasPrevious = function() {
        if (items.length == 0)
            return false;
        return pagination.before || pagination.since ? true : false;
    };

    hasNext = function() {
        if (items.length == 0)
            return false;
        if (pagination.since === 0)
            return false;
        if (items.length < pagination.limit)
            return false;
        return true;
    };

    var links = {};

    if (hasFirst()) {

        var item = _.first(items);
        var value = item[dateExtractor];

        links.first = getLink('until', value);
    }

    if (hasLast()) {

        links['last'] = getLink('since', '0');
        if (items.length != 0) {


            var item = _.last(items);
            var value = item[dateExtractor];

            links['last'] = getLink2({'since': 0, 'before': value});
        }
    }

    if (hasPrevious()) {

        var item = _.first(items);
        var value = item[dateExtractor];

        links['previous'] = getLink('since', value);
    }

    if (hasNext()) {

        var item = _.last(items);
        var value = item[dateExtractor];
        links['next'] = getLink('before', value);
    }

    return Promise.resolve(links);
}


Collection.prototype.generateFirebaseLinks = function(req, items, dateExtractor, pagination) {

    var components = url.parse(req.protocol + '://' + req.get('host') + req.originalUrl, true);
    delete components.search;
    var queryObj = components.query;

    var getLink = function(name, value) {

        delete queryObj.since;
        delete queryObj.before;

        var newQueryObj = _.extend(queryObj, {limit: pagination.limit});

        newQueryObj[name] = value;
        return url.format(_.extend(components, {query: newQueryObj}));
    }

    hasPrevious = function() {
        if (items.length == 0)
            return false;

        return pagination.before != null || pagination.since != null ? true : false;
    };

    hasNext = function() {
        if (items.length == 0)
            return false;
        if (pagination.since === 0)
            return false;
        if (items.length < pagination.limit)
            return false;
        return true;
    };

    var links = {};


    if (hasPrevious()) {

        var item = _.first(items);
        var value = item[dateExtractor];

        links['previous'] = getLink('since', value);
    }

    if (hasNext()) {

        var item = _.last(items);
        var value = item[dateExtractor];
        links['next'] = getLink('before', value);
    }

    return Promise.resolve(links);
}

Collection.prototype.returnCollection = function(req, res, dataPromise, countPromise) {
    var self = this;

    if (typeof countPromise != "function") {
        return new Promise(function(resolve, reject) {
            return reject(new Error("countPromise is not a function"));
        })
    }
    var promise = countPromise();
    if (!rfUtils.isPromise(promise)) {
        return new Promise(function(resolve, reject) {
            return reject(new Error("result return by countPromise is not a Promise"));
        })
    }

    if (typeof dataPromise != "function") {
        return new Promise(function(resolve, reject) {
            return reject(new Error("dataPromise is not a function"));
        })
    }

    return countPromise()
            .then(function(count) {
                return self.resolvePagination(req, count);
            }).then(function(pagination) {
        return Promise.props({
            count: pagination.count,
            items: dataPromise(pagination),
            links: self.generateLinks(req, pagination)
        })
    });
}

Collection.prototype.returnCollectionTimestamp = function(req, res, dataPromise, countPromise, dateExtractor) {
    var self = this;

    if (typeof countPromise != "function") {
        return new Promise(function(resolve, reject) {
            return reject(new Error("countPromise is not a function"));
        })
    }
    var promise = countPromise();
    if (!rfUtils.isPromise(promise)) {
        return new Promise(function(resolve, reject) {
            return reject(new Error("result return by countPromise is not a Promise"));
        })
    }

    if (typeof dataPromise != "function") {
        return new Promise(function(resolve, reject) {
            return reject(new Error("dataPromise is not a function"));
        })
    }

    return countPromise()
            .then(function(count) {
                return self.resolvePagination(req, count);
            }).then(function(pagination) {

        return dataPromise(pagination).then(function(items) {
            return Promise.props({
                count: pagination.count,
                items: items,
                links: self.generateTimestampLinks(req, items, dateExtractor, pagination)
            })
        })
    });
}



Collection.prototype.returnCollectionFirebase = function(req, res, dataPromise, countPromise, dateExtractor) {
    var self = this;

    if (typeof countPromise != "function") {
        return new Promise(function(resolve, reject) {
            return reject(new Error("countPromise is not a function"));
        })
    }
    var promise = countPromise();
    if (!rfUtils.isPromise(promise)) {
        return new Promise(function(resolve, reject) {
            return reject(new Error("result return by countPromise is not a Promise"));
        })
    }

    if (typeof dataPromise != "function") {
        return new Promise(function(resolve, reject) {
            return reject(new Error("dataPromise is not a function"));
        })
    }

    return countPromise()
            .then(function(count) {
                return self.resolvePagination(req, count);
            }).then(function(pagination) {

        return dataPromise(pagination).then(function(items) {
            return Promise.props({
                count: pagination.count,
                items: items,
                links: self.generateFirebaseLinks(req, items, dateExtractor, pagination)
            })
        })
    });
}
