// Data filters etc
var filters = (function() {
    var list = [];
    var ids = [];
    var includeProtected = true;
    var groupFunc = sum;
    var groupBy = 0;
    // Function on the grouping
    function sum(d) {
        return d3.sum(d, function(d) { return d.count > 0 ? d.value : null; });
    }
    function mean(d) {
        return d3.mean(d, function(d) { return d.count > 0 ? d.value : null; });
    }
    function median(d) {
        return d3.median(d, function(d) { return d.count > 0 ? d.value : null; });
    }
    function count(d) {
        return d3.sum(d, function(d) { return d.count; });
    }
    function max(d) {
        return d3.max(d, function(d) { return d.count > 0 ? d.value : null; });
    }

    // Select which quantity to show
    // Also create deep copy making it safe to alter objects in rest of filters
    list.push(function(data) {
        var rows = [];
        data.forEach(function(d) {
            var row = [];
            d.forEach(function(d) {
                var item = Object.assign({}, d);
                item.count = 1;
                item.value = item[selectedQuantity];
                row.push(item);
            });
            rows.push(row);
        });
        return rows;
    });
    // Exclude data from tribes in protection
    list.push(function(data) {
        if (!includeProtected) {
            data.forEach(function(d) {
                d.forEach(function(d) {
                    if (d.protected != "0") {
                        d.count = 0;
                        d.value = 0;
                    }
                });
            });
        }
        return data;
    });
    // Only include selected alliances
    function filter(data, on, values) {
        newdata = [];
        data.forEach(function(d) {
            var line = d.filter(function(d) {
                return values.indexOf(d[on]) >= 0;
            });
            if (line.length > 0) {
                newdata.push(line);
            }
        });
        return newdata;
    }
    list.push(function(data) {
        if (ids.length == 0) {
            return data;
        }
        return filter(data, 'alli_id', ids);
    });
    // Group data
    list.push(function(data) {
        switch (groupBy) {
            case 0:
                data = group(data, 'tribe_id', groupFunc);
                break;
            case 1:
                data = groupAll(data, groupFunc);
                break;
            default:
                data = group(data, groupBy, groupFunc);
                break;
        }
        return data;
    });

    function group(data, on, groupFunction) {
        var o = data.reduce(function(m, d) {
            d.forEach(function(d) {
                m.push(d);
            });
            return m;
        }, []);
        var n = d3.nest()
            .key(function(d) { return d[on]; })
            .key(function(d) { return d.tick; })
            .rollup(function(d) {
                var base = Object.assign({}, d[d.length-1]);
                base.value = groupFunction(d);
                base.count = d3.sum(d, function(d) { return d.count; });
                base.protected = 0;
                // hacky hacky
                if (on == 'alli_id') {
                    base.label = alliName(base.alli_id);
                } else if (on == 'tribe_id') {
                    base.label = base.tribe_name + ' (#' + base.alli_id + ')';
                } else {
                    base.label = base[on];
                }
                return base;
            });
        o = n.entries(o);
        var real = [];
        o.forEach(function(d) {
            var line = [];
            d.values.forEach(function(d) {
                line.push(d.values);
            });
            real.push(line);
        });
        return real;
    }

    function groupAll(data, groupFunction) {
        var o = data.reduce(function(m, d) {
            d.forEach(function(d) {
                m.push(d);
            });
            return m;
        }, []);
        var n = d3.nest()
            .key(function(d) { return d.tick; })
            .rollup(function(d) {
                var base = Object.assign({}, d[d.length-1]);
                base.value = groupFunction(d);
                base.count = d3.sum(d, function(d) { return d.count; });
                base.protected = 0;
                base.label = "Game";
                return base;
            });
        o = n.entries(o);
        var real = [];
        o.forEach(function(d) {
            real.push(d.values);
        });
        return [real];
    }

    return {
        run: function(data) {
            for (var i = 0; i < list.length; i++) {
                data = list[i](data);
            }
            return data;
        },
        set includeProtected(val) {
            includeProtected = (val === true);
        },
        get includeProtected() {
            return includeProtected;
        },
        set alliIds(val) {
            ids = val;
        },
        get alliIds() {
            return ids;
        },
        get group() {
            return {
                get func() {
                    return {
                        sum: function() {
                            groupFunc = sum;
                        },
                        mean: function() {
                            groupFunc = mean;
                        },
                        median: function() {
                            groupFunc = median;
                        },
                        count: function() {
                            groupFunc = count;
                        },
                        max: function() {
                            groupFunc = max;
                        }
                    };
                },
                set by(val) {
                    if (val === null) {
                        groupBy = 0;
                    } else {
                        groupBy = val;
                    }
                },
                get by() {
                    return {
                        all: function() {
                            groupBy = 1;
                        }
                    };
                }
            };
        }
    };
})();
