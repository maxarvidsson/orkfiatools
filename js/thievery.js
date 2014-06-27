function main()
{
    var tpa = Math.min(1000, Math.max(0, document.getElementById('tpa').value));
    var target = Math.min(1000, Math.max(0, document.getElementById('target').value));
    var op = getOp('operations_list');
    var race = document.getElementById('race').value;
    var target_race = document.getElementById('target_race').value;
    var ghs = Math.min(25, Math.max(0, document.getElementById('ghs').value));
    var tt = document.getElementById('tt').checked;
    var sci = Math.min(25, Math.max(0, document.getElementById('sci').value));
    var land = Math.max(1, document.getElementById('land').value);
    var casts = Math.min(200, Math.max(1, document.getElementById('casts').value));
    if (casts == 200) {
        document.getElementById('casts').value = casts;
    }

    var race_fail = 0;
    var race_cast_fail = 0;
    var ghs_protection = 0.03;

    switch (race) {
        case 'nazgul':
            race_cast_fail = 0.25;
            break;
    }
    
    switch (target_race) {
        case 'nazgul':
        case 'morihai':
            race_fail = 0.25;
            break;
    }

    var sci_fail = sci/100;
    var ghs_fail = ghs*ghs_protection;
    var tt_fail = tt*0.15;
    var tpo = thievesPerOp(land, op);
    console.log(tpo);
    var max_casts = Math.max(0, Math.floor(tpa * land / tpo));
    if (casts > max_casts) {
        casts = max_casts;
        document.getElementById('casts').value = casts;
    }
    var base = opChance(tpa, target, land, tpo, op.chance, casts);
    var size_fail = 0;
    var chance = base*(1-ghs_fail)*(1-tt_fail)*(1-race_fail)*(1-race_cast_fail)*(1-sci_fail);

    if (casts > 1) {
        var canvas = document.getElementById("chart");
        var dataset = filterData(createData(casts, chance), 1);
        drawGraph(dataset, canvas);
    }
    
    colorResult(chance);
    chance = Math.round(chance*10000)/100;
    
    document.getElementById('chance').innerHTML = chance + '%';

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
