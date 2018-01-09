var tr_d = document.getElementById('target_fame_display').style.display;
document.getElementById('target_fame_display').style.display = "none";

var main_form = document.getElementById('main_form');

function main() {
    
    var tpa = Math.min(1000, Math.max(0, document.getElementById('tpa').value));
    var target = Math.min(1000, Math.max(0, document.getElementById('target').value));
    var op = getOp('operations_list');
    var race = getRace('race');
    var target_race = getTargetRace('target_race');
    var target_fame = Math.min(50000, Math.max(0, document.getElementById('target_fame').value));
    var ghs = Math.max(0, document.getElementById('ghs').value);
    var tt = document.getElementById('tt').checked;
    var land = Math.max(1, document.getElementById('land').value);
    var casts = Math.min(200, Math.max(1, document.getElementById('casts').value));
    if (casts == 200) {
        document.getElementById('casts').value = casts;
    }

    var martial_arts = (function() {
        var s = document.getElementById('martial_law');
        return s.options[s.selectedIndex].value;
    })();

    var fame_fail = 0;
    
    var f = document.getElementById('target_fame_display');
    if (target_race.ability.fame1) {
        f.style.display = tr_d;
        fame_fail = target_fame * 0.00001;
    } else {
        f.style.display = "none";
    }

    var race_fail = target_race.protection;
    var race_cast_fail = race.fumble;
 
    var martial_arts_fail = martial_arts/100;
    var ghs_fail = gh_formula(ghs/100);
    var tt_fail = tt*0.15;
    var tpo = thievesPerOp(land, op);
    var max_casts = Math.max(0, Math.floor(tpa * land / tpo));
    if (casts > max_casts) {
        casts = max_casts;
        document.getElementById('casts').value = casts;
    }
    var base = opChance(tpa, target, land, tpo, op.chance, casts);
    var size_fail = 0;
    var chance = base*(1-ghs_fail)*(1-tt_fail)*(1-race_fail)*(1-race_cast_fail)*(1-fame_fail)*(1-martial_arts_fail);

    if (casts > 1) {
        var canvas = document.getElementById("chart");
        var dataset = filterData(createData(casts, chance), 1);
        drawGraph(dataset, canvas);
    }
    
    colorResult(chance);
    chance = Math.round(chance*10000)/100;
    
    document.getElementById('chance').innerHTML = chance + '%';

    var link = document.getElementById('link_input');
    link.href = "thievery.html?" + form2query(main_form);
}

function opChance(tpa, ttpa, land, tpo, c, n) {
    var e = 1;
    if (ttpa > 0.25) {
        e = Math.min(1, Math.max(0.05, ((tpa - n * tpo / land / 2) / ttpa / 1.5)));
    }
    return e*c/100;
}

function thievesPerOp(l, op) {
    var t = op.tpa * l * 3;
    if (l <= 2000) {
        t /= (1 + l/1000);
    } else {
        t /= (1 + 2 * log_x(l/333, 6));
    }
    return Math.max(t, op.min);
}

function colorResult(d) {
    var red = 255 - Math.round(d*255);
    var green = Math.min(255, Math.round(1.5 * d * 255));
    var rgb = 'rgb(' + red + ',' + green + ',0)';
    document.getElementById('chance').style.color = rgb;
}

function selop(e) {
    var s = document.getElementById(e);
    return s.options[s.selectedIndex];
}

function getOp(e) {
    op = selop(e);
    return {
        chance: op.getAttribute('data-chance'),
        tpa: op.getAttribute('data-tpa'),
        min: op.getAttribute('data-min')
    };
}

function log_x(v, x) {
    return Math.log(v)/Math.log(x);
}

function getRace(e) {
    op = selop(e);
    return {
        fumble: op.getAttribute('data-fumble') / 100
    };
}

function getTargetRace(e) {
    op = selop(e);
    abilities = {fame1: false}
    if (op.hasAttribute('data-ability')) {
        switch (op.getAttribute('data-ability')) {
        case 'fame1':
            abilities.fame1 = true;
            break;
        }
    }
    return {
        protection: op.getAttribute('data-protection') / 100,
        ability: abilities
    };
}

function gh_formula(ghs) {
    var limit = 0.2;
    return 1 - 1/(25/3 * Math.min(ghs, limit) + 1);
}

if (fillFormFromUrl(main_form)) {
    main();
}
