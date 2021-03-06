var el = document.createElement("script");
el.src = server + ':' + port + "/socket.io/socket.io.js";
document.body.appendChild(el);

$("#Settings").find('dt').each(function() {
    var $this = $(this);
    $this.click(function() {
        $this.next().toggle();
    });
});

// support "built-in" string, number, boolean
var db = (function() {
    if (typeof localStorage === "undefined") {
        return new (function() {
            var temp = {};
            this.get = function(key) {
                return temp[key];
            };
            this.set = function(key, value) {
                temp[key] = value;
            }
        });
    }
    return new (function() {
        this.get = function(key) {
            var value = localStorage.getItem(key);
            var type = localStorage.getItem(key + "_meta_type");
            if (type === typeof true) {
                value = !!(+value);
            } else if (type === typeof 1) {
                value = +value;
            }
            debug("db.get(" + key + ") value: " + value + ", type: " + typeof value);
            return value;
        };
        this.set = function(key, value) {
            debug("db.set(" + key + ", " + value + ") type: " + typeof value);
            var type = typeof value;
            if (type !== typeof "") {
                localStorage.setItem(key + "_meta_type", type);
                if (type === typeof true) {
                    value = value ? "1" : "0";
                }
            }
            localStorage.setItem(key, value);
        };
    });
})();

var settings = new (function(database) {
    var self = this;
    var db = database;
    var settings = {};
    this.add = function(id, opts) {
        debug("settings.add(" + id + ")");
        var opts = opts || {};
        var el = document.getElementById("settings_" + id);
        settings[id] = {element: el, options: opts};
        if (self.isEnabled(id)) {
            // Fix for bad behavour in firefox, it remembers disabled
            // attribute on page reload
            el.disabled = false;
            self.init(id);
        } else {
            debug("this setting is disabled");
            el.disabled = true;
        }
    };
    this.isEnabled = function(id) {
        var enabled = true;
        var opt = settings[id].options.enabled;
        if (typeof opt === typeof true) {
            enabled = opt;
        }
        return enabled;
    };
    this.defaultValue = function(id) {
        if (typeof settings[id].options.default !== "undefined") {
            return settings[id].options.default;
        }
        return "";
    };
    this.init = function(id) {
        debug("settings.init(" + id + ")");
        settings[id].element.onchange = function() {
            self.set(id, self.getElementValue(this));
        }
        var value = db.get(id);
        if (value === null) {
            value = self.defaultValue(id);
        }
        self.set(id, value);
    };
    this.filter = function(id, value) {
        var filter = settings[id].options.filter;
        if (typeof filter === "function") {
            value = filter(value);
        }
        return value;
    };
    this.set = function(id, value) {
        debug("settings.set(" + id + ", " + value + ")");
        value = self.filter(id, value);
        self.setElementValue(settings[id].element, value);
        db.set(id, value);
        var onChange = settings[id].options.onChange;
        if (typeof onChange === "function") {
            onChange(value);
        }
    };
    this.get = function(id) {
        return db.get(id);
    };
    this.getElementValue = function(el) {
        if (el.type == "checkbox") {
            return el.checked;
        }
        return el.value;
    };
    this.setElementValue = function(el, value) {
        if (el.type == "checkbox") {
            el.checked = value;
        } else {
            el.value = value;
        }
    };
    this.lock = function() {
        for (var i in settings) {
            var lock = true;
            if (typeof settings[i].options.alwaysUnlocked === "boolean") {
                lock = !settings[i].options.alwaysUnlocked;
            }
            settings[i].element.disabled = lock;
        }
    };
})(db);

settings.add("username", {
    filter: function(v) {
        v = v.trim().replace(" ", "_");
        if (v.length == 0) {
            v = "guest" + Math.floor(Math.random() * 10000);
        }
        return v;
    }
});

settings.add("token", {
    filter: function(v) {
        return v.replace(/[^\w\n]/g, "");
    }
});

settings.add("font_size", {
    default: "11",
    alwaysUnlocked: true,
    filter: function(v) {
        v = v.replace(/[\D]/g, "");
        if (v.length == 0) {
            v = "11";
        }
        return v;
    },
    onChange: function(v) {
        document.body.style.fontSize = v + "px";
    }
});

