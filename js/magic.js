var INTEL = 1;
var DARK = 2;
var spells = [
    ["Inner Sight",      220, INTEL],
    ["Cleanse",          200, DARK],
    ["Vision",           200, INTEL],
    ["Poison",           180, DARK],
    ["Enforced Honesty", 150, DARK],
    ["Fear",             150, DARK],
    ["Juranimosity",     150, DARK],
    ["Lightning Bolt",   150, DARK],
    ["Fireball",         120, DARK],
    ["Wrath of XENE",    120, DARK],
    ["Fly over",         100, INTEL],
    ["Cyclops",           90, DARK],
    ["Earthquake",        90, DARK],
    ["Meteor Storm",      90, DARK],
    ["Mystical Rust",     90, DARK],
    ["Rupture",           90, DARK],
    ["Enchantress Salem", 80, DARK],
    ["Winds of Distress", 80, DARK],
    ["DragonMage",        70, DARK],
    ["Enforced Honesty",  60, DARK],
    ["Magical Void",      60, DARK]
];

(function(e, s){
    var l = document.getElementById(e);
    for (var i = 0; i < s.length; i++) {
        l.options.add(new Option(s[i][0], i, i == 18, i == 18));
    }
})('spell', spells);

function main()
{
    var ml = Math.min(100, Math.max(1, document.getElementById('ml').value));
    var target = Math.min(100, Math.max(1, document.getElementById('target').value));
    var spell = document.getElementById('spell').value;
    var race = document.getElementById('race').value;
    var target_race = document.getElementById('target_race').value;
    var churches = Math.min(25, Math.max(0, document.getElementById('churches').value));
    var sod = document.getElementById('sod').checked;
    var sci = Math.min(25, Math.max(0, document.getElementById('sci').value));
    var casts = Math.min(200, Math.max(1, document.getElementById('casts').value));
    if (casts == 200) {
        document.getElementById('casts').value = casts;
    }

    var race_fail = 0;
    var race_cast_fail = 0;
    var church_protection = 0.03;

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
    var church_fail = churches*church_protection;
    var base = orkfiaSpellChance(ml, target, spells[spell][1]);
    var size_fail = 0;
    var chance = base*(1-church_fail)*(1-sod*0.25)*(1-race_fail)*(1-race_cast_fail)*(1-sci_fail);

    var canvas = document.getElementById("chart");
    var dataset = filterData(createData(casts, chance), 1);
    drawGraph(dataset, canvas);
    
    colorResult(chance);
    chance = Math.round(chance*10000)/100;
    
    document.getElementById('chance').innerHTML = chance + '%';

}

function orkfiaSpellChance(ml, tml, spell)
{
    return Math.min(spell*(ml+(ml>tml)*(ml-tml)+10)/(tml+10), 290)/300;
}

function colorResult(d)
{
    var red = 255 - Math.round(d*255);
    var green = Math.min(255, Math.round(1.5 * d * 255));
    var rgb = 'rgb(' + red + ',' + green + ',0)';
    document.getElementById('chance').style.color = rgb;
}
