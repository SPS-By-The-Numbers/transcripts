import React from 'react';
import Highcharts from 'highcharts'
import HighchartsExporting from 'highcharts/modules/exporting'
import HighchartsReact from 'highcharts-react-official'
import ChartCard from './ChartCard'
import Measure from 'react-measure'
import _uniqueId from 'lodash/uniqueId';

if (typeof Highcharts === 'object') {
    HighchartsExporting(Highcharts)
}

function getTitle(category) {
  return `${category} Ratings Histogram`;
}

class Histogram extends React.Component {
  constructor(props) {
    super(props);
    this.id = _uniqueId('histogram-');

    this.drawChart = this.drawChart.bind(this);
    this.getChartOptions = this.getChartOptions.bind(this);
    this.getSeries = this.getSeries.bind(this);
  }

  componentDidMount() {
    this.drawChart();
  }

  getChartOptions() {
    return {
      title: { text: this.props.title },
      xAxis: {
        title: { text: this.props.data.xlabel },
        categories: this.props.data.categories
      },
      yAxis: {
        title: { text: this.props.data.ylabel }
      }
    };
  }

  drawChart() {
    const chart_options = this.getChartOptions();
    chart_options.plotOptions = {
	   column: {
		pointPadding: 0,
		shadow: false
	   }
	 };
    chart_options.series = this.getSeries();
    console.log(this.id);
    console.log(document.getElementById(this.id));

    this.chart = Highcharts.chart(this.id, chart_options);
  }

  getSeries() {
    return this.props.data.series.map(d => Object.assign({ type: "column" }, d));
  }

  componentDidUpdate() {
    clearTimeout(this.chartIsUpdating);
    this.chartIsUpdating = setTimeout(() => {
      const series = this.getSeries();
      // Remove extraneious series.
      for (let i = this.chart.series.length - 1; i >= series.length; i--) {
        this.chart.series[i].remove();
      }

      series.forEach((s, idx) => {
        if (idx >= this.chart.series.length) {
          this.chart.addSeries(s, false);
        } else {
          this.chart.series[idx].update(s, false);
        }
      });
      this.chart.update(this.getChartOptions());
    }, 100);
  }

  render() {
    return (
      <figure className="flex-1 flex flex-col bg-gray-100">
        <div className="flex-1 flex relative">
          <Measure bounds onResize={(contentRect) => this.setState({width: contentRect.bounds.width - 10})}>
            {({ measureRef }) =>
              <div ref={measureRef}>
                <div id={this.id} ref={(r) => this.chartRef = r} />
              </div>
            }
          </Measure>
        </div>
      </figure>
    );
  }
}

export default Histogram;