settings.add("timestamps", {
    default: true,
    alwaysUnlocked: true,
    onChange: (function() {
        var rule = (function(){
            var sheets = document.styleSheets;
            for (var i = 0; i < sheets.length; i++) {
                var sheet = sheets[i];
                if (sheet.cssRules) {
                    var rules = sheet.cssRules;
                    for (var j = 0; j < rules.length; j++) {
                        var rule = rules[j];
                        if (rule.selectorText == ".timestamp") {
                            return rule;
                        }
                    }
                }
            }
        })();
        return function(v) {
            if (v) {
                rule.style.display = "";
            } else {
                rule.style.display = "none";
            }
        };
    })()
});

var isConnected = false;
var textarea = document.getElementById("chat_input");
var button_connect = document.getElementById("button_connect");
// Fix for bad behavour in firefox, it remembers disabled
// attribute on page reload
button_connect.disabled = false;
button_connect.onclick = function () {
    button_connect.onclick = null;
    button_connect.disabled = true;
    settings.lock();
    connect();
    return false;
};

var loadingAnim = document.createElement("img");
loadingAnim.alt = "connecting";
loadingAnim.style.display = "none";
// thanks to ajaxload.info for gif loading animation
loadingAnim.src = "\
data:image/gif;base64,R0lGODlhEAAQAPQAAP///wAAAPj4+Dg4OISEhAYGBiYmJtbW1qioqBYWF\
nZ2dmZmZuTk5JiYmMbGxkhISFZWVgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\
AAAAAAAAACH/C05FVFNDQVBFMi4wAwEAAAAh/hpDcmVhdGVkIHdpdGggYWpheGxvYWQuaW5mbwAh+QQ\
JCgAAACwAAAAAEAAQAAAFUCAgjmRpnqUwFGwhKoRgqq2YFMaRGjWA8AbZiIBbjQQ8AmmFUJEQhQGJha\
KOrCksgEla+KIkYvC6SJKQOISoNSYdeIk1ayA8ExTyeR3F749CACH5BAkKAAAALAAAAAAQABAAAAVoI\
CCKR9KMaCoaxeCoqEAkRX3AwMHWxQIIjJSAZWgUEgzBwCBAEQpMwIDwY1FHgwJCtOW2UDWYIDyqNVVk\
UbYr6CK+o2eUMKgWrqKhj0FrEM8jQQALPFA3MAc8CQSAMA5ZBjgqDQmHIyEAIfkECQoAAAAsAAAAABA\
AEAAABWAgII4j85Ao2hRIKgrEUBQJLaSHMe8zgQo6Q8sxS7RIhILhBkgumCTZsXkACBC+0cwF2GoLLo\
FXREDcDlkAojBICRaFLDCOQtQKjmsQSubtDFU/NXcDBHwkaw1cKQ8MiyEAIfkECQoAAAAsAAAAABAAE\
AAABVIgII5kaZ6AIJQCMRTFQKiDQx4GrBfGa4uCnAEhQuRgPwCBtwK+kCNFgjh6QlFYgGO7baJ2CxIi\
oSDpwqNggWCGDVVGphly3BkOpXDrKfNm/4AhACH5BAkKAAAALAAAAAAQABAAAAVgICCOZGmeqEAMRTE\
QwskYbV0Yx7kYSIzQhtgoBxCKBDQCIOcoLBimRiFhSABYU5gIgW01pLUBYkRItAYAqrlhYiwKjiWAcD\
MWY8QjsCf4DewiBzQ2N1AmKlgvgCiMjSQhACH5BAkKAAAALAAAAAAQABAAAAVfICCOZGmeqEgUxUAIp\
kA0AMKyxkEiSZEIsJqhYAg+boUFSTAkiBiNHks3sg1ILAfBiS10gyqCg0UaFBCkwy3RYKiIYMAC+RAx\
iQgYsJdAjw5DN2gILzEEZgVcKYuMJiEAOwAAAAAAAAAAAA==";
loadingAnim.style.display = "none";
button_connect.parentNode.insertBefore(loadingAnim, button_connect.nextSibling);
var connectedImg = document.createElement("img");
connectedImg.alt = "connected";
connectedImg.src = "\
data:image/gif;base64,R0lGODlhEAAQAIABAACAAP///yH5BAEKAAEALAAAAAAQABAAAAIjjI8Jy\
Qfb1IvoWRqsjrqzvmyOl4ngCIpGqqJnk2KkPGEOVgAAOw==";
button_connect.parentNode.insertBefore(loadingAnim, button_connect.nextSibling);
connectedImg.style.display = "none";
button_connect.parentNode.insertBefore(connectedImg, button_connect.nextSibling);

