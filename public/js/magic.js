var tr_d = document.getElementById('target_fame_display').style.display;
document.getElementById('target_fame_display').style.display = "none";

var main_form = document.getElementById('main_form');

function main() {

    var ml = Math.max(1, document.getElementById('ml').value);
    var target = Math.max(1, document.getElementById('target').value);
    var spell = getSpell('spell');
    var race = getRace('race');
    var target_race = getTargetRace('target_race');
    var target_fame = Math.min(50000, Math.max(0, document.getElementById('target_fame').value));
    var chs = Math.max(0, document.getElementById('churches').value);
    var sod = document.getElementById('sod').checked;
    var casts = Math.min(200, Math.max(1, document.getElementById('casts').value));
    if (casts == 200) {
        document.getElementById('casts').value = casts;
    }

    var fame_fail = 0;
    
    var f = document.getElementById('target_fame_display');
    if (target_race.ability.fame1) {
        f.style.display = tr_d;
        fame_fail = target_fame * 0.00001;
    } else {
        f.style.display = "none";
    }

    if (spell.type == "dark") {
        spell.chance += race.chanceDark;
    }

    var race_fail = target_race.protection;
    var race_cast_fail = race.fumble;

    var chs_fail = ch_formula(chs/100);
    var base = orkfiaSpellChance(ml, target, spell.chance);
    var chance = base*(1-chs_fail)*(1-sod*0.15)*(1-race_fail)*(1-race_cast_fail)*(1-fame_fail);

    var canvas = document.getElementById("chart");
    var dataset = filterData(createData(casts, chance), 1);
    drawGraph(dataset, canvas);
    
    colorResult(chance);
    chance = Math.round(chance*10000)/100;
    
    document.getElementById('chance').innerHTML = chance + '%';

    var link = document.getElementById('link_input');
    link.href = "magic.html?" + form2query(main_form);
}

function orkfiaSpellChance(ml, tml, c) {
    return Math.min(c*(ml+(ml>tml)*(ml-tml)+10)/(tml+10), 290)/300;
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

function getSpell(e) {
    op = selop(e);
    return {
        chance: parseInt(op.getAttribute('data-chance'), 10),
        type: op.getAttribute('data-type')
    };
}

function getRace(e) {
    op = selop(e);
    return {
        fumble: op.getAttribute('data-fumble') / 100,
        chanceDark: op.hasAttribute('data-chance-dark') ? parseInt(op.getAttribute('data-chance-dark'), 10) : 0
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

function ch_formula(chs) {
    var limit = 0.2;
    return 1 - 1/(25/3 * Math.min(chs, limit) + 1);
}

if (fillFormFromUrl(main_form)) {
    main();
}
