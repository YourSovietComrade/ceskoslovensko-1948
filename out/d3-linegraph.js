/*
 * generování čárového grafu více stran s více daty...
 * */

function addMonths(date, months) {
    date = new Date(date);
    var d = date.getDate();
    date.setMonth(date.getMonth() + months);
    if (date.getDate() != d) {
      date.setDate(0);
    }
    return date;
}


d3.linegraph = function(noTicks, noDots, parties, partyColors, partyNames, dataMax, dataMin, additionalMonths) {
    /* params */
    if (!parties) {
        parties = ['ksc', 'cssd', 'csns', 'csl', 'ds', 'sns', 'other'];
    }
    if (!partyColors) {
        partyColors = {'ksc': '#DC143C', 'cssd': '#FF6B00', 'csns': '#FFD700', 'csl': '#228B22', 'ds': '#4169E1', 'sns': '#8B4513', 'other': '#909090'};
    }
    if (!partyNames) {
        partyNames = {'ksc': 'KSČ', 'cssd': 'ČSSD', 'csns': 'ČSNS', 'csl': 'ČSL', 'ds': 'DS', 'sns': 'SNS', 'other': 'Ostatní'};
    }
    if (!additionalMonths) {
        additionalMonths = 10;
    }

    // Deklarace rozměrů grafu a okrajů.
    var width = 500;
    var height = 400;
    var marginTop = 20;
    var marginRight = 20;
    var marginBottom = 50;
    var marginLeft = 40;

    function linegraph(dataset) {
     dataset.each(function (data) {
      const dates = data.map(d => new Date(d.date));
      // Namapování dat na pole polí {x, y} n-tic.
      const series = parties.map(party => data.map(d => ({'x': new Date(d.date), 'y': d[party], 'series': party})));

      // Deklarace x (horizontální pozice) škály.
      const maxDate = d3.max(dates);
      const xScale = d3.scaleUtc([new Date(1946, 0), addMonths(maxDate, additionalMonths)], [marginLeft, width - marginRight]);

      var xaxis = d3.axisBottom()
        .tickFormat(d3.timeFormat('%b %Y'))
        .tickValues(dates)
        .scale(xScale);
      if (noTicks) {
        xaxis = d3.axisBottom()
        .tickFormat(d3.timeFormat('%b %Y'))
        .ticks(10)
        .scale(xScale);
      }

      // Deklarace y (vertikální pozice) škály.
      if (!dataMax) {
          const maxKSC = d3.max(data, d => d.ksc);
          const maxCSSD = d3.max(data, d => d.cssd);
          dataMax = maxKSC >= maxCSSD ? maxKSC + 10 : maxCSSD + 10;
          dataMin = 0;
      }
      const yScale = d3.scaleLinear([dataMin, dataMax], [height - marginBottom, marginTop]);

      // Vytvoření SVG kontejneru.
      // const svg = d3.create("svg")
      //    .attr("width", width)
      //    .attr("height", height);
     var svg = d3.select(this);


      // Přidání x-osy.
      svg.append("g")
          .attr("transform", `translate(0,${height - marginBottom})`)
          .call(xaxis)
          .selectAll("text")
          .attr("text-anchor", "end")
          .attr("dx", "-0.8em")
          .attr("dy", "0.1em")
          .attr("transform", "rotate(-30)");

      // Přidání y-osy.
      svg.append("g")
          .attr("transform", `translate(${marginLeft},0)`)
          .call(d3.axisLeft(yScale));

      const partyLine = (party) => d3.line()
          .x(d => xScale(new Date(d.date)))
          .y(d => yScale(d[party]));

      // vykreslení čar
      for (const party of parties) {
        svg.append("path")
          .attr("fill", "none")
          .attr("stroke", partyColors[party])
          .attr("stroke-width", 1.5)
          .attr("class", party + " " + "party-line")
          .attr("id", party+"-line")
          .attr("series", party)
          .attr("d", partyLine(party)(data))
          .on("mouseover", function (d) {
              d3.selectAll(".party-line").attr("stroke-width", 0.1);
              d3.selectAll(".party-node").attr("fill-opacity", 0.1);
              d3.selectAll(".party-label").attr("opacity", 0.1);
              d3.selectAll("."+party+'-node').attr("fill-opacity", 1);
              d3.selectAll("."+party+'-label').attr("opacity", 1);
              d3.select(this).attr("stroke-width", 5);
          })
          .on("mouseout", function (d) {
            d3.selectAll(".party-line").attr("stroke-width", 1.5);
            d3.selectAll(".party-node").attr("fill-opacity", 1);
            d3.selectAll(".party-label").attr("opacity", 1);
          });
      }

      // vykreslení uzlů
      const z = d3.scaleOrdinal(d3.schemeCategory10);
      if (!noDots) {
          svg.selectAll(".series")
              .data(series)
            .enter().append("g")
            .selectAll(".point")
              .data(d => d)
            .enter().append("circle")
              .attr("class", d => d.series + " " + d.series+"-node " + "party-node")
              .attr("fill", d => partyColors[d.series])
              .attr("series", d => d.series)
              .attr("r", 4)
              .attr("cx", d => xScale(d.x))
              .attr("cy", d => yScale(d.y))
              .on("mouseover", function (d) {
                  const node = d3.select(this);
                  const series = node.attr('series');
                  d3.selectAll(".party-line").attr("stroke-width", 0.1);
                  d3.selectAll(".party-node").attr("fill-opacity", 0.1);
                  d3.selectAll(".party-label").attr("opacity", 0.1);
                  d3.selectAll("."+series+'-node').attr("fill-opacity", 1);
                  d3.selectAll("#"+series+'-line').attr("stroke-width", 5);
                  d3.selectAll("."+series+'-label').attr("opacity", 1);
              })
              .on("mouseout", function (d) {
                  d3.selectAll(".party-line").attr("stroke-width", 1.5);
                  d3.selectAll(".party-node").attr("fill-opacity", 1);
                  d3.selectAll(".party-label").attr("opacity", 1);
              });
      }

      // vykreslení popisků vpravo
      svg.selectAll(".labels")
        .data(series)
        .enter().append("text")
        .text(s => partyNames[s[0].series])
        .attr("series", s => s[0].series)
        .attr("font-size", "0.8em")
        .attr("class", s => s[0].series + "-label party-label")
        .attr("x", s => xScale(s[s.length - 1].x) + 15)
        .attr("y", s => yScale(s[s.length - 1].y) + 5)
        .on("mouseover", function (d) {
          const text = d3.select(this);
          const series = text.attr('series');
          d3.selectAll(".party-line").attr("stroke-width", 0.1);
          d3.selectAll(".party-node").attr("fill-opacity", 0.1);
          d3.selectAll(".party-label").attr("opacity", 0.1);
          d3.selectAll("."+series+'-node').attr("fill-opacity", 1);
          d3.selectAll("#"+series+'-line').attr("stroke-width", 5);
          d3.selectAll("."+series+'-label').attr("opacity", 1);
        })
        .on("mouseout", function (d) {
          d3.selectAll(".party-line").attr("stroke-width", 1.5);
          d3.selectAll(".party-node").attr("fill-opacity", 1);
          d3.selectAll(".party-label").attr("opacity", 1);
        });

     });
    }

    linegraph.width = function(value) {
        if (!arguments.length) return width;
        width = value;
        return linegraph;
    };

    linegraph.height = function(value) {
        if (!arguments.length) return height;
        height = value;
        return linegraph;
    };

    linegraph.parties = function(value) {
        if (!arguments.length) return parties;
        parties = value;
        return linegraph;
    };

    linegraph.partyNames = function(value) {
        if (!arguments.length) return partyNames;
        partyNames = value;
        return linegraph;
    };

    linegraph.partyColors = function(value) {
        if (!arguments.length) return partyColors;
        partyColors = value;
        return linegraph;
    };

    return linegraph;
};