// Notifications --------------------------------------------------------------
var notify = new (function() {
    var self = this;
    this.message = function(msg) {
        debug("notify.message: " + msg.message);
        if (typeof document.hasFocus === "function" && !document.hasFocus()) {
            var n = new Notification(msg.sender + " writes:", {
                body: msg.message
            });
        }
    };
    this.isSupported = function() {
        return "Notification" in window;
    };
    this.getPermissionLevel = function() {
        return Notification.permission;
    };
    this.hasPermission = function() {
        return Notification.permission === "granted";
    };
    // denied could be browser doesnt allow any page
    // or they pressed deny once and browser remembers
    this.isDenied = function() {
        return Notification.permission === "denied";
    };
    this.requestPermission = function(callback) {
        Notification.requestPermission(function(permission) {
            debug("Requesting permission.... " + permission);
            // According to mozilla dev
            if (!("permission" in Notification)) {
                Notification.permission = permission;
            }
            if (typeof callback === "function") {
                callback();
            }
        });
    };
});

settings.add("notifications", {
    default: false,
    enabled: notify.isSupported(),
    filter: function(v) {
        if (!v || !notify.isSupported()) {
            return false;
        }
        if (notify.isDenied()) {
            settings.set("notifications", false);
            // need some nicer popup that doesnt halt execution
            // alert("Your browser-settings does not allow notifications on this site");
        } else if (!notify.hasPermission()) {
            notify.requestPermission(function() {
                // runs very much async from rest
                settings.set("notifications", notify.hasPermission());
            });
        } else {
            return true;
        }
        return false;
    }
});

var myNick = settings.get("username");

debug("Notifications supported by browser: " + notify.isSupported());
if (notify.isSupported()) {
    debug("Notifications has permission: " + notify.hasPermission());
    debug("Notifications permission level: " + notify.getPermissionLevel());
}
//debug("Notifications is on: " + notifications);

// Page title notifications ----------------------------------------------------
var page_title;
// not supported in all browsers :S
debug("typeof document.hasFocus == " + typeof document.hasFocus);
if (typeof document.hasFocus !== "function") {
    page_title = new (function() {
        this.reset = function() {};
        this.update = function() {};
    });
} else {
    page_title = new (function() {
        var doc = window.top.document;
        var orig = doc.title;
        var count = 0;
        this.reset = function() {
            count = 0;
            doc.title = orig;
        };
        this.update = function() {
            var has_focus = doc.hasFocus();
            debug("update page title? document has focus: " + has_focus);
            if (!has_focus) {
                count = count + 1;
                doc.title = count + " " + orig;
            }
        };
    });
    // kinda works
    window.onfocus = function() {
        debug("window gained focus");
        page_title.reset();
    };
}

var color_table = {};
// all colors below pass WCAG AA (good contrast)
var color_list = [
    // pink color
    "#c71585", // MediumVioletRed
    // red colors
    "#dc143c", // Crimson
    "#b22222", // FireBrick
    "#8b0000", // DarkRed
    // brown colors
    "#8b4513", // SaddleBrown
    "#a0522d", // Sienna
    "#a52a2a", // Brown
    "#800000", // Maroon
    // green colors
    "#556b2f", // DarkOliveGreen
    "#008000", // Green
    "#006400", // DarkGreen
    // cyan color
    "#008080", // Teal
    // blue colors
    "#4169e1", // RoyalBlue
    "#0000ff", // Blue
    "#0000cd", // MediumBlue
    "#00008b", // DarkBlue
    "#000080", // Navy
    "#191970", // MidnightBlue
    // purple/violet/magenta colors
    "#8a2be2", // BlueViolet
    "#9400d3", // DarkViolet
    "#9932cc", // DarkOrchid
    "#8b008b", // DarkMagenta
    "#800080", // Purple
    "#4b0082", // Indigo
    "#483d8b", // DarkSlateBlue
    "#663399", // RebeccaPurple
    "#6a5acd", // SlateBlue
    // gray color
    "#2f4f4f" // DarkSlateGray
];
function hash(s, n) {
    var hash = 0;
    var factor = 1;
    for (var i = s.length - 1; i >= 0; --i) {
        hash += factor * s.charCodeAt(i);
        factor = (factor * 19) % n;
    }
    hash = hash % n;
    return hash;
}
function name2color(name) {
    debug("name2color(" + name + ")");
    name = name.toLowerCase();
    var last = name.charCodeAt(name.length - 1);
    if (last < 97 || 122 < last) {
        name = name.substr(0, name.length - 1);
    }
    if (typeof color_table[name] === "undefined") {
        color_table[name] = color_list[hash(name, color_list.length)];
        debug(name + " = " + color_table[name]);
    }
    return color_table[name];
}

