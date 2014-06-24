function B(n, k)
{
    var b = 1;
    if (k > n / 2) {
        k = n - k;
    }
    for (var i = 1, c = n - k; i <= k; ++i) {
        b = b * (c + i) / i;
    }
    return b;
}

function pmf(k, n, p)
{
    return B(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
}

function createData(n, p)
{
    var labels = new Array(n + 1);
    var data = new Array(n + 1);
    for (var i = 0; i <= n; ++i) {
        labels[i] = i;
        data[i] = pmf(i, n, p) * 100;
    }
    return {labels:labels, data:data};
}

function filterData(dataset, cutoff)
{
    var labels = [];
    var data = [];
    for (var i = 0; i < dataset.data.length; ++i) {
        if (dataset.data[i] >= cutoff) {
            labels.push(dataset.labels[i]);
            data.push(dataset.data[i]);
        }
    }
    return {labels:labels, data:data};
}

function drawGraph(dataset, canvas)
{
    var data = {
        labels : dataset.labels,
        datasets : [
            {
                fillColor : "rgba(220,220,220,0.5)",
                strokeColor : "rgba(220,220,220,1)",
                data : dataset.data
            }
        ]
    }
    var ctx = canvas.getContext("2d");
    var myNewChart = new Chart(ctx).Bar(data, {animation:false, scaleLabel : "<%=value%>%"});
}
