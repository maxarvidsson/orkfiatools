function form2query(form) {
    var vars = []; 
    for (var i = 0; i < form.elements.length; ++i) {
        var e = form.elements[i];
        if (e.id.length > 0) {
            var key = encodeURIComponent(e.id);
            var val;
            if (e.type == "checkbox") {
                val = e.checked ? 1 : 0;
            } else {
                val = encodeURIComponent(e.value);
            }
            vars.push(key + "=" + val);
        }
    }
    return vars.join("&");
}

function fillFormFromUrl(form) {
    var values = parseQuery(window.location.search.substring(1));
    var c = 0;
    for (var i = 0; i < form.elements.length; ++i) {
        var e = form.elements[i];
        if (e.id.length > 0) {
            if (typeof values[e.id] !== "undefined") {
                ++c;
                if (e.type == "checkbox") {
                    e.checked = (values[e.id] == 1);
                } else if (e.type == "select-one") {
                    for (var j = 0; j < e.options.length; ++j) {
                        if (e.options[j].value == values[e.id]) {
                            e.options[j].selected = true;
                        }
                    }
                } else {
                    e.value = values[e.id];
                }
            }
        }
    }
    return c > 0;
}

function parseQuery(str) {
    var query = {};
    vars = str.split("&");
    for (var i = 0; i < vars.length; ++i) {
        var pair = vars[i].split("=");
        var key = decodeURIComponent(pair[0]);
        var val = decodeURIComponent(pair[1]);
        if (typeof query[key] === "undefined") {
            query[key] = val;
        } else if (typeof query[key] === "string") {
            query[key] = [query[key], val];
        } else {
            query[key].push(val);
        }
    }
    return query;
}