var chatbox = new (function() {
    var self = this;
    var tabs = {};
    var rooms = {};
    var current = "";
    var $chat_tabs_ul = $("#chat").find("ul");
    this.addRoom = function(id) {
        if (typeof rooms[id] !== "undefined") {
            return false;
        }
        self._addTab(id);
        self._addContent(id);
        if (current == "") {
            tabs[id].addClass("tab_active");
            rooms[id].css("visibility", "visible");
            current = id;
        } else {
            rooms[id].css("visibility", "hidden");
        }
        return true;
    };
    this.selectRoom = function(id) {
        if (current != id) {
            if (current != "") {
                tabs[current].removeClass("tab_active");
                rooms[current].css("visibility", "hidden");
            }
            tabs[id].addClass("tab_active");
            rooms[id].css("visibility", "visible");
            current = id;
        }
    };
    this._addTab = function(id) {
        var title = id.replace("_", " ");
        if (title.substr(0, 8) == "Alliance") {
            title = "Alliance";
        }
        var $tab = $("<li>" + title + "</li>");
        tabs[id] = $tab;
        $tab.click(function() {
            self.selectRoom(id);
            tabs[id].removeClass("tab_new");
            tabs[id].removeClass("tab_alert");
        });
        $tab.appendTo($chat_tabs_ul);
    };
    this._addContent = function(id) {
        var $div = $('<div id="' + id + '" class="room"></div>');
        self._addRoom(id, $div);
        $div.appendTo($("#chat"));
    };
    this._addRoom = function(id, $div) {
        rooms[id] = $div;
        //$div.css("height", room_height);
        $div.css("visibility", "hidden");
    };
    this.currentRoom = function() {
        return current;
    };
    this.highlightRoom = function(msg) {
        debug("HL: " + msg.room + " (current: " + current + ")");
        // Ignore notifications from "Botter" - trivia bot super spamming 
        var botter = "IRC Botter";
        if (msg.sender.substr(0, botter.length) == botter) { 
            return msg;
        }
        page_title.update();
        var myNick = settings.get("username");
        if (msg.sender == myNick) {
            return msg;
        }
        var pattern = new RegExp("\\b" + myNick + "(\\b|:)", "ig");
        var match = msg.message.match(pattern);
        if (match) {
            msg.hlNick = true;
            if (settings.isEnabled("notifications")
                && settings.get("notifications")
            ) {
                notify.message(msg);
            }
        }
        // var i = msg.message.search(pattern);
        // if (i >= 0) {
        //     if (notifications) {
        //         notify.message(msg);
        //     }
        //     msg.message = msg.message.substr(0, i)
        //                 + '<span class="my_nick">'
        //                 + msg.message.substr(i, myNick.length)
        //                 + "</span>"
        //                 + msg.message.substr(i + myNick.length);
        // }
        if (current == msg.room) {
            return msg;
        }
        if (match) {
            tabs[msg.room].removeClass("tab_new");
            tabs[msg.room].addClass("tab_alert");
        } else if (!tabs[msg.room].hasClass("tab_alert")) {
            tabs[msg.room].addClass("tab_new");
        }
        return msg;
    };
    this.room = function(id) {
        return rooms[id];
    };
});

chatbox._addTab("Settings");
chatbox._addRoom("Settings", $("#Settings"));
chatbox.selectRoom("Settings");

var urlPattern = /(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?/g;
function urlFilter(s) {
    return s.replace(urlPattern, '<a href="$&" target="_blank">$&</a>');
}
function decode(s) {
    return s.replace(/&#x2f;/g, '/');
}
function msgFormat(msg) {
    var message = urlFilter(decode(msg.message));
    var sender = msg.sender;
    if (sender.substr(0, 4) == 'IRC ') {
        sender = sender.substr(4);
    }
    var tsStyle = "";
    var msgStyle = "";
    var senderStyle = "";
    if (typeof msg.hlNick !== "undefined") {
        tsStyle += " hl_nick";
    }
    var emote = message.substr(0, 4) == "/me ";
    if (emote) {
        msgStyle += ' msg-me-emote';
        senderStyle += ' msg-me-emote';
        message = message.substr(4);
    }
    var time = '<span class="timestamp' + tsStyle + '">' + msg.serverTime + '</span>';
    sender = '<span class="msg-nick' + senderStyle + '" style="color:'
           + name2color(sender) + ';">' + sender + '</span>';
    if (!emote) {
        sender = '&lt;' + sender + '&gt;'
    }
    message = '<span class="msg-msg' + msgStyle + '">' + message + '</span>';
    return time + ' ' + sender + ' ' + message + '<br />';
}
function filterMsg(msg) {
    return (msg.sender == "IRC Stats");
}
function isScrollAtBottom(el) {
    // works better without jquery
    var isAtBottom = el.scrollTop + el.clientHeight === el.scrollHeight;
    debug("isScrollAtBottom: " + el.scrollTop + " + "
          + el.clientHeight + " === " + el.scrollHeight + " (" + isAtBottom + ")");
    return isAtBottom;
}
function scrollToBottom(el) {
    el.scrollTop = 9999999;
}
function connect() {
    loadingAnim.style.display = "inline";

    var socket = io.connect(server + ":" + port);

    socket.on("error", function(obj) {
        debug("io error: " + obj.message);
    });

    socket.on("disconnect", function() {
        debug("io disconnected");
        connectedImg.style.display = "none";
        loadingAnim.style.display = "inline";
        isConnected = false;
    });

    socket.on("reconnect", function(n) {
        debug("io reconnected after " + n + " attempts");
    });

    socket.on("reconnect_attempt", function() {
        debug("io attempting to reconnect");
    });

    socket.on("reconnecting", function(n) {
        debug("io reconnecting, attempt number " + n);
    });

    socket.on("reconnect_error", function(obj) {
        debug("io reconnect error: " + obj.message);
    });

    socket.on("connect", function() {
        socket.emit("join", settings.get("username"), settings.get("token"));
        loadingAnim.style.display = "none";
        connectedImg.style.display = "inline";
        isConnected = true;
    });

    socket.on("rooms", function(rooms) {
        for (i in rooms) {
            if (chatbox.addRoom(rooms[i])) {
                socket.emit("backlog", rooms[i]);
            } 
        }
    });

    socket.on("backlog", function(msgs) {
        for (i in msgs) {
            msg = msgs[i];
            if (!filterMsg(msg)) {
                var $room = chatbox.room(msg.room);
                $room.append(msgFormat(msg));
                scrollToBottom($room[0]);
            }
        }
    });

    socket.on("chat", function(msg) {
        if (!filterMsg(msg)) {
            var $room = chatbox.room(msg.room);
            msg = chatbox.highlightRoom(msg);
            var scrollDown = isScrollAtBottom($room[0]);
            $room.append(msgFormat(msg));
            if (scrollDown) {
                scrollToBottom($room[0]);
            }
        }
    });


    function sendMsg(textarea) {
        var message = textarea.value;
        textarea.value = "";
        var lines = message.split("\n");
        var room = chatbox.currentRoom();
        for (var i = 0; i < lines.length; ++i) {
            socket.emit("chat", room, lines[i]);
        }
        var $room = chatbox.room(room);
        scrollToBottom($room[0]);
    }

    var history = [""];
    var pos = 0;

    // when the client hits ENTER on their keyboard
    textarea.onkeydown = function(event) {
        var e = event || window.event;
        // jquery might help us make "which" work in all browsers
        debug("textarea.keypress: " + e.which);
        switch (e.which) {
        case 13:
            if (chatbox.currentRoom() !== "Settings") {
                history[history.length - 1] = textarea.value;
                pos = history.push("") - 1;
                sendMsg(textarea);
            }
            return false;
        case 38:
            debug("history up!");
            if (pos == history.length - 1) {
                history[pos] = textarea.value;
            }
            if (pos > 0) {
                textarea.value = history[--pos];
            }
            return false;
        case 40:
            debug("history down!");
            if (pos != history.length - 1) {
                textarea.value = history[++pos];
            }
            return false;
        }
    };
};

// Stuff to do if chat is not run "stand-alone"
var standalone = (self == top);

settings.add("chat_pos", {
    enabled: !standalone,
    default: "right",
    alwaysUnlocked: true,
    onChange: function(v) {
        switch (v) {
        case "right":
            parent.showAatw();
            parent.chatRight();
            break;
        case "left":
            parent.showAatw();
            parent.chatLeft();
            break;
        case "full":
            parent.hideAatw();
            break;
        }
    }
});

